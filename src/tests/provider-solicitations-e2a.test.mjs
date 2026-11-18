import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadManifest, staticPlan, snapshotFiles } from '../../scripts/provider-solicitations-e2a/plan.mjs';

const read = p => readFileSync(p, 'utf8');
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');

test('manifest covers the complete canonical order and pins both targets last', () => {
  const m = loadManifest();
  assert.equal(m.migrations.length, readdirSync('supabase/migrations').filter(p => p.endsWith('.sql')).length);
  assert.deepEqual(m.migrations.slice(-2).map(p => p.path.split('/').at(-1)), ['20261117120000_provider_solicitations.sql', '20261117121000_provider_solicitation_replay_lookup.sql']);
  assert.ok([...m.migrations, ...m.assets, ...m.references].every(p => sha(p.path) === p.sha256));
});
test('historical divergence remains explicit and evidence is pinned', () => {
  const historical = JSON.parse(read('scripts/concierge-04b/manifest.json'));
  const evidence = JSON.parse(read('scripts/sec-auth-c1/divergences.json'));
  const current = loadManifest();
  assert.equal(evidence.length, 5);
  for (const e of evidence) {
    assert.equal(historical.migrations.find(p => p.path === e.path).sha256, e.expected);
    assert.equal(current.migrations.find(p => p.path === e.path).sha256, e.actual);
    assert.ok(e.explanation && e.reference && !e.blocking);
  }
  const historicPaths = new Set(historical.migrations.map(p => p.path));
  assert.equal(current.migrations.filter(p => !historicPaths.has(p.path)).length, 4);
});
test('plan is static and reports remaining blockers', () => {
  const plan = staticPlan();
  assert.match(plan.mode, /SQL NOT RUN/);
  assert.ok(plan.blockers.includes('business rollback and concurrency not validated in PostgreSQL'));
  assert.doesNotMatch(read('scripts/provider-solicitations-e2a/plan.mjs'), /child_process|\bspawn\b|\bexec\b/);
});
test('prepared SQL asserts ACL, role separation, definer, deferred FK and empty scoped reads', () => {
  const sql = read('scripts/provider-solicitations-e2a/assertions.sql');
  const cases = read('scripts/provider-solicitations-e2a/scenarios.sql');
  for (const term of ['relrowsecurity', 'has_table_privilege', 'has_function_privilege', 'prosecdef', 'condeferrable', 'tgdeferrable']) assert.ok(sql.includes(term), term);
  for (const term of ['SET LOCAL ROLE authenticated', 'SET LOCAL ROLE service_role', '42501', 'owner empty list', 'provider empty list']) assert.ok(cases.includes(term), term);
});
test('all prepared files are valid UTF-8 without BOM', () => {
  for (const name of readdirSync('scripts/provider-solicitations-e2a')) {
    const b = readFileSync(`scripts/provider-solicitations-e2a/${name}`);
    assert.notDeepEqual([...b.subarray(0,3)], [239,187,191]);
    new TextDecoder('utf-8', {fatal:true}).decode(b);
  }
});
test('snapshot keeps verified bytes after source mutation and rejects mutated input', () => {
  const original = Buffer.from('SELECT 1;');
  const digest = createHash('sha256').update(original).digest('hex');
  const manifest = { migrations: [{path:'fixture.sql',sha256:digest}], assets: [], references: [] };
  let current = original;
  const snapshot = snapshotFiles(manifest, () => current);
  current = Buffer.from('SELECT 2;');
  assert.equal(snapshot['fixture.sql'], 'SELECT 1;');
  assert.throws(() => snapshotFiles(manifest, () => current), /changed/);
  assert.ok(Object.isFrozen(snapshot));
});
