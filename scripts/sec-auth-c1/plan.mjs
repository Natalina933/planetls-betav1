import { readFileSync, readdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const directory = path.join(root, 'scripts/sec-auth-c1');
export const database = 'planetls_sec_auth_c1';
export const label = 'fr.planetls.sec-auth-c1';
export const digestPattern = /^sha256:[a-f0-9]{64}$/;
export const read = relative => readFileSync(path.join(root, relative), 'utf8');
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function loadManifest() {
  const bytes = readFileSync(path.join(directory, 'manifest.json'));
  const manifest = JSON.parse(bytes);
  const canonical = readdirSync(path.join(root, 'supabase/migrations')).filter(p => p.endsWith('.sql')).sort();
  const actual = manifest.migrations?.map(p => p.path);
  if (manifest.version !== 1 || manifest.postgresMajor !== 17 || !manifest.preparedOnly
    || JSON.stringify(actual) !== JSON.stringify(canonical.map(p => `supabase/migrations/${p}`))
    || new Set(actual).size !== actual.length || manifest.blockers.length) throw new Error('BLOCKED: manifest/order/divergence');
  if (manifest.migrations.filter(p => p.kind === 'c1a').length !== 2
    || manifest.migrations.slice(-2).some(p => p.kind !== 'c1a')) throw new Error('BLOCKED: C1A boundary');
  if (manifest.historicalManifest !== 'scripts/concierge-04b/manifest.json'
    || sha(readFileSync(path.join(root, manifest.historicalManifest))) !== manifest.historicalManifestSha256) {
    throw new Error('BLOCKED: historical reference changed');
  }
  const local = readdirSync(directory).sort().filter(p => p !== 'manifest.json');
  if (JSON.stringify(manifest.assets.map(p => p.path)) !== JSON.stringify(local.map(p => `scripts/sec-auth-c1/${p}`))) {
    throw new Error('BLOCKED: unexpected harness assets');
  }
  for (const p of [...manifest.migrations, ...manifest.assets]) {
    if (!/^(supabase\/migrations\/\d{14}_[a-z0-9_]+\.sql|scripts\/sec-auth-c1\/[A-Za-z0-9.-]+)$/.test(p.path)
      || sha(readFileSync(path.join(root, p.path))) !== p.sha256) throw new Error(`BLOCKED: changed asset ${p.path}`);
  }
  const evidence = JSON.parse(read('scripts/sec-auth-c1/divergences.json'));
  if (evidence.length !== 5 || evidence.some(p => !p.explanation || !p.reference || p.blocking)) {
    throw new Error('BLOCKED: unexplained divergence');
  }
  const historical = JSON.parse(read(manifest.historicalManifest));
  for (const item of evidence) {
    if (historical.migrations.find(p => p.path === item.path)?.sha256 !== item.expected
      || manifest.migrations.find(p => p.path === item.path)?.sha256 !== item.actual) {
      throw new Error('BLOCKED: divergence evidence inconsistent with manifests');
    }
  }
  return { ...manifest, digest: sha(bytes) };
}
export function staticPlan() {
  const manifest = loadManifest();
  return { mode: 'PREPARED ONLY; PostgreSQL cases NOT RUN', manifest: manifest.digest,
    baseline: manifest.migrations.filter(p => p.kind !== 'c1a').length,
    targets: manifest.migrations.filter(p => p.kind === 'c1a').map(p => p.path),
    profiles: ['fresh: all migrations then fixtures', 'existing: baseline then fixtures then C1A'],
    blockers: ['explicit execution authorization', 'approved local daemon/context/image', 'first SQL failure stops run'],
    disclaimer: 'No HTTP, Supabase, Storage, email or application authorization validation.' };
}

// Mécanismes d’isolation repris sans modifier le harnais historique.
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
  return { token, name: `planetls-sec-auth-c1-${token}`, id: null, created: false };
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
    '--env', 'POSTGRES_DB=planetls_sec_auth_c1',
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
