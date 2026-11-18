import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fixture, OWNER, PROVIDER, OTHER, REQUEST, OP, KEY } from "./helpers/provider-solicitations-fixture.ts";
import type { Options } from "./helpers/provider-solicitations-fixture.ts";

const command = { status: "interested", expected_version: 1 };
const responseCalls = (f: ReturnType<typeof fixture>) => f.calls.rpc.filter((call) => call.name === "respond_provider_solicitation");
const invoke = (f: ReturnType<typeof fixture>, body: unknown = command, headers: Record<string, string> = {}) => f.invoke("POST", { respond: true, body, headers });

for (const status of ["interested", "declined"]) test(`réponse destinataire : ${status}, message et identité serveur`, async () => {
  const f = fixture({ role: "provider" }); const result = await invoke(f, { status, expected_version: 1, message: "  Ma réponse  " });
  assert.equal(result.status, 200); assert.equal(result.body.result.status, status); assert.equal(result.body.result.version, 2);
  assert.equal(f.state().history.length, 2); assert.equal(f.state().current.response_message, "Ma réponse");
  assert.equal(f.state().history.at(-1)!.actor_principal_id, PROVIDER);
  assert.equal(f.state().history.at(-1)!.actor_profile_id, PROVIDER);
  assert.deepEqual(responseCalls(f)[0].args, { p_principal_id: PROVIDER, p_actor_id: PROVIDER, p_idempotency_key: KEY,
    p_solicitation_id: REQUEST, p_status: status, p_message: "Ma réponse", p_expected_version: 1 });
  assert.equal(f.calls.logs.length, 0); assert.equal(f.calls.network.length, 0);
});
for (const message of [undefined, null, "", "   "]) test(`message facultatif normalisé : ${JSON.stringify(message)}`, async () => {
  const f = fixture({ role: "artisan" });
  assert.equal((await invoke(f, { ...command, ...(message !== undefined ? { message } : {}) })).status, 200);
  assert.equal(responseCalls(f)[0].args.p_message, null);
});
test("message borné, statuts contractuels et champs d'identité refusés", async () => {
  const inputs = [{ ...command, message: "x".repeat(2001) }, ...["sent", "accepted", "paid", "completed"].map((status) => ({ ...command, status })),
    { ...command, owner_profile_id: OWNER }, { ...command, actor_profile_id: OTHER }, { ...command, metadata: { authorized: true } }];
  for (const body of inputs) {
    const f = fixture({ role: "provider" }); assert.equal((await invoke(f, body)).status, 400);
    assert.equal(f.calls.rpc.length, 0); assert.equal(f.state().history.length, 1);
  }
});
test("autre artisan et demande inexistante : même 404, aucune transition", async () => {
  const other = fixture({ role: "provider", actor: OTHER }); const missing = fixture({ role: "provider", readMissing: true });
  const a = await invoke(other); const b = await invoke(missing);
  assert.equal(a.status, 404); assert.deepEqual(a, b); assert.equal(other.state().history.length, 1);
});
for (const options of [{ role: "owner" }, { role: "concierge" }, { role: "admin" }, { role: "provider", status: "suspended" },
  { role: "provider", selected: OTHER }, { role: "provider", claim: "admin" }]) test(`autorisation refusée : ${JSON.stringify(options)}`, async () => {
  const f = fixture(options); assert.equal((await invoke(f)).status, 403); assert.equal(f.calls.rpc.length, 0);
});
test("absence d'identité ou droits indisponibles : refus avant SQL", async () => {
  for (const [options, status] of [[{ role: "provider", unauthenticated: true }, 401], [{ role: "provider", rightsError: true }, 503]] as [Options, number][]) {
    const f = fixture(options); assert.equal((await invoke(f)).status, status); assert.equal(f.calls.rpc.length, 0);
  }
});
test("propriétaire émetteur inactif ou rôle révoqué : 403", async () => {
  for (const options of [{ ownerStatus: "suspended" }, { ownerStatus: "deleted" }, { ownerRole: "provider" }]) {
    const f = fixture({ role: "provider", ...options }); assert.equal((await invoke(f)).status, 403);
    assert.equal(f.state().history.length, 1);
  }
});
test("origine incorrecte ou absente, y compris faux en-tête serveur", async () => {
  for (const origin of ["https://attacker.invalid", "", "null"]) {
    const f = fixture({ role: "provider" }); assert.equal((await invoke(f, command, { origin, authorization: "forged" })).status, 403);
    assert.equal(f.calls.rpc.length, 0);
  }
});
test("clé absente/invalide, version absente ou invalide et identifiant invalide", async () => {
  for (const key of ["", "invalid-key"]) {
    const f = fixture({ role: "provider" }); assert.equal((await invoke(f, command, { "idempotency-key": key })).status, 400); assert.equal(f.calls.rpc.length, 0);
  }
  for (const body of [{ status: "interested" }, { ...command, expected_version: 0 }, { ...command, expected_version: 1.5 }]) {
    const f = fixture({ role: "provider" }); assert.equal((await invoke(f, body)).status, 400); assert.equal(f.calls.rpc.length, 0);
  }
  const f = fixture({ role: "provider" });
  assert.equal((await f.invoke("POST", { respond: true, target: "invalid", body: command })).status, 400);
});
test("rejeu même clé/commande : résultat initial et un seul nouvel événement", async () => {
  const f = fixture({ role: "provider" }); const first = await invoke(f); const second = await invoke(f);
  assert.equal(first.status, 200); assert.equal(first.body.replayed, false); assert.equal(second.body.replayed, true);
  assert.deepEqual(second.body.result, first.body.result); assert.equal(second.body.operation_id, first.body.operation_id);
  assert.equal(f.state().history.length, 2); assert.equal(f.state().operations.size, 1);
});
test("compte artisan ou propriétaire devenu inactif : rejeu refusé", async () => {
  for (const suspended of ["provider", "owner"]) {
    const f = fixture({ role: "provider" }); await invoke(f);
    if (suspended === "provider") f.setActorStatus("suspended"); else f.setOwnerStatus("suspended");
    assert.equal((await invoke(f)).status, 403); assert.equal(f.state().history.length, 2);
  }
});
test("même clé avec un autre corps : 409 sans nouvel événement", async () => {
  for (const changed of [{ ...command, status: "declined" }, { ...command, message: "Différent" }, { ...command, expected_version: 2 }]) {
    const f = fixture({ role: "provider" }); await invoke(f); const result = await invoke(f, changed);
    assert.equal(result.status, 409); assert.equal(result.body.error.code, "IDEMPOTENCY_CONFLICT"); assert.equal(f.state().history.length, 2);
  }
});
test("nouvelle clé après réponse terminale : 409", async () => {
  const f = fixture({ role: "provider" }); await invoke(f);
  const result = await invoke(f, { status: "declined", expected_version: 1 }, { "idempotency-key": OP });
  assert.equal(result.status, 409); assert.equal(result.body.error.code, "ALREADY_RESPONDED"); assert.equal(f.state().history.length, 2);
});
test("version obsolète transmise à SQL et traduite en 409", async () => {
  const f = fixture({ role: "provider" }); const result = await invoke(f, { ...command, expected_version: 2 });
  assert.equal(responseCalls(f)[0].args.p_expected_version, 2); assert.equal(result.status, 409);
  assert.equal(result.body.error.code, "VERSION_CONFLICT"); assert.equal(f.state().history.length, 1);
});
test("réponses concurrentes incompatibles : résultat du transport SQL simulé respecté", async () => {
  const f = fixture({ role: "provider" });
  const results = await Promise.all([invoke(f), invoke(f, { ...command, status: "declined" }, { "idempotency-key": OP })]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal(f.state().history.length, 2); assert.equal(f.state().operations.size, 1); assert.equal(responseCalls(f).length, 2);
});
test("rejeux concurrents identiques : un seul effet dans le transport simulé", async () => {
  const f = fixture({ role: "provider" }); const results = await Promise.all([invoke(f), invoke(f)]);
  assert.ok(results.every((result) => result.status === 200));
  assert.deepEqual(results.map((result) => result.body.replayed).sort(), [false, true]); assert.equal(f.state().history.length, 2);
});
test("RPC indisponible, transport en erreur ou échec transactionnel : pas de fallback", async () => {
  for (const options of [{ rpcError: { code: "PGRST202", message: "PRIVATE-RPC" } }, { rpcThrows: true },
    { responseError: { code: "XX000", message: "PRIVATE-ROLLBACK" } }]) {
    const f = fixture({ role: "provider", ...options }); const result = await invoke(f);
    assert.equal(result.status, 503); assert.equal(result.body.error.code, "UNAVAILABLE");
    assert.equal(f.state().history.length, 1); assert.equal(f.state().operations.size, 0);
    assert.equal(responseCalls(f).length, 1); assert.equal(f.calls.logs.length, 0);
    assert.equal(JSON.stringify(result.body).includes("PRIVATE"), false);
  }
});
test("résultat SQL incohérent refusé sans réessai automatique", async () => {
  for (const replyResult of [{ result: { solicitation_id: REQUEST, status: "accepted", version: 2 }, operation_id: OP, replayed: false },
    { result: { solicitation_id: OTHER, status: "interested", version: 2 }, operation_id: OP, replayed: false }]) {
    const f = fixture({ role: "provider", replyResult }); assert.equal((await invoke(f)).status, 503); assert.equal(responseCalls(f).length, 1);
  }
});
test("projection minimale privée, aucun effet sur les autres domaines", async () => {
  const f = fixture({ role: "provider" }); const result = await invoke(f);
  assert.deepEqual(Object.keys(result.body).sort(), ["operation_id", "replayed", "result"]);
  assert.deepEqual(Object.keys(result.body.result).sort(), ["solicitation_id", "status", "version"]);
  assert.equal(JSON.stringify(result.body).includes("PRIVATE"), false);
  assert.ok(f.calls.tables.every((table) => table === "profiles:id,role,status"));
  assert.deepEqual(f.calls.rpc.map((call) => call.name), ["respond_provider_solicitation"]);
  assert.equal(f.calls.network.length, 0); assert.equal(f.calls.logs.length, 0);
});
test("actions de détail : destinataire actif et propriétaire actif, jamais après réponse", async () => {
  const f = fixture({ role: "provider" }); assert.equal((await f.invoke("GET", { detail: true })).body.allowed_actions.can_respond, true);
  await invoke(f); assert.equal((await f.invoke("GET", { detail: true })).body.allowed_actions.can_respond, false);
  const suspended = fixture({ role: "provider", ownerStatus: "suspended" });
  assert.equal((await suspended.invoke("GET", { detail: true })).body.allowed_actions.can_respond, false);
  const owner = fixture(); assert.equal((await owner.invoke("GET", { detail: true })).body.allowed_actions.can_respond, false);
});
test("API désactivée : réponse indisponible, aucune RPC", async () => {
  const f = fixture({ role: "provider", disabled: true }); assert.equal((await invoke(f)).status, 503); assert.equal(f.calls.rpc.length, 0);
});
test("SQL statique : droits propriétaire avant rejeu, verrou, version et audit atomique", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261117120000_provider_solicitations.sql", import.meta.url), "utf8");
  const start = sql.indexOf("CREATE FUNCTION public.respond_provider_solicitation(");
  const response = sql.slice(start, sql.indexOf("CREATE FUNCTION public.read_provider_solicitations(", start));
  assert.ok(response.indexOf("id = v_owner_id AND status = 'active'") < response.indexOf("'replayed',true"));
  assert.match(response, /provider_profile_id = p_actor_id FOR UPDATE/); assert.match(response, /v_row.version <> p_expected_version/);
  assert.doesNotMatch(response, /p_expected_version IS DISTINCT FROM 1|EXCEPTION WHEN/);
  assert.match(response, /INSERT INTO public.provider_solicitation_events/);
  assert.match(response, /p_principal_id,p_actor_id,'sent',p_status,2/);
  assert.doesNotMatch(response, /(?:INSERT INTO|UPDATE|DELETE FROM)\s+public\.(?:missions|invoices|provider_interventions|mission_provider_assignments)/);
});
