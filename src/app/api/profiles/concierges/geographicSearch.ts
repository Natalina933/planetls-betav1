import { geocodeLocation, isGeocodingServiceError } from "../../../../server/location/geocodeLocation.ts";
import { distanceKm, readSearchZones, type SearchPoint } from "../../../../features/owner-concierges/lib/geography.ts";

type LocatedProfile = { id: string; city: string | null; postal_code?: string | null; country: string | null; availability_hours: string | null };

export async function locateConcierges<T extends LocatedProfile>(profiles: T[], center: SearchPoint, radius: number,
  geocode: (query: string) => Promise<SearchPoint | null> = geocodeLocation) {
  const locations = new Map<string, SearchPoint | null>();
  const results: Array<T & SearchPoint> = [];
  let unlocated = 0;
  let geocodingDeferred = false;
  // Avoid concurrent geocoding calls and resolve each distinct city once per search.
  for (const profile of profiles) {
    let points = readSearchZones(profile.availability_hours);
    if (!points.length && profile.city) {
      const query = [profile.city, profile.postal_code, profile.country || "France"].filter(Boolean).join(", ");
      if (!locations.has(query)) {
        try { locations.set(query, await geocode(query)); }
        catch (error) {
          if (!isGeocodingServiceError(error)) throw error;
          geocodingDeferred = true;
          locations.set(query, null);
        }
      }
      const point = locations.get(query);
      if (point) points = [point];
    }
    if (!points.length) { unlocated += 1; continue; }
    const nearest = points.reduce((a, b) => distanceKm(center, a) <= distanceKm(center, b) ? a : b);
    if (distanceKm(center, nearest) <= radius) results.push({ ...profile, ...nearest });
  }
  return { results, unlocated, geocodingDeferred };
}
