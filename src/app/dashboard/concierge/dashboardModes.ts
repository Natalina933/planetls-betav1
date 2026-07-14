export type ConciergeDashboardMode = "essential" | "expert";
export type ConciergeOperatingMode = "airbnb_cohost" | "conciergerie" | "provider" | "mixed";
export type ConciergeTextScale = "normal" | "large";
export type ConciergeContrastMode = "standard" | "high";
export type ConciergeWidgetId = "operations" | "notifications" | "missions" | "revenues" | "inspiration" | "reports";

export type ConciergeDashboardPreferences = {
  mode: ConciergeDashboardMode;
  operatingMode: ConciergeOperatingMode;
  textScale: ConciergeTextScale;
  contrast: ConciergeContrastMode;
};

export const CONCIERGE_DASHBOARD_STORAGE_KEY = "planetls-concierge-dashboard-preferences";
export const CONCIERGE_WIDGET_STORAGE_KEY = "planetls.concierge.dashboard.widgets";

export const CONCIERGE_DASHBOARD_MODE_CONFIG: Record<
  ConciergeDashboardMode,
  {
    label: string;
    description: string;
    maxTodayCards: number;
    showStrategicPanels: boolean;
  }
> = {
  essential: {
    label: "Essentiel",
    description: "Priorités du jour, peu de cartes, lecture plus directe.",
    maxTodayCards: 3,
    showStrategicPanels: false,
  },
  expert: {
    label: "Expert",
    description: "Vue complète pour piloter portefeuille, prospection et performance.",
    maxTodayCards: 5,
    showStrategicPanels: true,
  },
};

export const DEFAULT_CONCIERGE_WIDGETS: Record<ConciergeWidgetId, boolean> = {
  operations: true,
  notifications: true,
  missions: true,
  revenues: true,
  inspiration: true,
  reports: true,
};

export const CONCIERGE_OPERATING_MODE_CONFIG: Record<
  ConciergeOperatingMode,
  {
    label: string;
    shortLabel: string;
    badge: string;
    description: string;
    dashboardLead: string;
    priorityLabel: string;
    planningLabel: string;
    demandLabel: string;
    revenueLabel: string;
    reportTitle: string;
    reportSubtitle: string;
    kpiLabels: {
      portfolio: string;
      missions: string;
      arrivals: string;
      quotes: string;
    };
    statDetails: {
      portfolioStable: string;
      missionDetail: string;
      revenueDetail: string;
      notificationEmpty: string;
    };
    widgetDefaults: Record<ConciergeWidgetId, boolean>;
  }
> = {
  airbnb_cohost: {
    label: "Co-hote Airbnb",
    shortLabel: "Co-hote",
    badge: "Mode co-hôte Airbnb",
    description: "Priorité aux voyageurs, check-ins, rotations et revenus locatifs.",
    dashboardLead: "Le cockpit se concentre sur les arrivées, la qualité voyageur et les revenus locatifs.",
    priorityLabel: "Priorité voyageur",
    planningLabel: "Planning voyageurs",
    demandLabel: "Demandes hôtes",
    revenueLabel: "Revenus locatifs",
    reportTitle: "Rapport co-hôte",
    reportSubtitle: "Arrivées, readiness logements, messages voyageurs et revenus projetés.",
    kpiLabels: {
      portfolio: "Annonces suivies",
      missions: "Rotations ouvertes",
      arrivals: "Check-ins",
      quotes: "Revenus à activer",
    },
    statDetails: {
      portfolioStable: "Annonces prêtes pour accueillir.",
      missionDetail: "Rotations, ménages et accueil voyageurs.",
      revenueDetail: "Lecture orientée réservations, options et encaissements.",
      notificationEmpty: "Aucun point voyageur bloquant pour le moment.",
    },
    widgetDefaults: {
      operations: true,
      notifications: true,
      missions: true,
      revenues: true,
      inspiration: false,
      reports: true,
    },
  },
  conciergerie: {
    label: "Conciergerie",
    shortLabel: "Conciergerie",
    badge: "Mode conciergerie",
    description: "Pilotage complet du parc, des propriétaires, des devis et de l'exploitation.",
    dashboardLead: "Le cockpit équilibre parc, propriétaires, missions, devis et performance d'exploitation.",
    priorityLabel: "Priorité exploitation",
    planningLabel: "Planning opérationnel",
    demandLabel: "Demandes propriétaires",
    revenueLabel: "Lecture financière",
    reportTitle: "Rapport conciergerie",
    reportSubtitle: "Portefeuille, missions, devis, encaissements et alertes propriétaires.",
    kpiLabels: {
      portfolio: "Logements",
      missions: "Missions ouvertes",
      arrivals: "Arrivées",
      quotes: "Devis à envoyer",
    },
    statDetails: {
      portfolioStable: "Logements stables et exploitables.",
      missionDetail: "Missions planifiées, urgences et validations.",
      revenueDetail: "Projection devis + demandes qualifiées.",
      notificationEmpty: "Aucune notification bloquante pour le moment.",
    },
    widgetDefaults: DEFAULT_CONCIERGE_WIDGETS,
  },
  provider: {
    label: "Prestataire",
    shortLabel: "Prestataire",
    badge: "Mode prestataire",
    description: "Focus interventions, disponibilités, devis et exécution terrain.",
    dashboardLead: "Le cockpit met en avant interventions, SLA terrain, devis et suivi d'exécution.",
    priorityLabel: "Priorité intervention",
    planningLabel: "Planning interventions",
    demandLabel: "Demandes clients",
    revenueLabel: "CA interventions",
    reportTitle: "Rapport prestataire",
    reportSubtitle: "Interventions, urgences, devis, délais et paiements à recevoir.",
    kpiLabels: {
      portfolio: "Sites clients",
      missions: "Interventions ouvertes",
      arrivals: "Créneaux du jour",
      quotes: "Devis intervention",
    },
    statDetails: {
      portfolioStable: "Sites prêts pour intervention.",
      missionDetail: "Interventions terrain ouvertes ou à planifier.",
      revenueDetail: "CA potentiel issu des interventions et devis.",
      notificationEmpty: "Aucune intervention bloquante pour le moment.",
    },
    widgetDefaults: {
      operations: true,
      notifications: true,
      missions: true,
      revenues: true,
      inspiration: false,
      reports: true,
    },
  },
  mixed: {
    label: "Mixte",
    shortLabel: "Mixte",
    badge: "Mode mixte",
    description: "Vue hybride pour co-hôte, conciergerie et prestations ponctuelles.",
    dashboardLead: "Le cockpit garde ensemble voyageurs, propriétaires, interventions, revenus et reporting.",
    priorityLabel: "Priorité globale",
    planningLabel: "Planning hybride",
    demandLabel: "Demandes à arbitrer",
    revenueLabel: "Revenus consolidés",
    reportTitle: "Rapport mixte",
    reportSubtitle: "Synthèse voyageurs, missions, prestations, devis et revenus consolidés.",
    kpiLabels: {
      portfolio: "Actifs suivis",
      missions: "Travaux ouverts",
      arrivals: "Moments du jour",
      quotes: "Opportunités",
    },
    statDetails: {
      portfolioStable: "Actifs suivis sans point bloquant.",
      missionDetail: "Missions, rotations et interventions ouvertes.",
      revenueDetail: "Projection consolidée devis + demandes + paiements.",
      notificationEmpty: "Aucun arbitrage urgent pour le moment.",
    },
    widgetDefaults: DEFAULT_CONCIERGE_WIDGETS,
  },
};

