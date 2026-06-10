export type ServiceCategoryIconName =
  | "home"
  | "sparkles"
  | "shirt"
  | "key"
  | "wrench"
  | "shopping"
  | "file"
  | "trees"
  | "shield"
  | "comfort"
  | "leaf"
  | "camera"
  | "message"
  | "chart"
  | "users"
  | "hammer"
  | "help";

export type ServiceCategoryIconRule = {
  icon: ServiceCategoryIconName;
  label: string;
  keywords: string[];
};

const normalizeCategory = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const SERVICE_CATEGORY_ICON_RULES: ServiceCategoryIconRule[] = [
  { icon: "sparkles", label: "Menage / nettoyage", keywords: ["menage", "nettoyage", "proprete", "entretien"] },
  { icon: "shirt", label: "Linge / blanchisserie", keywords: ["linge", "blanchisserie", "drap", "serviette"] },
  { icon: "key", label: "Accueil voyageurs", keywords: ["accueil", "check in", "check out", "voyageur", "cle", "cles"] },
  { icon: "wrench", label: "Maintenance", keywords: ["maintenance", "reparation", "depannage", "controle", "etat"] },
  { icon: "shopping", label: "Courses", keywords: ["courses", "approvisionnement", "stock", "achat"] },
  { icon: "file", label: "Gestion administrative", keywords: ["administratif", "administrative", "fiscal", "document", "contrat", "assistance"] },
  { icon: "trees", label: "Exterieur / jardin", keywords: ["exterieur", "jardin", "espaces verts", "terrasse"] },
  { icon: "shield", label: "Securite", keywords: ["securite", "alarme", "assurance", "surveillance"] },
  { icon: "comfort", label: "Confort", keywords: ["confort", "bienvenue", "kit", "amenity", "amenities"] },
  { icon: "leaf", label: "Eco", keywords: ["eco", "ecologie", "durable", "energie"] },
  { icon: "camera", label: "Photo", keywords: ["photo", "photographie", "image", "visuel"] },
  { icon: "message", label: "Messages / reservations", keywords: ["message", "reservation", "communication", "annonce"] },
  { icon: "chart", label: "Revenus / optimisation", keywords: ["revenu", "reporting", "prix", "optimisation", "tarif"] },
  { icon: "home", label: "Proprietaire", keywords: ["proprietaire", "logement", "location"] },
  { icon: "users", label: "Conciergerie", keywords: ["concierge", "conciergerie", "supervision"] },
  { icon: "hammer", label: "Artisan", keywords: ["artisan", "travaux", "plomberie", "electricite", "peinture", "menuiserie"] },
];

export function getServiceCategoryIconName(category: unknown): ServiceCategoryIconName {
  const normalized = normalizeCategory(category);
  if (!normalized) return "help";

  const match = SERVICE_CATEGORY_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(normalizeCategory(keyword))),
  );

  return match?.icon ?? "help";
}

export function getServiceCategoryIconLabel(category: unknown): string {
  const iconName = getServiceCategoryIconName(category);
  return SERVICE_CATEGORY_ICON_RULES.find((rule) => rule.icon === iconName)?.label ?? "Service";
}
