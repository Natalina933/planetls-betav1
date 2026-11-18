import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SOLICITATION_STATUSES, canRespond, createSolicitationSchema, createSolicitationCommandSchema,
  respondSolicitationSchema, solicitationListSchema, idempotencyKeySchema, verifiedPlaceSchema,
  projectOwnerSolicitation, projectProviderSolicitation,
} from "../features/provider-solicitations/contracts.ts";
import type { Solicitation } from "../features/provider-solicitations/contracts.ts";
import { PLANETLS_SERVICE_TARGET } from "../app/lib/planetlsServiceCatalogTarget.ts";

const sql = readFileSync(new URL("../../supabase/migrations/20261117120000_provider_solicitations.sql", import.meta.url), "utf8");
const body = {
  provider_profile_id: "00000000-0000-4000-8000-000000000002", service_slug: "plumbing_repair",
  description: "  Réparer une fuite  ",
  location: { kind: "address", address: "1 rue Exemple", city: "Perpignan", postal_code: "66000", country_code: "FR" },
};
const place = { location_label: "1 rue Exemple, Perpignan", city: "Perpignan", postal_code: "66000", country_code: "FR",
  latitude: 42.7, longitude: 2.9, geocoded_at: "2026-11-17T12:00:00Z", geocoding_source: "synthetic-test" };
