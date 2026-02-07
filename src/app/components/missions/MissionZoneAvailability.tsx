"use client";

import React from "react";
import dynamic from "next/dynamic";
import styles from "./MissionZoneAvailability.module.scss";
import type { MissionAvailability, WeekDay } from "./types";

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
}: Props) {
  const state = value ?? DEFAULT_VALUE;

  const updateZones = (zones: MissionAvailability["zones"]) =>
    onChange({ ...state, zones });

  const updateRadius = (radiusKm: number) =>
    onChange({ ...state, radiusKm });

  const toggleRule = (key: keyof MissionAvailability["rules"]) =>
    onChange({ ...state, rules: { ...state.rules, [key]: !state.rules[key] } });

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

        {state.zones.length === 0 && (
          <p className={styles.emptyState}>
            {isEditing
              ? "Cliquez sur la carte ou utilisez le champ de recherche pour ajouter des zones"
              : "Aucune zone définie"}
          </p>
        )}
      </section>

      {/* SECTION HORAIRES */}
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

      {/* SECTION RÈGLES */}
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>
          <span className={styles.titleIcon}>🤖</span>
          Règles d&apos;automatisation
        </h4>

        <div className={styles.rulesGrid}>
          <label
            className={`${styles.ruleItem} ${!isEditing ? styles.disabled : ""}`}
          >
            <input
              type="checkbox"
              checked={state.rules.refuseOutOfZone}
              disabled={!isEditing}
              onChange={() => toggleRule("refuseOutOfZone")}
              className={styles.checkbox}
            />
            <div className={styles.ruleContent}>
              <span className={styles.ruleTitle}>
                Refuser automatiquement les missions hors zone
              </span>
              <span className={styles.ruleDescription}>
                Les demandes en dehors de votre périmètre seront déclinées
                automatiquement
              </span>
            </div>
          </label>

          <label
            className={`${styles.ruleItem} ${!isEditing ? styles.disabled : ""}`}
          >
            <input
              type="checkbox"
              checked={state.rules.refuseOutOfSchedule}
              disabled={!isEditing}
              onChange={() => toggleRule("refuseOutOfSchedule")}
              className={styles.checkbox}
            />
            <div className={styles.ruleContent}>
              <span className={styles.ruleTitle}>
                Refuser les missions hors horaires
              </span>
              <span className={styles.ruleDescription}>
                Seules les demandes pendant vos créneaux définis seront acceptées
              </span>
            </div>
          </label>

          <label
            className={`${styles.ruleItem} ${!isEditing ? styles.disabled : ""}`}
          >
            <input
              type="checkbox"
              checked={state.rules.autoAcceptEmergency}
              disabled={!isEditing}
              onChange={() => toggleRule("autoAcceptEmergency")}
              className={styles.checkbox}
            />
            <div className={styles.ruleContent}>
              <span className={styles.ruleTitle}>
                Accepter automatiquement les urgences
              </span>
              <span className={styles.ruleDescription}>
                Les missions urgentes seront acceptées même hors horaires
              </span>
            </div>
          </label>
        </div>
      </section>
    </div>
  );
}