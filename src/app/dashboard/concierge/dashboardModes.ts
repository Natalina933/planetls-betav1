export type ConciergeDashboardMode = "essential" | "expert";
export type ConciergeTextScale = "normal" | "large";
export type ConciergeContrastMode = "standard" | "high";

export type ConciergeDashboardPreferences = {
  mode: ConciergeDashboardMode;
  textScale: ConciergeTextScale;
  contrast: ConciergeContrastMode;
};

export const CONCIERGE_DASHBOARD_STORAGE_KEY = "planetls-concierge-dashboard-preferences";

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

export const DEFAULT_CONCIERGE_DASHBOARD_PREFERENCES: ConciergeDashboardPreferences = {
  mode: "essential",
  textScale: "normal",
  contrast: "standard",
};

export function getDefaultConciergeDashboardMode(experienceLevel?: string | null): ConciergeDashboardMode {
  return experienceLevel === "experimente" ? "expert" : "essential";
}

export function parseConciergeDashboardPreferences(
  rawValue: string | null,
  fallbackMode: ConciergeDashboardMode,
): ConciergeDashboardPreferences {
  if (!rawValue) {
    return { ...DEFAULT_CONCIERGE_DASHBOARD_PREFERENCES, mode: fallbackMode };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ConciergeDashboardPreferences>;
    return {
      mode: parsed.mode === "expert" || parsed.mode === "essential" ? parsed.mode : fallbackMode,
      textScale: parsed.textScale === "large" ? "large" : "normal",
      contrast: parsed.contrast === "high" ? "high" : "standard",
    };
  } catch {
    return { ...DEFAULT_CONCIERGE_DASHBOARD_PREFERENCES, mode: fallbackMode };
  }
}
