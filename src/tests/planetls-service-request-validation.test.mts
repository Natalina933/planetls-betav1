import assert from "node:assert/strict";
import { test } from "node:test";

import { validatePlanetLSServiceRequest } from "../app/lib/planetlsServiceRequestValidation.ts";

test("Une prestation précise ne nécessite pas de description", () => {
  const result = validatePlanetLSServiceRequest(["cleaning_standard"], null);

  assert.equal(result.valid, true);
  assert.equal(result.code, null);
  assert.equal(result.requiresDescription, false);
  assert.deepEqual(result.unknownSlugs, []);
});

test("Un tableau vide est refusé avec SERVICE_REQUIRED", () => {
  const result = validatePlanetLSServiceRequest([], null);

  assert.equal(result.valid, false);
  assert.equal(result.code, "SERVICE_REQUIRED");
  assert.equal(result.empty, true);
});

test("Un slug inconnu est refusé avec UNKNOWN_SERVICE", () => {
  const result = validatePlanetLSServiceRequest(["service_inconnu"], null);

  assert.equal(result.valid, false);
  assert.equal(result.code, "UNKNOWN_SERVICE");
  assert.deepEqual(result.unknownSlugs, ["service_inconnu"]);
});

test("Un libellé historique est refusé avec UNKNOWN_SERVICE", () => {
  const result = validatePlanetLSServiceRequest(["Ménage du logement"], null);

  assert.equal(result.valid, false);
  assert.equal(result.code, "UNKNOWN_SERVICE");
  assert.deepEqual(result.unknownSlugs, ["Ménage du logement"]);
});

test("Le slug commercial groupé ne remplace jamais les slugs opérationnels de demande", () => {
  const result = validatePlanetLSServiceRequest(
    ["guest_checkin_checkout"],
    null,
  );

  assert.equal(result.valid, false);
  assert.equal(result.code, "UNKNOWN_SERVICE");
  assert.deepEqual(result.unknownSlugs, ["guest_checkin_checkout"]);
  assert.equal(
    validatePlanetLSServiceRequest(["guest_checkin", "guest_checkout"], null)
      .valid,
    true,
  );
});

test("Un groupe nécessite une description", () => {
  const result = validatePlanetLSServiceRequest(
    ["maintenance_minor_repairs"],
    "",
  );

  assert.equal(result.valid, false);
  assert.equal(result.code, "SERVICE_GROUP_DESCRIPTION_REQUIRED");
  assert.equal(result.missingDescription, true);
});

test("Un groupe avec description est accepté", () => {
  const result = validatePlanetLSServiceRequest(
    ["maintenance_minor_repairs"],
    "Le robinet de la cuisine fuit.",
  );

  assert.equal(result.valid, true);
  assert.equal(result.code, null);
  assert.deepEqual(result.groupSlugs, ["maintenance_minor_repairs"]);
});

test("Une nouvelle prestation de réseaux sociaux est reconnue", () => {
  const result = validatePlanetLSServiceRequest(
    ["social_media_management"],
    null,
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.unknownSlugs, []);
});
