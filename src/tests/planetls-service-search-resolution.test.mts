import assert from "node:assert/strict";
import { test } from "node:test";

import { resolvePlanetLSRequestServices } from "../app/lib/planetlsServiceSearchResolution.ts";

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
