import { db } from "@/server/db/dbServer";
import {
  round2,
  getDefaultQuantity,
  findMatchedServiceIds,
  getBestMatchingPackage,
  clarifyQuoteDraftRequestedServices,
  type ServiceCatalogRow,
  type PricingRow,
  type PackageRow,
} from "./quoteDraftMatching";

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
  | "needs_clarification"
  | "needs_explicit_price";


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

  const items =
    matchedPricingRows.length > 0
      ? matchedPricingRows.map((pricing, index) => {
          const quantity = getDefaultQuantity(pricing);
          const unitPrice = round2(Number(pricing.amount ?? 0));
          return {
            service_id: pricing.service_id ?? null,
            pricing_id: pricing.id ?? null,
            label: pricing.label?.trim() || request.title || "Prestation a chiffrer",
            description:
              pricing.unit && pricing.unit.trim().length > 0
                ? `Tarif ${pricing.unit}`
                : request.description ?? null,
            quantity,
            unit_price: unitPrice,
            line_total: round2(quantity * unitPrice),
            sort_order: index,
            metadata: {
              source: "service_request",
              service_request_id: request.id,
              matched_from_request: true,
              quote_service_clarification_status: "resolved_catalog",
              quote_service_clarification_reason: null,
            },
          };
        })
      : [
          {
            service_id:
              serviceClarifications.find(
                (clarification) =>
                  clarification.isPrecise &&
                  clarification.historicalServiceIds.length === 1 &&
                  !clarification.explicitPriceRequired,
              )?.historicalServiceIds[0] ?? null,
            pricing_id: null,
            label:
              requestedServices.length > 0
                ? requestedServices.slice(0, 3).join(", ")
                : request.title || "Prestation à chiffrer",
            description: request.description ?? null,
            quantity: 1,
            unit_price:
              Number.isFinite(Number(request.budget_max ?? 0)) && Number(request.budget_max ?? 0) > 0
                ? round2(Number(request.budget_max ?? 0))
                : 0,
            line_total:
              Number.isFinite(Number(request.budget_max ?? 0)) && Number(request.budget_max ?? 0) > 0
                ? round2(Number(request.budget_max ?? 0))
                : 0,
            sort_order: 0,
            metadata: {
              source: "service_request",
              service_request_id: request.id,
              matched_from_request: false,
              quote_service_clarification_status: serviceClarifications.some(
                (clarification) => clarification.explicitPriceRequired,
              )
                ? "needs_explicit_price"
                : "needs_clarification",
              quote_service_clarification_reason:
                serviceClarifications.find((clarification) => clarification.needsClarification)
                  ?.clarificationReason ??
                "Aucune prestation tarifée certaine n'a pu être déterminée automatiquement.",
              quote_service_original_values: requestedServices,
              quote_service_resolution_diagnostics: serviceClarifications.map((clarification) => ({
                original_value: clarification.originalValue,
                diagnostic: clarification.diagnostic,
                canonical_slug: clarification.canonicalSlug,
                explicit_price_required: clarification.explicitPriceRequired,
              })),
            },
          },
        ];

  const matchedPackageName = bestPackageMatch?.pkg.name ?? null;
  const noteParts = [
    `Devis brouillon créé depuis la demande ${request.id}`,
    matchedPackageName ? `Pack suggéré : ${matchedPackageName}` : null,
    matchedPricingRows.length > 0 ? `${matchedPricingRows.length} tarif(s) préchargés` : null,
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
