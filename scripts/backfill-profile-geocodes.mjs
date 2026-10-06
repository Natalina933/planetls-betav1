import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { geocodeLocation, isGeocodingServiceError } from "../src/server/location/geocodeLocation.ts";

const APPLY = process.argv.includes("--apply");

const VALID_CITIES = new Map([
  ["antibes", "Antibes"],
  ["bordeaux", "Bordeaux"],
  ["cannes", "Cannes"],
  ["le barcares", "Le Barcarès"],
  ["lille", "Lille"],
  ["lyon", "Lyon"],
  ["marseille", "Marseille"],
  ["montpellier", "Montpellier"],
  ["nantes", "Nantes"],
  ["nice", "Nice"],
  ["paris", "Paris"],
  ["toulouse", "Toulouse"],
  ["vendome", "Vendôme"],
]);

function normalizeCity(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function canonicalCity(value) {
  return VALID_CITIES.get(normalizeCity(value)) ?? null;
}

function validCoordinate(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.");
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const { data: profiles, error } = await db
  .from("profiles")
  .select("id, role, city, country, latitude, longitude, geocoded_at")
  .not("city", "is", null)
  .or("latitude.is.null,longitude.is.null");

if (error) {
  throw error;
}

const stats = {
  analyzed: 0,
  geocoded: 0,
  alreadyGeocoded: 0,
  ignored: 0,
  failures: 0,
};
const failures = [];

for (const profile of profiles ?? []) {
  stats.analyzed += 1;

  if (
    validCoordinate(profile.latitude, -90, 90) &&
    validCoordinate(profile.longitude, -180, 180)
  ) {
    stats.alreadyGeocoded += 1;
    continue;
  }

  const city = canonicalCity(profile.city);
  if (!city) {
    stats.ignored += 1;
    continue;
  }

  try {
    const result = await geocodeLocation(`${city}, ${profile.country || "France"}`);
    if (
      !result ||
      !validCoordinate(result.latitude, -90, 90) ||
      !validCoordinate(result.longitude, -180, 180)
    ) {
      stats.failures += 1;
      failures.push({ id: profile.id, city, reason: "coordonnees invalides ou introuvables" });
      continue;
    }

    if (APPLY) {
      const { error: updateError } = await db
        .from("profiles")
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
          geocoded_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) {
        stats.failures += 1;
        failures.push({ id: profile.id, city, reason: updateError.message });
        continue;
      }
    }

    stats.geocoded += 1;
  } catch (error) {
    stats.failures += 1;
    failures.push({
      id: profile.id,
      city,
      reason: isGeocodingServiceError(error) ? error.message : String(error),
    });
  }
}

console.log(`Mode : ${APPLY ? "apply" : "dry-run"}`);
console.log(`Profils analysés : ${stats.analyzed}`);
console.log(`Profils géocodés : ${stats.geocoded}`);
console.log(`Profils déjà géocodés : ${stats.alreadyGeocoded}`);
console.log(`Profils ignorés : ${stats.ignored}`);
console.log(`Échecs : ${stats.failures}`);
if (failures.length > 0) {
  console.log(JSON.stringify(failures, null, 2));
}
