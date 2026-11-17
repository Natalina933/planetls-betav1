import assert from 'node:assert/strict';
import test from 'node:test';
import { loadManifest, createIdentity, createSecrets, endpoint, evaluateResources } from './plan.mjs';
import { buildStack, buildGateway } from './stack.mjs';
import { nextEnvironment, snapshotPaths, nextCommand } from './next-process.mjs';
import { assertSocket, socketTarget } from './network-guard.mjs';
import { cleanupOwned, redact, structuredLogger } from './lifecycle.mjs';
import { accountPlan, bindAccount, fixturePlan } from './fixtures.mjs';
import { createClient } from './client.mjs';
import { scenarios, runPreparedMatrix } from './scenarios.mjs';
import { main } from './run.mjs';

const manifest = loadManifest();
const sample = { dockerFreeMiB: 5000, windowsFreeMiB: 6000, diskFreeGiB: 20, cpu: 8, occupiedPorts: [] };

test('plan only, fifteen NOT RUN scenarios, execute refused before any driver', () => {
  let output = ''; const plan = main([], value => { output = value; });
  assert.equal(plan.mode, 'PREPARED ONLY'); assert.equal(plan.scenarios.length, 15);
  assert.ok(plan.scenarios.every(item => item.status === 'NOT RUN'));
  assert.equal(JSON.parse(output).manifest, manifest.digest);
  for (const args of [['--execute'], ['--up'], ['--cleanup'], ['--prepare']]) assert.throws(() => main(args, () => assert.fail()), /BLOQUÉE/);
});
test('secrets are fresh, synthetic, and JWT roles match the server contract', () => {
  const a = createSecrets(), b = createSecrets();
  for (const key of Object.keys(a)) assert.notEqual(a[key], b[key]);
  assert.equal(JSON.parse(Buffer.from(a.anonKey.split('.')[1], 'base64url')).role, 'anon');
  assert.equal(JSON.parse(Buffer.from(a.serviceKey.split('.')[1], 'base64url')).role, 'service_role');
});
test('stack closed network, pinned images, no host data or public DB/admin port', () => {
  const identity = createIdentity(), stack = buildStack(manifest, identity, createSecrets());
  assert.equal(stack.networks.isolated.internal, true);
  let memory = 0, cpu = 0;
  for (const [key, service] of Object.entries(stack.services)) {
    assert.equal(service.image, manifest.images[key].id); assert.equal(service.pull_policy, 'never');
    assert.equal(service.restart, 'no'); assert.equal(service.read_only, true);
    assert.deepEqual(service.networks, ['isolated']); assert.deepEqual(service.cap_drop, ['ALL']);
    assert.equal(service.labels[`${identity.label}.run`], identity.token);
    assert.equal(service.volumes, undefined); assert.equal(service.env_file, undefined);
    if (key !== 'gateway') assert.equal(service.ports, undefined);
    memory += Number(service.mem_limit.slice(0, -1)); cpu += service.cpus;
  }
  assert.equal(memory, manifest.budget.dockerMiB); assert.equal(cpu, manifest.budget.cpu);
  assert.equal(stack.services.gateway.ports[0].host_ip, '127.0.0.1');
  assert.equal(stack.services.gateway.environment.KONG_ADMIN_LISTEN, 'off');
});
test('gateway only proxies three services and requires generated API keys', () => {
  const secrets = createSecrets(), gateway = buildGateway(secrets);
  assert.equal(gateway.services.length, 3); assert.equal(gateway.consumers.length, 2);
  for (const service of gateway.services) {
    assert.ok(service.plugins.some(plugin => plugin.name === 'key-auth'));
    assert.match(service.url, /^http:\/\/(auth|rest|storage):\d+\/$/);
  }
});
for (const [key, value] of [['dockerFreeMiB', 2800], ['windowsFreeMiB', 795], ['diskFreeGiB', 8.9], ['cpu', 2], ['occupiedPorts', [58431]], ['windowsFreeMiB', undefined]]) {
  test(`resource gate denies ${key}=${value}`, () => assert.equal(evaluateResources({ ...sample, [key]: value }, manifest.budget).ready, false));
}
test('resource gate accepts only a complete sufficient snapshot', () => assert.equal(evaluateResources(sample, manifest.budget).ready, true));
for (const url of ['https://127.0.0.1:58430', 'http://localhost:58430', 'http://127.0.0.1:3000', 'http://user:pass@127.0.0.1:58430', 'http://127.0.0.1:58430/?x=1', 'http://example.invalid:58430']) {
  test(`endpoint rejected: ${url}`, () => assert.throws(() => endpoint(url, 58430)));
}
test('Next never inherits secrets or NODE_OPTIONS; readiness stays off', () => {
  const secrets = createSecrets();
  const env = nextEnvironment({ inherited: { PATH: 'synthetic-path', SUPABASE_URL: 'https://real.invalid', AUTH_SECRET: 'foreign', NODE_OPTIONS: '--require=foreign', PRIVATE: 'foreign' },
    manifest, secrets, guardUrl: 'file:///C:/synthetic/network-guard.mjs', appUrl: 'http://127.0.0.1:58430', gatewayUrl: 'http://127.0.0.1:58431' });
  assert.equal(env.PATH, 'synthetic-path'); assert.equal(env.PRIVATE, undefined);
  assert.equal(env.AUTH_SECRET, secrets.authSecret); assert.equal(env.PLANETLS_MISSION_ASSIGNMENTS_READY, 'false');
  assert.equal(env.SUPABASE_URL, 'http://127.0.0.1:58431'); assert.ok(!env.NODE_OPTIONS.includes('foreign'));
  assert.equal(nextCommand('node', '/approved/next', manifest).shell, false);
});
test('snapshot excludes env/keys before reading git blobs', () => {
  assert.deepEqual(snapshotPaths(['src/app/page.tsx', '.env', '.env.local', 'sub/.env.test', 'secret.pem', '.git/config', 'node_modules/x']), ['src/app/page.tsx']);
  for (const value of ['../outside', 'C:/outside', '/outside', 'sub\\file']) assert.throws(() => snapshotPaths([value]));
});
test('socket gate denies remote hosts, wrong ports and unknown IPC forms', () => {
  assertSocket('127.0.0.1', 58431, [58430, 58431]);
  for (const [host, port] of [['example.invalid', 58431], ['127.0.0.1', 54321], ['localhost', 58431], ['::1', 58431], [undefined, 58431]]) assert.throws(() => assertSocket(host, port, [58430, 58431]));
  assert.deepEqual(socketTarget([{ host: '127.0.0.1', port: 58431 }]), { host: '127.0.0.1', port: 58431, path: undefined });
  assert.equal(socketTarget(['\\\\.\\pipe\\foreign']).path, '\\\\.\\pipe\\foreign');
});
test('HTTP client refuses external URLs before fetch and forces manual redirects', async () => {
  const calls = [];
  const client = createClient({ appUrl: 'http://127.0.0.1:58430', gatewayUrl: 'http://127.0.0.1:58431', ports: manifest.ports,
    fetchImpl: async (url, options) => { calls.push({ url: String(url), options }); return new Response('{}'); } });
  await assert.rejects(client.get('https://example.invalid/private'));
  await assert.rejects(client.signed('http://127.0.0.1:54321/private'));
  assert.equal(calls.length, 0);
  await client.get('/api/auth/session'); assert.equal(calls[0].options.redirect, 'manual');
});
function fakeCleanup(overrides = {}) {
  const identity = { ...createIdentity(), daemonId: 'synthetic-daemon' };
  const resource = { kind: 'container', id: 'a'.repeat(64), name: `${identity.project}-db`, image: manifest.images.db.id, createdByThisRun: true };
  const info = { ...resource, internalNetworkOnly: true, labels: { [`${identity.label}.run`]: identity.token, [`${identity.label}.purpose`]: 'synthetic-integration' } };
  const removed = [];
  const transport = { daemonId: async () => identity.daemonId, inspect: async () => ({ ...info, ...overrides }),
    removeExact: async item => removed.push(item.id), exists: async () => false };
  return { receipt: { state: 'created', identity, resources: [resource] }, transport, removed };
}
test('cleanup uses exact owned ID and confirms absence', async () => {
  const f = fakeCleanup(); assert.equal((await cleanupOwned(f.receipt, f.transport)).state, 'removed');
  assert.deepEqual(f.removed, ['a'.repeat(64)]);
});
for (const overrides of [{ labels: {} }, { id: 'b'.repeat(64) }, { hostMounts: true }, { unexpectedPorts: true }, { internalNetworkOnly: false }]) {
  test(`uncertain cleanup refused ${Object.keys(overrides)[0]}`, async () => {
    const f = fakeCleanup(overrides); await assert.rejects(cleanupOwned(f.receipt, f.transport)); assert.deepEqual(f.removed, []);
  });
}
test('journal redaction removes nested credentials, JWTs and signed URL tokens', () => {
  const secrets = createSecrets(), serialized = JSON.stringify(redact({ password: secrets.database, nested: { cookie: 'private', signed_url: 'private' }, message: `Bearer ${secrets.serviceKey}` }));
  assert.ok(!serialized.includes(secrets.database)); assert.ok(!serialized.includes(secrets.serviceKey)); assert.ok(!serialized.includes('private'));
});
test('matrix has fifteen unique criteria and never runs with missing adapters', async () => {
  assert.equal(scenarios.length, 15); assert.equal(new Set(scenarios.map(item => item.id)).size, 15);
  await assert.rejects(runPreparedMatrix({}), /Adaptateur requis/);
});
test('scenario failure triggers cleanup and marks later scenarios NOT RUN', async () => {
  let cleaned = 0; const events = [];
  const noop = async () => {};
  const ctx = { accounts: { provider: {} }, client: { login: async () => { throw new Error('synthetic failure'); }, post: noop, get: noop, upload: noop, signed: noop },
    db: Object.fromEntries(['assignment','forgeOwnMetadata','sameStay','setStatus','hasProof','revoke','installAlertFailure','removeAlertFailure'].map(key => [key, noop])),
    storage: { objects: noop }, barriers: { concurrentReplay: noop, revokeDuringStorage: noop, until: noop },
    observe: noop, emit: value => events.push(value), cleanup: async () => { cleaned++; } };
  await assert.rejects(runPreparedMatrix(ctx), /synthetic failure/); assert.equal(cleaned, 1);
  assert.equal(events.at(-1).global, 'FAIL'); assert.equal(events.at(-1).states.assignment, 'NOT RUN'); assert.equal(events.at(-1).states.cleanup, 'PASS');
});
test('fixture accounts cannot be bound to a real-domain identity or unrelated Auth UUID', () => {
  const accounts = accountPlan(createIdentity());
  for (const account of Object.values(accounts)) {
    assert.match(account.email, /@example\.invalid$/);
    assert.throws(() => bindAccount(account, { id: 'a'.repeat(36), email: account.email }));
    assert.throws(() => bindAccount(account, { id: '10000000-0000-4000-8000-000000000001', email: 'foreign@example.invalid' }));
  }
  assert.throws(() => fixturePlan(accounts));
  const bound = Object.fromEntries(Object.entries(accounts).map(([key, account]) => [key, bindAccount(account, { email: account.email, id: createIdentity().token })]));
  assert.equal(fixturePlan(bound).profiles.length, 8);
});
test('structured journal emits ordered redacted JSONL without writing files', () => {
  const lines = [], emit = structuredLogger(line => lines.push(line), () => 'synthetic-time');
  emit({ phase: 'test', cookie: 'private' }); emit({ phase: 'end', password: 'private' });
  assert.equal(JSON.parse(lines[1]).sequence, 2); assert.equal(JSON.parse(lines[0]).cookie, '[REDACTED]');
  assert.ok(lines.every(line => line.endsWith('\n') && !line.includes('private')));
});
test('duplicate resources or changed daemon never authorize cleanup', async () => {
  const duplicate = fakeCleanup(); duplicate.receipt.resources.push(duplicate.receipt.resources[0]);
  await assert.rejects(cleanupOwned(duplicate.receipt, duplicate.transport)); assert.deepEqual(duplicate.removed, []);
  const changed = fakeCleanup(); changed.transport.daemonId = async () => 'different-daemon';
  await assert.rejects(cleanupOwned(changed.receipt, changed.transport)); assert.deepEqual(changed.removed, []);
});
test('Credentials client performs CSRF, cookies and session identity checks', async () => {
  const account = { id: '10000000-0000-4000-8000-000000000001', email: 'provider@example.invalid', role: 'provider', password: 'synthetic-only' };
  const calls = [];
  const client = createClient({ appUrl: 'http://127.0.0.1:58430', gatewayUrl: 'http://127.0.0.1:58431', ports: manifest.ports,
    fetchImpl: async (url, options) => {
      calls.push({ path: url.pathname, options });
      if (url.pathname.endsWith('/csrf')) return new Response(JSON.stringify({ csrfToken: 'synthetic-csrf' }), { headers: { 'set-cookie': 'csrf=synthetic; Path=/' } });
      if (url.pathname.endsWith('/credentials')) {
        assert.match(options.headers.cookie, /csrf=synthetic/);
        assert.equal(options.body.get('csrfToken'), 'synthetic-csrf');
        return new Response('{}', { headers: { 'set-cookie': 'session=synthetic; Path=/' } });
      }
      assert.match(options.headers.cookie, /session=synthetic/);
      return new Response(JSON.stringify({ user: account }));
    } });
  assert.match(await client.login(account), /session=synthetic/);
  assert.deepEqual(calls.map(call => call.path), ['/api/auth/csrf', '/api/auth/callback/credentials', '/api/auth/session']);
});
