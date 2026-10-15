import { buildOwnerConciergeSearchParams, type OwnerConciergeSearchFilters } from "../../../app/dashboard/owner/concierges/searchHelpers.ts";
import { ownerSearchReturnPath } from "./geography.ts";

export function readSelectedConcierges(params: URLSearchParams): string[] {
  return [...new Set((params.get("selectedConciergeIds") ?? "").split(",").filter((id) => /^[a-zA-Z0-9_-]{1,100}$/.test(id)))];
}

export function buildOwnerSearchReturnTo(filters: OwnerConciergeSearchFilters, selectedIds: readonly string[], currentQuery = "") {
  const params = new URLSearchParams(currentQuery);
  const active = buildOwnerConciergeSearchParams(filters);
  params.delete("postalCode");
  params.delete("service");
  for (const key of ["region", "city", "categories", "serviceFamilies", "services", "propertyType", "budgetMax", "radiusKm", "proOnly"]) {
    // Explicit empty values prevent profile preferences from reactivating cleared filters.
    params.set(key, active.get(key) ?? (key === "proOnly" ? "0" : ""));
  }
  if (active.has("geographic")) params.set("geographic", active.get("geographic")!);
  else params.delete("geographic");
  params.set("selectedConciergeIds", selectedIds.join(","));
  return "/dashboard/owner/concierges?" + params.toString();
}

export function conciergeProfileHref(id: string, returnTo?: string) {
  const path = "/concierges/" + encodeURIComponent(id);
  return returnTo ? path + "?" + new URLSearchParams({ returnTo: ownerSearchReturnPath(returnTo) }).toString() : path;
}

export function restoreSelectedConcierges(params: URLSearchParams, results: readonly { id: string }[]) {
  const available = new Set(results.map((profile) => profile.id));
  return readSelectedConcierges(params).filter((id) => available.has(id));
}
