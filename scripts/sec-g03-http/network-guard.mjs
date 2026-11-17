import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import dgram from 'node:dgram';
import { syncBuiltinESMExports } from 'node:module';

export function assertSocket(host, port, ports) {
  if (host !== '127.0.0.1' || !ports.includes(Number(port)) || !Number.isInteger(Number(port))) throw new Error('Sortie réseau G03 refusée.');
}
export function socketTarget(args) {
  const value = args[0];
  if (Array.isArray(value)) return socketTarget(value);
  if (value && typeof value === 'object' && !Array.isArray(value)) return { host: value.host, port: value.port, path: value.path };
  if (typeof value === 'number') return { port: value, host: typeof args[1] === 'string' ? args[1] : undefined };
  return { path: value };
}
/** Experimental until validated with Next workers; deny unknown IPC/socket forms. */
export function installGuard(ports) {
  const connect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (...args) {
    const target = socketTarget(args);
    if (target.path) throw new Error('Socket IPC non approuvé.');
    assertSocket(target.host, target.port, ports);
    return connect.apply(this, args);
  };
  const fetch = globalThis.fetch;
  globalThis.fetch = (input, init = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.protocol !== 'http:' || url.username || url.password) throw new Error('URL G03 refusée.');
    assertSocket(url.hostname, url.port, ports);
    return fetch(input, { ...init, redirect: 'manual' });
  };
  const deny = () => { throw new Error('Transport non approuvé.'); };
  tls.connect = deny; dgram.createSocket = deny;
  for (const target of [dns, dns.promises, dns.Resolver.prototype, dns.promises.Resolver.prototype]) {
    for (const key of Object.getOwnPropertyNames(target)) if (/^(lookup|resolve|reverse)/.test(key) && typeof target[key] === 'function') target[key] = deny;
  }
  dns.lookup = (host, options, callback) => {
    if (host !== '127.0.0.1') return deny();
    if (typeof options === 'function') { callback = options; options = {}; }
    if (typeof callback !== 'function') throw new Error('Lookup invalide.');
    if (options?.all) process.nextTick(callback, null, [{ address: host, family: 4 }]);
    else process.nextTick(callback, null, host, 4);
  };
  syncBuiltinESMExports();
}
if (process.env.G03_GUARD_ENABLED === '1') {
  const ports = String(process.env.G03_ALLOWED_PORTS ?? '').split(',').map(Number);
  if (ports.length !== 2 || ports.some(port => !Number.isInteger(port) || port < 1024 || port > 65535)) throw new Error('Ports de garde invalides.');
  installGuard(ports);
}
