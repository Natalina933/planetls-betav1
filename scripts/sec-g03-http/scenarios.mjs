import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Every db/storage/barrier adapter below MUST make real, bounded observations.
// None is supplied by the preparation CLI; missing adapters abort before HTTP.
const download = (mission, proof) => `/api/missions/${mission}/files/${proof}/download?format=json`;
const assignment = mission => `/api/missions/${mission}/provider-interventions`;
const same = (a, b) => assert.deepEqual(a, b, 'Effets persistants inattendus.');
async function refusedWithoutEffects(ctx, request, expected = 403) {
  const before = await ctx.observe();
  assert.equal((await request()).status, expected);
  same(await ctx.observe(), before); // SQL rows AND Storage objects/signing audit.
}
export const scenarios = [
  ['auth-session', 'Connexion Auth.js réelle avec compte GoTrue, CSRF et cookie applicatif', async c => {
    c.cookies = {};
    for (const [name, account] of Object.entries(c.accounts)) c.cookies[name] = await c.client.login(account);
  }],
  ['assignment', 'Une affectation et une intervention, principal/profil exacts', async c => {
    c.operation = randomUUID();
    const response = await c.client.post(assignment(c.ids.mission), { provider_profile_id: c.accounts.provider.id }, c.cookies.concierge, c.operation);
    assert.equal(response.status, 201); c.intervention = await response.json();
    const row = await c.db.assignment(c.operation);
    assert.equal(row.provider_intervention_id, c.intervention.id); assert.equal(row.state, 'active');
    assert.equal(row.mission_id, c.ids.mission); assert.equal(row.provider_profile_id, c.accounts.provider.id);
  }],
  ['forged-intervention', 'POST forgé refusé sans effet SQL/Storage', c => refusedWithoutEffects(c,
    () => c.client.post('/api/provider/interventions', { title: 'Forgée', metadata: { mission_id: c.ids.otherMission } }, c.cookies.provider), 400)],
  ['forged-metadata', 'Mutation SQL cliente réelle sans acquisition de droits', async c => {
    await c.db.forgeOwnMetadata(c.accounts.provider.id, c.ids.autonomousIntervention, c.ids.otherMission);
    await refusedWithoutEffects(c, () => c.client.get(download(c.ids.otherMission, c.ids.seedProof), c.cookies.provider));
  }],
  ['other-mission-same-stay', 'Mission exacte requise malgré séjour commun', async c => {
    assert.equal(await c.db.sameStay(c.ids.mission, c.ids.otherMission), true);
    await refusedWithoutEffects(c, () => c.client.upload(c.ids.otherMission, c.cookies.provider));
  }],
  ['suspended-account', 'Ancien cookie refusé après suspension persistée', async c => {
    await c.db.setStatus(c.accounts.provider.id, 'suspended');
    try { await refusedWithoutEffects(c, () => c.client.upload(c.ids.mission, c.cookies.provider)); }
    finally { await c.db.setStatus(c.accounts.provider.id, 'active'); }
  }],
  ['upload', 'Upload autorisé observable et upload tiers sans effet', async c => {
    const before = await c.storage.objects();
    const response = await c.client.upload(c.ids.mission, c.cookies.provider); assert.equal(response.status, 201);
    c.proof = await response.json(); assert.ok(c.proof.id);
    assert.equal((await c.storage.objects()).length, before.length + 1);
    assert.equal(await c.db.hasProof(c.ids.mission, c.proof.id), true);
    await refusedWithoutEffects(c, () => c.client.upload(c.ids.mission, c.cookies.stranger));
  }],
  ['download', 'Lien privé utilisable et téléchargement tiers refusé', async c => {
    const response = await c.client.get(download(c.ids.mission, c.proof.id), c.cookies.provider); assert.equal(response.status, 200);
    const result = await response.json(); c.signedUrl = result.signed_url; c.signedAt = Date.now(); c.ttl = result.expires_in;
    assert.equal(c.ttl, 600); assert.equal((await c.client.signed(c.signedUrl)).status, 200);
    await refusedWithoutEffects(c, () => c.client.get(download(c.ids.mission, c.proof.id), c.cookies.stranger));
  }],
  ['revocation', 'Révocation serveur terminale et nouveau refus Storage', async c => {
    await c.db.revoke(c.operation, c.accounts.concierge.id);
    assert.equal((await c.db.assignment(c.operation)).state, 'revoked');
    await refusedWithoutEffects(c, () => c.client.get(download(c.ids.mission, c.proof.id), c.cookies.provider));
  }],
  ['idempotency', 'Même clé/corps : même résultat ; corps différent refusé', async c => {
    const operation = randomUUID(), body = { provider_profile_id: c.accounts.provider.id };
    const first = await c.client.post(assignment(c.ids.mission), body, c.cookies.concierge, operation); assert.equal(first.status, 201);
    const row = await first.json(), before = await c.observe();
    const replay = await c.client.post(assignment(c.ids.mission), body, c.cookies.concierge, operation); assert.equal(replay.status, 200);
    assert.equal((await replay.json()).id, row.id); same(await c.observe(), before);
    await refusedWithoutEffects(c, () => c.client.post(assignment(c.ids.mission), { ...body, title: 'Autre' }, c.cookies.concierge, operation), 400);
  }],
  ['rollback', 'Panne SQL à la dernière écriture : restauration complète', async c => {
    await c.db.installAlertFailure();
    try {
      const before = await c.observe();
      const response = await c.client.post(assignment(c.ids.mission), { provider_profile_id: c.accounts.provider.id }, c.cookies.concierge, randomUUID());
      assert.ok(response.status >= 400); same(await c.observe(), before);
    } finally { await c.db.removeAlertFailure(); }
  }],
  ['concurrency', 'Rejeu concurrent et révocation entre contrôle et Storage', async c => {
    const result = await c.barriers.concurrentReplay();
    assert.equal(result.distinctBackends, true); assert.equal(result.blockingObserved, true); assert.equal(result.assignments, 1);
    const race = await c.barriers.revokeDuringStorage();
    assert.equal(race.assignmentReadBeforeRevoke, true); assert.equal(race.revokeBeforeStorage, true);
    assert.equal(race.subsequentRequestDenied, true);
    c.emit({ phase: 'race-observation', outcome: race.outcome, atomicRevocationClaimed: false });
  }],
  ['signed-link-lifetime', 'Mesurer un lien déjà signé après révocation puis expiration', async c => {
    const status = (await c.client.signed(c.signedUrl)).status;
    c.emit({ phase: 'old-signed-link', status, elapsedMs: Date.now() - c.signedAt });
    await c.barriers.until(c.signedAt + (c.ttl + 5) * 1000); // Future driver must yield/report at intervals <60 s.
    assert.ok((await c.client.signed(c.signedUrl)).status >= 400);
  }],
  ['owner-concierge', 'Accès légitimes conservés, upload propriétaire interdit', async c => {
    for (const actor of ['owner', 'concierge']) assert.equal((await c.client.get(download(c.ids.mission, c.proof.id), c.cookies[actor])).status, 200);
    await refusedWithoutEffects(c, () => c.client.upload(c.ids.mission, c.cookies.owner));
  }],
  ['cleanup', 'Toutes les ressources de la campagne supprimées et reçu conservé', null]
].map(([id, criterion, run]) => ({ id, criterion, run }));

