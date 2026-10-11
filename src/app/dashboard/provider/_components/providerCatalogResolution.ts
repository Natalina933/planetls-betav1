import type {
  PlanetLSServiceTargetEntry,
} from "../../../lib/planetlsServiceCatalogTarget.ts";
import { resolvePlanetLSSelection } from "../../../lib/planetlsServiceSelection.ts";

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
      service?: PlanetLSServiceTargetEntry;
      verifiedQualification: false;
    }
  | {
      kind: "group";
      source: ProviderCatalogSource;
      value: string;
      slug: string;
      service: PlanetLSServiceTargetEntry;
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
      service: PlanetLSServiceTargetEntry;
      verifiedQualification: false;
    }
  | {
      kind: "ambiguous";
      source: ProviderCatalogSource;
      value: string;
      candidates: PlanetLSServiceTargetEntry[];
      reason: string;
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

function normalizeInput(value: unknown) {
  return String(value ?? "").trim();
}

function buildUnknown(source: ProviderCatalogSource, value: string): ProviderCatalogResolution {
  return { kind: "unknown", source, value, verifiedQualification: false };
}

function serviceResolutionFromReference(
  source: ProviderCatalogSource,
  value: string,
  service: PlanetLSServiceTargetEntry,
): ProviderCatalogResolution {
  // Un métier ou une famille ne prouve aucune prestation précise.
  // Un groupe reconnu identifie le métier sans attribuer
  // automatiquement toutes ses interventions.
  if (service.kind === "group") {
    return {
      kind: "group",
      source,
      value,
      slug: service.slug,
      service,
      verifiedQualification: false,
    };
  }

  return {
    kind: "service",
    source,
    value,
    slug: service.slug,
    service,
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
    const service = resolvePlanetLSSelection(rawValue);
    return {
      kind: "skill",
      source,
      value: rawValue,
      service: service ?? undefined,
      verifiedQualification: false,
    };
  }

  const direct = resolvePlanetLSSelection(rawValue);
  if (direct) {
    return serviceResolutionFromReference(source, rawValue, direct);
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
