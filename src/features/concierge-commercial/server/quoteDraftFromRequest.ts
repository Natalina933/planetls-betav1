import { db } from "@/server/db/dbServer";

type ServiceRequestRow = {
  id: string;
  title: string | null;
  description: string | null;
  budget_max: number | null;
  currency: string | null;
  desired_date: string | null;
  requested_services: string[] | null;
};

type ServiceCatalogRow = {
  id: number;
  category: string | null;
  service: string | null;
  description: string | null;
};

type PricingRow = {
  id: string;
  service_id: number | null;
  label: string | null;
  type: string | null;
  amount: number | null;
  unit: string | null;
};

type PackageRow = {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  services_package_items?: Array<{ service_id: string | number }>;
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

const round2 = (value: number) => Math.round(value * 100) / 100;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getDefaultQuantity = (pricing: PricingRow) => {
  const unit = normalizeText(pricing.unit ?? "");
  const type = normalizeText(pricing.type ?? "");
  if (unit.includes("heure") || unit === "h" || type === "hourly") return 2;
  return 1;
};

const buildRequestedServiceSet = (requestedServices: string[]) =>
  new Set(requestedServices.map((value) => normalizeText(value)).filter(Boolean));

const getServiceSearchHaystack = (service: ServiceCatalogRow) =>
  normalizeText(
    [service.category ?? "", service.service ?? "", service.description ?? ""].join(" "),
  );

const findMatchedServiceIds = (
  requestedServices: string[],
  servicesCatalog: ServiceCatalogRow[],
) => {
  const requestedSet = buildRequestedServiceSet(requestedServices);
  if (requestedSet.size === 0) return [];

  return servicesCatalog
    .filter((service) => {
      const haystack = getServiceSearchHaystack(service);
      return Array.from(requestedSet).some(
        (requestedValue) =>
          haystack.includes(requestedValue) || requestedValue.includes(normalizeText(service.service ?? "")),
      );
    })
    .map((service) => service.id);
};

const getBestMatchingPackage = (matchedServiceIds: number[], packages: PackageRow[]) => {
  if (matchedServiceIds.length === 0) return null;

  const matchedSet = new Set(matchedServiceIds.map(String));

  return (
    packages
      .map((pkg) => {
        const serviceIds = Array.isArray(pkg.services_package_items)
          ? pkg.services_package_items.map((item) => String(item.service_id))
          : [];
        const overlap = serviceIds.filter((serviceId) => matchedSet.has(serviceId)).length;
        return { pkg, overlap, serviceIds };
      })
      .filter((entry) => entry.overlap > 0)
      .sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
        return a.serviceIds.length - b.serviceIds.length;
      })[0] ?? null
  );
};

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

  const matchedServiceIds = findMatchedServiceIds(requestedServices, servicesCatalog);
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
            },
          };
        })
      : [
          {
            service_id: null,
            pricing_id: null,
            label:
              requestedServices.length > 0
                ? requestedServices.slice(0, 3).join(", ")
                : request.title || "Prestation a chiffrer",
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
