export const DEFAULT_AVATAR = "/icons/account-svgrepo-com.svg";

export const formatExperienceLabel = (
  level: "debutant" | "intermediaire" | "experimente" | null,
): string => {
  switch (level) {
    case "debutant":
      return "Débutant";
    case "intermediaire":
      return "Petite expérience";
    case "experimente":
      return "Expérimenté";
    default:
      return "Non renseigné";
  }
};

export const formatCurrency = (value: number, currency = "EUR"): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const normalizeSectionId = (title: string) =>
  title.replace(/[^a-zA-Z0-9]/g, "_");

export const SECTION_IDS = {
  INFO_PERSO: normalizeSectionId("Informations personnelles"),
  PRESENTATION: normalizeSectionId("Presentation de la conciergerie"),
  SERVICES_ZONE: normalizeSectionId("Services & Zone d'intervention"),
  TARIFS: normalizeSectionId("Ma grille tarifaire"),
  INSPIRATION_VIDEOS: normalizeSectionId("Videos d'inspiration"),
} as const;

export const TARIFF_SECTION_IDS = {
  WORKFLOW: normalizeSectionId("Parcours devis & facturation"),
  CONFIG: normalizeSectionId("Configuration tarifs conciergerie"),
  BILLING_DESK: normalizeSectionId("Devis et factures opérationnels"),
} as const;

export const MISSION_SECTION_IDS = {
  SERVICES: normalizeSectionId("Services proposés"),
  ZONE_RULES: normalizeSectionId("Zone, disponibilités & règles de mission"),
  WEEKLY_AVAILABILITY: normalizeSectionId("Disponibilités hebdomadaires"),
} as const;
