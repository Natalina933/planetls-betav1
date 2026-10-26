import { readFileSync, readdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const directory = path.join(root, 'scripts/concierge-04b');
export const label = 'fr.planetls.concierge-04b';
export const database = 'planetls_concierge_04b';
export const digestPattern = /^sha256:[a-f0-9]{64}$/;
export function read(relative) { return readFileSync(path.join(root, relative), 'utf8'); }
export function loadManifest() {
  const manifest = JSON.parse(read('scripts/concierge-04b/manifest.json'));
  const assets = ['expired.sql','fixtures.sql','foundation.sql','permissions.sql','plan.mjs','preflight.sql','run.mjs','scenarios.mjs']
    .map(name => `scripts/concierge-04b/${name}`);
  if (manifest.version !== 1 || !manifest.preparedOnly
    || JSON.stringify(manifest.assets?.map(item => item.path)) !== JSON.stringify(assets)) {
    throw new Error('Unexpected manifest format or asset path; no arbitrary file reads');
  }
  const canonical = readdirSync(path.join(root, 'supabase/migrations')).filter(f => f.endsWith('.sql')).sort();
  const paths = manifest.migrations.map(item => item.path);
  const expected = canonical.map(file => `supabase/migrations/${file}`);
  expected.push('docs/sql-proposals/concierge-04a-request-rls.sql',
    'docs/sql-proposals/concierge-03b-operational-integrity.sql',
    'docs/sql-proposals/concierge-03c-termination-integrity.sql');
  if (JSON.stringify(paths) !== JSON.stringify(expected) || new Set(paths).size !== paths.length) {
    throw new Error('Manifest differs from canonical migration order; explicit review required');
  }
  for (const item of manifest.migrations) {
    if (item.sha256 !== createHash('sha256').update(readFileSync(path.join(root, item.path))).digest('hex')) {
      throw new Error(`SQL changed since review: ${item.path}`);
    }
  }
  for (const item of manifest.assets) {
    if (item.sha256 !== createHash('sha256').update(readFileSync(path.join(root, item.path))).digest('hex')) {
      throw new Error(`Harness asset changed since review: ${item.path}`);
    }
  }
  return manifest;
}
export function localEndpoint(endpoint) {
  return ['npipe:////./pipe/docker_engine', 'npipe:////./pipe/dockerDesktopLinuxEngine',
    'unix:///var/run/docker.sock', 'unix:///run/docker.sock'].includes(endpoint);
}
export function cleanEnvironment(environment) {
  // No .env, PG*, cloud credentials, Docker endpoint override or Node preload.
  for (const key of Object.keys(environment)) {
    if (/^(DOCKER_|PG|SUPABASE|NODE_OPTIONS$|NODE_PATH$)/i.test(key)) {
      throw new Error(`Environment override refused: ${key}`);
    }
  }
  return Object.fromEntries(Object.keys(environment).filter(key =>
    /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|TEMP|TMP|APPDATA|LOCALAPPDATA|USERPROFILE|HOMEDRIVE|HOMEPATH|HOME)$/i.test(key))
    .map(key => [key, environment[key]]));
}
export function createIdentity() {
  const token = randomUUID();
  return { token, name: `planetls-concierge-04b-${token}`, id: null, created: false };
}
export function createArguments(identity, image) {
  if (!digestPattern.test(image)) throw new Error('An explicitly approved local image ID is required');
  return ['create', '--pull=never', '--name', identity.name,
    '--label', `${label}.run=${identity.token}`, '--label', `${label}.purpose=isolated-tests`,
    '--network', 'none', '--read-only', '--user', 'postgres', '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges', '--pids-limit', '128', '--memory', '1g', '--cpus', '2',
    '--tmpfs', '/var/lib/postgresql/data:rw,nosuid,noexec,size=536870912,mode=1777',
    '--tmpfs', '/var/run/postgresql:rw,nosuid,noexec,size=16777216,mode=1777',
    '--tmpfs', '/tmp:rw,nosuid,noexec,size=33554432,mode=1777',
    '--env', 'PGDATA=/var/lib/postgresql/data/pgdata',
    '--env', 'POSTGRES_DB=planetls_concierge_04b',
    '--env', 'POSTGRES_PASSWORD=fictional-04b-container-only',
    '--env', 'POSTGRES_INITDB_ARGS=--auth-local=trust --auth-host=reject',
    '--env', 'TZ=UTC', image, 'postgres', '-c', 'listen_addresses=',
    '-c', 'unix_socket_directories=/var/run/postgresql',
    '-c', 'statement_timeout=15000', '-c', 'lock_timeout=3000', '-c', 'idle_in_transaction_session_timeout=15000'];
}
export function assertOwnedContainer(info, identity, image) {
  if (!identity.created || !identity.id || info.Id !== identity.id
    || info.Name !== `/${identity.name}` || info.Image !== image
    || info.Config?.Labels?.[`${label}.run`] !== identity.token
    || info.Config?.Labels?.[`${label}.purpose`] !== 'isolated-tests') throw new Error('Unknown cleanup/execution target');
  const host = info.HostConfig;
  if (host.NetworkMode !== 'none' || !host.ReadonlyRootfs || host.Privileged
    || host.PidMode || host.IpcMode === 'host' || host.VolumesFrom?.length
    || host.CapAdd?.length || !host.CapDrop?.includes('ALL')
    || !host.SecurityOpt?.includes('no-new-privileges')
    || Object.keys(host.PortBindings ?? {}).length || host.Binds?.length
    || info.Mounts?.some(mount => mount.Type !== 'tmpfs')
    || Object.keys(info.NetworkSettings?.Ports ?? {}).some(port => info.NetworkSettings.Ports[port]?.length)
    || Object.keys(info.NetworkSettings?.Networks ?? {}).some(network => network !== 'none')
    || !host.Tmpfs?.['/var/lib/postgresql/data']
    || info.Config.User !== 'postgres') throw new Error('Container isolation does not match plan');
}
export function staticPlan() {
  const manifest = loadManifest();
  return {
    mode: 'STATIC ONLY — no dynamic isolation proved; no Docker invoked',
    tools: ['Node.js >=22.14 <23', 'Docker CLI + explicitly identified local Linux daemon',
      'Locally available, approved official PostgreSQL 17 image ID; psql/initdb in image'],
    image: 'sha256:<64 hex characters>, supplied and explicitly approved for 04B; never pulled',
    resources: ['One unique labelled disposable container', 'One database in container tmpfs',
      'Synthetic roles and fixtures', 'Unique OS temp directory containing local execution journals'],
    isolation: ['network none', 'No published ports, bind mounts or persistent volumes',
      'Read-only root, postgres user, no capabilities', 'Only in-container Unix socket connections',
      'Environment allowlist, no .env or actual credentials', 'No Supabase CLI/API or application server'],
    sqlOrder: ['foundation.sql', ...manifest.migrations.map(m => m.path)],
    profiles: { fresh: 'All SQL, then fixtures', existing: '70 historical migrations, synthetic fixtures, compatibility/proposal tail; assert preservation' },
    scenarios: ['A: two proposals, one award, distinct check-in/check-out/cleaning/linen, invoice',
      'B: undated collaboration, interventions, future/past notice, retained history',
      'C: real authenticated/anon/service roles, RLS and profile guard, forged role GUC',
      'D: two independent psql connections: award, finalization, intervention, termination',
      'E: controlled statement/transaction failure and idempotent retry'],
    cleanup: 'Only the exact container ID returned by this run; verify name, labels, image and isolation again; never prune or drop an external database',
    limitations: 'SQL-level scenarios do not execute HTTP search, REST finalization or notification delivery. Real Supabase ACL/PostgREST/JWT/storage parity is not claimed.'
  };
}
