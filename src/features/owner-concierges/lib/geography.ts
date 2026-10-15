export type SearchPoint = { latitude: number; longitude: number };

export function isSearchPoint(value: unknown): value is SearchPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as SearchPoint;
  return Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

export function distanceKm(a: SearchPoint, b: SearchPoint) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const lat = radians(b.latitude - a.latitude);
  const lon = radians(b.longitude - a.longitude);
  const h = Math.sin(lat / 2) ** 2 + Math.cos(radians(a.latitude)) *
    Math.cos(radians(b.latitude)) * Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function readSearchZones(raw: string | null): SearchPoint[] {
  try {
    const data = JSON.parse(raw || "{}");
    const zones = data.missionProfile?.availability?.zones ?? data.zones ?? [];
    if (!Array.isArray(zones)) return [];
    return zones.filter((zone) => zone && typeof zone === "object")
      .map((zone) => ({ latitude: zone.lat, longitude: zone.lng })).filter(isSearchPoint);
  } catch { return []; }
}

export function ownerSearchReturnPath(value: string | null | undefined) {
  const fallback = "/dashboard/owner/concierges";
  if (!value) return fallback;
  try {
    const url = new URL(value, "https://planetls.local");
    if (url.origin !== "https://planetls.local" || url.pathname !== fallback) return fallback;
    return `${fallback}${url.search}`;
  } catch { return fallback; }
}


export function groupProfilesAtCoordinates<T extends SearchPoint & { id: string }>(profiles: readonly T[]) {
  const groups = new Map<string, { key: string; latitude: number; longitude: number; profiles: T[] }>();
  for (const profile of profiles) {
    if (!isSearchPoint(profile)) continue;
    const key = profile.latitude + "," + profile.longitude;
    const group = groups.get(key) ?? { key, latitude: profile.latitude, longitude: profile.longitude, profiles: [] };
    group.profiles.push(profile);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function resolveSearchMapCenter(apiCenter: unknown, profiles: readonly SearchPoint[]): SearchPoint | null {
  if (isSearchPoint(apiCenter)) return apiCenter;
  return profiles.find(isSearchPoint) ?? null;
}

export function searchRadiusMeters(radiusKm: number): number {
  return Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm * 1000 : 20000;
}

export function publicConciergeReturnPath(value?: string | null, role?: string | null) {
  if (value) return ownerSearchReturnPath(value);
  return role === "owner" || role === "owner_pro" ? ownerSearchReturnPath(null) : "/map-list?filter=concierge";
}
