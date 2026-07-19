import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("provider professional documents are private and verification-aware", () => {
  const migration = read("../../supabase/migrations/20260719140000_provider_profile_documents.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.provider_profile_documents/);
  assert.match(migration, /verification_status IN \('pending', 'verified', 'rejected'\)/);
  assert.match(migration, /auth\.uid\(\) = provider_profile_id/);
  assert.match(migration, /file_size_bytes <= 10485760/);
});

test("provider documents API fingerprints uploads and keeps signed downloads scoped", () => {
  const route = read("../app/api/provider/profile-documents/route.ts");
  const download = read("../app/api/provider/profile-documents/[id]/download/route.ts");
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /verification_status: "pending"/);
  assert.match(route, /PROVIDER_ROLES\.has\(role\)/);
  assert.match(download, /document\.provider_profile_id !== userId/);
  assert.match(download, /createSignedUrl/);
  assert.match(download, /TTL_SECONDS = 10 \* 60/);
});

test("provider settings exposes upload, status and private download", () => {
  const panel = read("../app/dashboard/provider/settings/ProviderDocumentsPanel.tsx");
  const page = read("../app/dashboard/provider/settings/page.tsx");
  assert.match(page, /<ProviderDocumentsPanel \/>/);
  assert.match(panel, /application\/pdf,image\/jpeg,image\/png,image\/webp/);
  assert.match(panel, /En attente de vérification/);
  assert.match(panel, /api\/provider\/profile-documents\/\$\{item\.id\}\/download/);
});

test("admin can decide verification and provider directory exposes signals only", () => {
  const decision = read("../app/api/provider/profile-documents/[id]/route.ts");
  const directory = read("../app/api/profiles/providers/route.ts");
  const admin = read("../app/dashboard/admin/ProviderDocumentReviewPanel.tsx");
  assert.match(decision, /requireApiRole\(req, ADMIN_ROLES\)/);
  assert.match(decision, /verified_by: guard\.auth\.userId/);
  assert.match(decision, /status === "rejected" && rejectionReason\.length < 3/);
  assert.match(directory, /verifiedDocumentCount/);
  assert.match(directory, /insuranceVerified/);
  assert.doesNotMatch(directory, /storage_path/);
  assert.match(admin, /Consulter le fichier privé/);
  assert.match(admin, /ProviderDocumentReviewPanel/);
});
