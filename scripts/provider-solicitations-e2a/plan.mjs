import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'scripts/provider-solicitations-e2a');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function snapshotFiles(manifest, read = p => readFileSync(path.join(root,p))) {
  const contents = Object.create(null);
  for (const item of [...manifest.migrations, ...manifest.assets, ...manifest.references]) {
    const bytes = Buffer.from(read(item.path));
    if (hash(bytes) !== item.sha256) throw Error(`BLOCKED: changed ${item.path}`);
    contents[item.path] = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  return Object.freeze(contents);
}
export function loadManifest() {
  const bytes = readFileSync(path.join(dir, 'manifest.json'));
  const manifest = JSON.parse(bytes);
  const canonical = readdirSync(path.join(root, 'supabase/migrations')).filter(p => p.endsWith('.sql')).sort().map(p => `supabase/migrations/${p}`);
  const targets = ['supabase/migrations/20261117120000_provider_solicitations.sql', 'supabase/migrations/20261117121000_provider_solicitation_replay_lookup.sql'];
  const assets = ['README.md', 'assertions.sql', 'atomicity.mjs', 'business-atomicity.mjs', 'concurrency.mjs', 'fixtures.sql', 'history.sql', 'plan.mjs', 'recovery.mjs', 'run.mjs', 'scenarios.sql', 'transport.mjs'].map(p => `scripts/provider-solicitations-e2a/${p}`);
  const references = ['scripts/concierge-04b/manifest.json','scripts/sec-auth-c1/divergences.json','scripts/sec-auth-c1/foundation.sql','scripts/sec-auth-c1/lifecycle.mjs','scripts/sec-auth-c1/plan.mjs','scripts/sec-auth-c1/transport.mjs'];
  if (manifest.version !== 1 || manifest.postgresMajor !== 17 || manifest.preparedOnly !== true
    || JSON.stringify(manifest.migrations.map(p => p.path)) !== JSON.stringify(canonical)
    || JSON.stringify(canonical.slice(-2)) !== JSON.stringify(targets)
    || JSON.stringify(manifest.assets.map(p => p.path)) !== JSON.stringify(assets)
    || JSON.stringify(manifest.references.map(p => p.path)) !== JSON.stringify(references)) throw Error('BLOCKED: order or unexpected assets');
  for (const item of [...manifest.migrations, ...manifest.assets, ...manifest.references]) {
    if (hash(readFileSync(path.join(root, item.path))) !== item.sha256) throw Error(`BLOCKED: changed ${item.path}`);
  }
  return { ...manifest, digest: hash(bytes) };
}
export function staticPlan() {
  const manifest = loadManifest();
  return { mode: 'PREPARATION ONLY — SQL NOT RUN', digest: manifest.digest, migrations: manifest.migrations.length,
    targets: manifest.migrations.slice(-2).map(p => p.path),
    profiles: ['fresh: full chain then synthetic fixtures', 'existing: baseline, synthetic fixtures, then targets'],
    isolation: ['PG17 approved local image digest', 'network none', 'no ports or persistent volumes', 'read-only root, tmpfs', '1 GiB, 2 CPUs, 128 PIDs'],
    blockers: ['business rollback and concurrency not validated in PostgreSQL', 'process termination not proven', 'explicit E2B authorization', 'local image and daemon not verified', 'representative source absent'],
    disclaimer: 'Static plan only; no Docker, database or remote access.' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2 && !(process.argv.length === 3 && process.argv[2] === '--plan')) throw Error('Only --plan is available');
  console.log(JSON.stringify(staticPlan(), null, 2));
}
