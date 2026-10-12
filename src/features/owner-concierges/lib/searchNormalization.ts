const LEGACY_CATEGORY_ALIASES = new Map([
  ["accueil", "Accueil voyageurs"],
]);

export function normalizeSearchLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizeConciergeCategory(value: string) {
  const trimmed = value.trim();
  return LEGACY_CATEGORY_ALIASES.get(normalizeSearchLabel(trimmed)) ?? trimmed;
}

export function normalizeConciergeCategories(values: string[]) {
  return Array.from(
    new Set(values.map(normalizeConciergeCategory).filter(Boolean)),
  );
}
