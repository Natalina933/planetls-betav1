"use client";

import { useEffect, useState } from "react";
import {
  CONCIERGE_DASHBOARD_MODE_CONFIG,
  CONCIERGE_DASHBOARD_STORAGE_KEY,
  getDefaultConciergeDashboardMode,
  parseConciergeDashboardPreferences,
  type ConciergeContrastMode,
  type ConciergeDashboardMode,
  type ConciergeDashboardPreferences,
  type ConciergeTextScale,
} from "./dashboardModes";
import styles from "./ConciergeDashboardModeControls.module.scss";

type ConciergeDashboardModeControlsProps = {
  experienceLevel?: string | null;
  onPreferencesChange: (preferences: ConciergeDashboardPreferences) => void;
};

export default function ConciergeDashboardModeControls({
  experienceLevel,
  onPreferencesChange,
}: ConciergeDashboardModeControlsProps) {
  const fallbackMode = getDefaultConciergeDashboardMode(experienceLevel);
  const [preferences, setPreferences] = useState<ConciergeDashboardPreferences>(() => ({
    mode: fallbackMode,
    textScale: "normal",
    contrast: "standard",
  }));

  useEffect(() => {
    const nextPreferences = parseConciergeDashboardPreferences(
      window.localStorage.getItem(CONCIERGE_DASHBOARD_STORAGE_KEY),
      fallbackMode,
    );
    setPreferences(nextPreferences);
    onPreferencesChange(nextPreferences);
  }, [fallbackMode, onPreferencesChange]);

  useEffect(() => {
    document.body.dataset.conciergeDashboardMode = preferences.mode;
    document.body.dataset.conciergeTextScale = preferences.textScale;
    document.body.dataset.conciergeContrast = preferences.contrast;
    onPreferencesChange(preferences);

    try {
      window.localStorage.setItem(CONCIERGE_DASHBOARD_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Dashboard preferences are a comfort feature and should never block rendering.
    }
  }, [onPreferencesChange, preferences]);

  const updatePreference = <TKey extends keyof ConciergeDashboardPreferences>(
    key: TKey,
    value: ConciergeDashboardPreferences[TKey],
  ) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const modeOptions: ConciergeDashboardMode[] = ["essential", "expert"];
  const textOptions: Array<{ value: ConciergeTextScale; label: string }> = [
    { value: "normal", label: "A" },
    { value: "large", label: "A+" },
  ];
  const contrastOptions: Array<{ value: ConciergeContrastMode; label: string }> = [
    { value: "standard", label: "Standard" },
    { value: "high", label: "Contraste" },
  ];

  return (
    <section className={styles.controls} aria-label="Préférences du dashboard">
      <div className={styles.modeGroup} role="group" aria-label="Mode d'affichage">
        {modeOptions.map((mode) => (
          <button
            key={mode}
            type="button"
            className={preferences.mode === mode ? styles.activeButton : styles.button}
            onClick={() => updatePreference("mode", mode)}
            aria-pressed={preferences.mode === mode}
          >
            <strong>{CONCIERGE_DASHBOARD_MODE_CONFIG[mode].label}</strong>
            <span>{CONCIERGE_DASHBOARD_MODE_CONFIG[mode].description}</span>
          </button>
        ))}
      </div>

      <div className={styles.accessibilityGroup} aria-label="Accessibilité">
        <div role="group" aria-label="Taille du texte">
          {textOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={preferences.textScale === option.value ? styles.smallActive : styles.smallButton}
              onClick={() => updatePreference("textScale", option.value)}
              aria-pressed={preferences.textScale === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div role="group" aria-label="Contraste">
          {contrastOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={preferences.contrast === option.value ? styles.smallActive : styles.smallButton}
              onClick={() => updatePreference("contrast", option.value)}
              aria-pressed={preferences.contrast === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
