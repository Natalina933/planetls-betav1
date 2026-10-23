import test, { after, mock } from "node:test";
import assert from "node:assert/strict";
import dns, { lookup as namedLookup } from "node:dns";
import dnsPromises from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";
import http2 from "node:http2";
import dgram from "node:dgram";

// Safety net installed BEFORE the production guard: no test can reach native
// DNS or connect to any destination, even if the guard regresses.
let nativeAttempts = 0;
function nativeTripwire(): never { nativeAttempts++; throw new Error("NATIVE_NETWORK_MUST_NOT_BE_CALLED"); }
for (const target of [dns, dnsPromises, dns.Resolver.prototype, dnsPromises.Resolver.prototype]) {
  for (const name of Object.getOwnPropertyNames(target)) {
    if (/^(lookup|resolve|reverse)/.test(name) && typeof Reflect.get(target, name) === "function") mock.method(target, name as never, nativeTripwire);
  }
}
for (const [target, names] of [
  [net, ["connect", "createConnection"]], [net.Socket.prototype, ["connect"]], [tls, ["connect"]],
  [http, ["get", "request"]], [https, ["get", "request"]], [http2, ["connect"]], [dgram, ["createSocket"]],
] as const) for (const name of names) mock.method(target, name as never, nativeTripwire);
mock.method(globalThis, "fetch", nativeTripwire);
const previousMode = process.env.PLS_READONLY_E2E;
process.env.PLS_READONLY_E2E = "1";
const { denyE2ENetwork } = await import("../../scripts/readonly-e2e-network.mjs");
after(() => {
  assert.equal(nativeAttempts, 0);
  mock.restoreAll();
  if (previousMode === undefined) delete process.env.PLS_READONLY_E2E;
  else process.env.PLS_READONLY_E2E = previousMode;
});

test("lookup local : callback asynchrone et signatures sans délégation native", async () => {
  assert.equal(namedLookup, dns.lookup);
  await new Promise<void>((resolve, reject) => {
    let synchronous = true;
    const request = dns.lookup("127.0.0.1", (error, address, family) => {
      try { assert.equal(synchronous, false); assert.equal(error, null); assert.equal(address, "127.0.0.1"); assert.equal(family, 4); resolve(); }
      catch (failure) { reject(failure); }
    });
    assert.deepEqual(request, {});
    synchronous = false;
  });
  for (const family of [0, 4, 6]) await new Promise<void>((resolve, reject) => {
    dns.lookup("127.0.0.1", family, (error, address, returnedFamily) => {
      if (error) return reject(error);
      try { assert.equal(address, "127.0.0.1"); assert.equal(returnedFamily, 4); resolve(); } catch (failure) { reject(failure); }
    });
  });
});

test("lookup local : all, options Node et API Promise restent strictement en mémoire", async () => {
  await new Promise<void>((resolve, reject) => {
    dns.lookup("127.0.0.1", { all: true, family: 4, hints: dns.ADDRCONFIG, order: "verbatim" }, (error, addresses) => {
      if (error) return reject(error);
      try { assert.deepEqual(addresses, [{ address: "127.0.0.1", family: 4 }]); resolve(); } catch (failure) { reject(failure); }
    });
  });
  assert.deepEqual(await dnsPromises.lookup("127.0.0.1"), { address: "127.0.0.1", family: 4 });
  assert.deepEqual(await dnsPromises.lookup("127.0.0.1", { all: true, family: 6, verbatim: true }), [{ address: "127.0.0.1", family: 4 }]);
  assert.throws(() => Reflect.apply(dns.lookup, dns, ["127.0.0.1", {}]), TypeError);
  for (const options of [{ all: "yes" }, { family: 7 }, { hints: -1 }, { order: "unknown" }, { extra: true }, []]) {
    assert.throws(() => Reflect.apply(dns.lookup, dns, ["127.0.0.1", options, () => {}]), TypeError);
  }
});

test("DNS : domaines, Supabase fictif et formes ambiguës refusés sans résolution", async () => {
  for (const host of ["example.invalid", "project.supabase.invalid", "localhost", "127.0.0.2", "203.0.113.1", "::1", "127.1", "2130706433", "0x7f000001", "127.0.0.1.", "127.0.0.1:3109", " 127.0.0.1", "", undefined, null, new String("127.0.0.1")]) {
    assert.throws(() => Reflect.apply(dns.lookup, dns, [host, () => {}]), /avant toute sortie réseau/);
    await assert.rejects(() => Reflect.apply(dnsPromises.lookup, dnsPromises, [host]), /avant toute sortie réseau/);
  }
  for (const target of [dns, dnsPromises, new dns.Resolver(), new dnsPromises.Resolver()]) {
    for (const name of ["resolve", "resolve4", "resolve6", "reverse"]) {
      assert.equal(Reflect.get(target, name), denyE2ENetwork);
      assert.throws(() => Reflect.apply(Reflect.get(target, name), target, ["example.invalid", () => {}]), /avant toute sortie réseau/);
    }
  }
  assert.throws(() => dns.lookupService("127.0.0.1", 0, () => {}), /avant toute sortie réseau/);
});

test("sorties réseau : mocks préalables et gardes indépendants de l’autorisation DNS locale", () => {
  const blocked = [net.connect, net.createConnection, net.Socket.prototype.connect, tls.connect, http.request, http.get, https.request, https.get, http2.connect, dgram.createSocket, globalThis.fetch];
  for (const fn of blocked) {
    assert.equal(fn, denyE2ENetwork);
    // Function identity plus native tripwires guarantees no actual request.
    assert.throws(() => Reflect.apply(fn, undefined, [{ host: "127.0.0.1", port: 54321 }]), /avant toute sortie réseau/);
  }
  assert.throws(() => new WebSocket("ws://example.invalid"), /avant toute sortie réseau/);
  assert.equal(nativeAttempts, 0);
});

test("Server.listen : écoute réelle sur 127.0.0.1:0, aucun client, puis fermeture", async () => {
  const server = net.createServer();
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address === "object");
    assert.equal(address.address, "127.0.0.1");
    assert.equal(address.family, "IPv4");
    assert.ok(address.port > 0);
    assert.equal(server.listening, true);
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  assert.equal(server.listening, false);
  assert.equal(server.address(), null);
  assert.equal(nativeAttempts, 0);
});
