import { normalizeCatalogText } from "./serviceCatalog.ts";

export type ServiceRole = "owner" | "concierge" | "provider";
export type ServiceStatus = "active" | "legacy_alias" | "ambiguous" | "regulated";
export type CollaborationModeSlug = "a_la_carte" | "full_management" | "both";

export type CommonServiceReference = {
  id: number | null;
  slug: string;
  family: string;
  label: string;
  roles: ServiceRole[];
  status: ServiceStatus;
  legacyAliases: string[];
  requiresQualification?: boolean;
};

export type ServiceResolution =
  | { kind: "service"; service: CommonServiceReference; confidence: "id" | "slug" | "label" | "alias" }
  | { kind: "collaboration_mode"; mode: CollaborationModeSlug; label: string }
  | { kind: "ambiguous"; value: string; candidates: CommonServiceReference[]; reason: string }
  | { kind: "unknown"; value: string };

const ALL_ROLES: ServiceRole[] = ["owner", "concierge", "provider"];
const OWNER_CONCIERGE: ServiceRole[] = ["owner", "concierge"];
const OWNER_PROVIDER: ServiceRole[] = ["owner", "provider"];

const service = (
  id: number | null,
  family: string,
  label: string,
  slug: string,
  status: ServiceStatus = "active",
  roles: ServiceRole[] = OWNER_CONCIERGE,
  legacyAliases: string[] = [],
  requiresQualification = false,
): CommonServiceReference => ({
  id,
  slug,
  family,
  label,
  roles,
  status,
  legacyAliases,
  requiresQualification,
});

