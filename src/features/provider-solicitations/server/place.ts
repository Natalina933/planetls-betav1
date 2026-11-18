import "server-only";
import { z } from "zod";
import type { VerifiedPlace } from "../contracts.ts";

export type PlaceInput = { address: string; city: string; postal_code?: string; country_code?: string };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]/g, "");
const candidate = z.object({
  place_id: z.union([z.number().int().positive(), z.string().regex(/^[1-9][0-9]*$/)]),
  lat: z.string().regex(/^-?\d+(?:\.\d+)?$/), lon: z.string().regex(/^-?\d+(?:\.\d+)?$/),
  address: z.object({ house_number: z.string(), road: z.string(), postcode: z.string(), country_code: z.string(),
    city: z.string().optional(), town: z.string().optional(), village: z.string().optional(), municipality: z.string().optional(),
  }),
});
export function hasPreciseAddress(input: PlaceInput): boolean {
  return /^\d+[a-z]?(?:\s+(?:bis|ter))?\s+\S.{2,}$/i.test(input.address.trim()) && input.city.trim().length > 1;
}
/** Require a unique matching building, never a municipality/street centroid. */
export function qualifyPlace(raw: unknown, input: PlaceInput, now = new Date()): VerifiedPlace | null {
  const address = /^(\d+[a-z]?(?:\s+(?:bis|ter))?)\s+(.+)$/i.exec(input.address.trim());
  if (!address || !Array.isArray(raw)) return null;
  const matches = raw.flatMap((item) => {
    const parsed = candidate.safeParse(item);
    if (!parsed.success) return [];
    const point = parsed.data; const a = point.address;
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? "";
    const latitude = Number(point.lat), longitude = Number(point.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180
      || normalize(a.house_number) !== normalize(address[1]) || normalize(a.road) !== normalize(address[2])
      || normalize(city) !== normalize(input.city) || !a.postcode.trim() || !/^[a-z]{2}$/i.test(a.country_code)
      || (input.postal_code && normalize(a.postcode) !== normalize(input.postal_code))
      || (input.country_code && a.country_code.toUpperCase() !== input.country_code)) return [];
    return [{ latitude, longitude, city, postal_code: a.postcode, country_code: a.country_code.toUpperCase(),
      location_label: `${a.house_number} ${a.road}, ${a.postcode} ${city}`,
      geocoded_at: now.toISOString(), geocoding_source: `nominatim:${point.place_id}` }];
  });
  // Ambiguity is refused, including repeated candidates: do not guess.
  return matches.length === 1 ? matches[0] : null;
}

let pending = 0;
let nextAt = 0;
let queue: Promise<unknown> = Promise.resolve();
/** Separate precise-address contract; no change to the existing search geocoder. */
export async function geocodeSolicitationPlace(input: PlaceInput): Promise<VerifiedPlace | null> {
  if (!hasPreciseAddress(input)) return null;
  if (pending >= 4) throw new Error("Geocoder busy");
  pending++;
  const job = queue.then(async () => {
    const delay = Math.max(0, nextAt - Date.now());
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    nextAt = Date.now() + 1100;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2"); url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "2");
    url.searchParams.set("q", [input.address, input.postal_code, input.city, input.country_code].filter(Boolean).join(", "));
    const response = await fetch(url, { headers: { "User-Agent": "planetls-geocode", "Accept-Language": "fr" },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Geocoder unavailable");
    return qualifyPlace(await response.json(), input);
  });
  queue = job.catch(() => undefined);
  try { return await job; } finally { pending--; }
}
