import {
  normalizePlanetLSSelection,
  resolvePlanetLSSelection,
} from "./planetlsServiceSelection.ts";

export type PlanetLSRequestValidationCode =
  | "SERVICE_REQUIRED"
  | "UNKNOWN_SERVICE"
  | "SERVICE_GROUP_DESCRIPTION_REQUIRED"
  | null;

export type PlanetLSRequestValidation = {
  valid: boolean;
  code: PlanetLSRequestValidationCode;
  services: string[];
  requiresDescription: boolean;
  missingDescription: boolean;
  groupSlugs: string[];
  unknownSlugs: string[];
  empty: boolean;
  // Conservé pour les appels existants ; sera retiré lors du nettoyage final.
  reviewSlugs: string[];
};

export function validatePlanetLSServiceRequest(
  requestedServices: readonly string[],
  description: string | null | undefined,
): PlanetLSRequestValidation {
  const services = normalizePlanetLSSelection(requestedServices);
  const unknownSlugs = services.filter(
    (slug) => !resolvePlanetLSSelection(slug),
  );
  const recognizedSlugs = services.filter((slug) =>
    Boolean(resolvePlanetLSSelection(slug)),
  );

  if (services.length === 0) {
    return {
      valid: false,
      code: "SERVICE_REQUIRED",
      services,
      requiresDescription: false,
      missingDescription: false,
      groupSlugs: [],
      unknownSlugs: [],
      empty: true,
      reviewSlugs: [],
    };
  }

  if (unknownSlugs.length > 0) {
    return {
      valid: false,
      code: "UNKNOWN_SERVICE",
      services,
      requiresDescription: false,
      missingDescription: false,
      groupSlugs: [],
      unknownSlugs,
      empty: false,
      reviewSlugs: [],
    };
  }

  const groupSlugs = [
    ...new Set(
      recognizedSlugs.filter(
        (slug) => resolvePlanetLSSelection(slug)?.kind === "group",
      ),
    ),
  ];

  const requiresDescription = groupSlugs.length > 0;
  const missingDescription =
    requiresDescription && !Boolean(description?.trim());

  return {
    valid: !missingDescription,
    code: missingDescription ? "SERVICE_GROUP_DESCRIPTION_REQUIRED" : null,
    services: recognizedSlugs,
    requiresDescription,
    missingDescription,
    groupSlugs,
    unknownSlugs: [],
    empty: false,
    reviewSlugs: [],
  };
}

