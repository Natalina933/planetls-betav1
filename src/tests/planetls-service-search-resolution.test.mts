import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolvePlanetLSIndividualRequestServices,
  resolvePlanetLSRequestServices,
} from "../app/lib/planetlsServiceSearchResolution.ts";

test("Un slug reconnu est transmis tel quel", () => {
  const result = resolvePlanetLSRequestServices(["cleaning_standard"]);

  assert.deepEqual(result.services, ["cleaning_standard"]);
  assert.deepEqual(result.unknownValues, []);
});

test("Un libellé précis est résolu vers son slug", () => {
  const result = resolvePlanetLSRequestServices(["Ménage du logement"]);

  assert.deepEqual(result.services, ["cleaning_standard"]);
  assert.deepEqual(result.unknownValues, []);
});

test("Une catégorie générique n'est jamais transmise telle quelle", () => {
  const result = resolvePlanetLSRequestServices(["Travaux et rénovation"]);

  assert.deepEqual(result.services, []);
  assert.deepEqual(result.unknownValues, ["Travaux et rénovation"]);
});

test("Les doublons sont dédupliqués", () => {
  const result = resolvePlanetLSRequestServices([
    "cleaning_standard",
    " cleaning_standard ",
    "Ménage du logement",
  ]);

  assert.deepEqual(result.services, ["cleaning_standard"]);
  assert.deepEqual(result.unknownValues, []);
});

test("Une sélection vide reste vide", () => {
  const result = resolvePlanetLSRequestServices([]);

  assert.deepEqual(result.services, []);
  assert.deepEqual(result.unknownValues, []);
});

test("La demande ne transmet que les prestations individuelles explicitement sélectionnées", () => {
  const result = resolvePlanetLSIndividualRequestServices([
    "guest_checkin",
    "maintenance_minor_repairs",
  ]);

  assert.deepEqual(result.services, ["guest_checkin"]);
  assert.deepEqual(result.entries.map((entry) => entry.kind), ["service"]);
});
