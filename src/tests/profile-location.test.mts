import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveNormalizedCity,
  normalizeAreaLabel,
  normalizeProfileLocationFields,
} from "../app/lib/profileLocation.ts";

test("normalizeAreaLabel cleans spacing and casing", () => {
  assert.equal(normalizeAreaLabel("  paris ,   seine et marne "), "Paris, Seine Et Marne");
});

test("deriveNormalizedCity falls back to location or service area", () => {
  assert.equal(deriveNormalizedCity("lyon", null, null), "Lyon");
  assert.equal(deriveNormalizedCity(null, "bordeaux, gironde", null), "Bordeaux");
});

test("normalizeProfileLocationFields aligns city, location and service area", () => {
  assert.deepEqual(
    normalizeProfileLocationFields({
      location: "  marseille ",
      service_area: "marseille, aix en provence",
      city: null,
    }),
    {
      location: "Marseille",
      service_area: "Marseille, Aix En Provence",
      city: "Marseille",
    },
  );
});
