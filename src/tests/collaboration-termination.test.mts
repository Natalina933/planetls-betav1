import test from "node:test";
import assert from "node:assert/strict";
import { collaborationLifecycle, terminationSchedule } from "../app/api/_shared/collaborationLifecycle.ts";
import { requestCollaborationTermination, readCollaborationTermination } from "../app/api/_shared/collaborationTermination.ts";
import { addCollaborationIntervention } from "../app/api/_shared/collaborationInterventions.ts";
import { authorizeMissionCreation } from "../app/api/_shared/missionCreationAuthorization.ts";
import { TerminationDb, OWNER, CONCIERGE, THIRD, ID, STAY, NOW, agreedVersion, modules, type Row } from "./fixtures/collaborationTerminationHarness.mts";

for (const actor of [OWNER, CONCIERGE]) {
  test(`participant ${actor === OWNER ? "propriétaire" : "concierge"} : préavis standard serveur et événement conservé`, async () => {
    const db = new TerminationDb();
    const result = await requestCollaborationTermination(db.client(), ID, actor, NOW) as Row;
    assert.equal(result.status, 202); assert.equal(result.collaboration_status, "active");
    assert.equal(result.termination_request.notice_days, 30);
    assert.equal(result.termination_request.requested_by, actor);
    assert.equal(result.termination_request.requested_at, NOW.toISOString());
    assert.equal(result.termination_request.effective_date, "2026-11-25");
    assert.equal(result.termination_request.effective_at, "2026-11-25T00:00:00.000Z");
    assert.equal(db.row().ends_on, "2026-11-25"); assert.equal(db.row().status, "active");
    assert.equal(db.row().scope.termination_events.length, 1);
    assert.equal(db.row().scope.termination_events[0].recipient_profile_id, actor === OWNER ? CONCIERGE : OWNER);
  });
}

test("tiers : consultation et demande refusées sans lecture des missions ni écriture", async () => {
  const db = new TerminationDb();
  assert.equal((await requestCollaborationTermination(db.client(), ID, THIRD, NOW)).status, 404);
  assert.equal((await readCollaborationTermination(db.client(), ID, THIRD, NOW)).status, 404);
  assert.deepEqual(db.writes, []);
});

test("conditions particulières : une version acceptée par les deux participants permet 45 jours", async () => {
  const db = new TerminationDb(); agreedVersion(db, 45);
  const result = await requestCollaborationTermination(db.client(), ID, OWNER, NOW) as Row;
  assert.equal(result.termination_request.notice_days, 45);
  assert.equal(result.termination_request.effective_date, "2026-12-10");
  assert.equal(result.termination_request.conditions_version_id, "version-agreed");
  assert.equal(result.termination_request.notice_source, "bilateral_contract_conditions");
});

test("préavis unilatéral, brouillon, autre participant ou deux versions différentes : jamais appliqués", async () => {
  for (const overrides of [{ concierge_accepted_at: null }, { status: "draft" }, { concierge_accepted_by: THIRD },
    { concierge_accepted_at: "2030-01-01T00:00:00Z" }, { proposed_owner_id: THIRD }]) {
    const db = new TerminationDb();
    db.row().scope.noticeDays = 0;
    agreedVersion(db, 0, overrides);
    assert.equal(((await requestCollaborationTermination(db.client(), ID, OWNER, NOW)) as Row).termination_request.notice_days, 30);
  }
  const db = new TerminationDb();
  agreedVersion(db, 1, { concierge_accepted_at: null });
  agreedVersion(db, 1, { id: "second-version", version_number: 2, owner_accepted_at: null });
  assert.equal(((await requestCollaborationTermination(db.client(), ID, OWNER, NOW)) as Row).termination_request.notice_days, 30);
});

test("calendrier UTC : changement d’année, mois, année bissextile et décalage horaire", () => {
  for (const [requested, expected] of [
    ["2026-12-15T23:59:59Z", "2027-01-14"], ["2026-01-31T10:00:00Z", "2026-03-02"],
    ["2028-02-01T10:00:00Z", "2028-03-02"], ["2026-03-08T01:30:00-05:00", "2026-04-07"],
  ]) assert.equal(terminationSchedule(requested, 30).effective_at, `${expected}T00:00:00.000Z`);
  assert.equal(terminationSchedule(NOW.toISOString(), 0).effective_at, NOW.toISOString());
});

test("activité jusqu’à la borne exclue, fin effective à la borne sans traitement différé", async () => {
  const db = new TerminationDb(); await requestCollaborationTermination(db.client(), ID, OWNER, NOW);
  assert.equal(collaborationLifecycle(db.row(), new Date("2026-11-24T23:59:59.999Z")).canCreateInterventions, true);
  const atEnd = collaborationLifecycle(db.row(), new Date("2026-11-25T00:00:00.000Z"));
  assert.equal(atEnd.status, "ended"); assert.equal(atEnd.canCreateInterventions, false);
  const result = await readCollaborationTermination(db.client(), ID, CONCIERGE, new Date("2026-11-26T00:00:00Z")) as Row;
  assert.equal(result.collaboration_status, "ended"); assert.equal(result.termination_request.state, "effective");
  assert.equal(db.row().status, "active"); assert.equal(db.writes.length, 1);
});

