import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fixture, OWNER, PROVIDER, OTHER, REQUEST, OP, DATE, body, geographic, view, event } from "./helpers/provider-solicitations-fixture.ts";
import type { Options } from "./helpers/provider-solicitations-fixture.ts";

const created = (f: ReturnType<typeof fixture>) => f.calls.rpc.filter((call) => call.name === "create_provider_solicitation");

test("POST propriétaire autorisé, sans séjour, RPC transactionnelle seule", async () => {
  const f = fixture(); const result = await f.invoke("POST");
  assert.equal(result.status, 201); assert.equal(result.body.result.status, "sent");
  assert.equal(created(f).length, 1);
  const args = created(f)[0].args;
  assert.equal(args.p_actor_id, OWNER); assert.equal(args.p_principal_id, OWNER);
  assert.equal(args.p_parameters.reservation_id, null);
  assert.equal(args.p_parameters.provider_declaration.option, '["plumbing_repair"]');
  assert.equal(f.calls.logs.length, 0);
});
for (const [label, options] of [
  ["artisan inactif", { providerStatus: "suspended" }], ["prestation non proposée", { skills: '["electrical_repair"]' }],
  ["couverture inconnue malgré adresse/coordonnées professionnelles", { zones: null }],
  ["couverture extérieure", { zones: JSON.stringify({ zoneDeclaration: "root_explicit", zones: [{ lat: 48.8, lng: 2.3, label: "Paris", placeId: "nominatim:456" }] }) }],
] as [string, Options][]) test(`POST refus : ${label}`, async () => {
  const f = fixture(options); const result = await f.invoke("POST"); assert.equal(result.status, 422); assert.equal(created(f).length, 0);
});
test("POST logement d'un autre propriétaire refusé", async () => {
  const f = fixture({ housingOwner: OTHER });
  assert.equal((await f.invoke("POST", { body: { ...body, location: { kind: "housing", housing_id: "42" } } })).status, 403);
  assert.equal(created(f).length, 0); assert.equal(f.calls.network.length, 0);
});
test("POST logement historique autorisé avec adresse persistée", async () => {
  const f = fixture(); const result = await f.invoke("POST", { body: { ...body, location: { kind: "housing", housing_id: "9223372036854775807" } } });
  assert.equal(result.status, 201); assert.equal(created(f)[0].args.p_parameters.location.housing_id, "9223372036854775807");
});
test("POST propriété étrangère et séjour incohérent refusés", async () => {
  const foreign = fixture({ propertyOwner: OTHER });
  assert.equal((await foreign.invoke("POST", { body: { ...body, location: { kind: "property", property_id: OTHER } } })).status, 403);
  const stay = fixture({ stayOwner: OTHER });
  assert.equal((await stay.invoke("POST", { body: { ...body, location: { kind: "property", property_id: OTHER }, reservation_id: OP } })).body.error.code, "INVALID_RESERVATION");
  assert.equal(created(stay).length, 0);
});
test("POST propriété limitée à une ville refusée sans géocodage inventé", async () => {
  const f = fixture(); const result = await f.invoke("POST", { body: { ...body, location: { kind: "property", property_id: OTHER }, reservation_id: OP } });
  assert.equal(result.body.error.code, "INVALID_LOCATION"); assert.equal(f.calls.network.length, 0); assert.equal(created(f).length, 0);
});
for (const [label, input, options] of [
  ["adresse sans numéro", { ...body, location: { ...body.location, address: "rue Exemple" } }, {}],
  ["géocodage à la commune", body, { geo: [{ ...geographic, address: { city: "Perpignan", country_code: "fr" } }] }],
  ["mauvais numéro", body, { geo: [{ ...geographic, address: { ...geographic.address, house_number: "14" } }] }],
  ["mauvais code postal", body, { geo: [{ ...geographic, address: { ...geographic.address, postcode: "75000" } }] }],
  ["lieu ambigu", body, { geo: [geographic, geographic] }],
  ["coordonnées vides", body, { geo: [{ ...geographic, lat: "" }] }],
  ["pays différent", body, { geo: [{ ...geographic, address: { ...geographic.address, country_code: "es" } }] }],
] as [string, unknown, Options][]) test(`POST lieu insuffisant : ${label}`, async () => {
  const f = fixture(options); const result = await f.invoke("POST", { body: input }); assert.equal(result.status, 422); assert.equal(created(f).length, 0);
});
test("POST rejeu : résultat initial sans géocodage ni nouvelle création", async () => {
  const f = fixture(); const first = await f.invoke("POST"); const second = await f.invoke("POST");
  assert.equal(first.status, 201); assert.equal(second.status, 200); assert.equal(second.body.replayed, true);
  assert.deepEqual(second.body.result, first.body.result); assert.equal(created(f).length, 1); assert.equal(f.calls.network.length, 1);
});
test("POST rejeu après changement d'éligibilité et date passée", async () => {
  const f = fixture({ replay: true, providerStatus: "suspended", geoThrows: true });
  const result = await f.invoke("POST", { body: { ...body, desired_at: "2000-01-01T12:00:00Z" } });
  assert.equal(result.status, 200); assert.equal(f.calls.network.length, 0); assert.equal(created(f).length, 0);
});
test("POST clé réutilisée avec corps différent : 409 avant effets", async () => {
  const f = fixture(); await f.invoke("POST");
  const result = await f.invoke("POST", { body: { ...body, description: "Autre besoin" } });
  assert.equal(result.status, 409); assert.equal(result.body.error.code, "IDEMPOTENCY_CONFLICT"); assert.equal(created(f).length, 1);
});
test("POST doublon métier : 409 sans fallback", async () => {
  const f = fixture({ rpcError: { code: "23505", message: "DUPLICATE_OPEN_SOLICITATION" } });
  const result = await f.invoke("POST"); assert.equal(result.status, 409); assert.equal(result.body.error.code, "DUPLICATE_OPEN_SOLICITATION");
  assert.equal(created(f).length, 1);
});
test("GET propriétaire et artisan : projection privée par rôle", async () => {
  for (const role of ["owner", "provider"]) {
    const f = fixture({ role }); const list = await f.invoke("GET"); const detail = await f.invoke("GET", { detail: true });
    assert.equal(list.status, 200); assert.equal(detail.status, 200);
    assert.equal(detail.body.allowed_actions.can_respond, role === "provider");
    assert.equal("secret_access_code" in detail.body.solicitation, false);
    assert.equal("actor_principal_id" in detail.body.events[0], false); assert.equal("operation_id" in detail.body.events[0], false);
    for (const key of ["creation_operation_id", "business_fingerprint"]) assert.equal(key in list.body.items[0], false);
    if (role === "provider") for (const key of ["property_id", "housing_id", "reservation_id"]) {
      assert.equal(key in list.body.items[0], false); assert.equal(key in detail.body.solicitation, false);
    }
  }
});
test("GET étranger et inexistant : même 404", async () => {
  const stranger = await fixture({ actor: OTHER }).invoke("GET", { detail: true });
  const missing = await fixture({ readMissing: true }).invoke("GET", { detail: true });
  assert.equal(stranger.status, 404); assert.deepEqual(stranger, missing);
});
test("GET vérifie le participant même si le transport renvoie une mauvaise ligne", async () => {
  const f = fixture({ detail: { ...view, owner_profile_id: OTHER, provider_profile_id: OWNER } });
  assert.equal((await f.invoke("GET", { detail: true })).status, 404);
});
test("GET historique incohérent refusé et historique terminal correctement projeté", async () => {
  const malformed = fixture({ events: [{ ...event, actor_profile_id: PROVIDER }] });
  assert.equal((await malformed.invoke("GET", { detail: true })).status, 503);
  const terminal = fixture({ role: "provider", detail: { ...view, status: "interested", version: 2, responded_at: DATE, response_message: "Intéressé" },
    events: [event, { ...event, id: OP, version: 2, actor_profile_id: PROVIDER, event_type: "provider_interested", old_status: "sent", new_status: "interested", message: "Intéressé" }] });
  const result = await terminal.invoke("GET", { detail: true });
  assert.equal(result.status, 200); assert.equal(result.body.events.length, 2);
  assert.equal(result.body.allowed_actions.can_respond, false);
});
for (const options of [{ status: "suspended" }, { selected: OTHER }, { role: "admin" }, { role: "concierge" }, { claim: "admin", role: "owner" }]) {
  test(`droits actuels refusés : ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    assert.equal((await f.invoke("POST")).status, 403); assert.equal((await f.invoke("GET")).status, 403);
    assert.equal(f.calls.rpc.length, 0); assert.equal(f.calls.network.length, 0);
  });
}
test("identité absente et vérification de droits indisponible", async () => {
  assert.equal((await fixture({ unauthenticated: true }).invoke("GET")).status, 401);
  assert.equal((await fixture({ rightsError: true }).invoke("GET")).status, 503);
});
test("POST origine stricte, même avec faux en-tête serveur", async () => {
  for (const origin of ["https://attacker.invalid", "null", "", "http://localhost/", "not-an-origin"]) {
    const f = fixture(); assert.equal((await f.invoke("POST", { headers: { origin, authorization: "forged" } })).status, 403);
    assert.equal(f.calls.rpc.length, 0);
  }
});
test("POST propriétaire injecté, JSON invalide, clé manquante et date passée", async () => {
  const inputs: Array<{ body?: unknown; raw?: string; headers?: Record<string, string> }> = [
    { body: { ...body, owner_profile_id: OTHER } }, { raw: "{" }, { headers: { "idempotency-key": "" } },
    { body: { ...body, desired_at: "2000-01-01T12:00:00Z" } },
    { raw: " ".repeat(32769) }, { headers: { "content-type": "application/jsonx" } },
  ];
  for (const input of inputs) {
    const f = fixture(); assert.equal((await f.invoke("POST", input)).status, 400); assert.equal(created(f).length, 0);
  }
});
test("GET pagination stable : égalité des dates départagée par UUID, précision conservée", async () => {
  const f = fixture({ readItems: [{ ...view, id: OP }, view] });
  const first = await f.invoke("GET", { query: "?limit=1&status=sent" });
  assert.equal(first.body.items[0].id, OP);
  const second = await f.invoke("GET", { query: `?limit=1&status=sent&cursor=${first.body.next_cursor}` });
  assert.equal(second.body.items[0].id, REQUEST);
  const args = f.calls.rpc.at(-1)!.args; assert.equal(args.p_before_at, DATE); assert.equal(args.p_before_id, OP);
  const changed = await f.invoke("GET", { query: `?limit=1&cursor=${first.body.next_cursor}` }); assert.equal(changed.status, 400);
});
test("GET filtres inconnus, doublons et curseurs invalides refusés", async () => {
  for (const query of ["?limit=51", "?owner_profile_id=" + OTHER, "?limit=1&limit=2", "?cursor=broken", "?status=paid"]) {
    const f = fixture(); assert.equal((await f.invoke("GET", { query })).status, 400); assert.equal(f.calls.rpc.length, 0);
  }
});
test("GET filtre terminal, liste vide et curseur d'un autre acteur", async () => {
  const f = fixture();
  assert.deepEqual((await f.invoke("GET", { query: "?status=declined" })).body, { items: [], next_cursor: null });
  const first = await f.invoke("GET", { query: "?limit=1" });
  const other = fixture({ role: "provider" });
  assert.equal((await other.invoke("GET", { query: `?cursor=${first.body.next_cursor}` })).status, 400);
});
test("POST erreur de revalidation SQL et GET schéma absent : refus sans fallback", async () => {
  const f = fixture({ rpcError: { code: "40001", message: "DECLARATION_CHANGED" } });
  const result = await f.invoke("POST"); assert.equal(result.status, 409); assert.equal(result.body.error.code, "DECLARATION_CHANGED");
  assert.equal(created(f).length, 1);
  const missing = await fixture({ rpcError: { code: "PGRST202", message: "PRIVATE" } }).invoke("GET");
  assert.equal(missing.status, 503); assert.equal(missing.body.error.code, "UNAVAILABLE");
});
test("RPC/schéma manquants et transport : 503 explicite, aucune donnée privée ni fallback", async () => {
  for (const options of [{ lookupError: { code: "PGRST202", message: "PRIVATE-MISSING-RPC" } },
    { rpcError: { code: "42P01", message: "PRIVATE-SCHEMA" } }, { rpcThrows: true }, { malformedResult: true }, { geoThrows: true }]) {
    const f = fixture(options); const result = await f.invoke("POST"); assert.equal(result.status, 503);
    assert.equal(result.body.error.code, "UNAVAILABLE"); assert.equal(JSON.stringify(result.body).includes("PRIVATE"), false);
    assert.equal(f.calls.logs.length, 0);
    assert.ok(f.calls.rpc.every((call) => ["lookup_provider_solicitation_creation", "create_provider_solicitation"].includes(call.name)));
  }
});
test("API désactivée par défaut : aucun accès métier", async () => {
  const f = fixture({ disabled: true }); assert.equal((await f.invoke("GET")).status, 503);
  assert.equal((await f.invoke("POST")).status, 503); assert.equal(f.calls.tables.length, 0); assert.equal(f.calls.rpc.length, 0);
});
test("aucun effet dans les autres domaines et route de détail en lecture seule", async () => {
  const f = fixture(); await f.invoke("POST"); await f.invoke("GET"); await f.invoke("GET", { detail: true });
  assert.ok(f.calls.tables.every((table) => table.startsWith("profiles:")));
  assert.ok(f.calls.rpc.every((call) => ["lookup_provider_solicitation_creation", "create_provider_solicitation", "read_provider_solicitations"].includes(call.name)));
  assert.deepEqual(Object.keys(f.execute("app/api/provider-solicitations/[id]/route.ts")).sort(), ["GET", "dynamic"]);
});
test("SQL statique : lookup sans écriture et empreinte identique à la création A", () => {
  const a = readFileSync(new URL("../../supabase/migrations/20261117120000_provider_solicitations.sql", import.meta.url), "utf8");
  const b = readFileSync(new URL("../../supabase/migrations/20261117121000_provider_solicitation_replay_lookup.sql", import.meta.url), "utf8");
  const fingerprint = (sql: string) => /encode\(sha256\(convert_to\(jsonb_build_object\('provider_profile_id',[\s\S]*?'hex'\)/.exec(sql)?.[0];
  assert.ok(fingerprint(a)); assert.equal(fingerprint(a), fingerprint(b));
  assert.doesNotMatch(b, /(?:INSERT INTO|UPDATE|DELETE FROM|ALTER TABLE)\s+public\./i);
  assert.match(b, /SECURITY DEFINER SET search_path = pg_catalog/);
  assert.match(b, /GRANT EXECUTE.*TO service_role/);
  assert.match(b, /assert_provider_solicitation_actor/);
});
