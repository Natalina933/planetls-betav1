import assert from "node:assert/strict";
import test from "node:test";
import { matchPlanetLSService } from "../app/lib/planetlsServiceMatching.ts";

test("reconnaît un slug et son libellé", () => {
  assert.equal(matchPlanetLSService("guest_checkin", "Check-in"), "match");
});

test("deux slugs identiques correspondent à la même prestation", () => {
  assert.equal(
    matchPlanetLSService("cleaning_standard", "cleaning_standard"),
    "match",
  );
});

test("ne confond pas Check-in et Check-out", () => {
  assert.equal(
    matchPlanetLSService("guest_checkin", "guest_checkout"),
    "no_match",
  );
});

test("un libellé exact est résolu vers son slug", () => {
  assert.equal(
    matchPlanetLSService("Ménage du logement", "cleaning_standard"),
    "match",
  );
});

test("une famille générique ne prouve aucune compétence précise", () => {
  assert.notEqual(
    matchPlanetLSService("Travaux et rénovation", "painting_wall_coverings"),
    "match",
  );
  assert.equal(
    matchPlanetLSService("Travaux et rénovation", "painting_wall_coverings"),
    "no_match",
  );
});

test("un groupe reconnu reste à qualifier", () => {
  assert.equal(
    matchPlanetLSService("maintenance_minor_repairs", "plumbing_repair"),
    "review",
  );
  assert.equal(
    matchPlanetLSService("plumbing_repair", "maintenance_minor_repairs"),
    "review",
  );
});

test("une valeur inconnue n'est jamais approximée", () => {
  assert.equal(
    matchPlanetLSService(
      "guest_checkin",
      "guest_checkin_checkout_legacy_bundle",
    ),
    "no_match",
  );
});

test("reconnaît les nouvelles prestations", () => {
  assert.equal(
    matchPlanetLSService(
      "social_media_management",
      "Gestion des réseaux sociaux",
    ),
    "match",
  );
});

test("ne valide pas une prestation inconnue", () => {
  assert.equal(
    matchPlanetLSService("guest_checkin", "service_inconnu"),
    "no_match",
  );
});

test("photographie et réseaux sociaux ne correspondent pas", () => {
  assert.equal(
    matchPlanetLSService(
      "real_estate_photography",
      "social_media_management",
    ),
    "no_match",
  );
});

