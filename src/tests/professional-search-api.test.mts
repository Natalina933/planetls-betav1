import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as matching from "../app/lib/professionalSearchMatching.ts";
import * as pagination from "../app/lib/professionalSearchPagination.ts";
import * as shared from "../app/api/profiles/concierges/shared.ts";
import * as coverage from "../app/api/search/professionals/coverage.ts";
import * as geography from "../features/owner-concierges/lib/geography.ts";
import * as publication from "../app/lib/conciergePublication.ts";
import { GeocodingServiceError, isGeocodingServiceError } from "../server/location/geocodeLocation.ts";

// Exécute la vraie route avec uniquement ses transports remplacés ; aucun client DB réel.
const source = readFileSync(new URL("../app/api/search/professionals/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const center = { latitude: 47.792, longitude: 1.065 };
const zone = (point = center) => ({ placeId: "nominatim:123", label: "Zone fictive", lat: point.latitude, lng: point.longitude });
const zones = (...values: unknown[]) => JSON.stringify({ zones: values });
const profile = (id: string, role = "provider", extra = {}) => ({
  id, role, status: "active", first_name: id, last_name: "Fixture", city: "Vendôme", country: "France",
  latitude: center.latitude, longitude: center.longitude,
  option: JSON.stringify(["cleaning_standard", "guest_checkin_checkout"]),
  service_radius_km: 10, availability_hours: zones(zone()), hourly_rate: null, monthly_rate: null, ...extra,
});

function harness(options: {
  profiles?: ReturnType<typeof profile>[]; role?: string; anonymous?: boolean;
  geocode?: (query: string) => Promise<typeof center | null>; queryError?: boolean;
  pricing?: Array<{ profile_id: string; property_type: string }>;
} = {}) {
  const calls: Array<{ table: string; select: string; roles: string[]; status: string; range?: number[] }> = [];
  const geocode = options.geocode ?? (async () => center);
  const db = { from(table: string) {
    const call = { table, select: "", roles: [] as string[], status: "", range: undefined as number[] | undefined };
    calls.push(call);
    let rows: Array<{ role?: string; status?: string | null; [key: string]: unknown }> =
      table === "profiles" ? options.profiles ?? [] : table === "pricing_packages" ? options.pricing ?? [] : [];
    const query = {
      select(value: string) { call.select = value; return query; },
      in(key: string, values: string[]) { if (key === "role") call.roles = values; rows = rows.filter(row => values.includes(String(row[key]))); return query; },
      or(value: string) { call.status = value; rows = rows.filter(row => !["suspended", "deleted"].includes(row.status ?? "")); return query; },
      order() { return query; },
      range(from: number, to: number) { call.range = [from, to]; rows = rows.slice(from, to + 1); return query; },
      then(resolve: (value: unknown) => unknown) { return Promise.resolve({ data: rows, error: options.queryError ? { code: "TEST" } : null }).then(resolve); },
    };
    return query;
  } };
  const dependencies: Record<string, unknown> = {
    "next/server": { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } },
    "@/app/lib/dbServer": { db },
    "@/app/lib/apiAuth": { getApiAuthContext: async () => ({ userId: options.anonymous ? undefined : "owner-a", role: options.role ?? "owner" }) },
    "@/server/location/geocodeLocation": { geocodeLocation: geocode, isGeocodingServiceError },
    "./coverage": coverage,
    "../../../lib/conciergePublication": publication,
    "@/features/owner-concierges/lib/geography": geography,
    "@/app/api/profiles/concierges/shared": shared,
    "@/app/lib/professionalSearchMatching": matching,
    "@/app/lib/professionalSearchPagination": pagination,
  };
  const exports: { GET?: (request: unknown) => Promise<Response> } = {};
  new Function("require", "exports", compiled)((name: string) => {
    assert.ok(name in dependencies, `Dépendance non simulée : ${name}`);
    return dependencies[name];
  }, exports);
  return { calls, get: (query = "") => exports.GET!({ nextUrl: new URL(`http://localhost/api/search/professionals?${query}`) }) };
}

test("API : anonyme 401, rôles interdits 403, propriétaire et admin autorisés", async () => {
  const anonymous = harness({ anonymous: true });
  assert.equal((await anonymous.get()).status, 401);
  assert.equal(anonymous.calls.length, 0);
  for (const role of ["provider", "concierge", "traveler"]) {
    const denied = harness({ role });
    assert.equal((await denied.get()).status, 403);
    assert.equal(denied.calls.length, 0);
  }
  for (const role of ["owner", "owner_pro", "admin", "super_admin"]) assert.equal((await harness({ role }).get()).status, 200);
});

test("API : publication concierge appliquée aussi en recherche libre, sans exigence de tarif", async () => {
  const availability_hours = JSON.stringify({ radiusDeclaration: "explicit", zones: [zone()] });
  const profiles = [
    profile("complete", "concierge", { service_radius_km: 30, availability_hours }),
    profile("no-service", "concierge", { option: "" }),
    profile("no-zone", "concierge", { availability_hours: null }),
    profile("ambiguous", "concierge", { service_radius_km: 30 }),
    profile("suspended", "concierge", { status: "suspended" }),
  ];
  for (const query of ["", "geographic=1&city=Vendome"]) {
    const response = await harness({ profiles }).get(query);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(payload.items.map((item: { id: string }) => item.id), ["complete"]);
    assert.equal(payload.items[0].hourly_rate, null);
  }
});

test("API : Tous, Concierges et Artisans excluent les profils suspendus et supprimés", async () => {
  const profiles = [profile("c", "concierge"), profile("p"), profile("s", "artisan", { status: "suspended" }), profile("d", "provider", { status: "deleted" }), profile("n", "artisan_pro", { status: null })];
  for (const [type, expected] of [["all", ["n", "c", "p"]], ["concierge", ["c"]], ["provider", ["n", "p"]]] as const) {
    const response = await harness({ profiles }).get(`type=${type}`);
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).items.map((item: { id: string }) => item.id), expected);
  }
});

