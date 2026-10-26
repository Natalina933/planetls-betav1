import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { root, directory, label, localEndpoint, cleanEnvironment, createIdentity,
  createArguments, assertOwnedContainer, loadManifest, staticPlan } from '../../scripts/concierge-04b/plan.mjs';
import { parseArguments, validateHost, main } from '../../scripts/concierge-04b/run.mjs';
import { ids, session, interventions, termination, runScenarios } from '../../scripts/concierge-04b/scenarios.mjs';

const image = `sha256:${'a'.repeat(64)}`;
const configuration = { context: 'desktop-linux', image, 'daemon-id': 'local-id' };
const read = file => readFileSync(path.join(root, file), 'utf8');
function known() {
  const identity = { ...createIdentity(), id: 'b'.repeat(64), created: true };
  const info = { Id: identity.id, Name: `/${identity.name}`, Image: image,
    Config: { User: 'postgres', Labels: { [`${label}.run`]: identity.token, [`${label}.purpose`]: 'isolated-tests' } },
    HostConfig: { NetworkMode: 'none', ReadonlyRootfs: true, CapDrop: ['ALL'], SecurityOpt: ['no-new-privileges'],
      Tmpfs: { '/var/lib/postgresql/data': 'rw' } }, Mounts: [{ Type: 'tmpfs' }],
    NetworkSettings: { Ports: { '5432/tcp': null }, Networks: { none: {} } } };
  return { identity, info };
}
function host(overrides = {}) {
  const calls = [];
  return {
    calls, pin: endpoint => calls.push(['PIN', endpoint]),
    sync(args) {
      calls.push(args);
      if (args[0] === 'context') return JSON.stringify([{ Endpoints: { docker: { Host: overrides.endpoint ?? 'npipe:////./pipe/dockerDesktopLinuxEngine' } } }]);
      if (args[0] === 'info') return JSON.stringify({ ID: overrides.daemon ?? 'local-id', OSType: 'linux', Swarm: { LocalNodeState: overrides.swarm ?? 'inactive' } });
      if (args[0] === 'image') {
        if (overrides.missing) throw new Error('No such image');
        return JSON.stringify([{ Id: image, Os: 'linux', Config: { Env: [`PG_MAJOR=${overrides.major ?? '17'}`], Entrypoint: ['docker-entrypoint.sh'], Volumes: { '/var/lib/postgresql/data': {} } } }]);
      }
      throw new Error(`Unexpected call: ${args}`);
    }
  };
}

