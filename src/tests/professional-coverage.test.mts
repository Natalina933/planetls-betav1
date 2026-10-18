import test from "node:test";
import assert from "node:assert/strict";
import { evaluateProfessionalCoverage, qualifyProfessionalCoverage } from "../app/api/search/professionals/coverage.ts";

const center = { latitude: 0, longitude: 0 };
const search = { center, radiusKm: 20 };
const zone = (km = 0) => ({ placeId: "nominatim:123", label: "Zone fictive", lat: 0, lng: km / 6371 * 180 / Math.PI });
const profile = (...zones: unknown[]) => ({ service_radius_km: 10, availability_hours: JSON.stringify({ zones }) });

test("zones déclarées : couverture, tangence et absence d'intersection", () => {
  for (const [km, state] of [[25, "covered"], [30, "covered"], [30.001, "outside"]] as const) {
    const result = evaluateProfessionalCoverage(profile(zone(km)), search);
    assert.equal(result.state, state);
    assert.equal(result.kind, "declared");
    assert.equal(result.marker, null);
  }
});

test("couverture indépendante de l'adresse et sans mutation", () => {
  const data = { ...profile(zone(0)), latitude: 45, longitude: 3 };
  const before = JSON.stringify(data);
  assert.deepEqual(evaluateProfessionalCoverage(data, search).marker, { latitude: 45, longitude: 3 });
  assert.equal(evaluateProfessionalCoverage(data, search).state, "covered");
  assert.equal(evaluateProfessionalCoverage({ ...profile(zone(100)), ...center }, search).state, "outside");
  assert.equal(JSON.stringify(data), before);
});

test("union de zones et conservation des déclarations incomplètes", () => {
  assert.equal(evaluateProfessionalCoverage(profile(zone(100), zone(25)), search).state, "covered");
  const partial = evaluateProfessionalCoverage(profile(zone(100), { label: "Inconnue" }), search);
  assert.equal(partial.state, "unknown");
  assert.equal(partial.kind, "partial");
  assert.equal(evaluateProfessionalCoverage(profile(null, zone()), search).state, "covered");
});

test("rayon manquant ou défaut de 30 km : jamais une couverture confirmée", () => {
  for (const radius of [undefined, null, 30, -1, Infinity]) {
    const result = evaluateProfessionalCoverage({ ...profile(zone()), service_radius_km: radius }, search);
    assert.equal(result.state, "unknown");
  }
  assert.equal(evaluateProfessionalCoverage({ ...profile(zone()), service_radius_km: 30 }, search).issues[0], "ambiguous_default_radius");
  // Forme d'inscription réelle : texte + rayon implicite, sans centre déclaré.
  assert.equal(evaluateProfessionalCoverage(profile({ label: "Ville fictive", radiusKm: 30 }), search).state, "unknown");
  assert.equal(evaluateProfessionalCoverage({ ...profile(zone()), service_radius_km: 0 }, search).state, "covered");
});

test("centre synthétique rejeté par sa provenance, pas par une liste de coordonnées interdites", () => {
  const paris = { ...zone(), lat: 48.8566, lng: 2.3522 };
  const aroundParis = { center: { latitude: paris.lat, longitude: paris.lng }, radiusKm: 20 };
  assert.equal(evaluateProfessionalCoverage(profile({ ...paris, placeId: "zone-0-Autre ville" }), aroundParis).state, "unknown");
  assert.equal(evaluateProfessionalCoverage(profile(paris), aroundParis).state, "covered");
  assert.equal(evaluateProfessionalCoverage(profile({ ...zone(), placeId: "" }), search).state, "unknown");
});

test("coordonnées invalides, rayon local non qualifié et JSON malformé", () => {
  for (const value of [null, { ...zone(), lat: 91 }, { ...zone(), lng: "0" }, { ...zone(), radiusKm: 10 }]) {
    assert.equal(evaluateProfessionalCoverage(profile(value), search).state, "unknown");
  }
  for (const raw of ["{broken", "null", "[]", '{"zones":{}}']) {
    assert.equal(qualifyProfessionalCoverage({ availability_hours: raw }).kind, "invalid_or_unknown");
  }
  assert.equal(evaluateProfessionalCoverage({ ...profile(zone()), latitude: 200, longitude: 0 }, search).marker, null);
});

test("sources imbriquées et racine concurrentes : aucune priorité implicite", () => {
  for (const nestedZones of [[], [zone()], [zone(100)]]) {
    const data = { ...profile(zone()), availability_hours: JSON.stringify({ zones: [zone()], missionProfile: { availability: { zones: nestedZones, radiusKm: 10 } } }) };
    assert.equal(evaluateProfessionalCoverage(data, search).state, "unknown");
  }
  assert.equal(evaluateProfessionalCoverage({ availability_hours: JSON.stringify({ missionProfile: { availability: { zones: [zone()] } } }), service_radius_km: 10 }, search).state, "unknown");
});

test("adresse ou localisation seule ne constitue jamais une couverture", () => {
  for (const data of [{ ...center }, { city: "Ville fictive" }, { location: "Ville fictive", service_radius_km: 10 }]) {
    const result = evaluateProfessionalCoverage(data, search);
    assert.equal(result.kind, "location_only");
    assert.equal(result.state, "unknown");
  }
  assert.equal(qualifyProfessionalCoverage({}).kind, "invalid_or_unknown");
});
