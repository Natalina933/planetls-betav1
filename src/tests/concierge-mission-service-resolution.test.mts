import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_MISSION_CATALOG,
  buildDefaultMissionProfile,
  parseSeasonalPricing,
  resolveConciergePricingLineCatalog,
  resolveConciergePricingLinesCatalog,
  resolveConciergeMissionServiceValue,
  toMissionTypeId,
} from "../app/dashboard/concierge/profile/profileMissionPricing.ts";

test("concierge mission resolver preserves the historical check-in/check-out bundle", () => {
  const resolution = resolveConciergeMissionServiceValue("check-in-check-out");

  assert.equal(resolution.kind, "ambiguous");
  if (resolution.kind === "ambiguous") {
    assert.equal(resolution.candidates[0]?.slug, "guest_checkin_checkout_legacy_bundle");
    assert.match(resolution.reason, /ne pas scinder/i);
  }
});

test("concierge mission resolver keeps future check-in and check-out separate", () => {
  const checkin = resolveConciergeMissionServiceValue("guest_checkin");
  const checkout = resolveConciergeMissionServiceValue("guest_checkout");

  assert.equal(checkin.kind, "service");
  assert.equal(checkout.kind, "service");
  if (checkin.kind === "service" && checkout.kind === "service") {
    assert.equal(checkin.slug, "guest_checkin");
    assert.equal(checkout.slug, "guest_checkout");
    assert.notEqual(checkin.slug, checkout.slug);
  }
});

test("concierge mission resolver keeps broad concierge services as families", () => {
  const cleaning = resolveConciergeMissionServiceValue("Ménage");
  const maintenance = resolveConciergeMissionServiceValue("maintenance");
  const guestReception = resolveConciergeMissionServiceValue("accueil-voyageurs");

  assert.deepEqual(
    [cleaning.kind, maintenance.kind, guestReception.kind],
    ["family", "family", "family"],
  );

  if (cleaning.kind === "family") {
    assert.equal(cleaning.family, "Ménage");
    assert.match(cleaning.reason, /ne pas convertir/i);
  }
  if (maintenance.kind === "family") {
    assert.equal(maintenance.family, "Maintenance légère");
    assert.match(maintenance.reason, /réglementée/i);
  }
  if (guestReception.kind === "family") {
    assert.equal(guestReception.family, "Accueil voyageurs");
    assert.match(guestReception.reason, /check-in/i);
  }
});

test("concierge mission resolver keeps transversal and contextual values explicit", () => {
  const intendance = resolveConciergeMissionServiceValue("intendance");
  const nightEmergency = resolveConciergeMissionServiceValue("urgence-de-nuit");

  assert.equal(intendance.kind, "ambiguous");
  if (intendance.kind === "ambiguous") {
    assert.equal(intendance.candidates[0]?.slug, "legacy_intendance");
  }

  assert.equal(nightEmergency.kind, "context");
  if (nightEmergency.kind === "context") {
    assert.equal(nightEmergency.context, "night_emergency");
  }
});

test("concierge mission resolver distinguishes collaboration modes and unknown values", () => {
  const fullManagement = resolveConciergeMissionServiceValue("full_management");
  const unknown = resolveConciergeMissionServiceValue("service inventé");

  assert.equal(fullManagement.kind, "mode");
  if (fullManagement.kind === "mode") {
    assert.equal(fullManagement.mode, "full_management");
  }

  assert.deepEqual(unknown, { kind: "unknown", value: "service inventé" });
});

