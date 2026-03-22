import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEditableLogement,
  buildLogementPatchPayload,
  formatMoney,
  hasPendingLogementChanges,
  parseHousingRow,
  toOptionalNumber,
  validateLogementChanges,
} from "../app/dashboard/concierge/logements/[id]/logementHelpers.ts";

type HousingRowInput = Parameters<typeof parseHousingRow>[0];

test("formatMoney formats numbers and fallback values", () => {
  assert.equal(formatMoney(120), "120 EUR");
  assert.equal(formatMoney(undefined), "-");
});

test("parseHousingRow normalizes the upgraded housing model from legacy JSON", () => {
  const parsed = parseHousingRow({
    id: 1,
    created_at: null,
    updated_at: null,
    external_id: null,
    nom_logement: "Appartement test",
    ville: "Paris",
    adresse: "1 rue de Paris",
    plateforme: "Airbnb",
    statut: "draft",
    photo_principale: null,
    infos: { property_type: "Appartement", surface_sqm: 45 },
    proprietaire: { owner_profile_id: "owner-1", manager_profile_id: "manager-1", full_name: "Alice" },
    location: { postal_code: "75001", city: "Paris" },
    menage: { services: [{ label: "Menage", status: "active" }] },
    planning: [{ title: "Check-in", date: "2026-02-28" }],
    documents: [{ name: "Guide maison", type: "guide" }],
    notes: ["Note 1"],
    tarifs: { total_contract_value: 1200 },
    contrat: { quote_id: "quote-1" },
  } as HousingRowInput);

  assert.equal(parsed.owner.fullName, "Alice");
  assert.equal(parsed.characteristics.surfaceSqm, 45);
  assert.equal(parsed.services.items[0]?.label, "Menage");
  assert.equal(parsed.contractInfo.quoteId, "quote-1");
});

test("buildEditableLogement merges nested edition values over source logement", () => {
  const logement = parseHousingRow({
    id: 1,
    created_at: null,
    updated_at: null,
    external_id: null,
    nom_logement: "Appartement test",
    ville: "Paris",
    adresse: "1 rue de Paris",
    plateforme: "Airbnb",
    statut: "draft",
    photo_principale: null,
    infos: { property_type: "Appartement", surface_sqm: 45, bedroom_count: 1 },
    proprietaire: { full_name: "Alice", email: "alice@email.com" },
    location: { city: "Paris" },
    menage: { services: [{ id: "1", label: "Menage" }] },
    planning: [],
    documents: [],
    notes: [],
    tarifs: { total_contract_value: 900 },
    contrat: {},
  } as HousingRowInput);

  const editable = buildEditableLogement(logement, {
    owner: { ...logement.owner, fullName: "Alice Martin" },
    locationInfo: { ...logement.locationInfo, city: "Bordeaux" },
  });

  assert.equal(editable?.owner.fullName, "Alice Martin");
  assert.equal(editable?.locationInfo.city, "Bordeaux");
  assert.equal(editable?.characteristics.propertyType, "Appartement");
});

test("hasPendingLogementChanges detects direct and nested edits", () => {
  assert.equal(hasPendingLogementChanges({}), false);
  assert.equal(hasPendingLogementChanges({ ville: "Bordeaux" }), true);
  assert.equal(hasPendingLogementChanges({ owner: { fullName: "Alice" } as never }), true);
});

test("validateLogementChanges rejects missing required fields", () => {
  const logement = parseHousingRow({
    id: 1,
    created_at: null,
    updated_at: null,
    external_id: null,
    nom_logement: " ",
    ville: "Paris",
    adresse: "1 rue de Paris",
    plateforme: "Airbnb",
    statut: "draft",
    photo_principale: null,
    infos: null,
    proprietaire: null,
    location: null,
    menage: null,
    planning: [],
    documents: [],
    notes: [],
    tarifs: null,
    contrat: null,
  } as HousingRowInput);

  assert.equal(validateLogementChanges(logement).isValid, false);
  assert.equal(validateLogementChanges(logement).message, "Le nom du logement est obligatoire.");
});

test("buildLogementPatchPayload keeps legacy patch keys", () => {
  const payload = buildLogementPatchPayload({
    nom_logement: "  Maison test  " as never,
    ville: "  Lyon " as never,
    owner: {
      profileId: "owner-1",
      managerProfileId: "manager-1",
      fullName: "Jean Dupont",
      email: "jean@email.com",
      phone: "",
      companyName: "",
      city: "Lyon",
      notes: "",
      source: "manual",
    } as never,
  });

  assert.equal(payload.nom_logement, "Maison test");
  assert.equal(payload.ville, "Lyon");
  assert.equal((payload.proprietaire as Record<string, unknown>).owner_profile_id, "owner-1");
});

test("toOptionalNumber normalizes optional numeric input", () => {
  assert.equal(toOptionalNumber(""), undefined);
  assert.equal(toOptionalNumber("120"), 120);
  assert.equal(toOptionalNumber("abc"), undefined);
});
