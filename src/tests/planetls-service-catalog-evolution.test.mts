import assert from "node:assert/strict";
import test from "node:test";

import {
  PLANETLS_SERVICE_FAMILIES,
  PLANETLS_SERVICE_TARGET,
} from "../app/lib/planetlsServiceCatalogTarget.ts";
import {
  GUEST_CHECKIN_CHECKOUT_BUNDLE,
  getGuestCheckinCheckoutDisplaySelections,
  getGuestCheckinCheckoutOperationalSlugs,
  getGuestCheckinCheckoutRequestMetadata,
  toggleGuestCheckinCheckoutSelection,
} from "../app/lib/guestCheckinCheckout.ts";
import { matchPlanetLSService } from "../app/lib/planetlsServiceMatching.ts";
import {
  resolvePlanetLSHistoricalAlias,
  resolvePlanetLSSelection,
} from "../app/lib/planetlsServiceSelection.ts";
import { resolveProviderCatalogValue } from "../app/dashboard/provider/_components/providerCatalogResolution.ts";

test("the central service catalog retains eight families and the existing family slug", () => {
  assert.equal(PLANETLS_SERVICE_FAMILIES.length, 8);
  assert.deepEqual(
    PLANETLS_SERVICE_FAMILIES.find((family) => family.slug === "photography_visual"),
    { slug: "photography_visual", label: "Photographie et décoration" },
  );
});

test("the four decoration services are canonical, unique, and in the photo family", () => {
  const expected = [
    ["interior_decoration_consulting", "Conseil en décoration intérieure"],
    ["home_staging", "Home staging"],
    ["space_planning_decoration", "Aménagement et décoration"],
    ["seasonal_decoration", "Décoration saisonnière"],
  ] as const;

  for (const [slug, label] of expected) {
    const bySlug = PLANETLS_SERVICE_TARGET.filter((entry) => entry.slug === slug);
    const byLabel = PLANETLS_SERVICE_TARGET.filter((entry) => entry.label === label);
    assert.equal(bySlug.length, 1);
    assert.equal(byLabel.length, 1);
    assert.equal(bySlug[0].family, "photography_visual");
    assert.equal(bySlug[0].kind, "service");
  }
});

test("new decoration services can be explicitly offered by professionals", () => {
  const decorationSlugs = [
    "interior_decoration_consulting",
    "home_staging",
    "space_planning_decoration",
    "seasonal_decoration",
  ];

  for (const slug of decorationSlugs) {
    const skill = resolveProviderCatalogValue(slug, "skill");
    assert.equal(skill.kind, "skill");
    if (skill.kind === "skill") {
      assert.equal(skill.service?.slug, slug);
      assert.equal(skill.verifiedQualification, false);
    }
  }
});

test("the old decoration label resolves only as a text alias, never as numeric ID 29", () => {
  const alias = resolvePlanetLSHistoricalAlias("Décoration intérieure");
  assert.equal(alias?.slug, "interior_decoration_consulting");
  assert.equal(
    PLANETLS_SERVICE_TARGET.filter(
      (entry) => entry.label === "Conseil en décoration intérieure",
    ).length,
    1,
  );
  assert.equal(resolvePlanetLSHistoricalAlias(29), null);
  assert.equal(resolvePlanetLSHistoricalAlias("29"), null);
  assert.equal(resolvePlanetLSSelection("Décoration intérieure"), null);

  const historicalProviderSkill = resolveProviderCatalogValue(
    "Décoration intérieure",
    "skill",
  );
  assert.equal(historicalProviderSkill.kind, "skill");
  if (historicalProviderSkill.kind === "skill") {
    assert.equal(historicalProviderSkill.service, undefined);
  }
});

test("the commercial check-in/check-out choice has one picker label and keeps operational slugs", () => {
  assert.equal(
    PLANETLS_SERVICE_TARGET.filter(
      (entry) => entry.slug === GUEST_CHECKIN_CHECKOUT_BUNDLE,
    ).length,
    1,
  );
  assert.equal(
    PLANETLS_SERVICE_TARGET.filter(
      (entry) => entry.label === "Check-in & Check-out",
    ).length,
    1,
  );
  assert.deepEqual(
    getGuestCheckinCheckoutDisplaySelections([
      "guest_checkin",
      "guest_checkout",
    ]),
    [GUEST_CHECKIN_CHECKOUT_BUNDLE],
  );
  assert.deepEqual(
    toggleGuestCheckinCheckoutSelection([
      "guest_checkin",
      "guest_checkout",
      "cleaning_turnover",
    ]),
    ["cleaning_turnover"],
  );
  assert.equal(
    matchPlanetLSService("guest_checkin", GUEST_CHECKIN_CHECKOUT_BUNDLE),
    "match",
  );
});

test("each commercial modality maps only to its corresponding operational services and metadata", () => {
  assert.deepEqual(
    getGuestCheckinCheckoutOperationalSlugs("arrival_departure"),
    ["guest_checkin", "guest_checkout"],
  );
  assert.deepEqual(
    getGuestCheckinCheckoutOperationalSlugs("arrival_only"),
    ["guest_checkin"],
  );
  assert.deepEqual(
    getGuestCheckinCheckoutOperationalSlugs("departure_only"),
    ["guest_checkout"],
  );
  assert.deepEqual(
    getGuestCheckinCheckoutRequestMetadata(["guest_checkin"]),
    { guest_checkin_checkout: "arrival_only" },
  );
});