test("API : rayon propriétaire de 20 km par défaut, couverture extérieure et inconnue distinctes", async () => {
  const api = harness({ profiles: [profile("near"), profile("far", "artisan", { availability_hours: zones(zone({ latitude: 48.85, longitude: 2.35 })) }), profile("missing", "provider", { city: null, latitude: null, longitude: null, availability_hours: null })] });
  const response = await api.get("geographic=1&city=Vendome");
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(payload.items.map((item: { id: string }) => item.id), ["near"]);
  assert.match(payload.warning, /couverture de 1 professionnel/);
  assert.match(payload.warning, /ne signifie pas qu'ils sont hors zone/);
});

test("API : ville introuvable 422, géocodage indisponible 503, paramètres invalides 400", async () => {
  assert.equal((await harness({ geocode: async () => null }).get("geographic=1&city=inconnue")).status, 422);
  assert.equal((await harness({ geocode: async () => ({ latitude: 91, longitude: 0 }) }).get("geographic=1&city=invalide")).status, 422);
  assert.equal((await harness({ geocode: async () => { throw new GeocodingServiceError(); } }).get("geographic=1&city=Paris")).status, 503);
  for (const radius of ["0", "-1", "201", "NaN", "Infinity", ""]) assert.equal((await harness().get(`geographic=1&city=Paris&radiusKm=${radius}`)).status, 400);
  assert.equal((await harness().get("geographic=1")).status, 400);
  assert.equal((await harness().get("type=unknown")).status, 400);
});

test("API : prestations multiples, bundle arrivée/départ, familles et PRO", async () => {
  const profiles = [profile("pro", "provider_pro"), profile("basic"), profile("incomplete", "concierge", { option: '["cleaning_standard"]' })];
  const response = await harness({ profiles }).get("services=cleaning_standard,guest_checkin,guest_checkout&proOnly=1");
  assert.deepEqual((await response.json()).items.map((item: { id: string }) => item.id), ["pro"]);
  const noMatch = await harness({ profiles }).get("services=unknown");
  assert.deepEqual((await noMatch.json()).items, []);
  const family = await harness({ profiles: [profile("match"), profile("other", "provider", { option: '["unknown"]' })] }).get("serviceFamilies=cleaning_linen");
  assert.deepEqual((await family.json()).items.map((item: { id: string }) => item.id), ["match"]);
});

test("API : pagination cohérente et refus explicite au-delà de 2000 profils", async () => {
  for (const count of [101, 2000, 2001]) {
    const api = harness({ profiles: Array.from({ length: count }, (_, index) => profile(String(index))) });
    const response = await api.get();
    assert.equal(response.status, count > 2000 ? 422 : 200);
    if (count <= 2000) assert.equal((await response.json()).items.length, count);
    const profileCalls = api.calls.filter(call => call.table === "profiles");
    assert.ok(profileCalls.every(call => call.status === "status.is.null,status.not.in.(suspended,deleted)"));
    assert.ok(profileCalls.every(call => JSON.stringify(call.roles) === JSON.stringify(profileCalls[0].roles)));
    assert.deepEqual(profileCalls[1].range, [100, 199]);
    if (count >= 2000) assert.deepEqual(profileCalls.at(-1)?.range, [2000, 2000]);
  }
});

test("API : aucune adresse géocodée pour inventer une couverture ou un marqueur", async () => {
  const calls: string[] = [];
  const api = harness({ profiles: [profile("known"), profile("unknown", "artisan", { latitude: null, longitude: null, city: "Nice", availability_hours: null })], geocode: async (query) => {
    calls.push(query);
    if (query === "Vendome") return center;
    throw new GeocodingServiceError();
  } });
  const response = await api.get("geographic=1&city=Vendome");
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(payload.items.map((item: { id: string }) => item.id), ["known"]);
  assert.match(payload.warning, /couverture de 1 professionnel/);
  assert.deepEqual(calls, ["Vendome"]);
});

test("API : projection publique sans coordonnées privées de contact, documents ni planning brut", async () => {
  const api = harness({ profiles: [profile("p", "provider", { email: "private@example.test", phone: "secret", password: "secret", additional_info: "private", availability_hours: '{"private":"schedule"}' })] });
  const item = (await (await api.get()).json()).items[0];
  for (const key of ["email", "phone", "password", "additional_info", "availability_hours", "option", "status"]) assert.equal(key in item, false);
  assert.equal(item.average_rating, null);
  assert.equal(item.hourly_rate, null);
  assert.equal(item.is_available_now, false);
  assert.ok(api.calls.filter(call => call.table === "profiles").every(call => !/email|phone|password|additional_info/.test(call.select)));
});

test("API : six rôles, adresse extérieure couverte et adresse intérieure hors zone", async () => {
  const far = { latitude: 48.85, longitude: 2.35 };
  for (const role of ["concierge", "concierge_pro", "artisan", "artisan_pro", "provider", "provider_pro"]) {
    const api = harness({ profiles: [
      profile("covered", role, { ...far }),
      profile("outside", role, { availability_hours: zones(zone(far)) }),
      profile("multi", role, { availability_hours: zones(zone(far), zone()) }),
    ] });
    const payload = await (await api.get("geographic=1&city=Vendome")).json();
    assert.deepEqual(payload.items.map((item: { id: string }) => item.id), ["covered", "multi"]);
    assert.deepEqual({ latitude: payload.items[0].latitude, longitude: payload.items[0].longitude }, far);
    assert.equal(payload.warning, undefined);
  }
});

test("API : tangence des couvertures, rayon absent et rayon implicite séparés", async () => {
  const point = { latitude: 0, longitude: 0 };
  const tangent = { latitude: 0, longitude: 35 / 6371 * 180 / Math.PI };
  const payload = await (await harness({ geocode: async () => point, profiles: [
    profile("tangent", "artisan", { service_radius_km: 15, availability_hours: zones(zone(tangent)) }),
    profile("missing", "concierge", { service_radius_km: null }),
    profile("default", "provider", { service_radius_km: 30 }),
    profile("placeholder", "provider", { availability_hours: zones({ ...zone(point), placeId: "zone-0-Ville" }) }),
    profile("invalid", "provider", { availability_hours: zones(zone({ latitude: 91, longitude: 0 })) }),
  ] }).get("geographic=1&city=fictive")).json();
  assert.deepEqual(payload.items.map((item: { id: string }) => item.id), ["tangent"]);
  // The incomplete concierge is unpublished, rather than a geographic candidate.
  assert.match(payload.warning, /couverture de 3 professionnel/);
});

test("API : résultats sans marqueur, coordonnées originales et zones répétées sans doublons", async () => {
  const payload = await (await harness({ profiles: [
    profile("without", "concierge", { latitude: null, longitude: null }),
    profile("invalid", "artisan", { latitude: 100, longitude: 0 }),
    profile("with", "provider", { availability_hours: zones(zone(), zone()) }),
  ] }).get("geographic=1&city=Vendome")).json();
  assert.equal(payload.items.length, 3);
  assert.equal(new Set(payload.items.map((item: { id: string }) => item.id)).size, 3);
  const markers = payload.items.filter(geography.isSearchPoint);
  assert.deepEqual(markers.map((item: { id: string }) => item.id), ["with"]);
  for (const item of payload.items.filter((row: { id: string }) => row.id !== "with")) {
    assert.equal(item.latitude, null);
    assert.equal(item.longitude, null);
  }
  assert.match(payload.warning, /2 professionnel\(s\) couvrant la zone/);
  assert.deepEqual(payload.center, center);
});

test("API : compte des inconnus après filtres de famille, région, budget, bien et disponibilité", async () => {
  const unknown = { availability_hours: null };
  const profiles = [
    profile("kept", "artisan_pro", { ...unknown, emergency_service: true, hourly_rate: 20, monthly_rate: 20 }),
    profile("family", "artisan_pro", { ...unknown, option: '["unknown"]' }),
    profile("region", "artisan_pro", { ...unknown, city: "Autre" }),
    profile("budget", "artisan_pro", { ...unknown, hourly_rate: 100, monthly_rate: 100 }),
    profile("property", "artisan_pro", unknown),
    profile("unavailable", "artisan_pro", unknown),
    profile("basic", "provider", unknown),
  ];
  const pricing = profiles.filter(p => p.id !== "property").map(p => ({ profile_id: p.id, property_type: "Appartement" }));
  const api = harness({ profiles, pricing });
  const payload = await (await api.get("geographic=1&city=Vendome&region=Vendome&serviceFamilies=cleaning_linen&budgetMax=50&propertyType=Appartement&availableOnly=1&proOnly=1")).json();
  assert.deepEqual(payload.items, []);
  assert.match(payload.warning, /couverture de 1 professionnel/);
  const noMatch = await (await api.get("geographic=1&city=Vendome&region=absente")).json();
  assert.equal(noMatch.warning, undefined);
  // Chaque filtre doit aussi réduire le diagnostic indépendamment des autres.
  for (const [query, excluded] of [
    ["serviceFamilies=cleaning_linen", { option: '["unknown"]' }],
    ["region=Vendome", { city: "Autre" }],
    ["budgetMax=50", { hourly_rate: 100, monthly_rate: 100 }],
    ["availableOnly=1", { emergency_service: false }],
    ["propertyType=Appartement", {}],
  ] as const) {
    const fixture = harness({ profiles: [
      profile("kept", "provider", { ...unknown, emergency_service: true }),
      profile("removed", "provider", { ...unknown, emergency_service: true, ...excluded }),
    ], pricing: [{ profile_id: "kept", property_type: "Appartement" }] });
    const result = await (await fixture.get(`geographic=1&city=Vendome&${query}`)).json();
    assert.match(result.warning, /couverture de 1 professionnel/);
  }
});

test("API : pagination géographique, compteurs et filtres de type/prestations cohérents", async () => {
  const profiles = Array.from({ length: 101 }, (_, i) => profile(String(i), "artisan", i === 100 ? { availability_hours: null } : {}));
  profiles.push(profile("concierge-unknown", "concierge", { availability_hours: null }));
  const api = harness({ profiles });
  const payload = await (await api.get("geographic=1&city=Vendome&type=provider&services=cleaning_standard,guest_checkin,guest_checkout")).json();
  assert.equal(payload.items.length, 100);
  assert.equal(new Set(payload.items.map((item: { id: string }) => item.id)).size, 100);
  assert.match(payload.warning, /couverture de 1 professionnel/);
  assert.deepEqual(api.calls.filter(call => call.table === "profiles").map(call => call.range), [[0, 99], [100, 199]]);
  const free = await (await api.get("type=provider")).json();
  assert.equal(free.items.length, 101);
  assert.equal(free.warning, undefined);
});
