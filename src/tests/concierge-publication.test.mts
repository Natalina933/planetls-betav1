import test from "node:test";
import assert from "node:assert/strict";
import { conciergePublication, conciergeRequestEligibility } from "../app/lib/conciergePublication.ts";
import { buildProfileZoneUpdate } from "../app/dashboard/concierge/profile/missionEditing.ts";
import { qualifyProfessionalCoverage } from "../app/api/search/professionals/coverage.ts";

const zone = { placeId: "nominatim:fixture", label: "Zone isolée", lat: 0, lng: 0 };
const profile = { role: "concierge", status: "active", first_name: "Élodie", last_name: "TEST",
  option: "cleaning_standard", service_radius_km: 30,
  availability_hours: JSON.stringify({ zones: [zone], radiusDeclaration: "explicit" }) };

test("publication automatique : identité, rôle réel, statut, catalogue et zone obligatoires", () => {
  assert.equal(conciergePublication(profile).eligible, true);
  for (const patch of [{ role: "provider" }, { status: "suspended" }, { status: "deleted" },
    { status: "pending" }, { first_name: "" }, { option: "" }, { option: "obsolete_service" },
    { availability_hours: null }, { service_radius_km: null }]) {
    assert.equal(conciergePublication({ ...profile, ...patch }).eligible, false, JSON.stringify(patch));
  }
  assert.equal(conciergePublication({ ...profile, status: null }).eligible, true);
  assert.equal(conciergePublication({ ...profile, role: "concierge_pro" }).eligible, true);
});

test("publication sur devis : aucun tarif, photographie ou description requis", () => {
  assert.equal(conciergePublication({ ...profile, company_name: "Entreprise test", first_name: null,
    last_name: null }).eligible, true);
  assert.deepEqual(conciergePublication({ ...profile, option: "Ménage du logement" }).services, ["Ménage du logement"]);
  assert.equal(conciergePublication({ ...profile, option: "Ménage" }).eligible, false);
  const edited = { ...profile, additional_info: "Nouvelle description", website: "", avatar_url: null,
    hourly_rate: null, monthly_rate: null };
  assert.deepEqual(conciergePublication(edited), conciergePublication(profile));
});

test("rayon 30 : historique ambigu exclu, nouvelle déclaration explicite qualifiée", () => {
  const previous = { ...profile, availability_hours: JSON.stringify({ zones: [zone], onboarding: { retained: true } }) };
  assert.equal(conciergePublication(previous).eligible, false);
  const update = (radiusExplicit?: boolean) => buildProfileZoneUpdate(previous,
    { zones: [zone], radiusKm: 30, radiusExplicit, rules: {} }, (raw) => JSON.parse(raw || "{}"));
  assert.equal(qualifyProfessionalCoverage(update()).zones.some(Boolean), false);
  const declared = update(true);
  assert.equal(qualifyProfessionalCoverage(declared).zones.some(Boolean), true);
  assert.deepEqual(JSON.parse(declared.availability_hours).onboarding, { retained: true });
});

test("demande : couverture réelle du lieu, adresse professionnelle indépendante", () => {
  const point = { center: { latitude: 0, longitude: 0 }, radiusKm: 0 };
  assert.equal(conciergeRequestEligibility({ ...profile, latitude: 45, longitude: 3 }, point).eligible, true);
  assert.equal(conciergeRequestEligibility(profile, { center: { latitude: 45, longitude: 3 }, radiusKm: 0 }).code,
    "CONCIERGE_OUTSIDE_ZONE");
  assert.equal(conciergeRequestEligibility({ ...profile, status: "suspended" }, point).code, "CONCIERGE_NOT_PUBLISHED");
});

test("les prestations actives du profil priment sur une ancienne sélection d'inscription", () => {
  const availability_hours = JSON.stringify({ zones: [zone], radiusDeclaration: "explicit",
    missionProfile: { missions: [{ label: "Ménage du logement", isActive: false }] } });
  assert.equal(conciergePublication({ ...profile, availability_hours }).eligible, false);
});
