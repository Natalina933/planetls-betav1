export type ProfileVisualRole = "owner" | "concierge" | "provider";

export type VisualKitItem = {
  label: string;
  description: string;
  token: string;
  usage: string;
};

export type VisualKitSlice = {
  label: string;
  value: number;
  color: string;
};

export type ProfileVisualKit = {
  id: ProfileVisualRole;
  title: string;
  persona: string;
  image: string;
  accent: string;
  surfaces: VisualKitItem[];
  charts: {
    title: string;
    description: string;
    slices: VisualKitSlice[];
  }[];
};

export const PROFILE_VISUAL_KITS: ProfileVisualKit[] = [
  {
    id: "owner",
    title: "Kit propriétaire",
    persona: "Piloter son patrimoine, valider vite, garder une vue claire sur les revenus et les urgences.",
    image: "/icons/proprio_belle_epoque.png",
    accent: "#b88935",
    surfaces: [
      { label: "Patrimoine", description: "Logements, états, documents et demandes liées à chaque bien.", token: "DashboardHomeIcon", usage: "Cartes logement, sidebar, résumé owner." },
      { label: "Performance", description: "Revenus, devis, factures et occupation à suivre sans surcharge.", token: "CircleDollarSign", usage: "StatsCard finance + camembert revenus." },
      { label: "Décisions", description: "Demandes à valider, devis en attente, alertes logement.", token: "DashboardStatusBadge/warning", usage: "Badge action prioritaire." },
    ],
    charts: [
      {
        title: "Répartition propriétaire",
        description: "Lecture rapide de ce qui doit être visible sur le dashboard propriétaire.",
        slices: [
          { label: "Logements", value: 42, color: "#b88935" },
          { label: "Revenus", value: 28, color: "#285a45" },
          { label: "Demandes", value: 18, color: "#d7a94d" },
          { label: "Alertes", value: 12, color: "#a84f3f" },
        ],
      },
    ],
  },
  {
    id: "concierge",
    title: "Kit concierge",
    persona: "Organiser les missions, suivre les propriétaires, fluidifier les services et les partenaires.",
    image: "/icons/concierges_belle_epoque.png",
    accent: "#2f7a54",
    surfaces: [
      { label: "Missions", description: "Planning, cadence, checklists, statuts de tournée.", token: "CalendarDays + mission pace", usage: "DashboardMetricCard missions." },
      { label: "Portefeuille", description: "Propriétaires, logements rattachés et zones couvertes.", token: "ServiceCategoryIcon(Proprietaire)", usage: "Listes et fiches relation." },
      { label: "Services", description: "Catalogue ménage, linge, accueil, maintenance et options.", token: "ServiceCategoryIcon", usage: "ServiceCatalogSelector." },
    ],
    charts: [
      {
        title: "Répartition concierge",
        description: "Priorité aux opérations quotidiennes et à la charge mission.",
        slices: [
          { label: "Missions", value: 46, color: "#2f7a54" },
          { label: "Propriétaires", value: 20, color: "#87ad79" },
          { label: "Services", value: 22, color: "#d3a63f" },
          { label: "Urgences", value: 12, color: "#b95745" },
        ],
      },
    ],
  },
  {
    id: "provider",
    title: "Kit artisan",
    persona: "Recevoir les interventions, préparer les devis, planifier les passages et prouver le travail fait.",
    image: "/icons/artisans_belle_epoque.png",
    accent: "#3b5f83",
    surfaces: [
      { label: "Interventions", description: "Demandes entrantes, urgence, affectation et suivi terrain.", token: "ServiceCategoryIcon(Artisan)", usage: "Dashboard provider + demandes." },
      { label: "Devis", description: "Préparation, envoi, validation et transformation en mission.", token: "CircleDollarSign", usage: "Cartes finance/devis." },
      { label: "Preuves", description: "Photos, notes, garanties et clôture d’intervention.", token: "CheckCircle2", usage: "Badges validation." },
    ],
    charts: [
      {
        title: "Répartition artisan",
        description: "Un tableau simple orienté exécution, devis et preuves.",
        slices: [
          { label: "Interventions", value: 44, color: "#3b5f83" },
          { label: "Devis", value: 24, color: "#d4a444" },
          { label: "Planning", value: 18, color: "#567b63" },
          { label: "Preuves", value: 14, color: "#6f89a8" },
        ],
      },
    ],
  },
];

export const PROFILE_VISUAL_KIT_IMPORT = "PROFILE_VISUAL_KITS depuis @/app/lib/profileVisualKit";
