import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCircularCoverage, isCoverageCircle } from "../features/owner-concierges/lib/geographicCoverage.ts";
import { distanceKm } from "../features/owner-concierges/lib/geography.ts";

const origin = { latitude: 0, longitude: 0 };
const atKm = (km: number) => ({ latitude: 0, longitude: km / 6371 * 180 / Math.PI });
const circle = (km: number, radiusKm: number) => ({ center: atKm(km), radiusKm });
const search = { center: origin, radiusKm: 20 };

test("intersection, containment and disjoint circles", () => {
  assert.equal(evaluateCircularCoverage(search, [circle(30, 15)]).state, "covered");
  assert.equal(evaluateCircularCoverage(search, [circle(0, 1)]).state, "covered");
  assert.equal(evaluateCircularCoverage(search, [circle(0, 100)]).state, "covered");
  assert.equal(evaluateCircularCoverage(search, [circle(40, 15)]).state, "not_covered");
});

test("external tangency is included, a 1 mm gap is excluded", () => {
  assert.equal(evaluateCircularCoverage(search, [circle(35, 15)]).state, "covered");
  assert.equal(evaluateCircularCoverage(search, [circle(35.000001, 15)]).state, "not_covered");
});

test("explicit zero radius is a point, including a point search", () => {
  assert.equal(evaluateCircularCoverage(search, [circle(20, 0)]).state, "covered");
  assert.equal(evaluateCircularCoverage(search, [circle(21, 0)]).state, "not_covered");
  assert.equal(evaluateCircularCoverage(circle(0, 0), [circle(0, 0)]).state, "covered");
  assert.equal(evaluateCircularCoverage(circle(0, 0), [circle(1, 0)]).state, "not_covered");
});

test("absent, null, negative, nonfinite and string radii are unknown, never zero or default", () => {
  for (const radiusKm of [undefined, null, -1, NaN, Infinity, "20"]) {
    assert.equal(evaluateCircularCoverage(search, [{ center: origin, radiusKm }]).state, "unknown");
  }
  assert.equal(evaluateCircularCoverage(search, [origin]).state, "unknown");
});

test("invalid coordinates and unresolved text zones are unknown", () => {
  for (const center of [null, {}, { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: 181 }, { latitude: NaN, longitude: 0 },
    { latitude: 0, longitude: Infinity }, { latitude: "0", longitude: 0 }]) {
    assert.equal(isCoverageCircle({ center, radiusKm: 20 }), false);
    assert.equal(evaluateCircularCoverage(search, [{ center, radiusKm: 20 }]).state, "unknown");
  }
  assert.equal(evaluateCircularCoverage(search, [{ label: "Ville fictive", radiusKm: 30 }]).state, "unknown");
});

test("invalid search perimeter is distinct from absence of coverage", () => {
  for (const perimeter of [null, origin, circle(0, -1), { center: origin }]) {
    assert.equal(evaluateCircularCoverage(perimeter, [circle(0, 20)]).reason, "invalid_search");
  }
});

test("empty coverage remains unknown even with an address inside the search", () => {
  assert.deepEqual(evaluateCircularCoverage(search, []), {
    state: "unknown", reason: "no_zones", intersectingZoneIndexes: [], unknownZoneIndexes: [],
  });
});

test("multiple zones: one intersection suffices, unresolved declarations remain visible", () => {
  assert.deepEqual(evaluateCircularCoverage(search, [circle(100, 5), null, circle(30, 15)]), {
    state: "covered", reason: "intersection", intersectingZoneIndexes: [2], unknownZoneIndexes: [1],
  });
  assert.equal(evaluateCircularCoverage(search, [circle(100, 5), circle(200, 5)]).state, "not_covered");
  assert.equal(evaluateCircularCoverage(search, [circle(100, 5), null]).state, "unknown");
});

test("professional outside the owner's perimeter can cover it, regardless of role", () => {
  for (const role of ["concierge", "concierge_pro", "artisan", "artisan_pro", "provider", "provider_pro"]) {
    const profile = { role, latitude: atKm(30).latitude, longitude: atKm(30).longitude };
    const before = structuredClone(profile);
    assert.ok(distanceKm(origin, profile) > search.radiusKm);
    assert.equal(evaluateCircularCoverage(search, [{ center: profile, radiusKm: 15 }]).state, "covered");
    assert.deepEqual(profile, before);
  }
});

test("intersection is symmetric and crosses the antimeridian", () => {
  const a = { center: { latitude: 0, longitude: 179.9 }, radiusKm: 15 };
  const b = { center: { latitude: 0, longitude: -179.9 }, radiusKm: 10 };
  assert.equal(evaluateCircularCoverage(a, [b]).state, "covered");
  assert.equal(evaluateCircularCoverage(b, [a]).state, "covered");
  assert.equal(evaluateCircularCoverage({ center: { latitude: 90, longitude: 180 }, radiusKm: 0 },
    [{ center: { latitude: 90, longitude: -180 }, radiusKm: 0 }]).state, "covered");
});

test("frozen inputs are unchanged; duplicate zones produce one coverage decision", () => {
  const zone = Object.freeze({ center: Object.freeze(atKm(30)), radiusKm: 15 });
  const zones = Object.freeze([zone, zone]);
  const before = JSON.stringify(zones);
  const result = evaluateCircularCoverage(Object.freeze(search), zones);
  assert.equal(result.state, "covered");
  assert.deepEqual(result.intersectingZoneIndexes, [0, 1]);
  assert.equal(JSON.stringify(zones), before);
});
