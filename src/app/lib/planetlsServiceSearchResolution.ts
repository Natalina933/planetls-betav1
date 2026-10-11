import {
  PLANETLS_SERVICE_TARGET,
  type PlanetLSServiceTargetEntry,
} from "./planetlsServiceCatalogTarget.ts";
import { normalizeCatalogText } from "./serviceCatalog.ts";
import {
  normalizePlanetLSSelection,
  resolvePlanetLSSelection,
} from "./planetlsServiceSelection.ts";

export type PlanetLSRequestServiceResolution = {
  services: string[];
  unknownValues: string[];
  entries: PlanetLSServiceTargetEntry[];
};

function resolveSingleSearchValue(value: string): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const direct = resolvePlanetLSSelection(raw);
  if (direct) return direct.slug;

  const normalized = normalizeCatalogText(raw);
  if (!normalized) return null;

  // Une catégorie de recherche ne doit jamais sélectionner
  // automatiquement toutes les prestations de la famille.
  // Seule une prestation précise ou un groupe reconnu est transmis.
  const targetMatches = PLANETLS_SERVICE_TARGET.filter(
    (entry) =>
      normalizeCatalogText(entry.label) === normalized ||
      normalizeCatalogText(entry.slug) === normalized,
  );

  if (targetMatches.length === 1) return targetMatches[0].slug;
  return null;
}

export function resolvePlanetLSRequestServices(
  values: readonly string[] | null | undefined,
): PlanetLSRequestServiceResolution {
  const normalized = normalizePlanetLSSelection(values ?? []);
  const services: string[] = [];
  const unknownValues: string[] = [];

  normalized.forEach((value) => {
    const slug = resolveSingleSearchValue(value);
    if (slug) {
      if (!services.includes(slug)) services.push(slug);
      return;
    }
    unknownValues.push(value);
  });

  return {
    services,
    unknownValues,
    entries: services
      .map((slug) => resolvePlanetLSSelection(slug))
      .filter((entry): entry is PlanetLSServiceTargetEntry => entry !== null),
  };
}
