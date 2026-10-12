import { PLANETLS_SERVICE_TARGET } from "./planetlsServiceCatalogTarget.ts";
import { normalizeCatalogText } from "./serviceCatalog.ts";
import { resolvePlanetLSSelection } from "./planetlsServiceSelection.ts";

export type PlanetLSServiceMatchResult = "match" | "review" | "no_match";

type ResolvedMatchValue =
  | { kind: "service"; slug: string }
  | { kind: "review" }
  | { kind: "unknown"; normalized: string };

const LEGACY_SERVICE_ALIASES = new Map<string, string>([
  ["menage", "cleaning_standard"],
  ["menage entre voyageurs", "cleaning_turnover"],
]);

function resolveMatchValue(value: string): ResolvedMatchValue {
  const raw = String(value ?? "").trim();
  const normalized = normalizeCatalogText(raw);

  if (!normalized) {
    return { kind: "unknown", normalized };
  }

  const legacySlug = LEGACY_SERVICE_ALIASES.get(normalized);
  if (legacySlug) {
    return { kind: "service", slug: legacySlug };
  }

  // PLANETLS_SERVICE_TARGET est la seule référence.
  // Un slug direct est prioritaire ; un libellé exact et unique
  // peut être résolu vers son slug pour les interfaces existantes.
  // Aucune approximation historique : une valeur inconnue reste inconnue.
  const direct = resolvePlanetLSSelection(raw);
  if (direct) {
    return { kind: "service", slug: direct.slug };
  }

  const targetMatches = PLANETLS_SERVICE_TARGET.filter(
    (entry) => normalizeCatalogText(entry.label) === normalized,
  );

  if (targetMatches.length === 1) {
    return {
      kind: "service",
      slug: targetMatches[0].slug,
    };
  }

  if (targetMatches.length > 1) {
    return { kind: "review" };
  }

  return { kind: "unknown", normalized };
}

export function matchPlanetLSService(
  requestedService: string,
  offeredService: string,
): PlanetLSServiceMatchResult {
  const requested = resolveMatchValue(requestedService);
  const offered = resolveMatchValue(offeredService);

  if (requested.kind === "review" || offered.kind === "review") {
    return "review";
  }

  if (requested.kind === "service" && offered.kind === "service") {
    // Les groupes ne prouvent pas une compétence précise.
    const entry = PLANETLS_SERVICE_TARGET.find(
      (item) => item.slug === requested.slug,
    );

    if (
      !entry ||
      entry.kind === "group" ||
      PLANETLS_SERVICE_TARGET.find((item) => item.slug === offered.slug)
        ?.kind === "group"
    ) {
      return "review";
    }

    return requested.slug === offered.slug ? "match" : "no_match";
  }

  return "no_match";
}
