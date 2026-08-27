import assert from "node:assert/strict";
import test from "node:test";

import {
  collectHousingReferenceIds,
  getCanonicalListingId,
  getHousingReferenceId,
  getListingLabel,
  matchesHousingReference,
} from "../app/lib/listingReferences.ts";

test("getHousingReferenceId prefers explicit housing metadata and numeric property fallbacks", () => {
  assert.equal(
    getHousingReferenceId({
      propertyId: "8d2c71c0-2db7-48a4-861c-2f90bd7c7ef8",
      metadata: { property_housing_id: 42 },
    }),
    "42",
  );
  assert.equal(
    getHousingReferenceId({
      propertyId: "84",
      metadata: null,
    }),
    "84",
  );
  assert.equal(
    getHousingReferenceId({
      propertyId: "8d2c71c0-2db7-48a4-861c-2f90bd7c7ef8",
      metadata: { housing_id: "73" },
    }),
    "73",
  );
});

test("getCanonicalListingId keeps legacy property uuids when no housing reference exists", () => {
  assert.equal(
    getCanonicalListingId({
      propertyId: "8d2c71c0-2db7-48a4-861c-2f90bd7c7ef8",
      metadata: null,
    }),
    "8d2c71c0-2db7-48a4-861c-2f90bd7c7ef8",
  );
});

test("matchesHousingReference resolves housing ids from property_id or metadata", () => {
  assert.equal(matchesHousingReference({ propertyId: "18", metadata: null }, 18), true);
  assert.equal(
    matchesHousingReference(
      {
        propertyId: "8d2c71c0-2db7-48a4-861c-2f90bd7c7ef8",
        metadata: { property_housing_id: "18" },
      },
      "18",
    ),
    true,
  );
  assert.equal(
    matchesHousingReference(
      {
        propertyId: "8d2c71c0-2db7-48a4-861c-2f90bd7c7ef8",
        metadata: null,
      },
      "18",
    ),
    false,
  );
});

test("getListingLabel prefers housing labels, then properties, then metadata", () => {
  const propertyNameById = new Map([["legacy-property", "Villa Legacy"]]);
  const housingNameById = new Map([["18", "Villa Canonique"]]);

  assert.equal(
    getListingLabel(
      {
        propertyId: "legacy-property",
        metadata: { property_housing_id: "18", property_label: "Fallback label" },
      },
      { propertyNameById, housingNameById },
    ),
    "Villa Canonique",
  );
  assert.equal(
    getListingLabel(
      {
        propertyId: "legacy-property",
        metadata: null,
      },
      { propertyNameById, housingNameById },
    ),
    "Villa Legacy",
  );
  assert.equal(
    getListingLabel(
      {
        propertyId: null,
        metadata: { property_label: "Label metadata" },
      },
      { propertyNameById, housingNameById },
    ),
    "Label metadata",
  );
});

test("collectHousingReferenceIds deduplicates mixed housing references", () => {
  assert.deepEqual(
    collectHousingReferenceIds([
      { propertyId: "18", metadata: null },
      { propertyId: "legacy-property", metadata: { property_housing_id: 18 } },
      { propertyId: "legacy-property", metadata: { housing_id: "24" } },
    ]),
    ["18", "24"],
  );
});
