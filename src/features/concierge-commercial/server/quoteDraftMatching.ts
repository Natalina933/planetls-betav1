import {
  resolveRequestedServicesCatalog,
  type RequestedServiceCatalogResolution,
} from "../../../app/api/_shared/requestedServicesCatalog.ts";

// Logique pure de correspondance et de tarification des devis.
// Ce module ne dépend d'aucun accès base de données : il est donc
// testable en isolation (node --experimental-strip-types --test).
// L'assemblage final (préchargement des tarifs du professionnel) reste
// dans quoteDraftFromRequest.ts, qui importe et ré-exporte ce module.

export type ServiceCatalogRow = {
  id: number;
  category: string | null;
  service: string | null;
  description: string | null;
};

export type PricingRow = {
  id: string;
  service_id: number | null;
  label: string | null;
  type: string | null;
  amount: number | null;
  unit: string | null;
};

export type PackageRow = {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  services_package_items?: Array<{ service_id: string | number }>;
};

export type QuoteDraftMatchDiagnosticKind =
  | "exact"
  | "family_only"
  | "ambiguous"
  | "mode_only"
  | "context_only"
  | "unknown";

export type QuoteDraftMatchDiagnostic = {
  originalValue: string;
  index: number;
  catalogResolution: RequestedServiceCatalogResolution;
  historicalServiceIds: number[];
  historicalServiceSlugs: string[];
  historicalMatchType: "none" | "textual";
  diagnostic: QuoteDraftMatchDiagnosticKind;
  confidence: "certain" | "needs_validation" | "none";
  reason: string;
};

export type QuoteDraftServiceClarification = {
  originalValue: string;
  index: number;
  diagnostic: QuoteDraftMatchDiagnosticKind;
  confidence: QuoteDraftMatchDiagnostic["confidence"];
  isPrecise: boolean;
  needsClarification: boolean;
  clarificationReason: string | null;
  exactTariffAvailable: boolean;
  explicitPriceRequired: boolean;
  canonicalSlug: string | null;
  historicalServiceIds: number[];
};

export const round2 = (value: number) => Math.round(value * 100) / 100;

export const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const getDefaultQuantity = (pricing: PricingRow) => {
  const unit = normalizeText(pricing.unit ?? "");
  const type = normalizeText(pricing.type ?? "");
  if (unit.includes("heure") || unit === "h" || type === "hourly") return 2;
  return 1;
};

const buildRequestedServiceSet = (requestedServices: string[]) =>
  new Set(requestedServices.map((value) => normalizeText(value)).filter(Boolean));

const getServiceSearchHaystack = (service: ServiceCatalogRow) =>
  normalizeText(
    [service.category ?? "", service.service ?? "", service.description ?? ""].join(" "),
  );

export const findMatchedServiceIds = (
  requestedServices: string[],
  servicesCatalog: ServiceCatalogRow[],
) => {
  const requestedSet = buildRequestedServiceSet(requestedServices);
  if (requestedSet.size === 0) return [];

  return servicesCatalog
    .filter((service) => {
      const haystack = getServiceSearchHaystack(service);
      return Array.from(requestedSet).some(
        (requestedValue) =>
          haystack.includes(requestedValue) || requestedValue.includes(normalizeText(service.service ?? "")),
      );
    })
    .map((service) => service.id);
};

export const findMatchedServicesForSingleRequest = (
  requestedService: string,
  servicesCatalog: ServiceCatalogRow[],
) => {
  const normalizedRequest = normalizeText(requestedService);
  if (!normalizedRequest) return [];

  return servicesCatalog.filter((service) => {
    const normalizedService = normalizeText(service.service ?? "");
    const haystack = getServiceSearchHaystack(service);
    return haystack.includes(normalizedRequest) || normalizedRequest.includes(normalizedService);
  });
};


const classifyQuoteDraftMatch = (
  resolution: RequestedServiceCatalogResolution,
  historicalMatches: ServiceCatalogRow[],
): Pick<QuoteDraftMatchDiagnostic, "diagnostic" | "confidence" | "reason"> => {
  if (resolution.kind === "service") {
    // L'identité de la prestation est le slug cible ; le prix reste
    // déterminé par les tarifs historiques du professionnel.
    const hasMatchingHistoricalId = historicalMatches.some(
      (service) => normalizeText(service.service ?? "") === normalizeText(resolution.service.label),
    );
    return {
      diagnostic: "exact",
      confidence: hasMatchingHistoricalId ? "certain" : "needs_validation",
      reason: hasMatchingHistoricalId
        ? "Prestation précise du catalogue cible, avec correspondance historique."
        : "Prestation précise du catalogue cible, sans correspondance historique directe.",
    };
  }

  if (resolution.kind === "group") {
    return {
      diagnostic: "family_only",
      confidence: "needs_validation",
      reason: "Groupe à qualifier : devis personnalisé requis, sans sélection automatique.",
    };
  }

  if (resolution.kind === "family") {
    return {
      diagnostic: "family_only",
      confidence: "needs_validation",
      reason: "Famille générale : le matching historique peut sélectionner une prestation plus précise.",
    };
  }

  if (resolution.kind === "mode") {
    return {
      diagnostic: "mode_only",
      confidence: "needs_validation",
      reason: "Mode de collaboration : ne correspond pas à une prestation unitaire.",
    };
  }

  if (resolution.kind === "context") {
    return {
      diagnostic: "context_only",
      confidence: "needs_validation",
      reason: "Contexte d'intervention : ne correspond pas à une prestation facturable précise.",
    };
  }

  if (resolution.kind === "ambiguous") {
    return {
      diagnostic: "ambiguous",
      confidence: "needs_validation",
      reason: resolution.reason,
    };
  }

  return {
    diagnostic: "unknown",
    confidence: "none",
    reason: "Aucune correspondance fiable dans le référentiel commun.",
  };
};

