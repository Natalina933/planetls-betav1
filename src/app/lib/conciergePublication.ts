import { parseProfileServices } from "../api/profiles/concierges/shared.ts";
import { qualifyProfessionalCoverage, evaluateProfessionalCoverage } from "../api/search/professionals/coverage.ts";
import { PLANETLS_SERVICE_TARGET } from "./planetlsServiceCatalogTarget.ts";
import { normalizeCatalogText } from "./serviceCatalog.ts";
import type { CoverageCircle } from "../../features/owner-concierges/lib/geographicCoverage.ts";

export type ConciergePublicationProfile = Parameters<typeof qualifyProfessionalCoverage>[0] & {
  role?: string | null;
  status?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  option?: string | null;
};

export function isConciergeRole(role?: string | null) {
  return role === "concierge" || role === "concierge_pro";
}

/** Publication derived from persisted fields; no mutable publication/admin status. */
export function conciergePublication(profile: ConciergePublicationProfile) {
  const reasons: string[] = [];
  if (!isConciergeRole(profile.role)) reasons.push("role");
  // Null is the existing registration default, interpreted as active by authentication.
  if (profile.status != null && profile.status !== "active") reasons.push("status");
  const filled = (value?: string | null) => Boolean(value?.trim());
  if (!filled(profile.company_name) && !(filled(profile.first_name) && filled(profile.last_name))) {
    reasons.push("professional_identity");
  }
  const services = parseProfileServices(profile.option ?? null, profile.availability_hours ?? null)
    .filter((value) => PLANETLS_SERVICE_TARGET.some((entry) =>
      entry.slug === value || normalizeCatalogText(entry.label) === normalizeCatalogText(value)));
  if (!services.length) reasons.push("services");
  if (!qualifyProfessionalCoverage(profile).zones.some(Boolean)) reasons.push("coverage");
  return { eligible: reasons.length === 0, reasons, services };
}

export function conciergeRequestEligibility(profile: ConciergePublicationProfile, intervention: CoverageCircle) {
  const publication = conciergePublication(profile);
  if (!publication.eligible) return { eligible: false, code: "CONCIERGE_NOT_PUBLISHED" } as const;
  const coverage = evaluateProfessionalCoverage(profile, intervention);
  return coverage.state === "covered"
    ? { eligible: true, code: null } as const
    : { eligible: false, code: coverage.state === "outside" ? "CONCIERGE_OUTSIDE_ZONE" : "CONCIERGE_ZONE_UNKNOWN" } as const;
}
