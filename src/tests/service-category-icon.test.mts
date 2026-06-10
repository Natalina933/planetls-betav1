import test from "node:test";
import assert from "node:assert/strict";

import {
  getServiceCategoryIconLabel,
  getServiceCategoryIconName,
} from "../app/lib/serviceCategoryIcon.ts";

test("service category icon helper maps common catalog categories", () => {
  assert.equal(getServiceCategoryIconName("Ménage"), "sparkles");
  assert.equal(getServiceCategoryIconName("Linge"), "shirt");
  assert.equal(getServiceCategoryIconName("Accueil voyageurs"), "key");
  assert.equal(getServiceCategoryIconName("Gestion administrative"), "file");
  assert.equal(getServiceCategoryIconName("Maintenance et réparations"), "wrench");
  assert.equal(getServiceCategoryIconName("Assistance administrative et fiscale"), "file");
  assert.equal(getServiceCategoryIconName("Jardinage / espaces verts"), "trees");
  assert.equal(getServiceCategoryIconName("Photographie professionnelle"), "camera");
});

test("service category icon helper covers broad profile categories and fallback", () => {
  assert.equal(getServiceCategoryIconName("proprietaire"), "home");
  assert.equal(getServiceCategoryIconName("concierge"), "users");
  assert.equal(getServiceCategoryIconName("artisan"), "hammer");
  assert.equal(getServiceCategoryIconName("categorie inconnue"), "help");
  assert.equal(getServiceCategoryIconLabel("categorie inconnue"), "Service");
  assert.equal(getServiceCategoryIconLabel("Gestion administrative"), "Gestion administrative");
});
