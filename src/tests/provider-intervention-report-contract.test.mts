import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const migration = read("../../supabase/migrations/20260829162000_provider_intervention_reports.sql");
const helper = read("../app/api/_shared/providerInterventionReports.ts");
const providerListRoute = read("../app/api/provider/interventions/route.ts");
const providerItemRoute = read("../app/api/provider/interventions/[id]/route.ts");
const missionRoute = read("../app/api/missions/[id]/route.ts");
const missionProviderRoute = read("../app/api/missions/[id]/provider-interventions/route.ts");
const providerPage = read("../app/dashboard/provider/interventions/page.tsx");

test("provider intervention reports migration creates a structured completion report table", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.provider_intervention_reports/);
  assert.match(migration, /provider_intervention_id UUID NOT NULL UNIQUE REFERENCES public\.provider_interventions\(id\) ON DELETE CASCADE/);
  assert.match(migration, /summary TEXT NOT NULL CHECK/);
  assert.match(migration, /work_performed TEXT/);
  assert.match(migration, /follow_up_required BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /pi\.metadata #>> '\{proof,note\}'/);
});

test("provider intervention reports migration secures participants with RLS", () => {
  assert.match(migration, /ALTER TABLE public\.provider_intervention_reports ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /CREATE POLICY provider_intervention_reports_select_participants/);
  assert.match(migration, /auth\.uid\(\) = provider_profile_id/);
  assert.match(migration, /auth\.uid\(\) = owner_profile_id/);
  assert.match(migration, /auth\.uid\(\) = m\.concierge_profile_id/);
  assert.match(migration, /CREATE POLICY provider_intervention_reports_insert_provider/);
});

test("provider intervention APIs persist and expose structured completion reports", () => {
  assert.match(helper, /readProviderInterventionReportInput/);
  assert.match(helper, /upsertProviderInterventionReport/);
  assert.match(helper, /attachProviderInterventionReports/);
  assert.match(providerItemRoute, /completion_report/);
  assert.match(providerItemRoute, /provider_intervention_report_submitted/);
  assert.match(providerListRoute, /attachProviderInterventionReports/);
  assert.match(missionRoute, /attachProviderInterventionReports/);
  assert.match(missionProviderRoute, /completion_reports_schema_ready/);
});

test("provider intervention page lets providers enter and read a completion report", () => {
  assert.match(providerPage, /completion_summary/);
  assert.match(providerPage, /work_performed/);
  assert.match(providerPage, /follow_up_required/);
  assert.match(providerPage, /Compte rendu/);
  assert.match(providerPage, /styles\.reportBox/);
});