export const COMMON_SERVICE_REFERENCES: CommonServiceReference[] = [
  service(1, "Ménage", "Ménage standard", "cleaning_standard", "active", OWNER_CONCIERGE, ["Menage standard"]),
  service(2, "Ménage", "Ménage entre voyageurs", "cleaning_turnover", "active", OWNER_CONCIERGE, ["Ménage entre les séjours", "Menage entre voyageurs"]),
  service(3, "Ménage", "Grand ménage", "cleaning_deep", "active", OWNER_CONCIERGE, ["Grand menage"]),
  service(4, "Ménage", "Désinfection complète", "cleaning_disinfection"),
  service(5, "Ménage", "Nettoyage fin de séjour", "cleaning_end_of_stay"),
  service(6, "Ménage", "Vitres et menuiseries", "cleaning_windows_frames"),
  service(7, "Ménage", "Nettoyage moquette/tapis", "cleaning_carpets_rugs"),
  service(8, "Ménage", "Nettoyage four/micro-ondes", "cleaning_oven_microwave"),
  service(9, "Linge", "Changement de linge", "linen_change", "active", OWNER_CONCIERGE, ["Linge"]),
  service(10, "Linge", "Blanchisserie complète", "linen_laundry_full", "active", OWNER_CONCIERGE, ["Blanchisserie complete", "laundry"]),
  service(11, "Linge", "Fourniture de linge", "linen_supply"),
  service(12, "Linge", "Nettoyage édredons", "linen_duvets_cleaning"),
  service(13, "Linge", "Gestion stock linge", "linen_stock_management"),
  service(14, "Linge", "Linge de table", "linen_table"),
  service(15, "Linge", "Linge bébé", "linen_baby"),
  service(16, "Accueil voyageurs", "Check-in / Check-out", "guest_checkin_checkout_legacy_bundle", "ambiguous", OWNER_CONCIERGE, ["checkin", "Check-in / check-out", "Accueil et check-in/check-out"]),
  service(17, "Accueil voyageurs", "Conciergerie 24/7", "guest_support_24_7"),
  service(18, "Accueil voyageurs", "Kit de bienvenue", "guest_welcome_kit"),
  service(19, "Accueil voyageurs", "Visite guidée logement", "guest_home_tour"),
  service(20, "Accueil voyageurs", "Instructions digitales", "guest_digital_instructions"),
  service(21, "Accueil voyageurs", "Gestion clés physiques", "guest_physical_keys"),
  service(22, "Accueil voyageurs", "Check-in autonome", "guest_self_checkin", "active", OWNER_CONCIERGE, ["self checkin"]),
  service(23, "Accueil voyageurs", "Assistance voyageurs", "guest_support_during_stay", "active", OWNER_CONCIERGE, ["welcome"]),
  service(24, "Accueil voyageurs", "Late check-out", "guest_late_checkout"),
  service(25, "Maintenance légère", "Contrôle d'état", "maintenance_condition_check"),
  service(26, "Maintenance légère", "Petites réparations", "maintenance_minor_repairs", "active", ALL_ROLES, ["Maintenance légère", "Maintenance et petites réparations"]),
  service(27, "Maintenance légère", "Intervention d'urgence", "maintenance_emergency", "ambiguous", ALL_ROLES, ["Urgence"]),
  service(28, "Maintenance légère", "Remplacement consommables", "maintenance_consumables_restock"),
  service(29, "Maintenance légère", "Contrôle équipements", "maintenance_equipment_check"),
  service(30, "Coordination", "Gestion prestataires", "maintenance_provider_coordination"),
  service(31, "Accueil voyageurs", "Préparation check-out", "maintenance_checkout_preparation", "ambiguous"),
  service(32, "Maintenance légère", "Dépannage serrures", "maintenance_lock_troubleshooting", "regulated", ALL_ROLES, ["Serrurerie"], true),
  service(33, "Maintenance légère", "Entretien plomberie", "maintenance_plumbing_minor", "regulated", ALL_ROLES, ["Plomberie"], true),
  service(34, "Sécurité", "Test sécurité électrique", "maintenance_electrical_safety_check", "regulated", ALL_ROLES, ["Électricité", "Electricité"], true),
  service(35, "Courses", "Courses d'arrivée", "groceries_arrival"),
  service(36, "Courses", "Courses complètes", "groceries_full_shopping"),
  service(37, "Courses", "Produits d'entretien", "groceries_cleaning_supplies"),
  service(38, "Courses", "Vin et spécialités", "groceries_wine_specialties"),
  service(39, "Courses", "Bébé/enfant", "groceries_baby_child"),
  service(40, "Courses", "Animaux", "groceries_pets"),
  service(41, "Gestion administrative", "Gestion réservations", "admin_booking_management"),
  service(42, "Gestion administrative", "Communication voyageurs", "admin_guest_communication", "active", OWNER_CONCIERGE, ["Gestion des messages voyageurs", "Messagerie voyageurs"]),
  service(43, "Gestion administrative", "Optimisation annonces", "admin_listing_optimization"),
  service(44, "Gestion administrative", "Reporting mensuel", "admin_monthly_reporting"),
  service(45, "Gestion administrative", "Photographie pro", "admin_professional_photography", "active", OWNER_PROVIDER),
  service(46, "Gestion administrative", "Déclarations fiscales", "admin_tax_declarations", "regulated", OWNER_PROVIDER, [], true),
  service(47, "Gestion administrative", "Gestion cautions", "admin_deposit_management"),
  service(48, "Gestion administrative", "Réclamations plateformes", "admin_platform_claims"),
  service(49, "Gestion administrative", "Calendrier dynamique", "admin_dynamic_calendar"),
  service(50, "Extérieur", "Jardinage", "outdoor_gardening", "active", ALL_ROLES, ["Jardinage et espaces verts"]),
  service(51, "Extérieur", "Nettoyage piscine", "outdoor_pool_cleaning", "active", ALL_ROLES),
  service(52, "Extérieur", "Déneigement", "outdoor_snow_removal", "active", ALL_ROLES),
  service(53, "Extérieur", "Nettoyage terrasses", "outdoor_terrace_cleaning", "active", ALL_ROLES),
  service(54, "Extérieur", "Entretien voirie", "outdoor_access_maintenance", "ambiguous", ALL_ROLES),
  service(55, "Extérieur", "Nettoyage gouttières", "outdoor_gutter_cleaning", "regulated", ALL_ROLES, [], true),
  service(56, "Extérieur", "Entretien toiture", "outdoor_roof_maintenance", "regulated", OWNER_PROVIDER, [], true),
  service(57, "Sécurité", "Contrôle sécurité incendie", "safety_fire_check", "regulated", OWNER_PROVIDER, [], true),
  service(58, "Sécurité", "Gestion des accès digitaux", "safety_digital_access"),
  service(59, "Sécurité", "Ronde de sécurité", "safety_patrol"),
  service(60, "Sécurité", "Caméras de surveillance", "safety_cameras", "regulated", OWNER_PROVIDER, [], true),
  service(61, "Sécurité", "Coffre-fort", "safety_safe_box", "regulated", OWNER_PROVIDER, [], true),
  service(62, "Confort", "Préparation petit-déjeuner", "comfort_breakfast_preparation"),
  service(63, "Confort", "Service femme de ménage quotidienne", "comfort_daily_cleaning", "active", OWNER_CONCIERGE, ["Ménage quotidien"]),
  service(64, "Confort", "Transfert aéroport", "comfort_airport_transfer"),
  service(65, "Confort", "Chef à domicile", "comfort_private_chef", "regulated", OWNER_PROVIDER, [], true),
  service(66, "Confort", "Massage à domicile", "comfort_home_massage", "regulated", OWNER_PROVIDER, [], true),
  service(67, "Confort", "Baby-sitting", "comfort_babysitting", "regulated", OWNER_PROVIDER, [], true),
  service(68, "Éco", "Produits ménagers éco", "eco_cleaning_products"),
  service(69, "Éco", "Gestion des déchets triés", "eco_waste_sorting"),
  service(70, "Éco", "Compostage", "eco_composting"),
  service(71, "Éco", "Audit énergétique", "eco_energy_audit", "regulated", OWNER_PROVIDER, [], true),
  service(72, "Ménage", "Menage", "legacy_menage", "legacy_alias", OWNER_CONCIERGE, ["Ménage"]),
  service(73, "Intendance", "Intendance", "legacy_intendance", "ambiguous", OWNER_CONCIERGE),
  service(74, "Maintenance légère", "Maintenance", "legacy_maintenance", "legacy_alias", ALL_ROLES),
  service(75, "Urgence", "Urgence de nuit", "legacy_night_emergency", "ambiguous", OWNER_CONCIERGE),
  service(76, "Accueil voyageurs", "Accueil voyageurs", "legacy_guest_reception", "legacy_alias", OWNER_CONCIERGE),
];