test('manifest explicitly matches all canonical migrations, proposal order and hashes', () => {
  const manifest = loadManifest();
  assert.equal(manifest.migrations.length, 74);
  assert.equal(manifest.migrations.filter(item => item.kind === 'historical').length, 70);
  assert.deepEqual(manifest.migrations.slice(-4).map(item => item.kind), ['compatibility','rls','operational-03b','termination-03c']);
  assert.ok(manifest.migrations.every(item => !item.path.startsWith('database/')));
  for (const item of [...manifest.migrations, ...manifest.assets]) {
    assert.equal(createHash('sha256').update(readFileSync(path.join(root,item.path))).digest('hex'),item.sha256);
  }
});
test('default and explicit plan are static, no authorization inferred', async () => {
  assert.deepEqual(parseArguments([]), { mode: 'plan' });
  assert.deepEqual(parseArguments(['--plan']), { mode: 'plan' });
  const output = [];
  const original = console.log;
  try { console.log = text => output.push(text); await main([]); } finally { console.log = original; }
  assert.match(output.join(''), /STATIC ONLY/);
  const plan = staticPlan();
  assert.equal(plan.sqlOrder.length,75);
  assert.ok(plan.cleanup.includes('exact container ID'));
});
test('execution refuses missing authorization, mutable image, external connection and arbitrary cleanup options', () => {
  const valid = ['--execute','--authorize=CONCIERGE-04B',`--image=${image}`,'--context=desktop-linux','--daemon-id=local-id','--profile=fresh'];
  assert.equal(parseArguments(valid).mode,'execute');
  for (const args of [valid.filter(arg => !arg.startsWith('--authorize')), valid.map(arg => arg.startsWith('--image')?'--image=postgres:17':arg),
    [...valid,'--host=remote'], [...valid,'--cleanup=old-container'], [...valid,'--profile=existing'], ['--execute']]) {
    assert.throws(() => parseArguments(args));
  }
});
test('only known local sockets are accepted', () => {
  for (const endpoint of ['tcp://127.0.0.1:2375','tcp://remote:2376','ssh://host','npipe:////remote/pipe/docker_engine','unix:///tmp/unknown.sock']) assert.equal(localEndpoint(endpoint),false);
  assert.equal(localEndpoint('unix:///var/run/docker.sock'),true);
});
test('remote contexts are rejected before any daemon contact', () => {
  const docker = host({ endpoint: 'ssh://remote' });
  assert.throws(() => validateHost(configuration,docker),/endpoint refused/);
  assert.equal(docker.calls.length,1);
});
test('local endpoint is pinned before daemon inspection; wrong daemon/swarm/image fail closed', () => {
  const docker = host();
  assert.equal(validateHost(configuration,docker),'local-id');
  assert.equal(docker.calls[1][0],'PIN');
  assert.equal(docker.calls[2][0],'info');
  for (const override of [{ daemon:'other' },{ swarm:'active' },{ major:'16' },{ missing:true }]) {
    const fake = host(override); assert.throws(() => validateHost(configuration,fake));
    assert.ok(fake.calls.every(call => !['create','start','pull'].includes(call[0])));
  }
});
test('environment is allowlisted, overrides refused without reading their values into logs', () => {
  assert.deepEqual(cleanEnvironment({ PATH:'synthetic',SECRET_TOKEN:'redacted',AWS_ACCESS_KEY_ID:'redacted' }),{ PATH:'synthetic' });
  const environment = { PATH:'synthetic' };
  Object.defineProperty(environment,'SECRET_TOKEN',{ enumerable:true,get() { throw new Error('Secret value must never be read'); } });
  assert.deepEqual(cleanEnvironment(environment),{ PATH:'synthetic' });
  for (const key of ['DOCKER_HOST','DOCKER_CONTEXT','PGHOST','PGSERVICE','SUPABASE_URL','NODE_OPTIONS']) assert.throws(() => cleanEnvironment({ [key]:'forbidden' }),/override refused/);
});
test('creation publishes nothing, mounts only tmpfs, uses immutable local image and no capabilities', () => {
  const args = createArguments(createIdentity(),image);
  assert.ok(args.includes('--pull=never'));
  assert.equal(args[args.indexOf('--network')+1],'none');
  assert.equal(args[args.indexOf('--user')+1],'postgres');
  assert.ok(args.includes('listen_addresses='));
  for (const forbidden of ['-p','--publish','-v','--volume','--env-file','--privileged','--rm']) assert.equal(args.includes(forbidden),false);
  assert.throws(() => createArguments(createIdentity(),'postgres:17'));
});
test('cleanup/execution accepts only exact resources created by this run', () => {
  const { identity,info } = known();
  assert.doesNotThrow(() => assertOwnedContainer(info,identity,image));
  for (const change of [copy => { copy.Id='old'; }, copy => { copy.Name='/old'; }, copy => { copy.Image='other'; },
    copy => { copy.Config.Labels[`${label}.run`]='other'; }, copy => { copy.HostConfig.NetworkMode='bridge'; },
    copy => { copy.HostConfig.PortBindings={ '5432/tcp': [{}] }; }, copy => { copy.HostConfig.Binds=['private:/data']; },
    copy => { copy.Mounts=[{ Type:'volume' }]; }, copy => { copy.Config.User='root'; },
    copy => { copy.HostConfig.CapAdd=['SYS_ADMIN']; }]) {
    const copy = structuredClone(info); change(copy); assert.throws(() => assertOwnedContainer(copy,identity,image));
  }
  assert.throws(() => assertOwnedContainer(info,{ ...identity,created:false },image));
});
test('SQL transport and cleanup have fixed targets, stop-on-error, finite deadlines and no generic deletion', () => {
  const script = read('scripts/concierge-04b/run.mjs');
  for (const required of ['ON_ERROR_STOP=1','lock_timeout=3000','statement_timeout=15000',"'-h','/var/run/postgresql'",'identity.created',"['container','rm','--force',identity.id]",'docker.pin(',"['--host', endpoint"]) assert.ok(script.includes(required),required);
  assert.doesNotMatch(script,/\b(prune|execSync|dotenv|DROP DATABASE|fetch)\s*\(/);
  assert.ok(script.indexOf('validateHost(config, docker)') < script.indexOf('docker.sync(createArguments'));
});
test('foundation uses non-owner real roles and separate server actor, minimal Supabase objects', () => {
  const sql = read('scripts/concierge-04b/foundation.sql');
  assert.match(sql,/CREATE ROLE authenticated NOLOGIN NOSUPERUSER NOBYPASSRLS/);
  assert.match(sql,/CREATE ROLE harness_client LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS/);
  assert.match(sql,/GRANT service_role TO harness_server/);
  assert.doesNotMatch(sql,/GRANT service_role TO harness_client/);
  assert.match(sql,/CREATE TABLE storage\.buckets/);
  assert.doesNotMatch(sql,/CREATE TABLE public\./);
  const references = new Set(loadManifest().migrations.flatMap(item =>
    [...read(item.path).matchAll(/\b(auth|storage)\.([a-z_]+)/g)].map(match => `${match[1]}.${match[2]}`)));
  assert.deepEqual([...references].sort(), ['auth.role','auth.uid','storage.buckets']);
});
test('fixtures are synthetic and represent current catalogue, multi-service and undated scenarios', () => {
  const sql = read('scripts/concierge-04b/fixtures.sql');
  assert.equal((sql.match(/@example\.invalid/g) ?? []).length,5);
  for (const slug of ['guest_checkin_checkout','guest_checkin','guest_checkout','cleaning_turnover','linen_change']) {
    assert.ok(sql.includes(slug)); assert.ok(read('src/app/lib/planetlsServiceCatalogTarget.ts').includes(`"${slug}"`));
  }
  assert.ok(sql.includes('"zones":['));
  assert.match(sql,/continuous_collaboration/);
  assert.match(sql,/DEMO-04B-HISTORY/);
  assert.doesNotMatch(sql,/https?:\/\/|supabase\.co|COPY.*FROM/i);
});
test('sessions select actual roles; two independent operations and controlled failure cases are prepared', async () => {
  const text = session('authenticated',ids.owner,'SELECT 1;');
  assert.match(text,/SET LOCAL ROLE authenticated/); assert.match(text,/ROLLBACK/);
  assert.throws(() => session('postgres',ids.owner,'SELECT 1'));
  const calls=[], logs=[];
  let raceCalls=0;
  await runScenarios({ sql: (sql,user='postgres') => { calls.push({ sql,user }); return ''; },
    parallel: async sql => {
      calls.push({ sql,user:'harness_server' }); raceCalls++;
      if (raceCalls===2) throw new Error('40001: competing award');
      return String(10000+raceCalls);
    },log: record=>logs.push(record),read });
  assert.equal(raceCalls,8);
  assert.equal(logs.filter(record=>record.race).length,4);
  assert.ok(calls.some(call=>call.sql.includes('FORCE ROW LEVEL SECURITY')));
  assert.ok(calls.some(call=>call.sql.includes('22012')));
  assert.ok(calls.some(call=>call.user==='harness_client' && call.sql.includes("'service_role'")));
  assert.match(interventions,/guest_checkin/); assert.match(interventions,/guest_checkout/);
  assert.match(termination,/scope->'termination_request' IS NULL/);
});
test('all prepared files are strict UTF-8 without BOM; no unexpected SQL metacommands', () => {
  for (const name of readdirSync(directory)) {
    const bytes=readFileSync(path.join(directory,name));
    assert.equal(bytes.subarray(0,3).equals(Buffer.from([239,187,191])),false,name);
    new TextDecoder('utf-8',{ fatal:true }).decode(bytes);
    if (name.endsWith('.sql')) assert.doesNotMatch(bytes.toString(),/^\s*\\(?:!|connect|c|include|i|copy)\b/m);
  }
});
