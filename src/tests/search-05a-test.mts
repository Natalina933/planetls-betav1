import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCircularCoverage } from "../features/owner-concierges/lib/geographicCoverage.ts";

const paris = { latitude: 48.8566, longitude: 2.3522 };
const lyon = { latitude: 45.7640, longitude: 4.8357 };
const marseille = { latitude: 43.2965, longitude: 5.3696 };

const search30km = { center: paris, radiusKm: 30 };
const conciergeParis = { center: paris, radiusKm: 20 };
const conciergeLyon = { center: lyon, radiusKm: 15 };
test("SEARCH-05A: Concierge dans périmètre", () => {
  const result = evaluateCircularCoverage(search30km, [conciergeParis]);
  assert.equal(result.state, "covered");
});

test("SEARCH-05A: Coordonnées absentes", () => {
  const result = evaluateCircularCoverage(search30km, [{ radiusKm: 20 }]);
  assert.equal(result.state, "unknown");
});

test("SEARCH-05A: Coordonnées invalides", () => {
  const invalidCenters = [
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: 181 },
    { latitude: NaN, longitude: 0 },
    { latitude: 0, longitude: Infinity },
  ];
  for (const center of invalidCenters) {
    const result = evaluateCircularCoverage(search30km, [{ center, radiusKm: 20 }]);
    assert.equal(result.state, "unknown");
  }
});

test("SEARCH-05A: Centre nul ou undefined", () => {
  const result1 = evaluateCircularCoverage(search30km, [{ center: null, radiusKm: 20 }]);
  assert.equal(result1.state, "unknown");
  const result2 = evaluateCircularCoverage(search30km, [{ center: undefined, radiusKm: 20 }]);
  assert.equal(result2.state, "unknown");
});

test("SEARCH-05A: Couverture vide", () => {
  const result = evaluateCircularCoverage(search30km, []);
  assert.deepEqual(result.state, "unknown");
});