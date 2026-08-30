import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260829150000_mission_checklist_items.sql", import.meta.url),
  "utf8",
);
const missionRoute = readFileSync(new URL("../app/api/missions/[id]/route.ts", import.meta.url), "utf8");

test("mission checklist migration creates structured business rows", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.mission_checklist_items/);
  assert.match(migration, /mission_id UUID NOT NULL REFERENCES public\.missions\(id\) ON DELETE CASCADE/);
  assert.match(migration, /provider_intervention_id UUID REFERENCES public\.provider_interventions\(id\) ON DELETE SET NULL/);
  assert.match(migration, /CONSTRAINT mission_checklist_external_key_unique UNIQUE \(mission_id, external_key\)/);
  assert.match(migration, /jsonb_array_elements\(m\.metadata -> 'checklist'\) WITH ORDINALITY/);
});

test("mission checklist migration secures participant and provider access", () => {
  assert.match(migration, /ALTER TABLE public\.mission_checklist_items ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /CREATE POLICY mission_checklist_select_participants/);
  assert.match(migration, /auth\.uid\(\) = m\.owner_profile_id OR auth\.uid\(\) = m\.concierge_profile_id/);
  assert.match(migration, /auth\.uid\(\) = pi\.provider_profile_id/);
  assert.match(migration, /CREATE POLICY mission_checklist_delete_concierge/);
});

test("mission detail route reads and writes mission checklist rows", () => {
  assert.match(missionRoute, /function normalizeChecklistPayload/);
  assert.match(missionRoute, /from\("mission_checklist_items"\)/);
  assert.match(missionRoute, /loadMissionChecklistItems\(mission\.id\)/);
  assert.match(missionRoute, /replaceMissionChecklistItems/);
  assert.match(missionRoute, /\.is\("provider_intervention_id", null\)/);
  assert.match(missionRoute, /checklist_source: "mission_checklist_items"/);
  assert.match(missionRoute, /metadataChecklist/);
});
