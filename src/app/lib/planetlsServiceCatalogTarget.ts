export const PLANETLS_SERVICE_FAMILIES = [
  { slug: "cleaning_linen", label: "Ménage et linge" },
  { slug: "guest_concierge", label: "Conciergerie et voyageurs" },
  { slug: "maintenance_repair", label: "Maintenance et dépannage" },
  { slug: "renovation_works", label: "Travaux et rénovation" },
  { slug: "outdoor_equipment", label: "Extérieurs et équipements" },
  { slug: "photography_visual", label: "Photographie et valorisation" },
  { slug: "communication_marketing", label: "Communication et marketing" },
  {
    slug: "management_complementary",
    label: "Gestion et services complémentaires",
  },
] as const;

export type PlanetLSServiceFamily =
  (typeof PLANETLS_SERVICE_FAMILIES)[number]["slug"];

export type PlanetLSServiceEntryKind = "service" | "group";

export type PlanetLSServiceTargetEntry = {
  slug: string;
  label: string;
  family: PlanetLSServiceFamily;
  kind: PlanetLSServiceEntryKind;
  legacyId?: number;
};

export const PLANETLS_SERVICE_TARGET: PlanetLSServiceTargetEntry[] = [
  // 1. Ménage et linge
  {
    slug: "cleaning_standard",
    label: "Ménage du logement",
    family: "cleaning_linen",
    kind: "service",
    legacyId: 1,
  },
  {
    slug: "cleaning_turnover",
    label: "Ménage entre deux séjours",
    family: "cleaning_linen",
    kind: "service",
    legacyId: 2,
  },
  {
    slug: "cleaning_deep",
    label: "Grand ménage",
    family: "cleaning_linen",
    kind: "service",
    legacyId: 3,
  },
  {
    slug: "linen_change",
    label: "Changement de linge",
    family: "cleaning_linen",
    kind: "service",
    legacyId: 9,
  },
  {
    slug: "linen_laundry_full",
    label: "Blanchisserie",
    family: "cleaning_linen",
    kind: "service",
    legacyId: 10,
  },
  {
    slug: "linen_supply",
    label: "Fourniture de linge",
    family: "cleaning_linen",
    kind: "service",
    legacyId: 11,
  },

  // 2. Conciergerie et voyageurs
  {
    slug: "guest_checkin",
    label: "Check-in",
    family: "guest_concierge",
    kind: "service",
  },
  {
    slug: "guest_checkout",
    label: "Check-out",
    family: "guest_concierge",
    kind: "service",
  },
  {
    slug: "guest_support_during_stay",
    label: "Assistance voyageurs",
    family: "guest_concierge",
    kind: "service",
    legacyId: 23,
  },
  {
    slug: "access_management",
    label: "Gestion des clés et accès",
    family: "guest_concierge",
    kind: "group",
  },
  {
    slug: "guest_welcome_preparation",
    label: "Préparation de l'accueil",
    family: "guest_concierge",
    kind: "group",
  },
  {
    slug: "guest_home_tour",
    label: "Visite et présentation du logement",
    family: "guest_concierge",
    kind: "service",
    legacyId: 19,
  },

  // 3. Maintenance et dépannage
  {
    slug: "maintenance_minor_repairs",
    label: "Petites réparations",
    family: "maintenance_repair",
    kind: "group",
    legacyId: 26,
  },
  {
    slug: "plumbing_repair",
    label: "Dépannage plomberie",
    family: "maintenance_repair",
    kind: "service",
  },
  {
    slug: "electrical_repair",
    label: "Dépannage électrique",
    family: "maintenance_repair",
    kind: "service",
  },
  {
    slug: "maintenance_lock_troubleshooting",
    label: "Serrurerie et dépannage des accès",
    family: "maintenance_repair",
    kind: "service",
    legacyId: 32,
  },
  {
    slug: "equipment_maintenance_repair",
    label: "Entretien et dépannage des équipements",
    family: "maintenance_repair",
    kind: "group",
  },
  {
    slug: "maintenance_condition_check",
    label: "Contrôle et entretien du logement",
    family: "maintenance_repair",
    kind: "service",
    legacyId: 25,
  },

  // 4. Travaux et rénovation
  {
    slug: "painting_wall_coverings",
    label: "Peinture et revêtements muraux",
    family: "renovation_works",
    kind: "group",
  },
  {
    slug: "plumbing_installation",
    label: "Plomberie et sanitaires",
    family: "renovation_works",
    kind: "group",
  },
  {
    slug: "electrical_installation",
    label: "Électricité et éclairage",
    family: "renovation_works",
    kind: "group",
  },
  {
    slug: "carpentry_fitting",
    label: "Menuiserie et agencement",
    family: "renovation_works",
    kind: "group",
  },
  {
    slug: "flooring_tiling",
    label: "Sols et carrelage",
    family: "renovation_works",
    kind: "group",
  },
  {
    slug: "masonry_partitions",
    label: "Maçonnerie et cloisons",
    family: "renovation_works",
    kind: "group",
  },
  {
    slug: "bathroom_renovation",
    label: "Rénovation salle de bain",
    family: "renovation_works",
    kind: "service",
  },
  {
    slug: "kitchen_renovation",
    label: "Rénovation cuisine",
    family: "renovation_works",
    kind: "service",
  },
  {
    slug: "full_renovation",
    label: "Rénovation complète",
    family: "renovation_works",
    kind: "service",
  },
  {
    slug: "heating_air_conditioning",
    label: "Chauffage et climatisation",
    family: "renovation_works",
    kind: "group",
  },
  {
    slug: "energy_renovation",
    label: "Isolation et rénovation énergétique",
    family: "renovation_works",
    kind: "group",
  },
  {
    slug: "roofing_facade_works",
    label: "Toiture et façade",
    family: "renovation_works",
    kind: "group",
  },

  // 5. Extérieurs et équipements
  {
    slug: "outdoor_gardening",
    label: "Jardinage et espaces verts",
    family: "outdoor_equipment",
    kind: "group",
    legacyId: 50,
  },
  {
    slug: "pool_spa_maintenance",
    label: "Piscine et spa",
    family: "outdoor_equipment",
    kind: "group",
  },
  {
    slug: "outdoor_area_maintenance",
    label: "Terrasses et espaces extérieurs",
    family: "outdoor_equipment",
    kind: "group",
  },
  {
    slug: "outdoor_access_maintenance",
    label: "Accès et aménagements extérieurs",
    family: "outdoor_equipment",
    kind: "group",
    legacyId: 54,
  },
  {
    slug: "roof_drainage_maintenance",
    label: "Toitures et évacuations",
    family: "outdoor_equipment",
    kind: "service",
  },
  {
    slug: "seasonal_outdoor_maintenance",
    label: "Entretien saisonnier",
    family: "outdoor_equipment",
    kind: "service",
  },

  // 6. Photographie et valorisation
  {
    slug: "real_estate_photography",
    label: "Photographie immobilière",
    family: "photography_visual",
    kind: "service",
  },
  {
    slug: "admin_professional_photography",
    label: "Photographie professionnelle",
    family: "photography_visual",
    kind: "service",
    legacyId: 45,
  },
  {
    slug: "presentation_video",
    label: "Vidéo de présentation",
    family: "photography_visual",
    kind: "service",
  },
  {
    slug: "drone_photography",
    label: "Prises de vue par drone",
    family: "photography_visual",
    kind: "service",
  },
  {
    slug: "virtual_tour_360",
    label: "Visite virtuelle 360°",
    family: "photography_visual",
    kind: "service",
  },
  {
    slug: "visual_enhancement",
    label: "Retouche et valorisation visuelle",
    family: "photography_visual",
    kind: "service",
  },

  // 7. Communication et marketing
  {
    slug: "social_media_management",
    label: "Gestion des réseaux sociaux",
    family: "communication_marketing",
    kind: "service",
  },
  {
    slug: "content_creation",
    label: "Création de contenus",
    family: "communication_marketing",
    kind: "service",
  },
  {
    slug: "website_creation",
    label: "Création de site internet",
    family: "communication_marketing",
    kind: "service",
  },
  {
    slug: "seo_local_visibility",
    label: "Référencement et visibilité",
    family: "communication_marketing",
    kind: "group",
  },
  {
    slug: "visual_identity_design",
    label: "Identité visuelle et graphisme",
    family: "communication_marketing",
    kind: "group",
  },
  {
    slug: "advertising_campaigns",
    label: "Publicité et campagnes",
    family: "communication_marketing",
    kind: "group",
  },
  {
    slug: "marketing_strategy",
    label: "Stratégie marketing et communication",
    family: "communication_marketing",
    kind: "service",
  },

  // 8. Gestion et services complémentaires
  {
    slug: "admin_booking_management",
    label: "Gestion des réservations",
    family: "management_complementary",
    kind: "service",
    legacyId: 41,
  },
  {
    slug: "administrative_management",
    label: "Gestion administrative",
    family: "management_complementary",
    kind: "group",
  },
  {
    slug: "financial_reporting",
    label: "Suivi financier et reporting",
    family: "management_complementary",
    kind: "service",
  },
  {
    slug: "shopping_supplies",
    label: "Courses et approvisionnement",
    family: "management_complementary",
    kind: "group",
  },
  {
    slug: "maintenance_provider_coordination",
    label: "Coordination des prestataires",
    family: "management_complementary",
    kind: "service",
    legacyId: 30,
  },
  {
    slug: "comfort_services",
    label: "Services de confort",
    family: "management_complementary",
    kind: "group",
  },
  {
    slug: "property_inventory_inspection",
    label: "États des lieux et inventaires",
    family: "management_complementary",
    kind: "service",
  },
  {
    slug: "eco_services",
    label: "Services écologiques",
    family: "management_complementary",
    kind: "group",
  },
  {
    slug: "deposits_disputes_management",
    label: "Gestion des cautions et litiges",
    family: "management_complementary",
    kind: "service",
  },
];
