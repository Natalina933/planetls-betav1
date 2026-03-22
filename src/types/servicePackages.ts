export type ServiceCatalogRow = {
  id: string;
  category: string | null;
  service: string | null;
};

export type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  services_package_items?: Array<{ service_id: string }>;
};

export type PricingPackageRow = {
  id: string;
  package_id: string;
  label: string;
  type: string;
  amount: number;
  property_type: string | null;
};

export type ContractTemplateRow = {
  id: string;
  package_id: string;
  title: string;
};

export type DefaultPackTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  serviceHints: string[];
  promise: string;
  accent: "teal" | "sand" | "gold" | "slate";
};

export const DEFAULT_SERVICE_PACK_TEMPLATES: DefaultPackTemplate[] = [
  {
    id: "essentiel",
    name: "Pack Essentiel",
    category: "Séjour",
    description:
      "Le socle minimum pour accueillir, remettre en état et sécuriser le logement entre deux séjours.",
    serviceHints: ["ménage", "check-in", "check-out", "contrôle"],
    promise: "Le bon point d'entrée pour une offre simple, lisible et rassurante.",
    accent: "teal",
  },
  {
    id: "confort",
    name: "Pack Confort",
    category: "Séjour",
    description:
      "Une offre standard simple à vendre, pensée pour fluidifier l'accueil et le turnover.",
    serviceHints: ["ménage", "linge", "check-in", "check-out", "kit", "contrôle"],
    promise: "Un équilibre très efficace entre confort, fluidité terrain et valeur perçue.",
    accent: "sand",
  },
  {
    id: "premium",
    name: "Pack Premium",
    category: "Premium",
    description:
      "Un niveau de service plus rassurant avec suivi renforcé, réactivité et image haut de gamme.",
    serviceHints: ["ménage", "linge", "check-in", "check-out", "24/7", "maintenance", "reporting"],
    promise: "Le pack à mettre en avant pour les biens exigeants et les propriétaires premium.",
    accent: "gold",
  },
  {
    id: "full-service",
    name: "Pack Exploitation complète",
    category: "Full service",
    description:
      "Une délégation large pour les propriétaires qui veulent une prise en charge quasi complète.",
    serviceHints: ["ménage", "linge", "check-in", "check-out", "maintenance", "courses", "administratif"],
    promise: "Le choix le plus complet pour déléguer l'exploitation sans friction.",
    accent: "slate",
  },
];

export function normalizeServicePackageText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizeServicePackageName(value: string) {
  return normalizeServicePackageText(value).replace(/^pack\s+/, "").trim();
}

export function formatServicePackageMoney(value: number) {
  return `${value.toFixed(0)} EUR`;
}
