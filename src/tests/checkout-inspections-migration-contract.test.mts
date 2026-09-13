import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../../supabase/migrations/20260912193000_checkout_inspections_disputes_core.sql");

test("the inspections and disputes module is present in the canonical migration directory", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.checkout_inspections/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.checkout_checklist_items/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.inspection_media/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.damage_disputes/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.dispute_evidence_links/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.inspection_events/);
});

test("inspection data is protected by participant RLS policies", () => {
  for (const table of [
    "checkout_inspections",
    "checkout_checklist_items",
    "inspection_media",
    "damage_disputes",
    "dispute_evidence_links",
    "inspection_events",
  ]) {
    assert.match(migration, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
  }

  assert.match(migration, /auth\.uid\(\) = owner_profile_id OR auth\.uid\(\) = concierge_profile_id/);
  assert.match(migration, /auth\.uid\(\) = ci\.owner_profile_id OR auth\.uid\(\) = ci\.concierge_profile_id/);
  assert.match(migration, /auth\.uid\(\) = d\.owner_profile_id OR auth\.uid\(\) = d\.concierge_profile_id/);
});

test("API errors identify the canonical migration when the module is absent", () => {
  const expected = "20260912193000_checkout_inspections_disputes_core.sql";
  assert.match(read("../app/api/inspections/route.ts"), new RegExp(expected));
  assert.match(read("../app/api/inspections/[id]/route.ts"), new RegExp(expected));
  assert.match(read("../app/api/disputes/route.ts"), new RegExp(expected));
});