function section(start: string, end: string) {
  const from = sql.indexOf(start); const to = sql.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Section SQL absente : ${start}`);
  return sql.slice(from, to);
}
const create = section("CREATE FUNCTION public.create_provider_solicitation(", "CREATE FUNCTION public.respond_provider_solicitation(");
const respond = section("CREATE FUNCTION public.respond_provider_solicitation(", "CREATE FUNCTION public.read_provider_solicitations(");

test("contrat : trois statuts, intérêt distinct d'une acceptation", () => {
  assert.deepEqual(SOLICITATION_STATUSES, ["sent", "interested", "declined"]);
  assert.equal(canRespond("sent", 1), true);
  for (const status of ["interested", "declined"] as const) assert.equal(canRespond(status, 2), false);
  assert.equal(canRespond("sent", 2), false);
});
test("création sans séjour ni date, description normalisée", () => {
  const parsed = createSolicitationSchema.parse(body);
  assert.equal(parsed.reservation_id, null); assert.equal(parsed.desired_at, null);
  assert.equal(parsed.description, "Réparer une fuite");
});
test("identités et champs d'autorisation forgés refusés", () => {
  for (const key of ["owner_profile_id", "prospective_client_profile_id", "principal_profile_id", "metadata", "status", "latitude"]) {
    assert.equal(createSolicitationSchema.safeParse({ ...body, [key]: "forged" }).success, false);
  }
  assert.equal(createSolicitationSchema.safeParse({ ...body, provider_profile_id: "not-a-uuid" }).success, false);
});
test("prestation canonique précise, inconnus et groupes refusés", () => {
  const group = PLANETLS_SERVICE_TARGET.find((entry) => entry.kind === "group");
  assert.ok(group);
  for (const service_slug of ["unknown_service", group.slug]) {
    assert.equal(createSolicitationSchema.safeParse({ ...body, service_slug }).success, false);
  }
});
test("lieu : union stricte, logement BIGINT sans perte de précision", () => {
  assert.equal(createSolicitationSchema.safeParse({ ...body, location: { kind: "property", property_id: body.provider_profile_id } }).success, true);
  assert.equal(createSolicitationSchema.safeParse({ ...body, location: { kind: "housing", housing_id: "9223372036854775807" } }).success, true);
  for (const housing_id of ["0", "-1", "1.5", "9223372036854775808", "invalid"]) {
    assert.equal(createSolicitationSchema.safeParse({ ...body, location: { kind: "housing", housing_id } }).success, false);
  }
  assert.equal(createSolicitationSchema.safeParse({ ...body, location: { ...body.location, property_id: body.provider_profile_id } }).success, false);
  assert.equal(createSolicitationSchema.safeParse({ ...body, location: { ...body.location, address: " " } }).success, false);
});
test("date avec fuseau explicite et séjour UUID", () => {
  assert.equal(createSolicitationSchema.safeParse({ ...body, desired_at: "2026-12-01T14:00:00+01:00" }).success, true);
  for (const desired_at of ["2026-12-01T14:00:00", "tomorrow", "2026-02-31T14:00:00Z"]) {
    assert.equal(createSolicitationSchema.safeParse({ ...body, desired_at }).success, false);
  }
  assert.equal(createSolicitationSchema.safeParse({ ...body, reservation_id: "foreign-text" }).success, false);
});
test("réponse : seulement intérêt ou refus, version positive transmise à SQL et taille bornée", () => {
  for (const status of ["interested", "declined"]) assert.equal(respondSolicitationSchema.safeParse({ status, expected_version: 1 }).success, true);
  for (const status of ["accepted", "sent", "paid", "completed"]) assert.equal(respondSolicitationSchema.safeParse({ status, expected_version: 1 }).success, false);
  assert.equal(respondSolicitationSchema.safeParse({ status: "interested", expected_version: 2 }).success, true);
  for (const expected_version of [0, -1, 1.5, 2147483648]) {
    assert.equal(respondSolicitationSchema.safeParse({ status: "interested", expected_version }).success, false);
  }
  assert.equal(respondSolicitationSchema.safeParse({ status: "interested", expected_version: 1, message: "x".repeat(2001) }).success, false);
});
test("provenance géographique et limites numériques", () => {
  assert.equal(verifiedPlaceSchema.safeParse(place).success, true);
  for (const latitude of [NaN, Infinity, 91, -91]) assert.equal(verifiedPlaceSchema.safeParse({ ...place, latitude }).success, false);
  assert.equal(verifiedPlaceSchema.safeParse({ ...place, longitude: 181 }).success, false);
});
test("commande interne : libellé canonique et déclaration structurée", () => {
  const command = { ...body, ...place, service_label_snapshot: "Dépannage plomberie",
    location_declaration: { city: body.location.city, address: body.location.address },
    provider_declaration: { option: null, availability_hours: null, service_radius_km: null, latitude: null, longitude: null } };
  assert.equal(createSolicitationCommandSchema.safeParse(command).success, true);
  assert.equal(createSolicitationCommandSchema.safeParse({ ...command, service_label_snapshot: "Autre" }).success, false);
  assert.equal(createSolicitationCommandSchema.safeParse({ ...command, provider_declaration: { authorized: true } }).success, false);
  assert.equal(createSolicitationCommandSchema.safeParse({ ...command, reservation_id: body.provider_profile_id }).success, false);
  assert.equal(createSolicitationCommandSchema.safeParse({ ...command, location_declaration: { city: "elsewhere", address: "changed", trusted: true } }).success, false);
});
test("pagination bornée et clé UUID", () => {
  assert.equal(solicitationListSchema.parse({}).limit, 20);
  for (const limit of [0, 51, 1.2]) assert.equal(solicitationListSchema.safeParse({ limit }).success, false);
  assert.equal(solicitationListSchema.safeParse({ owner_profile_id: body.provider_profile_id }).success, false);
  assert.equal(idempotencyKeySchema.safeParse("random-key").success, false);
});
test("projections exécutées : pas de séjour, provenance SQL ou colonnes inconnues chez l'artisan", () => {
  const row = { ...place, id: "request", owner_profile_id: "owner", prospective_client_profile_id: "owner", provider_profile_id: "provider",
    service_slug: "plumbing_repair", service_label_snapshot: "Dépannage plomberie", description: "Besoin", location_kind: "property",
    property_id: "property", housing_id: null, reservation_id: "stay", desired_at: null, status: "sent", response_message: null,
    responded_at: null, version: 1, creation_operation_id: "operation", business_fingerprint: "hash", created_at: "date", updated_at: "date",
    secret_access_code: "never-export" } as Solicitation & { secret_access_code: string };
  const owner = projectOwnerSolicitation(row); const provider = projectProviderSolicitation(row);
  assert.equal(owner.reservation_id, "stay");
  for (const key of ["reservation_id", "property_id", "housing_id", "creation_operation_id", "business_fingerprint", "secret_access_code"]) {
    assert.equal(key in provider, false);
  }
  assert.equal("secret_access_code" in owner, false);
});

// Les tests suivants sont STATIQUES : ils vérifient les garde-fous écrits,
// jamais leur exécution, les ACL appliquées, le rollback ou la concurrence PostgreSQL.
test("SQL statique : contraintes statut/client/participants et séjour facultatif", () => {
  assert.match(sql, /status IN \('sent','interested','declined'\)/);
  assert.match(sql, /owner_profile_id = prospective_client_profile_id AND owner_profile_id <> provider_profile_id/);
  assert.match(sql, /reservation_id uuid REFERENCES/);
  assert.match(sql, /reservation_id IS NULL OR/);
  assert.match(create, /owner_profile_id = p_actor_id\s+AND property_id = v_property_id FOR SHARE/);
});
test("SQL statique : sources logement et incohérences refusées", () => {
  assert.match(create, /owner_id = p_actor_id FOR SHARE/);
  assert.match(create, /v_address <> p_actor_id::text/);
  assert.match(sql, /location_kind = 'housing' AND housing_id IS NOT NULL AND property_id IS NULL/);
  assert.match(create, /RAISE EXCEPTION 'INVALID_RESERVATION'/);
  assert.match(create, /location_declaration' IS DISTINCT FROM jsonb_build_object\('city',v_city,'address',v_address\)/);
});
test("SQL statique : instantané catalogue exact, sans groupes", () => {
  const catalog = section("AS $catalog$", "$catalog$;");
  for (const entry of PLANETLS_SERVICE_TARGET) {
    const pair = `('${entry.slug}','${entry.label.replaceAll("'", "''")}')`;
    assert.equal(catalog.includes(pair), entry.kind === "service", entry.slug);
  }
  assert.match(sql, /CHECK \(public.is_provider_solicitation_service\(service_slug,service_label_snapshot\)\)/);
});
test("SQL statique : idempotence, conflit de clé et résultat initial avant transition", () => {
  assert.match(sql, /UNIQUE\(principal_profile_id,actor_profile_id,idempotency_key\)/);
  for (const command of [create, respond]) {
    assert.match(command, /pg_advisory_xact_lock/);
    assert.match(command, /RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'/);
    assert.match(command, /'replayed',true/);
  }
  assert.ok(respond.indexOf("'replayed',true") < respond.indexOf("'ALREADY_RESPONDED'"));
  assert.match(create, /DUPLICATE_OPEN_SOLICITATION/);
  assert.match(sql, /business_fingerprint\) WHERE status = 'sent'/);
});
test("SQL statique : concurrence, version et deux réponses terminales", () => {
  assert.match(respond, /provider_profile_id = p_actor_id FOR UPDATE/);
  assert.match(respond, /v_row.version <> p_expected_version/);
  assert.match(respond, /p_status NOT IN \('interested','declined'\)/);
  assert.match(sql, /OLD.status <> 'sent' OR NEW.status NOT IN \('interested','declined'\)/);
  assert.match(sql, /UNIQUE\(solicitation_id,version\)/);
});
test("SQL statique : droits actuels, suspension et délégation non prouvée refusés", () => {
  assert.match(sql, /p_principal_id <> p_actor_id/);
  assert.match(sql, /v_status IS DISTINCT FROM 'active'/);
  assert.match(create, /v_provider.status IS DISTINCT FROM 'active'/);
  assert.match(respond, /status = 'active' AND lower\(btrim\(role\)\) IN \('owner','owner_pro'\)/);
  assert.match(create, /provider_declaration' IS DISTINCT FROM jsonb_build_object/);
  assert.doesNotMatch(sql, /auth\.uid\(|workspace_parent_email|metadata\s*->/);
});
test("SQL statique : RLS des trois tables et RPC limitées au serveur", () => {
  for (const table of ["provider_solicitations", "provider_solicitation_operations", "provider_solicitation_events"]) {
    assert.ok(sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
  }
  assert.doesNotMatch(sql, /CREATE POLICY/i);
  assert.match(sql, /FROM PUBLIC,anon,authenticated,service_role/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION %s TO service_role/);
  assert.match(sql, /Unexpected solicitation function ACL/);
  assert.match(sql, /Unexpected solicitation table ACL/);
  for (const signature of sql.matchAll(/CREATE FUNCTION[\s\S]*?AS \$(?:function|catalog)\$/g)) assert.match(signature[0], /SET search_path = pg_catalog/);
});
test("SQL statique : historique immuable, audit atomique et provenance liée", () => {
  assert.match(sql, /provider_solicitation_events_immutable BEFORE UPDATE OR DELETE/);
  assert.match(sql, /provider_solicitation_operations_immutable BEFORE UPDATE OR DELETE/);
  assert.match(sql, /CREATE CONSTRAINT TRIGGER provider_solicitations_audit_complete/);
  assert.match(sql, /DEFERRABLE INITIALLY DEFERRED/);
  assert.match(sql, /e.actor_principal_id = o.principal_profile_id/);
  assert.doesNotMatch(create + respond, /EXCEPTION WHEN/i);
});
test("SQL statique : aucune création de mission, intervention, facture ou droit G03", () => {
  assert.doesNotMatch(sql, /(?:INSERT INTO|UPDATE|DELETE FROM|ALTER TABLE)\s+public\.(?:missions|provider_interventions|invoices|mission_provider_assignments)\b/i);
  assert.doesNotMatch(sql, /create_mission_provider_assignment\(/);
});
