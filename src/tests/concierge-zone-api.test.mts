import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { conciergePublication } from "../app/lib/conciergePublication.ts";

const compiled = ts.transpileModule(readFileSync(new URL("../app/api/concierge/intervention-zone/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness(role = "concierge", userId: string | null = "self", unavailable = false) {
  const calls: unknown[][] = [];
  const row = { service_area: "Ville isolée", service_radius_km: 30, availability_hours: JSON.stringify({
    preferences: { selectedServices: ["cleaning_standard"] },
    zones: [{ placeId: "nominatim:fixture", label: "Ville isolée", lat: 0, lng: 0 }],
  }) };
  let update: Record<string, unknown> | null = null;
  const query = {
    select: () => query,
    eq: (key: string, id: string) => { calls.push([key, id]); return query; },
    update: (value: Record<string, unknown>) => { update = value; Object.assign(row, value); return query; },
    single: async () => ({ data: row, error: null }),
  };
  const deps: Record<string, unknown> = {
    "next/server": { NextResponse: { json: (value: unknown, init?: ResponseInit) => Response.json(value, init) } },
    zod: { z: undefined },
    "@/app/lib/dbServer": { db: { from: () => query } },
    "@/app/lib/apiAuth": { getApiAuthContext: async () => ({ userId, role }) },
    "@/server/location/geocodeLocation": {
      geocodeLocation: async () => { if (unavailable) throw new Error("Unavailable fixture"); return { latitude: 0, longitude: 0 }; },
      isGeocodingServiceError: () => unavailable,
    },
  };
  const exports: { PATCH?: (request: unknown) => Promise<Response> } = {};
  return import("zod").then(({ z }) => {
    deps.zod = { z };
    new Function("require", "exports", compiled)((name: string) => {
      assert.ok(name in deps, `Unexpected dependency ${name}`);
      return deps[name];
    }, exports);
    return { row, calls, update: () => update,
      patch: (body: unknown) => exports.PATCH!({ json: async () => body }) };
  });
}

test("zone : anonyme et rôle propriétaire refusés sans lecture/écriture", async () => {
  for (const [role, id, status] of [["concierge", null, 401], ["owner", "self", 403]] as const) {
    const api = await harness(role, id);
    assert.equal((await api.patch({ locked: false })).status, status);
    assert.deepEqual(api.calls, []);
    assert.equal(api.update(), null);
  }
});

test("zone : modification limitée au profil authentifié, conservation des préférences et 30 km explicites", async () => {
  const api = await harness();
  const response = await api.patch({ id: "another-user", role: "admin", status: "active", locked: true,
    serviceArea: "Ville isolée", serviceRadiusKm: 30 });
  assert.equal(response.status, 200);
  assert.ok(api.calls.every(([key, id]) => key === "id" && id === "self"));
  assert.equal(api.update()?.role, undefined);
  assert.equal(api.update()?.status, undefined);
  const saved = JSON.parse(api.row.availability_hours);
  assert.deepEqual(saved.preferences.selectedServices, ["cleaning_standard"]);
  assert.equal(saved.radiusDeclaration, "explicit");
  assert.equal(conciergePublication({ ...api.row, role: "concierge", status: "active", company_name: "Entreprise isolée",
    option: "cleaning_standard" }).eligible, true);
});

test("zone : verrouillage seul ne confirme jamais le rayon historique", async () => {
  const api = await harness();
  assert.equal((await api.patch({ locked: true })).status, 200);
  assert.equal(JSON.parse(api.row.availability_hours).radiusDeclaration, undefined);
});

test("zone : géocodage indisponible sans modification persistée", async () => {
  const api = await harness("concierge", "self", true);
  assert.equal((await api.patch({ locked: false, serviceArea: "Ville isolée", serviceRadiusKm: 30 })).status, 503);
  assert.equal(api.update(), null);
});
