import { PLANETLS_SERVICE_TARGET } from "./planetlsServiceCatalogTarget.ts";
import { normalizeCatalogText } from "./serviceCatalog.ts";

const serviceBySlug = new Map(
  PLANETLS_SERVICE_TARGET.map((entry) => [entry.slug, entry]),
);

export function resolvePlanetLSSelection(value: string) {
  return serviceBySlug.get(String(value ?? "").trim()) ?? null;
}

export function resolvePlanetLSHistoricalAlias(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = normalizeCatalogText(value);
  if (!normalized) return null;
  return (
    PLANETLS_SERVICE_TARGET.find((entry) =>
      entry.historicalAliases?.some(
        (alias) => normalizeCatalogText(alias) === normalized,
      ),
    ) ?? null
  );
}

export function normalizePlanetLSSelection(values: readonly string[]) {
  return [
    ...new Set(
      values.map((value) => String(value ?? "").trim()).filter(Boolean),
    ),
  ];
}

export function validatePlanetLSSelection(values: readonly string[]) {
  const normalized = normalizePlanetLSSelection(values);

  return {
    services: normalized,
    unknownSlugs: normalized.filter((slug) => !serviceBySlug.has(slug)),
    empty: normalized.length === 0,
  };
}
