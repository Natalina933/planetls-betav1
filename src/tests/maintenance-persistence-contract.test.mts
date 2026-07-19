import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../../supabase/migrations/20260719100000_maintenance_incidents.sql", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/api/concierge/maintenance/route.ts", import.meta.url), "utf8");
const memberRoute = readFileSync(new URL("../app/api/concierge/maintenance/[id]/route.ts", import.meta.url), "utf8");
const providersRoute = readFileSync(new URL("../app/api/profiles/providers/route.ts", import.meta.url), "utf8");
const mediaRoute = readFileSync(new URL("../app/api/concierge/maintenance/[id]/media/route.ts", import.meta.url), "utf8");
const mediaDownloadRoute = readFileSync(new URL("../app/api/concierge/maintenance/[id]/media/[mediaId]/download/route.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/dashboard/concierge/maintenance/page.tsx", import.meta.url), "utf8");

test("maintenance migration persists incidents with participant RLS", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.maintenance_incidents/);
  assert.match(migration, /ALTER TABLE public\.maintenance_incidents ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /auth\.uid\(\) = concierge_profile_id/);
  assert.match(migration, /auth\.uid\(\) = owner_profile_id/);
  assert.match(migration, /auth\.uid\(\) = provider_profile_id/);
});

test("maintenance API scopes concierge reads and validates creation", () => {
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /eq\("concierge_profile_id", userId\)/);
  assert.match(route, /title\.length < 3/);
  assert.match(route, /schema_ready: false/);
});

test("maintenance cockpit merges legacy missions and persistent incidents", () => {
  assert.match(page, /fetch\("\/api\/concierge\/maintenance"/);
  assert.match(page, /persistedMissionIds/);
  assert.match(page, /method: "POST"/);
  assert.match(page, /Mode historique/);
});
test("maintenance incident updates enforce ownership and lifecycle transitions", () => {
  assert.match(memberRoute, /export async function PATCH/);
  assert.match(memberRoute, /eq\("concierge_profile_id", userId\)/);
  assert.match(memberRoute, /TRANSITIONS\[currentStatus\]/);
  assert.match(memberRoute, /status: 409/);
  assert.match(memberRoute, /provider_profile_id/);
  assert.match(memberRoute, /mission_id/);
  assert.match(page, /Changer le statut/);
  assert.match(page, /method: "PATCH"/);
});
test("maintenance assignment uses a restricted provider directory", () => {
  assert.match(providersRoute, /requireApiRole/);
  assert.match(providersRoute, /provider_pro/);
  assert.match(providersRoute, /artisan_pro/);
  assert.doesNotMatch(providersRoute, /email/);
  assert.doesNotMatch(providersRoute, /phone/);
  assert.match(memberRoute, /Profil artisan introuvable/);
  assert.match(page, /Affecter un artisan/);
  assert.match(page, /providerProfileId/);
});
test("maintenance evidence is private, fingerprinted and signed", () => {
  assert.match(mediaRoute, /MAX_SIZE = 25 \* 1024 \* 1024/);
  assert.match(mediaRoute, /ALLOWED_TYPES/);
  assert.match(mediaRoute, /createHash\("sha256"\)/);
  assert.match(mediaRoute, /incident\.provider_profile_id === userId/);
  assert.match(mediaDownloadRoute, /createSignedUrl/);
  assert.match(mediaDownloadRoute, /TTL_SECONDS = 10 \* 60/);
  assert.match(route, /maintenance_incident_media/);
  assert.match(page, /Ajouter une preuve/);
});