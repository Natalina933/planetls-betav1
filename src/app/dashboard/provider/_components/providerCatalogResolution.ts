import {
  resolveCommonServiceValue,
  type CommonServiceReference,
} from "../../../lib/commonServiceCatalog.ts";

type ProviderCatalogSource = "category" | "skill" | "service_label";

export type ProviderCatalogResolution =
  | {
      kind: "profession";
      source: ProviderCatalogSource;
      value: string;
      verifiedQualification: false;
    }
  | {
      kind: "skill";
      source: ProviderCatalogSource;
      value: string;
      catalog?: CommonServiceReference;
      requiresQualification: boolean;
      verifiedQualification: false;
    }
  | {
      kind: "family";
      source: ProviderCatalogSource;
      value: string;
      family: string;
      verifiedQualification: false;
    }
  | {
      kind: "service";
      source: ProviderCatalogSource;
      value: string;
      slug: string;
      service: CommonServiceReference;
      requiresQualification: boolean;
      verifiedQualification: false;
    }
  | {
      kind: "ambiguous";
      source: ProviderCatalogSource;
      value: string;
      candidates: CommonServiceReference[];
      reason: string;
      requiresQualification: boolean;
      verifiedQualification: false;
    }
  | {
      kind: "unknown";
      source: ProviderCatalogSource;
      value: string;
      verifiedQualification: false;
    };

export type ProviderProfileCatalogResolution = {
  category: ProviderCatalogResolution;
  skills: ProviderCatalogResolution[];
};

const GENERAL_FAMILY_BY_LEGACY_SLUG: Record<string, string> = {
  legacy_menage: "Ménage",
  legacy_maintenance: "Maintenance légère",
  legacy_guest_reception: "Accueil voyageurs",
};

function normalizeInput(value: unknown) {
  return String(value ?? "").trim();
}

function buildUnknown(source: ProviderCatalogSource, value: string): ProviderCatalogResolution {
  return { kind: "unknown", source, value, verifiedQualification: false };
}

function serviceResolutionFromReference(
  source: ProviderCatalogSource,
  value: string,
  service: CommonServiceReference,
): ProviderCatalogResolution {
  const family = GENERAL_FAMILY_BY_LEGACY_SLUG[service.slug];
  if (family) {
    return {
      kind: "family",
      source,
      value,
      family,
      verifiedQualification: false,
    };
  }

  if (service.status === "ambiguous") {
    return {
      kind: "ambiguous",
      source,
      value,
      candidates: [service],
      reason: "Référence historique ambiguë : ne pas convertir automatiquement.",
      requiresQualification: Boolean(service.requiresQualification),
      verifiedQualification: false,
    };
  }

  return {
    kind: "service",
    source,
    value,
    slug: service.slug,
    service,
    requiresQualification: Boolean(service.requiresQualification),
    verifiedQualification: false,
  };
}

export function resolveProviderCatalogValue(
  value: unknown,
  source: ProviderCatalogSource,
): ProviderCatalogResolution {
  const rawValue = normalizeInput(value);
  if (!rawValue) return buildUnknown(source, rawValue);

  if (source === "category") {
    return {
      kind: "profession",
      source,
      value: rawValue,
      verifiedQualification: false,
    };
  }

  if (source === "skill") {
    const catalog = resolveCommonServiceValue(rawValue);
    return {
      kind: "skill",
      source,
      value: rawValue,
      catalog: catalog.kind === "service" ? catalog.service : undefined,
      requiresQualification:
        catalog.kind === "service" ? Boolean(catalog.service.requiresQualification) : false,
      verifiedQualification: false,
    };
  }

  const catalog = resolveCommonServiceValue(rawValue);
  if (catalog.kind === "service") {
    return serviceResolutionFromReference(source, rawValue, catalog.service);
  }

  if (catalog.kind === "ambiguous") {
    return {
      kind: "ambiguous",
      source,
      value: rawValue,
      candidates: catalog.candidates,
      reason: catalog.reason,
      requiresQualification: catalog.candidates.some((candidate) =>
        Boolean(candidate.requiresQualification),
      ),
      verifiedQualification: false,
    };
  }

  return buildUnknown(source, rawValue);
}

export function resolveProviderProfileCatalog(input: {
  category?: unknown;
  skills?: unknown;
}): ProviderProfileCatalogResolution {
  const skills = Array.isArray(input.skills)
    ? input.skills.filter((skill): skill is string => typeof skill === "string")
    : [];

  return {
    category: resolveProviderCatalogValue(input.category, "category"),
    skills: skills.map((skill) => resolveProviderCatalogValue(skill, "skill")),
  };
}

export function resolveProviderInterventionCatalog<TIntervention extends { service_label?: unknown }>(
  intervention: TIntervention,
) {
  return {
    intervention,
    catalogResolution: resolveProviderCatalogValue(
      intervention.service_label,
      "service_label",
    ),
  };
}

export function resolveProviderInterventionsCatalog<
  TIntervention extends { service_label?: unknown },
>(interventions: readonly TIntervention[] | null | undefined) {
  return Array.isArray(interventions)
    ? interventions.map((intervention) => resolveProviderInterventionCatalog(intervention))
    : [];
}
