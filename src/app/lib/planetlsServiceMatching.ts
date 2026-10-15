import { PLANETLS_SERVICE_TARGET } from "./planetlsServiceCatalogTarget.ts";
import { normalizeCatalogText } from "./serviceCatalog.ts";
import {
  resolvePlanetLSHistoricalAlias,
  resolvePlanetLSSelection,
} from "./planetlsServiceSelection.ts";
import {
  GUEST_CHECKIN_CHECKOUT_BUNDLE,
  getGuestCheckinCheckoutOperationalSlugs,
} from "./guestCheckinCheckout.ts";

export type PlanetLSServiceMatchResult = "match" | "review" | "no_match";

type ResolvedMatchValue =
  | { kind: "service"; slug: string }
  | { kind: "review" }
  | { kind: "unknown"; normalized: string };

const LEGACY_SERVICE_ALIASES = new Map<string, string>([
  ["menage", "cleaning_standard"],
  ["menage entre voyageurs", "cleaning_turnover"],
]);

function resolveMatchValue(
  value: string,
  allowHistoricalAliases = false,
): ResolvedMatchValue {
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

  if (allowHistoricalAliases) {
    const historicalAlias = resolvePlanetLSHistoricalAlias(raw);
    if (historicalAlias) {
      return { kind: "service", slug: historicalAlias.slug };
    }
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

export function resolvePlanetLSServiceSlug(value: string): string | null {
  const resolved = resolveMatchValue(value);
  return resolved.kind === "service" ? resolved.slug : null;
}

export function matchPlanetLSService(
  requestedService: string,
  offeredService: string,
): PlanetLSServiceMatchResult {
  const requested = resolveMatchValue(requestedService, true);
  const offered = resolveMatchValue(offeredService);

  if (requested.kind === "review" || offered.kind === "review") {
    return "review";
  }

  if (requested.kind === "service" && offered.kind === "service") {
    // Les groupes ne prouvent pas une compétence précise.
    const entry = PLANETLS_SERVICE_TARGET.find(
      (item) => item.slug === requested.slug,
    );
    const offeredEntry = PLANETLS_SERVICE_TARGET.find(
      (item) => item.slug === offered.slug,
    );

    if (
      !entry ||
      entry.kind === "group" ||
      offeredEntry?.kind === "group"
    ) {
      return "review";
    }

    if (requested.slug === GUEST_CHECKIN_CHECKOUT_BUNDLE) {
      return offered.slug === GUEST_CHECKIN_CHECKOUT_BUNDLE
        ? "match"
        : "review";
    }
    if (offered.slug === GUEST_CHECKIN_CHECKOUT_BUNDLE) {
      return getGuestCheckinCheckoutOperationalSlugs().includes(requested.slug)
        ? "match"
        : "no_match";
    }

    return requested.slug === offered.slug ? "match" : "no_match";
  }

  return "no_match";
}
