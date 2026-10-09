import {
  resolveCommonServiceValue,
  type CollaborationModeSlug,
  type CommonServiceReference,
} from "../../lib/commonServiceCatalog.ts";

export type RequestedServiceCatalogResolution =
  | {
      kind: "service";
      originalValue: string;
      index: number;
      slug: string;
      service: CommonServiceReference;
    }
  | {
      kind: "family";
      originalValue: string;
      index: number;
      family: string;
      reference?: CommonServiceReference;
      reason: string;
    }
  | {
      kind: "mode";
      originalValue: string;
      index: number;
      mode: CollaborationModeSlug;
      label: string;
    }
  | {
      kind: "context";
      originalValue: string;
      index: number;
      context: "night_emergency";
      reference?: CommonServiceReference;
      reason: string;
    }
  | {
      kind: "ambiguous";
      originalValue: string;
      index: number;
      candidates: CommonServiceReference[];
      reason: string;
    }
  | {
      kind: "unknown";
      originalValue: string;
      index: number;
    };

const FAMILY_BY_LEGACY_SLUG: Record<string, string> = {
  legacy_menage: "Ménage",
  legacy_maintenance: "Maintenance légère",
  legacy_guest_reception: "Accueil voyageurs",
};

function resolveServiceReference(
  originalValue: string,
  index: number,
  service: CommonServiceReference,
): RequestedServiceCatalogResolution {
  const family = FAMILY_BY_LEGACY_SLUG[service.slug];
  if (family) {
    return {
      kind: "family",
      originalValue,
      index,
      family,
      reference: service,
      reason: "Famille générale : ne pas convertir automatiquement en prestation précise.",
    };
  }

  if (service.slug === "legacy_night_emergency") {
    return {
      kind: "context",
      originalValue,
      index,
      context: "night_emergency",
      reference: service,
      reason: "Contexte d'intervention : ne pas convertir automatiquement en prestation.",
    };
  }

  if (service.status === "ambiguous") {
    return {
      kind: "ambiguous",
      originalValue,
      index,
      candidates: [service],
      reason: "Référence historique ambiguë : ne pas convertir automatiquement.",
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

  const resolved = resolveCommonServiceValue(originalValue);

  if (resolved.kind === "collaboration_mode") {
    return {
      kind: "mode",
      originalValue,
      index,
      mode: resolved.mode,
      label: resolved.label,
    };
  }

  if (resolved.kind === "service") {
    return resolveServiceReference(originalValue, index, resolved.service);
  }

  if (resolved.kind === "ambiguous") {
    return {
      kind: "ambiguous",
      originalValue,
      index,
      candidates: resolved.candidates,
      reason: resolved.reason,
    };
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