export const DEFAULT_CONCIERGE_DASHBOARD_PREFERENCES: ConciergeDashboardPreferences = {
  mode: "essential",
  operatingMode: "conciergerie",
  textScale: "normal",
  contrast: "standard",
};

export function getDefaultConciergeDashboardMode(experienceLevel?: string | null): ConciergeDashboardMode {
  return experienceLevel === "experimente" ? "expert" : "essential";
}

export function getDefaultConciergeOperatingMode(role?: string | null): ConciergeOperatingMode {
  if (role === "provider") return "provider";
  return "conciergerie";
}

export function parseConciergeWidgets(rawValue: string | null, fallback = DEFAULT_CONCIERGE_WIDGETS) {
  if (!rawValue) return fallback;

  try {
    const parsed = JSON.parse(rawValue) as Partial<Record<ConciergeWidgetId, unknown>>;
    return (Object.keys(DEFAULT_CONCIERGE_WIDGETS) as ConciergeWidgetId[]).reduce<Record<ConciergeWidgetId, boolean>>(
      (widgets, widgetId) => ({
        ...widgets,
        [widgetId]: typeof parsed[widgetId] === "boolean" ? parsed[widgetId] : fallback[widgetId],
      }),
      { ...fallback },
    );
  } catch {
    return fallback;
  }
}

export function parseConciergeDashboardPreferences(
  rawValue: string | null,
  fallbackMode: ConciergeDashboardMode,
  fallbackOperatingMode: ConciergeOperatingMode = "conciergerie",
): ConciergeDashboardPreferences {
  if (!rawValue) {
    return { ...DEFAULT_CONCIERGE_DASHBOARD_PREFERENCES, mode: fallbackMode, operatingMode: fallbackOperatingMode };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ConciergeDashboardPreferences>;
    const parsedOperatingMode = parsed.operatingMode;
    return {
      mode: parsed.mode === "expert" || parsed.mode === "essential" ? parsed.mode : fallbackMode,
      operatingMode:
        parsedOperatingMode === "airbnb_cohost" ||
        parsedOperatingMode === "conciergerie" ||
        parsedOperatingMode === "provider" ||
        parsedOperatingMode === "mixed"
          ? parsedOperatingMode
          : fallbackOperatingMode,
      textScale: parsed.textScale === "large" ? "large" : "normal",
      contrast: parsed.contrast === "high" ? "high" : "standard",
    };
  } catch {
    return { ...DEFAULT_CONCIERGE_DASHBOARD_PREFERENCES, mode: fallbackMode, operatingMode: fallbackOperatingMode };
  }
}


