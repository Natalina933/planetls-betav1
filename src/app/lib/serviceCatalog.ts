export type ServiceCatalogItem = {
  id: number | string;
  category: string;
  service: string;
  description?: string | null;
};

export type ServiceCatalogGroup = {
  category: string;
  services: ServiceCatalogItem[];
};

export const SERVICE_CATALOG_CATEGORY_ORDER = [
  "Ménage",
  "Linge",
  "Accueil voyageurs",
  "Maintenance",
  "Courses",
  "Gestion administrative",
  "Extérieur",
  "Sécurité",
  "Confort",
  "Éco",
  "Autre besoin",
];

export function normalizeCatalogText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeServiceValues(value: string | string[] | null | undefined) {
  const source = Array.isArray(value) ? value : String(value ?? "").split(",");
  const seen = new Set<string>();
  const services: string[] = [];

  source.forEach((item) => {
    const service = String(item ?? "").trim();
    const key = normalizeCatalogText(service);
    if (!service || seen.has(key)) return;
    seen.add(key);
    services.push(service);
  });

  return services;
}

export function normalizeServiceCatalogCategory(category: unknown) {
  const raw = String(category ?? "").trim();
  const normalized = normalizeCatalogText(raw);
  if (!normalized) return "Autre besoin";
  if (normalized === "accueil") return "Accueil voyageurs";
  if (normalized === "administratif") return "Gestion administrative";
  if (normalized === "autres") return "Autre besoin";
  return raw;
}

export function sortServiceCatalogCategories(left: string, right: string) {
  const leftIndex = SERVICE_CATALOG_CATEGORY_ORDER.indexOf(left);
  const rightIndex = SERVICE_CATALOG_CATEGORY_ORDER.indexOf(right);
  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  }
  return left.localeCompare(right, "fr");
}

export function groupServiceCatalog(items: ServiceCatalogItem[]) {
  const groups = new Map<string, ServiceCatalogItem[]>();
  const seen = new Set<string>();

  items.forEach((item) => {
    const category = normalizeServiceCatalogCategory(item.category);
    const service = String(item.service ?? "").trim();
    if (!service) return;

    const key = `${normalizeCatalogText(category)}::${normalizeCatalogText(service)}`;
    if (seen.has(key)) return;
    seen.add(key);

    const current = groups.get(category) ?? [];
    current.push({ ...item, category, service });
    groups.set(category, current);
  });

  return Array.from(groups.entries())
    .map(([category, services]) => ({
      category,
      services: services.sort((left, right) => left.service.localeCompare(right.service, "fr")),
    }))
    .sort((left, right) => sortServiceCatalogCategories(left.category, right.category));
}

export function hasServiceValue(values: string[] | string, service: string) {
  const key = normalizeCatalogText(service);
  return normalizeServiceValues(values).some((item) => normalizeCatalogText(item) === key);
}

export function addServiceValues(currentValue: string[] | string, services: string[]) {
  const next = normalizeServiceValues(currentValue);
  const seen = new Set(next.map(normalizeCatalogText));

  services.forEach((service) => {
    const cleanService = service.trim();
    const key = normalizeCatalogText(cleanService);
    if (!cleanService || seen.has(key)) return;
    seen.add(key);
    next.push(cleanService);
  });

  return next;
}

export function removeServiceValue(currentValue: string[] | string, service: string) {
  const key = normalizeCatalogText(service);
  return normalizeServiceValues(currentValue).filter((item) => normalizeCatalogText(item) !== key);
}

export function toggleServiceValue(currentValue: string[] | string, service: string) {
  return hasServiceValue(currentValue, service)
    ? removeServiceValue(currentValue, service)
    : addServiceValues(currentValue, [service]);
}
