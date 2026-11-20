import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PROVIDER_ROLES } from "../app/lib/missionPermissions.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const migration = read("../../supabase/migrations/20260829162000_provider_intervention_reports.sql");
const helper = read("../app/api/_shared/providerInterventionReports.ts");
const providerListRoute = read("../app/api/provider/interventions/route.ts");
const providerItemRoute = read("../app/api/provider/interventions/[id]/route.ts");
const missionRoute = read("../app/api/missions/[id]/route.ts");
const missionProviderRoute = read("../app/api/missions/[id]/provider-interventions/route.ts");
const providerPage = read("../app/dashboard/provider/interventions/page.tsx");
const planningPage = read("../app/dashboard/provider/planning/page.tsx");
const providerAccess = read("../app/api/_shared/currentProviderAccess.ts");

test("la route conserve le repli historique et signale l’indisponibilité au planning", () => {
  const [listHandler] = providerListRoute.split("export async function POST");
  assert.match(listHandler, /if \(error\.code === "42P01"\) \{\s*return NextResponse\.json\(\{\s*items: \[\],\s*summary: \{[^}]+\},\s*interventions_schema_ready: false,[\s\S]*?\}\);/);
  assert.match(listHandler, /items: reports\.items,[\s\S]*note: rows\.length === 0/);
  assert.equal(listHandler.match(/interventions_schema_ready:/g)?.length, 1);
  assert.match(planningPage, /if \(payload\.interventions_schema_ready === false\) \{\s*throw new Error/);
  assert.match(planningPage, /catch \{[\s\S]*?setFailed\(true\)/);
});

test("la liste privée exige un rôle artisan et utilise le profil vérifié par le serveur", () => {
  for (const role of ["artisan", "artisan_pro", "provider", "provider_pro"]) {
    assert.equal(PROVIDER_ROLES.has(role), true);
  }
  for (const role of ["owner", "owner_pro", "concierge", "concierge_pro"]) {
    assert.equal(PROVIDER_ROLES.has(role), false);
  }
  assert.match(providerAccess, /resolveCommercialAccess\(req\)[\s\S]*?!PROVIDER_ROLES\.has\(auth\.role\)[\s\S]*?status: 403/);
  assert.match(providerListRoute, /export async function GET[\s\S]*?requireProviderAuth\(req\)[\s\S]*?if \(!authResult\.ok\) return authResult\.response;[\s\S]*?providerProfileId = auth\.userId[\s\S]*?\.eq\("provider_profile_id", providerProfileId\)/);
});

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
