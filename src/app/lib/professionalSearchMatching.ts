import { matchPlanetLSService } from "./planetlsServiceMatching.ts";
import { readProviderSkills } from "./providerSkills.ts";

export type ProfessionalType = "concierge" | "provider";

export function getProfessionalType(
  role: string | null | undefined,
): ProfessionalType | null {
  if (role === "concierge" || role === "concierge_pro") {
    return "concierge";
  }

  if (
    role === "provider" ||
    role === "provider_pro" ||
    role === "artisan" ||
    role === "artisan_pro"
  ) {
    return "provider";
  }

  return null;
}

export function getProfessionalServices(
  role: string | null | undefined,
  option: unknown,
  conciergeServices: readonly string[] = [],
): string[] {
  const type = getProfessionalType(role);

  if (type === "provider") {
    return readProviderSkills(option);
  }

  if (type === "concierge") {
    return [...conciergeServices];
  }

  return [];
}

export function professionalMatchesServices(
  offeredServices: readonly string[],
  requestedServices: readonly string[],
): boolean {
  if (requestedServices.length === 0) return true;

  return requestedServices.every((requested) =>
    offeredServices.some(
      (offered) => matchPlanetLSService(requested, offered) === "match",
    ),
  );
}

export function professionalMatchesType(
  role: string | null | undefined,
  requestedType: "all" | "concierge" | "provider",
): boolean {
  const professionalType = getProfessionalType(role);

  if (!professionalType) return false;

  return requestedType === "all" || professionalType === requestedType;
}

export function professionalIsSearchable(
  status: string | null | undefined,
): boolean {
  return status !== "suspended" && status !== "deleted";
}
