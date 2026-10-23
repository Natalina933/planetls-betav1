import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";
import dgram from "node:dgram";
import dns from "node:dns";
import http2 from "node:http2";
import { syncBuiltinESMExports } from "node:module";

export function denyE2ENetwork() {
  throw new Error("E2E en lecture seule : connexion serveur interdite avant toute sortie réseau.");
}

function literalLoopbackResult(hostname, options) {
  if (hostname !== "127.0.0.1") denyE2ENetwork();
  if (typeof options === "number") options = { family: options };
  options ??= {};
  if (typeof options !== "object" || Array.isArray(options)) throw new TypeError("Options lookup locales invalides.");
  if (Object.keys(options).some(key => !["family", "all", "hints", "verbatim", "order"].includes(key))) throw new TypeError("Option lookup locale non prise en charge.");
  if (options.family != null && ![0, 4, 6, "IPv4", "IPv6"].includes(options.family)) throw new TypeError("Famille lookup invalide.");
  if (options.all != null && typeof options.all !== "boolean") throw new TypeError("Option all invalide.");
  if (options.verbatim != null && typeof options.verbatim !== "boolean") throw new TypeError("Option verbatim invalide.");
  if (options.order != null && !["verbatim", "ipv4first", "ipv6first"].includes(options.order)) throw new TypeError("Ordre lookup invalide.");
  const hintMask = dns.ADDRCONFIG | dns.V4MAPPED | dns.ALL;
  if (options.hints != null && (!Number.isInteger(options.hints) || options.hints < 0 || (options.hints & ~hintMask) !== 0)) throw new TypeError("Hints lookup invalides.");
  // Like Node's numeric-address fast path: return the literal's actual family,
  // even with family=6. No resolver, system lookup or network API is called.
  return options.all ? [{ address: "127.0.0.1", family: 4 }] : { address: "127.0.0.1", family: 4 };
}

export function lookupLiteralLoopback(hostname, options = undefined, callback = undefined) {
  if (typeof options === "function") { callback = options; options = undefined; }
  if (typeof callback !== "function") throw new TypeError("Callback lookup requis.");
  const result = literalLoopbackResult(hostname, options);
  if (Array.isArray(result)) process.nextTick(callback, null, result);
  else process.nextTick(callback, null, result.address, result.family);
  return {}; // Same return contract as Node's literal-IP callback fast path.
}

export async function lookupLiteralLoopbackPromise(hostname, options = undefined) {
  return literalLoopbackResult(hostname, options);
}

// Preloaded only in the dedicated Next.js process and its workers, never in Playwright.
if (process.env.PLS_READONLY_E2E === "1") {
  globalThis.fetch = denyE2ENetwork;
  globalThis.WebSocket = class { constructor() { denyE2ENetwork(); } };
  net.Socket.prototype.connect = denyE2ENetwork;
  net.connect = net.createConnection = denyE2ENetwork;
  tls.connect = denyE2ENetwork;
  http.request = http.get = https.request = https.get = denyE2ENetwork;
  dgram.createSocket = denyE2ENetwork;
  http2.connect = denyE2ENetwork;
  for (const target of [dns, dns.promises, dns.Resolver.prototype, dns.promises.Resolver.prototype]) {
    for (const key of Object.getOwnPropertyNames(target)) {
      if (/^(lookup|resolve|reverse)/.test(key) && typeof target[key] === "function") target[key] = denyE2ENetwork;
    }
  }
  dns.lookup = lookupLiteralLoopback;
  dns.promises.lookup = lookupLiteralLoopbackPromise;
  syncBuiltinESMExports();
}
