import { evaluateCircularCoverage, type CoverageCircle } from "../../../../features/owner-concierges/lib/geographicCoverage.ts";
import { isSearchPoint, type SearchPoint } from "../../../../features/owner-concierges/lib/geography.ts";

type CoverageProfile = {
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km?: number | null;
  availability_hours?: string | null;
  city?: string | null;
  location?: string | null;
  service_area?: string | null;
};
type ZoneIssue = "missing_radius" | "invalid_radius" | "ambiguous_default_radius" |
  "invalid_center" | "unverified_center" | "unsupported_zone_radius" |
  "invalid_payload" | "unqualified_nested_source";
export type QualifiedCoverage = {
  kind: "declared" | "partial" | "location_only" | "invalid_or_unknown";
  zones: Array<CoverageCircle | null>;
  issues: ZoneIssue[];
  marker: SearchPoint | null;
};

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;

/** Read persisted declarations only. Never reuse form defaults or geocode an address into coverage. */
export function qualifyProfessionalCoverage(profile: CoverageProfile): QualifiedCoverage {
  const marker = isSearchPoint(profile)
    ? { latitude: profile.latitude, longitude: profile.longitude } : null;
  const zones: QualifiedCoverage["zones"] = [];
  const issues: ZoneIssue[] = [];
  const finish = (): QualifiedCoverage => ({
    kind: zones.some(Boolean) ? (issues.length ? "partial" : "declared")
      : issues.length ? "partial" : marker || [profile.city, profile.location, profile.service_area]
        .some((value) => typeof value === "string" && value.trim()) ? "location_only" : "invalid_or_unknown",
    zones, issues, marker,
  });
  const unresolved = (issue: ZoneIssue) => { zones.push(null); issues.push(issue); };
  if (!profile.availability_hours) return finish();
  let payload: Record<string, unknown> | null;
  try { payload = record(JSON.parse(profile.availability_hours)); }
  catch { payload = null; }
  if (!payload) {
    unresolved("invalid_payload");
    return { ...finish(), kind: "invalid_or_unknown" };
  }

  const nested = record(record(payload.missionProfile)?.availability);
  // No verified writer associates the nested source with the profile's common radius.
  // Its presence also makes precedence over root declarations ambiguous, including [].
  if (nested && "zones" in nested && payload.zoneDeclaration !== "root_explicit") {
    unresolved("unqualified_nested_source");
    return finish();
  }
  if (payload.zones == null) return finish();
  if (!Array.isArray(payload.zones)) {
    unresolved("invalid_payload");
    return { ...finish(), kind: "invalid_or_unknown" };
  }
  for (const raw of payload.zones) {
    const zone = record(raw);
    const center = { latitude: zone?.lat, longitude: zone?.lng };
    if (!isSearchPoint(center)) { unresolved("invalid_center"); continue; }
    // Suggestions carry this source prefix. Synthetic form centers use zone-... IDs.
    if (typeof zone?.placeId !== "string" || !/^nominatim:.+/.test(zone.placeId) ||
      typeof zone.label !== "string" || !zone.label.trim()) {
      unresolved("unverified_center"); continue;
    }
    if ("radiusKm" in zone) { unresolved("unsupported_zone_radius"); continue; }
    const radiusKm = profile.service_radius_km;
    if (radiusKm == null) { unresolved("missing_radius"); continue; }
    if (!Number.isFinite(radiusKm) || typeof radiusKm !== "number" || radiusKm < 0) {
      unresolved("invalid_radius"); continue;
    }
    // The persisted schema cannot distinguish an explicit 30 from the form's default 30.
    if (radiusKm === 30 && payload.radiusDeclaration !== "explicit") {
      unresolved("ambiguous_default_radius"); continue;
    }
    zones.push({ center, radiusKm });
  }
  return finish();
}

export function evaluateProfessionalCoverage(profile: CoverageProfile, search: CoverageCircle) {
  const qualified = qualifyProfessionalCoverage(profile);
  const result = evaluateCircularCoverage(search, qualified.zones);
  const state = result.state === "not_covered" ? "outside" : result.state;
  return { ...qualified, state, calculation: result };
}
