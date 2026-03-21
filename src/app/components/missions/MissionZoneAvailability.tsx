"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import styles from "./MissionZoneAvailability.module.scss";
import type { MissionAvailability } from "./types";
import MissionAcceptanceRules from "./MissionAcceptanceRules";
import AvailabilityEditor from "./AvailabilityEditor";

const MissionMap = dynamic(() => import("./MissionMap"), {
  ssr: false,
  loading: () => (
    <div className={styles.mapLoading}>
      <div className={styles.spinnerMini} />
      <span>Chargement de la carte interactive...</span>
    </div>
  ),
});

interface Props {
  value: MissionAvailability | null;
  isEditing: boolean;
  onChange: (value: MissionAvailability) => void;
  showZoneSection?: boolean;
  showScheduleSection?: boolean;
  showRulesSection?: boolean;
  lockZones?: boolean;
}

const DEFAULT_VALUE: MissionAvailability = {
  zones: [],
  radiusKm: 30,
  schedule: [],
  emergency24h: false,
  rules: {
    refuseOutOfZone: true,
    refuseOutOfSchedule: true,
    autoAcceptEmergency: false,
  },
};

function getState(value: MissionAvailability | null): MissionAvailability {
  return value ? value : { ...DEFAULT_VALUE, rules: { ...DEFAULT_VALUE.rules } };
}

export default function MissionZoneAvailability({
  value,
  isEditing,
  onChange,
  showZoneSection = true,
  showScheduleSection = true,
  showRulesSection = true,
  lockZones = false,
}: Props) {
  const state = getState(value);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const visibleZones = lockZones ? state.zones.slice(0, 1) : state.zones;
  const primaryZone = visibleZones[0] ?? null;
  const normalizedState = lockZones ? { ...state, zones: visibleZones } : state;

  const focusSearchField = () => {
    const input = containerRef.current?.querySelector<HTMLInputElement>(
      'input[aria-label="Rechercher un code postal ou une ville reconnue"]',
    );
    input?.focus();
    input?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const updateZones = (zones: MissionAvailability["zones"]) => {
    if (!isEditing) return;
    onChange({
      ...normalizedState,
      zones: lockZones ? zones.slice(-1) : zones,
    });
  };

  const updateRadius = (radiusKm: number) => {
    if (!isEditing) return;
    onChange({ ...normalizedState, radiusKm });
  };

  const removeZone = () => {
    if (!isEditing || !primaryZone) return;
    onChange({
      ...normalizedState,
      zones: [],
    });
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {showZoneSection ? (
        <section className={styles.block}>
          <div className={styles.blockHeader}>
            <div>
              <h4 className={styles.blockTitle}>Définir ma zone</h4>
            </div>
          </div>

          {!primaryZone ? (
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyStateCopy}>
                <h5>Aucune zone définie</h5>
                <p>
                  Renseignez un code postal, une ville ou un arrondissement pour cadrer vos
                  demandes entrantes.
                </p>
              </div>
              {isEditing ? (
                <button
                  type="button"
                  className={styles.searchCta}
                  onClick={focusSearchField}
                >
                  Rechercher une zone
                </button>
              ) : null}
            </div>
          ) : null}

          <div className={styles.mapWrapper}>
            <MissionMap
              zones={visibleZones}
              radiusKm={state.radiusKm}
              onZonesChange={updateZones}
              isEditing={isEditing}
            />
          </div>

          <div className={styles.radiusSection}>
            <div className={styles.radiusHeader}>
              <span className={styles.radiusEyebrow}>Rayon d’intervention</span>

              {!isEditing && primaryZone ? (
                <span className={styles.savedIndicator} role="status">
                  Sauvegardé
                </span>
              ) : null}
            </div>

            <label htmlFor="radius-input" className={styles.radiusLabel}>
              <span className={styles.radiusTitle}>Ajuster la couverture autour de la zone</span>
              <span className={styles.radiusValue}>{state.radiusKm} km</span>
            </label>

            <input
              id="radius-input"
              type="range"
              min={1}
              max={100}
              value={state.radiusKm}
              onChange={(e) => updateRadius(Number(e.target.value))}
              className={styles.radiusSlider}
              aria-label="Ajuster le rayon de couverture en kilomètres"
              disabled={!isEditing}
              aria-disabled={!isEditing}
            />

            <div className={styles.radiusScale} aria-hidden="true">
              <span>1 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>

            <p className={styles.radiusHint}>
              Faites glisser le curseur pour élargir ou réduire votre zone d’intervention.
            </p>
          </div>

          {isEditing && primaryZone ? (
            <div className={styles.selectionActions}>
              <button
                type="button"
                className={styles.removeZoneBtn}
                onClick={removeZone}
              >
                Supprimer la zone
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {showScheduleSection ? (
        <section className={styles.block}>
          <h4 className={styles.blockTitle}>Disponibilités hebdomadaires</h4>

          <AvailabilityEditor
            value={state.schedule}
            emergency24h={state.emergency24h}
            isEditing={isEditing}
            onChange={(schedule, emergency24h) => {
              const nextRules = emergency24h
                ? {
                    ...normalizedState.rules,
                    refuseOutOfSchedule: false,
                    autoAcceptEmergency: false,
                  }
                : normalizedState.rules;

              onChange({
                ...normalizedState,
                schedule,
                emergency24h,
                rules: nextRules,
              });
            }}
          />
        </section>
      ) : null}

      {showRulesSection ? (
        <section className={styles.block}>
          <h4 className={styles.blockTitle}>Règles d&apos;automatisation</h4>

          <MissionAcceptanceRules
            value={state.rules}
            isEditing={isEditing}
            onChange={(rules) => onChange({ ...normalizedState, rules })}
          />
        </section>
      ) : null}
    </div>
  );
}
