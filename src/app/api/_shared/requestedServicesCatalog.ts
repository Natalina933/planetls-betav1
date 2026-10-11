import type { PlanetLSServiceTargetEntry } from "../../lib/planetlsServiceCatalogTarget.ts";
import { resolvePlanetLSSelection } from "../../lib/planetlsServiceSelection.ts";

export type RequestedServiceCatalogResolution =
  | {
      kind: "service";
      originalValue: string;
      index: number;
      slug: string;
      service: PlanetLSServiceTargetEntry;
    }
  | {
      kind: "group";
      originalValue: string;
      index: number;
      slug: string;
      service: PlanetLSServiceTargetEntry;
      reason: string;
    }
  | {
      kind: "family";
      originalValue: string;
      index: number;
      family: string;
      reason: string;
    }
  | {
      kind: "mode";
      originalValue: string;
      index: number;
      mode: string;
      label: string;
    }
  | {
      kind: "context";
      originalValue: string;
      index: number;
      context: "night_emergency";
      reason: string;
    }
  | {
      kind: "ambiguous";
      originalValue: string;
      index: number;
      candidates: PlanetLSServiceTargetEntry[];
      reason: string;
    }
  | {
      kind: "unknown";
      originalValue: string;
      index: number;
    };

function resolveServiceReference(
  originalValue: string,
  index: number,
  service: PlanetLSServiceTargetEntry,
): RequestedServiceCatalogResolution {
  // Un groupe reconnu reste à qualifier : il ne prouve aucune
  // compétence précise et ne sélectionne aucune sous-prestation.
  if (service.kind === "group") {
    return {
      kind: "group",
      originalValue,
      index,
      slug: service.slug,
      service,
      reason: "Groupe à qualifier : ne pas convertir en prestation précise.",
    };
  }

  return {
    kind: "service",
    originalValue,
    index,
    slug: service.slug,
    service,
  };
}

export function resolveRequestedServiceCatalogValue(
  value: unknown,
  index: number,
): RequestedServiceCatalogResolution {
  const originalValue = String(value ?? "").trim();
  if (!originalValue) return { kind: "unknown", originalValue, index };

  // PLANETLS_SERVICE_TARGET est la seule référence.
  // Aucune approximation : une valeur inconnue reste inconnue.
  const direct = resolvePlanetLSSelection(originalValue);

  if (direct) {
    return resolveServiceReference(originalValue, index, direct);
  }

  return { kind: "unknown", originalValue, index };
}

export function resolveRequestedServicesCatalog(
  requestedServices: readonly unknown[] | null | undefined,
): RequestedServiceCatalogResolution[] {
  return Array.isArray(requestedServices)
    ? requestedServices.map((value, index) => resolveRequestedServiceCatalogValue(value, index))
    : [];
}
