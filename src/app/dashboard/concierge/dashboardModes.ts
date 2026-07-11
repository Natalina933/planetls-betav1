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
    description: "Priorites du jour, peu de cartes, lecture plus directe.",
    maxTodayCards: 3,
    showStrategicPanels: false,
  },
  expert: {
    label: "Expert",
    description: "Vue complete pour piloter portefeuille, prospection et performance.",
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
    badge: "Mode co-hote Airbnb",
    description: "Priorite aux voyageurs, check-ins, rotations et revenus locatifs.",
    dashboardLead: "Le cockpit se concentre sur les arrivees, la qualite voyageur et les revenus locatifs.",
    priorityLabel: "Priorite voyageur",
    planningLabel: "Planning voyageurs",
    demandLabel: "Demandes hotes",
    revenueLabel: "Revenus locatifs",
    reportTitle: "Rapport co-hote",
    reportSubtitle: "Arrivees, readiness logements, messages voyageurs et revenus projetes.",
    kpiLabels: {
      portfolio: "Annonces suivies",
      missions: "Rotations ouvertes",
      arrivals: "Check-ins",
      quotes: "Revenus a activer",
    },
    statDetails: {
      portfolioStable: "Annonces pretes pour accueillir.",
      missionDetail: "Rotations, menages et accueil voyageurs.",
      revenueDetail: "Lecture orientee reservations, options et encaissements.",
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
    description: "Pilotage complet du parc, des proprietaires, des devis et de l'exploitation.",
    dashboardLead: "Le cockpit equilibre parc, proprietaires, missions, devis et performance d'exploitation.",
    priorityLabel: "Priorite exploitation",
    planningLabel: "Planning operationnel",
    demandLabel: "Demandes proprietaires",
    revenueLabel: "Lecture financiere",
    reportTitle: "Rapport conciergerie",
    reportSubtitle: "Portefeuille, missions, devis, encaissements et alertes proprietaires.",
    kpiLabels: {
      portfolio: "Logements",
      missions: "Missions ouvertes",
      arrivals: "Arrivees",
      quotes: "Devis a envoyer",
    },
    statDetails: {
      portfolioStable: "Logements stables et exploitables.",
      missionDetail: "Missions planifiees, urgences et validations.",
      revenueDetail: "Projection devis + demandes qualifiees.",
      notificationEmpty: "Aucune notification bloquante pour le moment.",
    },
    widgetDefaults: DEFAULT_CONCIERGE_WIDGETS,
  },
  provider: {
    label: "Prestataire",
    shortLabel: "Prestataire",
    badge: "Mode prestataire",
    description: "Focus interventions, disponibilites, devis et execution terrain.",
    dashboardLead: "Le cockpit met en avant interventions, SLA terrain, devis et suivi d'execution.",
    priorityLabel: "Priorite intervention",
    planningLabel: "Planning interventions",
    demandLabel: "Demandes clients",
    revenueLabel: "CA interventions",
    reportTitle: "Rapport prestataire",
    reportSubtitle: "Interventions, urgences, devis, delais et paiements a recevoir.",
    kpiLabels: {
      portfolio: "Sites clients",
      missions: "Interventions ouvertes",
      arrivals: "Creneaux du jour",
      quotes: "Devis intervention",
    },
    statDetails: {
      portfolioStable: "Sites prets pour intervention.",
      missionDetail: "Interventions terrain ouvertes ou a planifier.",
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
    description: "Vue hybride pour co-hote, conciergerie et prestations ponctuelles.",
    dashboardLead: "Le cockpit garde ensemble voyageurs, proprietaires, interventions, revenus et reporting.",
    priorityLabel: "Priorite globale",
    planningLabel: "Planning hybride",
    demandLabel: "Demandes a arbitrer",
    revenueLabel: "Revenus consolides",
    reportTitle: "Rapport mixte",
    reportSubtitle: "Synthese voyageurs, missions, prestations, devis et revenus consolides.",
    kpiLabels: {
      portfolio: "Actifs suivis",
      missions: "Travaux ouverts",
      arrivals: "Moments du jour",
      quotes: "Opportunites",
    },
    statDetails: {
      portfolioStable: "Actifs suivis sans point bloquant.",
      missionDetail: "Missions, rotations et interventions ouvertes.",
      revenueDetail: "Projection consolidee devis + demandes + paiements.",
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