import { readFileSync, readdirSync } from 'node:fs';
import { createHash, randomUUID, randomBytes, createHmac } from 'node:crypto';

export const directory = new URL('./', import.meta.url);
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function loadManifest() {
  const bytes = readFileSync(new URL('manifest.json', directory));
  const manifest = JSON.parse(bytes);
  if (manifest.version !== 1 || manifest.preparedOnly !== true || !/^[a-f0-9]{40}$/.test(manifest.sourceCommit)
    || Object.keys(manifest.images).sort().join(',') !== 'auth,db,gateway,rest,storage'
    || Object.values(manifest.images).some(image => !/^sha256:[a-f0-9]{64}$/.test(image.id))
    || manifest.blockers.length === 0) throw new Error('Manifeste de préparation invalide.');
  const sqlBytes = readFileSync(new URL('../sec-auth-c1/manifest.json', directory));
  if (sha256(sqlBytes) !== manifest.sqlManifestSha256) throw new Error('Manifeste SQL modifié.');
  const lockBytes = readFileSync(new URL('assets.json', directory));
  const lock = JSON.parse(lockBytes);
  const actual = readdirSync(directory).filter(name => name !== 'assets.json').sort();
  if (lock.version !== 1 || JSON.stringify(Object.keys(lock.files).sort()) !== JSON.stringify(actual)) throw new Error('Inventaire des actifs modifié.');
  for (const [name, expected] of Object.entries(lock.files)) {
    if (!/^[A-Za-z0-9.-]+$/.test(name) || sha256(readFileSync(new URL(name, directory))) !== expected) throw new Error(`Actif modifié : ${name}`);
  }
  return { ...manifest, digest: sha256(bytes), assetsDigest: sha256(lockBytes) };
}
export function createIdentity() {
  const token = randomUUID();
  return { token, project: `planetls-g03-${token}`, label: 'fr.planetls.sec-g03-http', resources: [] };
}
/** Generated in memory only, never from .env or logged. Future runtime owns persistence/ACLs. */
export function createSecrets() {
  const jwtSecret = randomBytes(48).toString('hex');
  const issued = Math.floor(Date.now() / 1000);
  const sign = role => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ role, iss: 'supabase', iat: issued, exp: issued + 7200 })).toString('base64url');
    return `${header}.${payload}.${createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest('base64url')}`;
  };
  return { database: randomBytes(32).toString('hex'), jwtSecret, anonKey: sign('anon'), serviceKey: sign('service_role'), authSecret: randomBytes(48).toString('hex') };
}
export function endpoint(raw, port) {
  const url = new URL(raw);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.port !== String(port)
    || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Endpoint non autorisé.');
  return url.origin;
}
export function evaluateResources(sample, budget) {
  const reasons = [];
  const limits = { dockerFreeMiB: budget.dockerMiB + budget.dockerReserveMiB, windowsFreeMiB: budget.windowsFreeMiB, diskFreeGiB: budget.diskFreeGiB, cpu: budget.cpu };
  for (const [key, minimum] of Object.entries(limits)) {
    if (!Number.isFinite(sample[key]) || sample[key] < minimum) reasons.push(`${key}: mesure absente ou sous le seuil ${minimum}`);
  }
  for (const port of [58430, 58431]) if (!Array.isArray(sample.occupiedPorts) || sample.occupiedPorts.includes(port)) reasons.push(`Port ${port} non confirmé libre`);
  return { ready: reasons.length === 0, reasons };
}
