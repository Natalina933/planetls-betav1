import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const legacyDirectory = resolve("database/migrations");
const canonicalDirectory = resolve("supabase/migrations");
const frozenLegacyFiles = [
  "20260220_services_packages_contract_templates.sql",
  "20260222_missions_core.sql",
  "20260223_add_missions_concierge_profile_id.sql",
  "20260223_add_missions_owner_profile_id.sql",
  "20260223_concierge_matching_onboarding.sql",
  "20260223_contact_conversations_core.sql",
  "20260223_enable_rls_missions_and_matches.sql",
  "20260223_quotes_invoices_core.sql",
  "20260301_provider_workspace_core.sql",
  "20260307_normalize_mission_profile_ids.sql",
  "20260307_service_requests_core.sql",
  "20260312_checkout_inspections_disputes_core.sql",
  "20260509_optimized_routes.sql",
  "20260605_mission_planning_statuses.sql",
  "20260605_quotes_service_request_links.sql",
  "20260605_service_request_brief_statuses.sql",
  "20260605_service_request_recipient_info_date.sql",
  "20260605_service_requests_area_fields.sql",
  "20260605_service_requests_mission_id.sql",
  "20260605_workflow_events_core.sql",
].sort();

function sqlFiles(directory) {
  return readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();
}

const legacyFiles = sqlFiles(legacyDirectory);
const canonicalFiles = sqlFiles(canonicalDirectory);
const addedLegacy = legacyFiles.filter((file) => !frozenLegacyFiles.includes(file));
const missingLegacy = frozenLegacyFiles.filter((file) => !legacyFiles.includes(file));

if (addedLegacy.length || missingLegacy.length) {
  console.error("Migration governance violation: database/migrations is a frozen historical archive.");
  if (addedLegacy.length) console.error(`Unexpected legacy files: ${addedLegacy.join(", ")}`);
  if (missingLegacy.length) console.error(`Missing legacy files: ${missingLegacy.join(", ")}`);
  console.error("Create every new migration in supabase/migrations.");
  process.exit(1);
}

if (canonicalFiles.length === 0) {
  console.error("Migration governance violation: canonical supabase/migrations is empty.");
  process.exit(1);
}

console.log(`Migration governance OK: ${canonicalFiles.length} canonical, ${legacyFiles.length} frozen legacy migrations.`);