// Identité vs tarif :
// - l'identité d'une prestation reconnue est son slug cible ;
// - le tarif provient des lignes réellement renseignées par le professionnel,
//   historiquement stockées sous un libellé textuel dans `services_catalog`.
// On rapproche donc le slug de son libellé cible pour retrouver le tarif,
// sans jamais transformer un slug inconnu en une autre prestation.
const getHistoricalMatchValue = (resolution: RequestedServiceCatalogResolution): string => {
  if (resolution.kind === "service" || resolution.kind === "group") {
    return resolution.service.label;
  }
  return resolution.originalValue;
};

export function diagnoseQuoteDraftServiceMatches(
  requestedServices: readonly string[],
  servicesCatalog: ServiceCatalogRow[],
): QuoteDraftMatchDiagnostic[] {
  const catalogResolutions = resolveRequestedServicesCatalog(requestedServices);

  return catalogResolutions.map((resolution) => {
    const historicalMatches = findMatchedServicesForSingleRequest(
      getHistoricalMatchValue(resolution),
      servicesCatalog,
    );
    const classification = classifyQuoteDraftMatch(resolution, historicalMatches);

    return {
      originalValue: resolution.originalValue,
      index: resolution.index,
      catalogResolution: resolution,
      historicalServiceIds: historicalMatches.map((service) => service.id),
      historicalServiceSlugs:
        resolution.kind === "service" || resolution.kind === "group"
          ? [resolution.slug]
          : [],
      historicalMatchType: historicalMatches.length > 0 ? "textual" : "none",
      ...classification,
    };
  });
}

const getCanonicalSlug = (resolution: RequestedServiceCatalogResolution) =>
  resolution.kind === "service" || resolution.kind === "group"
    ? resolution.slug
    : null;

export function clarifyQuoteDraftRequestedServices(
  requestedServices: readonly string[],
  servicesCatalog: ServiceCatalogRow[],
  pricingRows: PricingRow[],
): QuoteDraftServiceClarification[] {
  const diagnostics = diagnoseQuoteDraftServiceMatches(requestedServices, servicesCatalog);
  const pricedServiceIds = new Set(
    pricingRows
      .map((pricing) => pricing.service_id)
      .filter((serviceId): serviceId is number => typeof serviceId === "number"),
  );

  return diagnostics.map((diagnostic) => {
    const exactTariffAvailable =
      diagnostic.diagnostic === "exact" &&
      diagnostic.historicalServiceIds.some((serviceId) => pricedServiceIds.has(serviceId));
    const isPrecise = diagnostic.diagnostic === "exact";
    const explicitPriceRequired = isPrecise && !exactTariffAvailable;
    const needsClarification = diagnostic.diagnostic !== "exact" || explicitPriceRequired;

    return {
      originalValue: diagnostic.originalValue,
      index: diagnostic.index,
      diagnostic: diagnostic.diagnostic,
      confidence: diagnostic.confidence,
      isPrecise,
      needsClarification,
      clarificationReason: needsClarification ? diagnostic.reason : null,
      exactTariffAvailable,
      explicitPriceRequired,
      canonicalSlug: getCanonicalSlug(diagnostic.catalogResolution),
      historicalServiceIds: diagnostic.historicalServiceIds,
    };
  });
}

export const getBestMatchingPackage = (matchedServiceIds: number[], packages: PackageRow[]) => {
  if (matchedServiceIds.length === 0) return null;

  const matchedSet = new Set(matchedServiceIds.map(String));

  return (
    packages
      .map((pkg) => {
        const serviceIds = Array.isArray(pkg.services_package_items)
          ? pkg.services_package_items.map((item) => String(item.service_id))
          : [];
        const overlap = serviceIds.filter((serviceId) => matchedSet.has(serviceId)).length;
        return { pkg, overlap, serviceIds };
      })
      .filter((entry) => entry.overlap > 0)
      .sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
        return a.serviceIds.length - b.serviceIds.length;
      })[0] ?? null
  );
};