export const FUTURE_SERVICE_REFERENCES: CommonServiceReference[] = [
  service(null, "Accueil voyageurs", "Check-in", "guest_checkin", "active", OWNER_CONCIERGE, ["arrival"]),
  service(null, "Accueil voyageurs", "Check-out", "guest_checkout", "active", OWNER_CONCIERGE, ["departure"]),
];

export const COMMON_SERVICE_REFERENCE_BY_ID = new Map(
  COMMON_SERVICE_REFERENCES.map((item) => [item.id, item]).filter((entry): entry is [number, CommonServiceReference] => entry[0] !== null),
);

export const COMMON_SERVICE_REFERENCE_BY_SLUG = new Map(
  [...COMMON_SERVICE_REFERENCES, ...FUTURE_SERVICE_REFERENCES].map((item) => [item.slug, item]),
);

const COLLABORATION_MODE_ALIASES: Record<CollaborationModeSlug, string[]> = {
  a_la_carte: ["À la carte", "A la carte", "Prestations à la carte"],
  full_management: ["Gestion complète", "Gestion complète du logement", "full_management", "management"],
  both: ["Les deux", "both"],
};

const indexByNormalizedText = new Map<string, CommonServiceReference[]>();

function addTextIndex(value: string, reference: CommonServiceReference) {
  const key = normalizeCatalogText(value);
  if (!key) return;
  const current = indexByNormalizedText.get(key) ?? [];
  if (!current.some((item) => item.slug === reference.slug)) {
    current.push(reference);
    indexByNormalizedText.set(key, current);
  }
}

[...COMMON_SERVICE_REFERENCES, ...FUTURE_SERVICE_REFERENCES].forEach((reference) => {
  addTextIndex(reference.slug, reference);
  addTextIndex(reference.label, reference);
  reference.legacyAliases.forEach((alias) => addTextIndex(alias, reference));
});

export function resolveCommonServiceById(id: number | string | null | undefined) {
  if (id === null || id === undefined || id === "") return null;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  return COMMON_SERVICE_REFERENCE_BY_ID.get(numericId) ?? null;
}

function resolveCollaborationMode(value: string): ServiceResolution | null {
  const key = normalizeCatalogText(value);
  for (const [mode, aliases] of Object.entries(COLLABORATION_MODE_ALIASES) as Array<[CollaborationModeSlug, string[]]>) {
    if (aliases.some((alias) => normalizeCatalogText(alias) === key)) {
      return { kind: "collaboration_mode", mode, label: aliases[0] };
    }
  }
  return null;
}

export function resolveCommonServiceValue(value: unknown): ServiceResolution {
  const raw = String(value ?? "").trim();
  if (!raw) return { kind: "unknown", value: raw };

  const mode = resolveCollaborationMode(raw);
  if (mode) return mode;

  const bySlug = COMMON_SERVICE_REFERENCE_BY_SLUG.get(raw);
  if (bySlug) return { kind: "service", service: bySlug, confidence: "slug" };

  const candidates = indexByNormalizedText.get(normalizeCatalogText(raw)) ?? [];
  if (candidates.length === 1) {
    const service = candidates[0];
    const confidence = normalizeCatalogText(service.label) === normalizeCatalogText(raw) ? "label" : "alias";
    return { kind: "service", service, confidence };
  }

  if (candidates.length > 1) {
    return {
      kind: "ambiguous",
      value: raw,
      candidates,
      reason: "Plusieurs prestations ou alias historiques correspondent à cette valeur.",
    };
  }

  return { kind: "unknown", value: raw };
}
