import { distanceKm, isSearchPoint, type SearchPoint } from "./geography.ts";

/** A radius must be explicit: a coordinate alone is not a service area. */
export type CoverageCircle = { center: SearchPoint; radiusKm: number };
export type CoverageState = "covered" | "not_covered" | "unknown";
export type CoverageResult = {
  state: CoverageState;
  reason: "intersection" | "disjoint" | "invalid_search" | "no_zones" | "incomplete_zones";
  intersectingZoneIndexes: number[];
  unknownZoneIndexes: number[];
};

export function isCoverageCircle(value: unknown): value is CoverageCircle {
  if (!value || typeof value !== "object") return false;
  const circle = value as CoverageCircle;
  return isSearchPoint(circle.center) &&
    typeof circle.radiusKm === "number" &&
    Number.isFinite(circle.radiusKm) && circle.radiusKm >= 0;
}

/**
 * Evaluate the union of declared circles, without geocoding or inferring radii.
 * Callers must establish the provenance of centers/radii before constructing circles.
 * Keep unresolved declarations in the array (e.g. null), rather than dropping them:
 * disjoint known zones plus an unresolved zone cannot prove absence of coverage.
 * An explicit zero radius is a point; a missing radius is unknown.
 * The 1e-9 km tolerance only compensates floating-point error at tangency.
 * No profile coordinate or marker is constructed or modified here.
 */
export function evaluateCircularCoverage(
  search: unknown,
  zones: readonly unknown[],
): CoverageResult {
  const intersectingZoneIndexes: number[] = [];
  const unknownZoneIndexes: number[] = [];
  const result = (state: CoverageState, reason: CoverageResult["reason"]): CoverageResult => ({
    state, reason, intersectingZoneIndexes, unknownZoneIndexes,
  });
  if (!isCoverageCircle(search)) return result("unknown", "invalid_search");
  if (!zones.length) return result("unknown", "no_zones");

  zones.forEach((zone, index) => {
    if (!isCoverageCircle(zone)) {
      unknownZoneIndexes.push(index);
      return;
    }
    if (distanceKm(search.center, zone.center) <= search.radiusKm + zone.radiusKm + 1e-9) {
      intersectingZoneIndexes.push(index);
    }
  });

  if (intersectingZoneIndexes.length) return result("covered", "intersection");
  if (unknownZoneIndexes.length) return result("unknown", "incomplete_zones");
  return result("not_covered", "disjoint");
}
