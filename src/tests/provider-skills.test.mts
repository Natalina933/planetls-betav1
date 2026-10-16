import test from "node:test";
import assert from "node:assert/strict";
import { PLANETLS_SERVICE_TARGET } from "../app/lib/planetlsServiceCatalogTarget.ts";
import { normalizeProviderSkills, providerSkillsFormValue, readProviderSkills } from "../app/lib/providerSkills.ts";
import { getProfilePatchPolicy, sanitizeProfilePatchBody } from "../app/api/profiles/pure.ts";

test("current catalog declarations round-trip through the existing option column", () => {
  for (const entry of PLANETLS_SERVICE_TARGET) {
    const result = normalizeProviderSkills(entry.label);
    assert.deepEqual(result, { services: [entry.slug], invalid: false });
    assert.equal(providerSkillsFormValue(JSON.stringify(result.services)), entry.label);
  }
});

test("declarations are deduplicated, clearable, and never expand groups into services", () => {
  assert.deepEqual(normalizeProviderSkills("plumbing_installation; plumbing_repair; plumbing_repair"),
    { services: ["plumbing_installation", "plumbing_repair"], invalid: false });
  for (const value of ["", null, []]) assert.deepEqual(normalizeProviderSkills(value), { services: [], invalid: false });
  for (const value of ["admin", "Ancienne prestation inventée", {}, [12], "[12]", '["plumbing_repair",12]', "[broken"]) assert.equal(normalizeProviderSkills(value).invalid, true);
});

test("historical values remain visible without silently granting current services", () => {
  assert.deepEqual(readProviderSkills("Texte historique; plumbing_repair"), ["Texte historique", "plumbing_repair"]);
  assert.match(providerSkillsFormValue("Texte historique"), /Texte historique/);
  assert.equal(normalizeProviderSkills("Texte historique").invalid, true);
});

test("no role emits a nonexistent skills column and authorization fields remain protected", () => {
  for (const role of ["owner", "owner_pro", "concierge", "concierge_pro", "provider", "provider_pro", "artisan", "artisan_pro", "admin", "super_admin"]) {
    const result = sanitizeProfilePatchBody({ first_name: "Élodie", skills: "plumbing_repair" }, getProfilePatchPolicy(role, role.includes("admin")));
    assert.deepEqual(result.updateData, { first_name: "Élodie" });
    assert.ok(result.ignoredFields.includes("skills"));
  }
  for (const role of ["provider", "provider_pro", "artisan", "artisan_pro"]) {
    const result = sanitizeProfilePatchBody({ option: '["plumbing_repair"]', category: "admin", role: "admin", status: "active" }, getProfilePatchPolicy(role, false));
    assert.deepEqual(result.updateData, { option: '["plumbing_repair"]' });
  }
});
