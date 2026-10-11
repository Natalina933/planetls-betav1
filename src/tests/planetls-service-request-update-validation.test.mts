
import test from "node:test";
import assert from "node:assert/strict";

import { validatePlanetLSServiceRequestUpdate } from "../app/lib/planetlsServiceRequestUpdateValidation.ts";

test("une ancienne demande de groupe sans description est requalifiée même sans changement de prestation", () => {
  // La validation porte désormais sur l'état final : une ancienne demande
  // contenant un groupe sans description doit être requalifiée avant son
  // prochain enregistrement, même si seul le titre change.
  const result = validatePlanetLSServiceRequestUpdate(
    {
      requested_services: ["maintenance_minor_repairs"],
      description: null,
    },
    {},
  );

  assert.equal(result.valid, false);
  assert.equal(result.code, "SERVICE_GROUP_DESCRIPTION_REQUIRED");
  assert.equal(result.missingDescription, true);
});

test("supprimer la description d'un groupe est refusé", () => {
  const result = validatePlanetLSServiceRequestUpdate(
    {
      requested_services: ["maintenance_minor_repairs"],
      description: "Réparer plusieurs éléments du logement",
    },
    {
      description: "",
    },
  );

  assert.equal(result.valid, false);
  assert.equal(result.missingDescription, true);
});

test("ajouter un groupe sans description est refusé", () => {
  const result = validatePlanetLSServiceRequestUpdate(
    {
      requested_services: ["cleaning_turnover"],
      description: null,
    },
    {
      requested_services: ["maintenance_minor_repairs"],
    },
  );

  assert.equal(result.valid, false);
});

test("une prestation précise reste autorisée", () => {
  const result = validatePlanetLSServiceRequestUpdate(
    {
      requested_services: ["cleaning_turnover"],
      description: null,
    },
    {
      description: "Nettoyage après le départ",
    },
  );

  assert.equal(result.valid, true);
});

test("modifier une demande vers un slug inconnu est refusé", () => {
  const result = validatePlanetLSServiceRequestUpdate(
    {
      requested_services: ["cleaning_standard"],
      description: null,
    },
    {
      requested_services: ["service_inconnu"],
    },
  );

  assert.equal(result.valid, false);
  assert.equal(result.code, "UNKNOWN_SERVICE");
});

test("modifier une demande vers un libellé historique est refusé", () => {
  const result = validatePlanetLSServiceRequestUpdate(
    {
      requested_services: ["cleaning_standard"],
      description: null,
    },
    {
      requested_services: ["Ménage du logement"],
    },
  );

  assert.equal(result.valid, false);
  assert.equal(result.code, "UNKNOWN_SERVICE");
});

test("modifier une demande vers un tableau vide est refusé", () => {
  const result = validatePlanetLSServiceRequestUpdate(
    {
      requested_services: ["cleaning_standard"],
      description: null,
    },
    {
      requested_services: [],
    },
  );

  assert.equal(result.valid, false);
  assert.equal(result.code, "SERVICE_REQUIRED");
});

test("une description composée d'espaces est refusée", () => {
  const result = validatePlanetLSServiceRequestUpdate(
    {
      requested_services: ["maintenance_minor_repairs"],
      description: "Réparation de la serrure",
    },
    {
      description: "   ",
    },
  );

  assert.equal(result.valid, false);
});