export async function runPreparedMatrix(ctx) {
  // Verify all adapters before any request. Implementations are a next-lot prerequisite.
  for (const [object, names] of [[ctx.client, ['login','post','get','upload','signed']], [ctx.db, ['assignment','forgeOwnMetadata','sameStay','setStatus','hasProof','revoke','installAlertFailure','removeAlertFailure']],
    [ctx.storage, ['objects']], [ctx.barriers, ['concurrentReplay','revokeDuringStorage','until']], [ctx, ['observe','emit','cleanup']]]) {
    for (const name of names) if (typeof object?.[name] !== 'function') throw new Error(`Adaptateur requis : ${name}`);
  }
  const states = Object.fromEntries(scenarios.map(({ id }) => [id, 'NOT RUN']));
  let failure;
  try {
    for (const scenario of scenarios.filter(item => item.run)) {
      states[scenario.id] = 'RUNNING'; ctx.emit({ scenario: scenario.id, status: 'RUNNING' });
      await scenario.run(ctx); states[scenario.id] = 'PASS'; ctx.emit({ scenario: scenario.id, status: 'PASS' });
    }
  } catch (error) {
    for (const id of Object.keys(states)) if (states[id] === 'RUNNING') states[id] = 'FAIL';
    failure = error;
  } finally {
    try { await ctx.cleanup(); states.cleanup = 'PASS'; }
    catch (error) { states.cleanup = 'FAIL'; failure ??= error; }
  }
  ctx.emit({ phase: 'terminal', global: failure ? 'FAIL' : 'PASS', states });
  if (failure) throw failure;
  return states;
}
