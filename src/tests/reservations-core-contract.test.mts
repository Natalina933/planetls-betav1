import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../../supabase/migrations/20260729153000_reservations_core.sql", import.meta.url), "utf8");
const missionLinkMigration = readFileSync(
  new URL("../../supabase/migrations/20260729190000_link_missions_to_reservations.sql", import.meta.url),
  "utf8",
);
const providerReservationLinkMigration = readFileSync(
  new URL("../../supabase/migrations/20260729193000_link_provider_interventions_to_reservations.sql", import.meta.url),
  "utf8",
);
const workflowReservationLinkMigration = readFileSync(
  new URL("../../supabase/migrations/20260729194500_link_workflow_events_to_reservations.sql", import.meta.url),
  "utf8",
);
const plan = readFileSync(new URL("../../docs/plan-technique-reservations-sejours-mvp-2026-07-29.md", import.meta.url), "utf8");

test("reservations core migration creates the canonical shared stay table", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.reservations/);
  assert.match(migration, /contract_id UUID REFERENCES public\.services_contracts\(id\) ON DELETE SET NULL/);
  assert.match(migration, /owner_profile_id UUID NOT NULL REFERENCES public\.profiles\(id\) ON DELETE CASCADE/);
  assert.match(migration, /concierge_profile_id UUID NOT NULL REFERENCES public\.profiles\(id\) ON DELETE CASCADE/);
  assert.match(migration, /status IN \('draft', 'shared', 'acknowledged', 'scheduled', 'in_stay', 'completed', 'canceled'\)/);
  assert.match(migration, /CONSTRAINT reservations_chronology_check CHECK \(check_out_at > check_in_at\)/);
});

test("reservations migration secures participant access with RLS", () => {
  assert.match(migration, /ALTER TABLE public\.reservations ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /CREATE POLICY reservations_select_participants/);
  assert.match(migration, /auth\.uid\(\) = owner_profile_id OR auth\.uid\(\) = concierge_profile_id/);
  assert.match(migration, /FROM public\.concierge_owner_matches com/);
  assert.match(migration, /created_by_profile_id IS NULL OR created_by_profile_id = auth\.uid\(\)/);
});

test("technical plan documents reservations as the canonical shared object", () => {
  assert.match(plan, /Introduire une table canonique `public\.reservations`/);
  assert.match(plan, /`reservations` = objet racine partage/);
  assert.match(plan, /migration `reservations` \+ RLS/);
});

test("phase D migration links missions explicitly to canonical reservations", () => {
  assert.match(missionLinkMigration, /ALTER TABLE public\.missions/);
  assert.match(missionLinkMigration, /ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public\.reservations\(id\) ON DELETE SET NULL/);
  assert.match(missionLinkMigration, /CREATE INDEX IF NOT EXISTS idx_missions_reservation_id/);
  assert.match(missionLinkMigration, /UPDATE public\.missions AS m/);
  assert.match(missionLinkMigration, /metadata ->> 'reservation_id'/);
});

test("phase D provider migration links interventions explicitly to canonical reservations", () => {
  assert.match(providerReservationLinkMigration, /ALTER TABLE public\.provider_interventions/);
  assert.match(providerReservationLinkMigration, /ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public\.reservations\(id\) ON DELETE SET NULL/);
  assert.match(providerReservationLinkMigration, /CREATE INDEX IF NOT EXISTS idx_provider_interventions_reservation_id/);
  assert.match(providerReservationLinkMigration, /UPDATE public\.provider_interventions AS pi/);
  assert.match(providerReservationLinkMigration, /m\.reservation_id IS NOT NULL/);
});

test("phase D workflow migration links events explicitly to canonical reservations", () => {
  assert.match(workflowReservationLinkMigration, /ALTER TABLE public\.workflow_events/);
  assert.match(workflowReservationLinkMigration, /ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public\.reservations\(id\) ON DELETE SET NULL/);
  assert.match(workflowReservationLinkMigration, /CREATE INDEX IF NOT EXISTS idx_workflow_events_reservation_created_at/);
  assert.match(workflowReservationLinkMigration, /UPDATE public\.workflow_events AS we/);
  assert.match(workflowReservationLinkMigration, /we\.mission_id = m\.id/);
});
