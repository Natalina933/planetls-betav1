import type { OwnerConciergeSearchFilters } from "./searchHelpers";
import type { ConciergeSearchRow, SortMode } from "./conciergeSearchTypes";

export const DEFAULT_CONCIERGE_AVATAR = "/icons/account-svgrepo-com.svg";

export function formatAmount(value: number | null, suffix: string) {
  if (typeof value !== "number") return "Non renseigne";
  return `${value.toFixed(0)} EUR ${suffix}`;
}

export function formatReviewDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getAvailabilityLabel(item: ConciergeSearchRow) {
  return item.is_available_now ? "Disponible maintenant" : "Disponibilite a confirmer";
}

export function getConciergeLocation(item: ConciergeSearchRow) {
  return item.location || item.service_area || item.city || "Zone non renseignee";
}

function compareNullableNumberDesc(left: number | null | undefined, right: number | null | undefined) {
  return (right ?? -1) - (left ?? -1);
}

function compareBooleanDesc(left: boolean | undefined, right: boolean | undefined) {
  return Number(right === true) - Number(left === true);
}

export function createConciergeComparator(sortMode: SortMode) {
  const priorityMap: Record<SortMode, Array<"rating" | "pro" | "available">> = {
    available: ["available", "rating", "pro"],
    rating: ["rating", "available", "pro"],
    pro: ["pro", "available", "rating"],
  };

  return (left: ConciergeSearchRow, right: ConciergeSearchRow) => {
    for (const criterion of priorityMap[sortMode]) {
      const delta =
        criterion === "rating"
          ? compareNullableNumberDesc(left.average_rating, right.average_rating)
          : criterion === "pro"
            ? compareBooleanDesc(left.is_pro, right.is_pro)
            : compareBooleanDesc(left.is_available_now, right.is_available_now);

      if (delta !== 0) return delta;
    }

    return left.display_name.localeCompare(right.display_name);
  };
}

export function mergeSortedOptions(...groups: string[][]) {
  return Array.from(new Set(groups.flat())).sort((left, right) => left.localeCompare(right));
}

export function getActiveSearchSummary(filters: OwnerConciergeSearchFilters) {
  return [
    filters.location.trim() ? `Zone: ${filters.location.trim()}` : null,
    filters.propertyType.trim() ? `Bien: ${filters.propertyType.trim()}` : null,
    filters.budgetMax.trim() ? `Budget max: ${filters.budgetMax.trim()} EUR/h` : null,
    filters.radiusKm.trim() ? `Rayon: ${filters.radiusKm.trim()} km` : null,
    filters.selectedServices.length > 0
      ? `Services: ${filters.selectedServices.slice(0, 3).join(", ")}${
          filters.selectedServices.length > 3 ? "..." : ""
        }`
      : null,
  ].filter((value): value is string => Boolean(value));
}

export function getPrimaryActionLabel(isSelected: boolean, isAvailableNow: boolean | undefined) {
  if (isSelected) return "Retirer de ma demande";
  return isAvailableNow ? "Selectionner ce concierge" : "Selectionner quand meme";
}

