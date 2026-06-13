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

export type VisualToken = {
  name: string;
  value: string;
  usage: string;
};

export type NamedVisualElement = {
  name: string;
  label: string;
  source: string;
  usage: string;
};

export type ProfileVisualKit = {
  id: ProfileVisualRole;
  title: string;
  persona: string;
  image: string;
  accent: string;
  colors: VisualToken[];
  typography: VisualToken[];
  components: NamedVisualElement[];
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
    persona:
      "Piloter son patrimoine, valider vite, garder une vue claire sur les revenus et les urgences.",
    image: "/icons/proprio_belle_epoque.png",
    accent: "#b88935",
    colors: [
      {
        name: "owner.accent.gold",
        value: "#b88935",
        usage: "Boutons, contours et éléments à forte valeur propriétaire.",
      },
      {
        name: "owner.text.ink",
        value: "#4b312a",
        usage: "Titres de cartes logement et textes importants.",
      },
      {
        name: "owner.surface.paper",
        value: "#fffaf3",
        usage: "Fonds de panneaux, checklists et zones guidées.",
      },
      {
        name: "owner.warning.terracotta",
        value: "#b85c48",
        usage: "Points à corriger, alertes et badges de capacité.",
      },
      {
        name: "owner.success.green",
        value: "#2f7550",
        usage: "Fiche complète et validation.",
      },
    ],
    typography: [
      {
        name: "owner.title",
        value: "Montserrat / 700",
        usage: "Titres de section et noms de logements.",
      },
      {
        name: "owner.body",
        value: "Open Sans / 400",
        usage: "Descriptions, détails et textes d’aide.",
      },
      {
        name: "owner.elegant",
        value: "Cormorant Garamond / serif",
        usage: "Accent éditorial quand le style Belle Époque est souhaité.",
      },
    ],
    components: [
      {
        name: "OwnerHousingSummaryDonut",
        label: "Camembert synthèse logement",
        source: "MetricDonut",
        usage: "Résumé Prêts, À préparer, Mouvements, Infos clés.",
      },
      {
        name: "OwnerHousingReviewPanel",
        label: "Panneau logement à revoir",
        source: "HousingListPage.reviewPanel",
        usage: "Bloc d’alerte en haut de /dashboard/owner/logements.",
      },
      {
        name: "OwnerHousingCard",
        label: "Carte logement propriétaire",
        source: "HousingListPage.renderOwnerHousingCards",
        usage: "Carte image + statut + checklist + bouton corriger.",
      },
      {
        name: "OwnerHousingFilterButtons",
        label: "Filtres Tous / À revoir",
        source: "HousingListPage filterButton",
        usage: "Basculer entre la liste complète et les corrections.",
      },
    ],
    surfaces: [
      {
        label: "Patrimoine",
        description:
          "Logements, états, documents et demandes liées à chaque bien.",
        token: "DashboardHomeIcon",
        usage: "Cartes logement, sidebar, résumé owner.",
      },
      {
        label: "Performance",
        description:
          "Revenus, devis, factures et occupation à suivre sans surcharge.",
        token: "CircleDollarSign",
        usage: "StatsCard finance + camembert revenus.",
      },
      {
        label: "Décisions",
        description: "Demandes à valider, devis en attente, alertes logement.",
        token: "DashboardStatusBadge/warning",
        usage: "Badge action prioritaire.",
      },
    ],
    charts: [
      {
        title: "Répartition propriétaire",
        description:
          "Lecture rapide de ce qui doit être visible sur le dashboard propriétaire.",
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
    persona:
      "Organiser les missions, suivre les propriétaires, fluidifier les services et les partenaires.",
    image: "/icons/concierges_belle_epoque.png",
    accent: "#2f7a54",
    colors: [
      {
        name: "concierge.accent.green",
        value: "#2f7a54",
        usage: "Missions, validation opérationnelle et éléments principaux.",
      },
      {
        name: "concierge.support.sage",
        value: "#87ad79",
        usage: "Portefeuille propriétaires et aides secondaires.",
      },
      {
        name: "concierge.warning.gold",
        value: "#d3a63f",
        usage: "Services à organiser et points d’attention.",
      },
    ],
    typography: [
      {
        name: "concierge.title",
        value: "Montserrat / 700",
        usage: "Titres opérationnels.",
      },
      {
        name: "concierge.body",
        value: "Open Sans / 400",
        usage: "Instructions, listes et détails de missions.",
      },
    ],
    components: [
      {
        name: "ConciergeMissionCard",
        label: "Carte mission",
        source: "DashboardMetricCard",
        usage: "Suivi journée et cadence.",
      },
      {
        name: "ConciergeServiceIcon",
        label: "Pictogramme service",
        source: "ServiceCategoryIcon",
        usage: "Catalogue ménage, linge, accueil, maintenance.",
      },
    ],
    surfaces: [
      {
        label: "Missions",
        description: "Planning, cadence, checklists, statuts de tournée.",
        token: "CalendarDays + mission pace",
        usage: "DashboardMetricCard missions.",
      },
      {
        label: "Portefeuille",
        description: "Propriétaires, logements rattachés et zones couvertes.",
        token: "ServiceCategoryIcon(Proprietaire)",
        usage: "Listes et fiches relation.",
      },
      {
        label: "Services",
        description:
          "Catalogue ménage, linge, accueil, maintenance et options.",
        token: "ServiceCategoryIcon",
        usage: "ServiceCatalogSelector.",
      },
    ],
    charts: [
      {
        title: "Répartition concierge",
        description:
          "Priorité aux opérations quotidiennes et à la charge mission.",
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
    persona:
      "Recevoir les interventions, préparer les devis, planifier les passages et prouver le travail fait.",
    image: "/icons/artisans_belle_epoque.png",
    accent: "#3b5f83",
    colors: [
      {
        name: "provider.accent.blue",
        value: "#3b5f83",
        usage: "Interventions et navigation artisan.",
      },
      {
        name: "provider.quote.gold",
        value: "#d4a444",
        usage: "Devis et revenus.",
      },
      {
        name: "provider.proof.slate",
        value: "#6f89a8",
        usage: "Preuves, documents, photos après intervention.",
      },
    ],
    typography: [
      {
        name: "provider.title",
        value: "Montserrat / 700",
        usage: "Titres intervention, devis et planning.",
      },
      {
        name: "provider.body",
        value: "Open Sans / 400",
        usage: "Détails chantier, notes et preuves.",
      },
    ],
    components: [
      {
        name: "ProviderInterventionCard",
        label: "Carte intervention",
        source: "ServiceCategoryIcon(Artisan)",
        usage: "Demandes entrantes et suivi terrain.",
      },
      {
        name: "ProviderQuoteBadge",
        label: "Badge devis",
        source: "Badge gold/warning",
        usage: "Statut des devis et factures.",
      },
    ],
    surfaces: [
      {
        label: "Interventions",
        description:
          "Demandes entrantes, urgence, affectation et suivi terrain.",
        token: "ServiceCategoryIcon(Artisan)",
        usage: "Dashboard provider + demandes.",
      },
      {
        label: "Devis",
        description:
          "Préparation, envoi, validation et transformation en mission.",
        token: "CircleDollarSign",
        usage: "Cartes finance/devis.",
      },
      {
        label: "Preuves",
        description: "Photos, notes, garanties et clôture d’intervention.",
        token: "CheckCircle2",
        usage: "Badges validation.",
      },
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

export const PROFILE_VISUAL_KIT_IMPORT =
  "PROFILE_VISUAL_KITS depuis @/app/lib/profileVisualKit";
