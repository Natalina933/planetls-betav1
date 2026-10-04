import test from "node:test";
import assert from "node:assert/strict";
import { distanceKm, isSearchPoint, readSearchZones, ownerSearchReturnPath } from "../features/owner-concierges/lib/geography.ts";
import { locateConcierges } from "../app/api/profiles/concierges/geographicSearch.ts";
import { GeocodingServiceError } from "../server/location/geocodeLocation.ts";

const vendome = { latitude: 47.792, longitude: 1.065 };
test("429 sur un profil : résultats persistés conservés et recherche partielle signalée", async () => {
  const base = { city: null, country: "France", availability_hours: null };
  const result = await locateConcierges([
    { ...base, id: "unknown", city: "Nice" },
    { ...base, id: "known", availability_hours: JSON.stringify({ zones: [{ lat: vendome.latitude, lng: vendome.longitude }] }) },
  ], vendome, 20, async () => { throw new GeocodingServiceError(); });
  assert.deepEqual(result.results.map((item) => item.id), ["known"]);
  assert.equal(result.unlocated, 1);
  assert.equal(result.geocodingDeferred, true);
});
test("filtrage effectif : zone proche, ville géocodée, doublons et profils sans coordonnées", async () => {
  const calls: string[] = [];
  const base = { city: null, country: "France", availability_hours: null };
  const result = await locateConcierges([
    { ...base, id: "local", availability_hours: JSON.stringify({ zones: [{ lat: vendome.latitude, lng: vendome.longitude }] }) },
    { ...base, id: "far", city: "Blois" },
    { ...base, id: "far2", city: "Blois" },
    { ...base, id: "unknown" },
  ], vendome, 20, async (query) => { calls.push(query); return { latitude: 47.586, longitude: 1.335 }; });
  assert.deepEqual(result.results.map((item) => item.id), ["local"]);
  assert.equal(result.unlocated, 1);
  assert.equal(calls.length, 1);
});
test("le rayon utilise une distance en km : proche inclus, Blois exclu à 20 km", () => {
  assert.equal(distanceKm(vendome, vendome), 0);
  assert.ok(distanceKm(vendome, { latitude: 47.84, longitude: 1.08 }) < 20);
  assert.ok(distanceKm(vendome, { latitude: 47.586, longitude: 1.335 }) > 20);
  assert.ok(distanceKm(vendome, { latitude: 47.586, longitude: 1.335 }) < 50);
});
test("zones persistées : coordonnées absentes et invalides exclues", () => {
  assert.deepEqual(readSearchZones(JSON.stringify({ zones: [null, { lat: 47.792, lng: 1.065 }, { lat: 999, lng: 0 }, { lat: "47", lng: 1 }] })), [vendome]);
  assert.deepEqual(readSearchZones("malformed"), []);
  assert.equal(isSearchPoint({ latitude: NaN, longitude: 1 }), false);
});
test("retour privé conserve accents, rayon et prestations sans accepter une redirection externe", () => {
  const path = "/dashboard/owner/concierges?city=Vend%C3%B4me&radiusKm=20&services=M%C3%A9nage";
  assert.equal(ownerSearchReturnPath(path), path);
  assert.equal(new URLSearchParams(path.split("?")[1]).get("city"), "Vendôme");
  for (const invalid of ["https://example.com/dashboard/owner/concierges", "//example.com", "/home#concierges-recommandes"]) {
    assert.equal(ownerSearchReturnPath(invalid), "/dashboard/owner/concierges");
  }
});