test("concierge mission catalog ids and seasonal prices remain unchanged", () => {
  assert.deepEqual(
    DEFAULT_MISSION_CATALOG.map((item) => item.id),
    [
      "check-in-check-out",
      "menage",
      "maintenance",
      "intendance",
      "accueil-voyageurs",
      "urgence-de-nuit",
    ],
  );
  assert.equal(toMissionTypeId("Check-in / Check-out"), "check-in-check-out");

  const defaultProfile = buildDefaultMissionProfile();
  assert.equal(defaultProfile.missions.length, DEFAULT_MISSION_CATALOG.length);
  assert.equal(defaultProfile.missions.every((mission) => mission.isActive === false), true);

  assert.deepEqual(parseSeasonalPricing(null), {
    checkInFee: 35,
    checkOutFee: 35,
    cleaningStudioFee: 55,
    cleaningTwoRoomsFee: 85,
    linenKitFee: 20,
    welcomePackFee: 25,
    urgentPercent: 30,
    nightPercent: 20,
    weekendPercent: 15,
    highSeasonPercent: 25,
    extraKmFee: 2,
    minimumInvoice: 35,
  });
});

test("concierge pricing resolver enriches exact service prices without changing pricing data", () => {
  const price = {
    id: "price-cleaning",
    service_id: 2,
    label: "Ménage entre voyageurs",
    type: "fixed",
    amount: 90,
    unit: "par prestation",
    currency: "EUR",
  };
  const before = structuredClone(price);

  const resolved = resolveConciergePricingLineCatalog(price);

  assert.equal(resolved.pricing, price);
  assert.deepEqual(price, before);
  assert.deepEqual(resolved.identifier, {
    serviceId: 2,
    value: "2",
    source: "service_id",
  });
  assert.equal(resolved.catalog.kind, "service");
  if (resolved.catalog.kind === "service") {
    assert.equal(resolved.catalog.slug, "cleaning_turnover");
  }
  assert.equal(resolved.pricing.amount, 90);
  assert.equal(resolved.pricing.unit, "par prestation");
  assert.equal(resolved.pricing.currency, "EUR");
});

test("concierge pricing resolver keeps general and ambiguous tariff references explicit", () => {
  const prices = [
    { service_id: 16, label: "Check-in / Check-out", amount: 75, unit: "par prestation" },
    { label: "Ménage", amount: 45, unit: "par heure" },
    { service_id: 73, label: "Intendance", amount: 12, unit: "%" },
    { service_id: 75, label: "Urgence de nuit", amount: 20, unit: "pourcentage" },
    { label: "Gestion complète", amount: 18, unit: "%" },
    { label: "Valeur inconnue", amount: 10, unit: "par prestation" },
  ];
  const before = structuredClone(prices);

  const resolved = resolveConciergePricingLinesCatalog(prices);

  assert.equal(resolved.length, prices.length);
  assert.deepEqual(
    resolved.map((item) => item.pricing),
    prices,
  );
  assert.deepEqual(prices, before);
  assert.deepEqual(
    resolved.map((item) => item.catalog.kind),
    ["ambiguous", "family", "ambiguous", "context", "mode", "unknown"],
  );

  const legacyBundle = resolved[0]?.catalog;
  assert.equal(legacyBundle?.kind, "ambiguous");
  if (legacyBundle?.kind === "ambiguous") {
    assert.equal(legacyBundle.candidates.length, 1);
    assert.equal(legacyBundle.candidates[0]?.slug, "guest_checkin_checkout_legacy_bundle");
  }

  const fullManagement = resolved[4]?.catalog;
  assert.equal(fullManagement?.kind, "mode");
  if (fullManagement?.kind === "mode") {
    assert.equal(fullManagement.mode, "full_management");
  }

  assert.deepEqual(
    resolved.map((item) => ({
      amount: item.pricing.amount,
      unit: item.pricing.unit,
    })),
    before.map((item) => ({
      amount: item.amount,
      unit: item.unit,
    })),
  );
});

test("concierge pricing resolver handles absent pricing lines without inventing data", () => {
  assert.deepEqual(resolveConciergePricingLinesCatalog(null), []);
  assert.deepEqual(resolveConciergePricingLinesCatalog(undefined), []);

  const missing = resolveConciergePricingLineCatalog({
    service_id: null,
    label: null,
    amount: null,
    unit: null,
    currency: null,
  });

  assert.deepEqual(missing.identifier, {
    serviceId: null,
    value: "",
    source: "none",
  });
  assert.deepEqual(missing.catalog, { kind: "unknown", value: "" });
});