test("répétition et requêtes concurrentes simulées : une demande, une échéance et un événement", async () => {
  const db = new TerminationDb();
  await Promise.all([requestCollaborationTermination(db.client(), ID, OWNER, NOW), requestCollaborationTermination(db.client(), ID, CONCIERGE, NOW)]);
  const original = structuredClone(db.row().scope);
  agreedVersion(db, 1); // A later edit cannot rewrite the already frozen notice.
  const result = await requestCollaborationTermination(db.client(), ID, CONCIERGE, new Date("2026-12-01T00:00:00Z")) as Row;
  assert.equal(result.collaboration_status, "ended");
  assert.equal(result.termination_request.notice_days, 30); assert.equal(result.termination_request.effective_date, "2026-11-25");
  assert.deepEqual(db.row().scope, original); assert.equal(db.row().scope.termination_events.length, 1);
  assert.equal(db.writes.length, 2); // Includes the losing CAS attempt; only one row mutation.
  db.row().status = "ended";
  await requestCollaborationTermination(db.client(), ID, OWNER, NOW);
  assert.equal(db.row().status, "ended"); assert.equal(db.writes.length, 2);
});

test("historique conservé, intervention postérieure et chevauchante signalées sans mutation", async () => {
  const db = new TerminationDb();
  db.tables.missions = [
    { id: "past", status: "closed", scheduled_start: "2026-10-01T10:00:00Z" },
    { id: "future", status: "scheduled", scheduled_start: "2026-12-01T10:00:00Z" },
    { id: "in-progress", status: "in_progress", scheduled_start: "2026-11-24T23:00:00Z", scheduled_end: "2026-11-25T01:00:00Z" },
  ].map(row => ({ ...row, owner_profile_id: OWNER, concierge_profile_id: CONCIERGE, metadata: { collaboration_id: ID } }));
  const history = structuredClone({ missions: db.tables.missions, invoices: db.tables.invoices });
  const result = await requestCollaborationTermination(db.client(), ID, OWNER, NOW) as Row;
  assert.deepEqual(result.interventions_requiring_arbitration.map((m: Row) => m.id), ["future", "in-progress"]);
  assert.ok(result.interventions_requiring_arbitration.every((m: Row) => m.requires_arbitration));
  await readCollaborationTermination(db.client(), ID, OWNER, new Date("2027-01-01T00:00:00Z"));
  assert.deepEqual({ missions: db.tables.missions, invoices: db.tables.invoices }, history);
  assert.ok(db.writes.every(table => table === "housing_collaborations"));
});

test("après échéance : commande dédiée, affectation de séjour et mission générique refusées", async () => {
  const db = new TerminationDb(); await requestCollaborationTermination(db.client(), ID, OWNER, new Date("2001-01-01T12:00:00Z"));
  await assert.rejects(addCollaborationIntervention(db.client(), { collaborationId: ID, actorId: OWNER,
    operationId: "operation", serviceSlug: "linen_change", start: "2026-12-01T12:00:00Z", end: "2026-12-01T13:00:00Z" }), /résiliation/);
  const helper = modules(db)("@/app/api/_shared/stayMissionAssignments");
  assert.equal((await helper.createOrReuseStayMissions({ db: db.client(), reservation: db.tables.reservations[0],
    body: { assignments: [{ need: "linen", collaboration_id: ID }] } })).ok, false);
  const authorization = { db: db.client(), actorProfileId: OWNER, actorRole: "owner" as const,
    conciergeProfileId: CONCIERGE, ownerProfileId: OWNER, propertyId: "42", reservationId: null };
  assert.equal((await authorizeMissionCreation(authorization)).ok, false);
  assert.equal((await authorizeMissionCreation({ ...authorization, propertyId: null, metadata: { collaboration_id: ID } })).ok, false);
  assert.equal((await authorizeMissionCreation({ ...authorization, propertyId: null, reservationId: STAY })).ok, false);
  assert.equal(db.tables.missions.length, 0);
});

test("pendant le préavis : commandes permises ; demandes ponctuelles indépendantes inchangées", async () => {
  const db = new TerminationDb(); await requestCollaborationTermination(db.client(), ID, OWNER);
  const mission = await addCollaborationIntervention(db.client(), { collaborationId: ID, actorId: OWNER,
    operationId: "during-notice", serviceSlug: "linen_change", start: "2026-11-01T12:00:00Z", end: "2026-11-01T13:00:00Z" });
  assert.ok(mission.id);
  const standalone = await authorizeMissionCreation({ db: db.client(), actorProfileId: OWNER, actorRole: "owner",
    conciergeProfileId: CONCIERGE, ownerProfileId: OWNER, propertyId: null, reservationId: null });
  assert.equal(standalone.ok, true);
  const oneOff = new TerminationDb(); oneOff.row().scope.continuous_collaboration = false;
  assert.equal((await requestCollaborationTermination(oneOff.client(), ID, OWNER, NOW)).status, 409);
  assert.deepEqual(oneOff.writes, []);
});

