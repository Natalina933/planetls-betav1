import { buildRequestQuoteItems } from "./quoteDraftItems.ts";
import { db } from "@/server/db/dbServer";
import {
  findMatchedServiceIds,
  getBestMatchingPackage,
  clarifyQuoteDraftRequestedServices,
  type ServiceCatalogRow,
  type PricingRow,
  type PackageRow,
} from "./quoteDraftMatching";
import { QUOTE_PRICE_CONFIRMED_KEY } from "./quoteSendGuard";
import {
  getGuestCheckinCheckoutModeFromMetadata,
  getGuestCheckinCheckoutModeLabel,
} from "@/app/lib/guestCheckinCheckout";

// La logique pure de correspondance et de tarification vit dans
// quoteDraftMatching.ts (sans dépendance base de données, testable en
// isolation). On la ré-exporte ici pour conserver la compatibilité des
// imports existants.
export {
  round2,
  normalizeText,
  getDefaultQuantity,
  findMatchedServiceIds,
  findMatchedServicesForSingleRequest,
  diagnoseQuoteDraftServiceMatches,
  clarifyQuoteDraftRequestedServices,
  getBestMatchingPackage,
  type ServiceCatalogRow,
  type PricingRow,
  type PackageRow,
  type QuoteDraftMatchDiagnosticKind,
  type QuoteDraftMatchDiagnostic,
  type QuoteDraftServiceClarification,
} from "./quoteDraftMatching";

type ServiceRequestRow = {
  id: string;
  title: string | null;
  description: string | null;
  budget_max: number | null;
  currency: string | null;
  desired_date: string | null;
  requested_services: string[] | null;
  metadata?: Record<string, unknown> | null;
};

export type PreparedQuoteItem = {
  service_id: number | null;
  pricing_id: string | null;
  label: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
  metadata: Record<string, unknown>;
};

export type PreparedQuoteDraft = {
  packageId: string | null;
  notes: string;
  validUntil: string | null;
  currency: string;
  requestedServices: string[];
  items: PreparedQuoteItem[];
  summary: {
    matchedServiceCount: number;
    matchedPricingCount: number;
    matchedPackageName: string | null;
  };
};

export type QuoteDraftClarificationStatus =
  | "resolved_catalog"
  | "resolved_manual"
  | "needs_clarification"
  | "needs_explicit_price";

// Source unique de la clé de confirmation de tarif (cf. quoteSendGuard.ts).
export { QUOTE_PRICE_CONFIRMED_KEY };


export async function prepareQuoteDraftFromRequest(
  conciergeProfileId: string,
  request: ServiceRequestRow,
): Promise<PreparedQuoteDraft> {
  const requestedServices = Array.isArray(request.requested_services)
    ? request.requested_services.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const [servicesCatalogResult, pricingResult, packagesResult] = await Promise.all([
    db.from("services_catalog").select("id, category, service, description"),
    db
      .from("services_pricing")
      .select("id, service_id, label, type, amount, unit")
      .eq("profile_id", conciergeProfileId),
    db
      .from("services_packages")
      .select("id, name, description, category, services_package_items(service_id)")
      .eq("profile_id", conciergeProfileId),
  ]);
  if (servicesCatalogResult.error || pricingResult.error || packagesResult.error) {
    throw new Error("Impossible de charger les prestations et tarifs du devis.");
  }

  const servicesCatalog = Array.isArray(servicesCatalogResult.data)
    ? (servicesCatalogResult.data as ServiceCatalogRow[])
    : [];
  const pricingRows = Array.isArray(pricingResult.data)
    ? (pricingResult.data as PricingRow[])
    : [];
  const packages = Array.isArray(packagesResult.data)
    ? (packagesResult.data as PackageRow[])
    : [];
  const serviceClarifications = clarifyQuoteDraftRequestedServices(
    requestedServices,
    servicesCatalog,
    pricingRows,
  );
  const checkinCheckoutMode = getGuestCheckinCheckoutModeFromMetadata(
    request.metadata,
  );

  const autoPricedServiceIds = new Set(
    serviceClarifications
      .filter((clarification) => clarification.isPrecise && clarification.exactTariffAvailable)
      .flatMap((clarification) => clarification.historicalServiceIds),
  );
  const matchedServiceIds = findMatchedServiceIds(requestedServices, servicesCatalog).filter((serviceId) =>
    autoPricedServiceIds.has(serviceId),
  );
  const matchedServiceSet = new Set(matchedServiceIds);
  const matchedPricingRows = pricingRows.filter(
    (pricing) => pricing.service_id !== null && matchedServiceSet.has(pricing.service_id),
  );
  const bestPackageMatch = getBestMatchingPackage(matchedServiceIds, packages);

  const items = buildRequestQuoteItems(request, servicesCatalog, pricingRows);

  const matchedPackageName = bestPackageMatch?.pkg.name ?? null;
  const noteParts = [
    `Devis brouillon créé depuis la demande ${request.id}`,
    matchedPackageName ? `Pack suggéré : ${matchedPackageName}` : null,
    matchedPricingRows.length > 0 ? `${matchedPricingRows.length} tarif(s) préchargés` : null,
    checkinCheckoutMode
      ? `Périmètre Check-in & Check-out : ${getGuestCheckinCheckoutModeLabel(checkinCheckoutMode)}`
      : null,
  ].filter(Boolean);

  return {
    packageId: bestPackageMatch?.pkg.id ?? null,
    notes: noteParts.join(" - "),
    validUntil: request.desired_date ?? null,
    currency: (request.currency ?? "EUR").toUpperCase(),
    requestedServices,
    items,
    summary: {
      matchedServiceCount: matchedServiceIds.length,
      matchedPricingCount: matchedPricingRows.length,
      matchedPackageName,
    },
  };
}
