import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLogementPatchPayload,
  buildEditableLogement,
  formatMoney,
  hasPendingLogementChanges,
  parseHousingRow,
  toOptionalNumber,
  validateLogementChanges,
} from "../app/dashboard/concierge/logements/[id]/logementHelpers.ts";

test("formatMoney formats numbers and fallback values", () => {
  assert.equal(formatMoney(120), "120 EUR");
  assert.equal(formatMoney(undefined), "-");
  assert.equal(formatMoney(null), "-");
});

test("parseHousingRow converts json fields into typed logement payload", () => {
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
    infos: { categorie: "Appartement" },
    proprietaire: { nom: "Alice" },
    location: { prix_nuit: 120 },
    menage: { temps: "2h" },
    planning: [{ date: "2026-02-28", type: "booking" }],
    documents: [{ name: "Guide maison" }],
    notes: ["Note 1"],
    tarifs: { prix_base: 90 },
    contrat: { renouvellement_auto: true },
  } as any);

  assert.equal(parsed.nom_logement, "Appartement test");
  assert.equal(parsed.menage?.temps, "2h");
  assert.equal(parsed.documents?.[0]?.name, "Guide maison");
  assert.equal(parsed.tarifs?.prix_base, 90);
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
    infos: { categorie: "Appartement", capacite: 4, nb_chambres: 1, equipements: ["Wifi"] },
    proprietaire: null,
    location: null,
    menage: { temps: "2h", checklist: "A" },
    planning: [],
    documents: [],
    notes: ["Note 1"],
    tarifs: { prix_base: 90, caution: 300 },
    contrat: { renouvellement_auto: false },
  } as any);

  const editable = buildEditableLogement(logement, {
    ville: "Bordeaux",
    infos: { capacite: 6, equipements: ["Wifi", "Parking"], description: "Maison familiale" },
    menage: { instructions: "Verifier le linge" },
    tarifs: { caution: 500 },
    contrat: { renouvellement_auto: true },
  });

  assert.equal(editable?.ville, "Bordeaux");
  assert.equal(editable?.infos?.categorie, "Appartement");
  assert.equal(editable?.infos?.capacite, 6);
  assert.deepEqual(editable?.infos?.equipements, ["Wifi", "Parking"]);
  assert.equal(editable?.infos?.description, "Maison familiale");
  assert.equal(editable?.menage?.temps, "2h");
  assert.equal(editable?.menage?.instructions, "Verifier le linge");
  assert.equal(editable?.tarifs?.prix_base, 90);
  assert.equal(editable?.tarifs?.caution, 500);
  assert.equal(editable?.contrat?.renouvellement_auto, true);
});

test("hasPendingLogementChanges detects direct and nested edits", () => {
  assert.equal(hasPendingLogementChanges({}), false);
  assert.equal(hasPendingLogementChanges({ ville: "Bordeaux" }), true);
  assert.equal(hasPendingLogementChanges({ menage: {} }), false);
  assert.equal(hasPendingLogementChanges({ menage: { temps: "2h" } } as any), true);
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
  } as any);

  assert.equal(validateLogementChanges(logement).isValid, false);
  assert.equal(validateLogementChanges(logement).message, "Le nom du logement est obligatoire.");
});

test("buildLogementPatchPayload trims top-level editable text fields", () => {
  const payload = buildLogementPatchPayload({
    nom_logement: "  Maison test  ",
    ville: "  Lyon ",
    adresse: " 1 rue Victor Hugo ",
    plateforme: " Airbnb ",
    notes: ["Note 1"],
  });

  assert.equal(payload.nom_logement, "Maison test");
  assert.equal(payload.ville, "Lyon");
  assert.equal(payload.adresse, "1 rue Victor Hugo");
  assert.equal(payload.plateforme, "Airbnb");
  assert.deepEqual(payload.notes, ["Note 1"]);
});

test("validateLogementChanges rejects invalid media urls and negative amounts", () => {
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
    photo_principale: "ftp://photo.png",
    infos: null,
    proprietaire: null,
    location: null,
    menage: null,
    planning: [],
    documents: [],
    notes: [],
    tarifs: { prix_base: -10 },
    contrat: { fichier_pdf: "/contrat.pdf" },
  } as any);

  assert.equal(validateLogementChanges(logement).isValid, false);
  assert.equal(
    validateLogementChanges(logement).message,
    "La photo principale doit etre une URL valide ou un chemin local commencant par '/'.",
  );
});

test("validateLogementChanges rejects invalid capacity values", () => {
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
    photo_principale: "/images/default-logement.png",
    infos: { capacite: 0 },
    proprietaire: null,
    location: null,
    menage: null,
    planning: [],
    documents: [],
    notes: [],
    tarifs: null,
    contrat: null,
  } as any);

  assert.equal(validateLogementChanges(logement).isValid, false);
  assert.equal(
    validateLogementChanges(logement).message,
    "La capacité du logement doit être un nombre positif.",
  );
});

test("toOptionalNumber normalizes optional numeric input", () => {
  assert.equal(toOptionalNumber(""), undefined);
  assert.equal(toOptionalNumber("  "), undefined);
  assert.equal(toOptionalNumber("120"), 120);
  assert.equal(toOptionalNumber("abc"), undefined);
});
