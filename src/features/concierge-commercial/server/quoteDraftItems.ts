import { clarifyQuoteDraftRequestedServices, getDefaultQuantity, round2, type ServiceCatalogRow, type PricingRow } from "./quoteDraftMatching.ts";
import { getGuestCheckinCheckoutModeFromMetadata, getGuestCheckinCheckoutOperationalSlugs } from "../../../app/lib/guestCheckinCheckout.ts";
import { PLANETLS_SERVICE_TARGET } from "../../../app/lib/planetlsServiceCatalogTarget.ts";
import type { PreparedQuoteItem } from "./quoteDraftFromRequest.ts";

export function buildRequestQuoteItems(request: { id: string; requested_services?: string[] | null;
  description?: string | null; desired_date?: string | null; budget_max?: number | null; metadata?: Record<string, unknown> | null },
  catalog: ServiceCatalogRow[], prices: PricingRow[]): PreparedQuoteItem[] {
  const mode = getGuestCheckinCheckoutModeFromMetadata(request.metadata);
  const selections = [...new Set((request.requested_services ?? []).flatMap((slug) =>
    slug === "guest_checkin_checkout" && mode ? getGuestCheckinCheckoutOperationalSlugs(mode) : [slug]))];
  return clarifyQuoteDraftRequestedServices(selections, catalog, prices).map((service, index) => {
    const tariff = service.isPrecise ? prices.find((price) => service.historicalServiceIds.includes(price.service_id ?? -1) &&
      typeof price.amount === "number" && Number.isFinite(price.amount) && price.amount > 0) : undefined;
    const canonical = PLANETLS_SERVICE_TARGET.find((entry) => entry.slug === service.canonicalSlug);
    const quantity = tariff ? getDefaultQuantity(tariff) : 1;
    const unitPrice = tariff ? round2(tariff.amount!) : 0;
    return {
      service_id: tariff?.service_id ?? (service.isPrecise && service.historicalServiceIds.length === 1 ? service.historicalServiceIds[0] : null),
      pricing_id: tariff?.id ?? null,
      label: canonical?.label ?? service.originalValue,
      description: request.description ?? null,
      quantity, unit_price: unitPrice, line_total: round2(quantity * unitPrice), sort_order: index,
      metadata: {
        source: "service_request", service_request_id: request.id,
        requested_service_slug: service.canonicalSlug, quote_service_original_values: [service.originalValue],
        desired_date: request.desired_date ?? null,
        matched_from_request: Boolean(tariff),
        quote_service_budget_is_indicative: true, quote_service_budget_max: request.budget_max ?? null,
        quote_service_clarification_status: tariff ? "resolved_catalog" : service.canonicalSlug ? "needs_explicit_price" : "needs_clarification",
        quote_service_clarification_reason: tariff ? null : service.clarificationReason ?? "Indiquez un tarif explicite pour cette prestation.",
      },
    };
  });
}
