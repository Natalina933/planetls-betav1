"use client";

import dynamic from "next/dynamic";
import styles from "./MissionZoneAvailability.module.scss";
import type { MissionAvailability, WeekDay } from "./types";
import MissionAcceptanceRules from "./MissionAcceptanceRules";

// Import dynamique de MissionMap avec SSR désactivé
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

const WEEK_DAYS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

export default function MissionZoneAvailability({
  value,
  isEditing,
  onChange,
  showZoneSection = true,
  showScheduleSection = true,
  showRulesSection = true,
}: Props) {
  const state = value ?? DEFAULT_VALUE;

  const updateZones = (zones: MissionAvailability["zones"]) =>
    onChange({ ...state, zones });

  const updateRadius = (radiusKm: number) =>
    onChange({ ...state, radiusKm });

  const removeZone = (placeId: string) => {
    const updatedZones = state.zones.filter((z) => z.placeId !== placeId);
    updateZones(updatedZones);
  };

  const toggleEmergency24h = () =>
    onChange({ ...state, emergency24h: !state.emergency24h });

  const addTimeRange = (day: WeekDay) => {
    const daySchedule = state.schedule.find((s) => s.day === day);
    const ranges = daySchedule?.ranges ?? [];
    const newRange = { start: "09:00", end: "18:00" };

    const otherDays = state.schedule.filter((d) => d.day !== day);
    onChange({
      ...state,
      schedule: [...otherDays, { day, ranges: [...ranges, newRange] }],
    });
  };

  const removeTimeRange = (day: WeekDay, index: number) => {
    const daySchedule = state.schedule.find((s) => s.day === day);
    if (!daySchedule) return;

    const ranges = daySchedule.ranges.filter((_, i) => i !== index);
    const otherDays = state.schedule.filter((d) => d.day !== day);

    if (ranges.length === 0) {
      onChange({ ...state, schedule: otherDays });
    } else {
      onChange({ ...state, schedule: [...otherDays, { day, ranges }] });
    }
  };

  const updateTimeRange = (
    day: WeekDay,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const daySchedule = state.schedule.find((s) => s.day === day);
    if (!daySchedule) return;

    const ranges = daySchedule.ranges.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    );

    const otherDays = state.schedule.filter((d) => d.day !== day);
    onChange({ ...state, schedule: [...otherDays, { day, ranges }] });
  };

  return (
    <div className={styles.container}>
      {/* SECTION CARTE */}
      {showZoneSection && (
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>
          <span className={styles.titleIcon}>📍</span>
          Zone d&apos;intervention
        </h4>

        <div className={styles.mapWrapper}>
          <MissionMap
            zones={state.zones}
            radiusKm={state.radiusKm}
            onZonesChange={updateZones}
            onRadiusChange={updateRadius}
            isEditing={isEditing}
          />
        </div>

        {/* Sélecteur de rayon */}
        <div className={styles.radiusSection}>
          <div className={styles.radiusHeader}>
            <div>
              <label htmlFor="radius-input" className={styles.radiusLabel}>
                <span>Rayon de couverture:</span>
                <span className={styles.radiusValue}>{state.radiusKm} km</span>
              </label>
            </div>
            {!isEditing && state.radiusKm > 0 && (
              <span className={styles.savedIndicator} role="status">
                ✓ Sauvegardé
              </span>
            )}
          </div>
          {isEditing && (
            <input
              id="radius-input"
              type="range"
              min="1"
              max="100"
              value={state.radiusKm}
              onChange={(e) => updateRadius(Number(e.target.value))}
              className={styles.radiusSlider}
              aria-label="Ajuster le rayon de couverture en kilomètres"
            />
          )}
        </div>

        {/* Zones sélectionnées */}
        <div className={styles.zonesSection}>
          <div className={styles.zonesSectionHeader}>
            <h5 className={styles.zonesSectionTitle}>
              {state.zones.length === 0
                ? "Aucune zone sélectionnée"
                : `${state.zones.length} zone${state.zones.length > 1 ? "s" : ""} sélectionnée${state.zones.length > 1 ? "s" : ""}`}
            </h5>
            {!isEditing && state.zones.length > 0 && (
              <span className={styles.savedIndicator} role="status">
                ✓ Sauvegardé
              </span>
            )}
          </div>

          {state.zones.length > 0 && (
            <div className={styles.zonesList}>
              {state.zones.map((zone) => (
                <div key={zone.placeId} className={styles.zoneCard}>
                  <div className={styles.zoneCardContent}>
                    <span className={styles.zoneLabel}>{zone.label}</span>
                    <span className={styles.zoneCoordinates}>
                      {zone.lat.toFixed(4)}°, {zone.lng.toFixed(4)}°
                    </span>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      className={styles.removeZoneBtn}
                      onClick={() => removeZone(zone.placeId)}
                      aria-label={`Supprimer la zone ${zone.label}`}
                      title="Supprimer cette zone"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {state.zones.length === 0 && isEditing && (
            <p className={styles.emptyZoneState}>
              Cliquez sur la carte ou utilisez le champ de recherche pour ajouter des zones
            </p>
          )}

          {state.zones.length === 0 && !isEditing && (
            <p className={styles.emptyZoneState}>
              Aucune zone définie pour le moment
            </p>
          )}
        </div>
      </section>
      )}

      {/* SECTION HORAIRES */}
      {showScheduleSection && (
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>
          <span className={styles.titleIcon}>⏱️</span>
          Disponibilités hebdomadaires
        </h4>

        <div className={styles.scheduleGrid}>
          {WEEK_DAYS.map((day) => {
            const daySchedule = state.schedule.find((s) => s.day === day);
            const ranges = daySchedule?.ranges ?? [];

            return (
              <div key={day} className={styles.scheduleDay}>
                <div className={styles.scheduleDayHeader}>
                  <span className={styles.dayLabel}>{DAY_LABELS[day]}</span>
                  {isEditing && (
                    <button
                      type="button"
                      className={styles.addRangeBtn}
                      onClick={() => addTimeRange(day)}
                      aria-label={`Ajouter une plage horaire pour ${DAY_LABELS[day]}`}
                    >
                      + Plage
                    </button>
                  )}
                </div>

                {ranges.length === 0 ? (
                  <div className={styles.noSchedule}>
                    {isEditing ? "Aucune plage définie" : "Fermé"}
                  </div>
                ) : (
                  <div className={styles.rangesList}>
                    {ranges.map((range, idx) => (
                      <div key={idx} className={styles.rangeItem}>
                        {isEditing ? (
                          <>
                            <label
                              htmlFor={`${day}-start-${idx}`}
                              className={styles.srOnly}
                            >
                              Heure de début pour {DAY_LABELS[day]}, plage {idx + 1}
                            </label>
                            <input
                              id={`${day}-start-${idx}`}
                              type="time"
                              value={range.start}
                              onChange={(e) =>
                                updateTimeRange(day, idx, "start", e.target.value)
                              }
                              className={styles.timeInput}
                              aria-label={`Heure de début, ${DAY_LABELS[day]}, ${range.start}`}
                            />
                            <span className={styles.rangeSeparator} aria-hidden="true">
                              →
                            </span>
                            <label
                              htmlFor={`${day}-end-${idx}`}
                              className={styles.srOnly}
                            >
                              Heure de fin pour {DAY_LABELS[day]}, plage {idx + 1}
                            </label>
                            <input
                              id={`${day}-end-${idx}`}
                              type="time"
                              value={range.end}
                              onChange={(e) =>
                                updateTimeRange(day, idx, "end", e.target.value)
                              }
                              className={styles.timeInput}
                              aria-label={`Heure de fin, ${DAY_LABELS[day]}, ${range.end}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeTimeRange(day, idx)}
                              className={styles.removeRangeBtn}
                              aria-label={`Supprimer la plage ${idx + 1} de ${DAY_LABELS[day]}`}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <span className={styles.rangeDisplay}>
                            {range.start} - {range.end}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Option urgence 24/7 */}
        <div className={styles.emergency24hToggle}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={state.emergency24h}
              onChange={toggleEmergency24h}
              disabled={!isEditing}
              className={styles.checkbox}
              aria-describedby="emergency-description"
            />
            <div>
              <strong>Disponible 24h/24, 7j/7</strong>
              <span id="emergency-description" className={styles.checkboxDesc}>
                pour les urgences
              </span>
            </div>
          </label>
        </div>
      </section>
      )}

      {/* SECTION RÈGLES */}
      {showRulesSection && (
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>
          <span className={styles.titleIcon}>🤖</span>
          Règles d&apos;automatisation
        </h4>

        <MissionAcceptanceRules
          value={state.rules}
          isEditing={isEditing}
          onChange={(rules) => onChange({ ...state, rules })}
        />
      </section>
      )}
    </div>
  );
}