test("demande 03B historique : date et demandeur préservés, ancienne trace conservée", async () => {
  const db = new TerminationDb();
  const previous = { state: "requested", requested_by: CONCIERGE, requested_at: "2020-01-01T12:00:00Z", effective_date: null, blocked_by: "old-decision" };
  db.row().scope.termination_request = previous;
  const result = await requestCollaborationTermination(db.client(), ID, OWNER, NOW) as Row;
  assert.equal(result.termination_request.requested_at, "2020-01-01T12:00:00.000Z");
  assert.equal(result.termination_request.requested_by, CONCIERGE); assert.equal(result.termination_request.effective_date, "2020-01-31");
  assert.deepEqual(db.row().scope.termination_history, [previous]);
  assert.equal(result.collaboration_status, "ended");
});

test("préavis convenu invalide, durée déterminée ou date historique : refus sans réécriture", async () => {
  for (const setup of [
    (db: TerminationDb) => agreedVersion(db, -1),
    (db: TerminationDb) => agreedVersion(db, 30, { conditions: { duration: { kind: "DETERMINEE", endsOn: "2027-01-01", noticeDays: 30 } } }),
    (db: TerminationDb) => { db.row().ends_on = "2030-01-01"; },
  ]) {
    const db = new TerminationDb(); setup(db); const snapshot = structuredClone(db.row());
    assert.equal((await requestCollaborationTermination(db.client(), ID, OWNER, NOW)).status, 409);
    assert.deepEqual(db.row(), snapshot);
  }
});

test("API : aucun préavis/date client, refus de tiers et de rôle, GET autorisé sans écriture", async () => {
  const db = new TerminationDb(), context = { params: Promise.resolve({ id: ID }) };
  const route = modules(db)("@/app/api/housing-collaborations/[id]/termination/route");
  for (const body of [{ notice_days: 0 }, { effective_date: "2000-01-01" }, { requested_by: THIRD }]) {
    const response = await route.POST(new Request("http://localhost/api/termination", { method: "POST", body: JSON.stringify(body) }), context);
    assert.equal(response.status, 400);
  }
  assert.deepEqual(db.writes, []);
  const outsider = modules(db, THIRD)("@/app/api/housing-collaborations/[id]/termination/route");
  assert.equal((await outsider.GET(new Request("http://localhost"), context)).status, 404);
  const role = modules(db, OWNER, "provider")("@/app/api/housing-collaborations/[id]/termination/route");
  assert.equal((await role.POST(new Request("http://localhost", { method: "POST" }), context)).status, 403);
  assert.equal((await route.POST(new Request("http://localhost", { method: "POST" }), context)).status, 202);
  const before = db.writes.length;
  assert.equal((await route.GET(new Request("http://localhost"), context)).status, 202);
  assert.equal(db.writes.length, before);
});

test("API de séjour et listes : échéance appliquée sans ouvrir une interface ni écrire un statut", async () => {
  const db = new TerminationDb(); await requestCollaborationTermination(db.client(), ID, OWNER, new Date("2001-01-01T12:00:00Z"));
  const load = modules(db), list = load("@/app/api/housing-collaborations/route");
  const writes = db.writes.length;
  assert.deepEqual((await (await list.GET(new Request("http://localhost/api/housing-collaborations?status=active"))).json()).items, []);
  const ended = await (await list.GET(new Request("http://localhost/api/housing-collaborations?status=ended"))).json();
  assert.equal(ended.items.length, 1); assert.equal(ended.items[0].status, "ended");
  assert.equal(ended.items[0].termination.state, "effective");
  const reservations = load("@/app/api/owner/reservations/route");
  const response = await reservations.POST(new Request("http://localhost/api/owner/reservations", { method: "POST",
    body: JSON.stringify({ concierge_profile_id: CONCIERGE, collaboration_id: ID, property_id: "42",
      check_in_at: "2026-12-01T15:00:00Z", check_out_at: "2026-12-08T10:00:00Z" }) }));
  assert.equal(response.status, 400);
  assert.equal(db.writes.length, writes); assert.equal(db.row().status, "active");
});

test("échec de lecture après enregistrement : reprise sans doublon ni nouveau délai", async () => {
  const db = new TerminationDb(); db.failTable = "missions";
  await assert.rejects(requestCollaborationTermination(db.client(), ID, OWNER, NOW), /indisponibles/);
  const notice = structuredClone(db.row().scope.termination_request);
  db.failTable = "";
  await requestCollaborationTermination(db.client(), ID, CONCIERGE, new Date("2026-11-01T00:00:00Z"));
  assert.deepEqual(db.row().scope.termination_request, notice);
  assert.equal(db.row().scope.termination_events.length, 1); assert.equal(db.writes.length, 1);
});
