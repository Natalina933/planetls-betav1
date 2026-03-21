"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
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

const ZONE_STYLES = [
  { stroke: "#1d4ed8", surface: "#dbeafe" },
  { stroke: "#0f766e", surface: "#ccfbf1" },
  { stroke: "#b45309", surface: "#fef3c7" },
  { stroke: "#be185d", surface: "#fce7f3" },
  { stroke: "#6d28d9", surface: "#ede9fe" },
];

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

  const visibleZones = lockZones ? state.zones.slice(0, 1) : state.zones;
  const canEditZones = isEditing;
  const normalizedState = lockZones ? { ...state, zones: visibleZones } : state;

  const updateZones = (zones: MissionAvailability["zones"]) => {
    if (!canEditZones) return;
    onChange({
      ...normalizedState,
      zones: lockZones ? zones.slice(-1) : zones,
    });
  };

  const updateRadius = (radiusKm: number) => {
    if (!isEditing) return;
    onChange({ ...normalizedState, radiusKm });
  };

  const removeZone = (placeId: string) => {
    if (!canEditZones) return;
    onChange({
      ...normalizedState,
      zones: normalizedState.zones.filter((z) => z.placeId !== placeId),
    });
  };

  return (
    <div className={styles.container}>
      {showZoneSection && (
        <section className={styles.block}>
          <h4 className={styles.blockTitle}>
            <span className={styles.titleIcon}>📍</span>
            Carte et rayon
          </h4>

          <div className={styles.mapWrapper}>
            <MissionMap
              zones={visibleZones}
              radiusKm={state.radiusKm}
              onZonesChange={updateZones}
              isEditing={canEditZones}
            />
          </div>

          <div className={styles.radiusSection}>
            <div className={styles.radiusHeader}>
              <label htmlFor="radius-input" className={styles.radiusLabel}>
                <span>Rayon de couverture :</span>
                <span className={styles.radiusValue}>{state.radiusKm} km</span>
              </label>

              {!isEditing && state.radiusKm > 0 && (
                <span className={styles.savedIndicator} role="status">
                  ✓ Sauvegardé
                </span>
              )}
            </div>

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
          </div>

          <div className={styles.zonesSection}>
            <div className={styles.zonesSectionHeader}>
              <h5 className={styles.zonesSectionTitle}>
                {visibleZones.length === 0
                  ? "Aucune zone"
                  : visibleZones.length === 1
                    ? "Zone sélectionnée"
                    : "Zones sélectionnées"}
              </h5>

              {!isEditing && visibleZones.length > 0 && (
                <span className={styles.savedIndicator} role="status">
                  ✓ Sauvegardé
                </span>
              )}
            </div>

            {visibleZones.length > 0 ? (
              <div className={styles.zonesList}>
                {visibleZones.map((zone, index) => {
                  const zoneTone = ZONE_STYLES[index % ZONE_STYLES.length];

                  return (
                    <div
                      key={zone.placeId}
                      className={styles.zoneCard}
                      style={
                        {
                          "--zone-stroke": zoneTone.stroke,
                          "--zone-surface": zoneTone.surface,
                        } as CSSProperties
                      }
                    >
                      <div className={styles.zoneCardContent}>
                        <div className={styles.zoneHeader}>
                          <span className={styles.zoneIndex}>Zone {index + 1}</span>
                          <span className={styles.zoneLabel}>{zone.label}</span>
                        </div>
                        <span className={styles.zoneCoordinates}>
                          {zone.lat.toFixed(4)}°, {zone.lng.toFixed(4)}°
                        </span>
                      </div>

                      {canEditZones ? (
                        <button
                          type="button"
                          className={styles.removeZoneBtn}
                          onClick={() => removeZone(zone.placeId)}
                          aria-label={`Supprimer la zone ${zone.label}`}
                          title="Supprimer cette zone"
                        >
                          Supprimer
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : canEditZones ? (
              <p className={styles.emptyZoneState}>
                Sélectionnez une ville reconnue pour définir votre zone principale.
              </p>
            ) : (
              <p className={styles.emptyZoneState}>Aucune zone définie pour le moment.</p>
            )}
          </div>
        </section>
      )}

      {showScheduleSection && (
        <section className={styles.block}>
          <h4 className={styles.blockTitle}>
            <span className={styles.titleIcon}>⏱️</span>
            Disponibilités hebdomadaires
          </h4>

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
      )}

      {showRulesSection && (
        <section className={styles.block}>
          <h4 className={styles.blockTitle}>
            <span className={styles.titleIcon}>🤖</span>
            Règles d&apos;automatisation
          </h4>

          <MissionAcceptanceRules
            value={state.rules}
            isEditing={isEditing}
            onChange={(rules) => onChange({ ...normalizedState, rules })}
          />
        </section>
      )}
    </div>
  );
}
