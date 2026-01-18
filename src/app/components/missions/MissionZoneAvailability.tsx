"use client";

import React from "react";
// 1. Import de dynamic pour gérer le problème de SSR de Leaflet
import dynamic from "next/dynamic";
import styles from "./MissionZoneAvailability.module.scss";
import type { MissionAvailability, WeekDay } from "./types";

// 2. Import dynamique de MissionMap avec désactivation du rendu serveur (ssr: false)
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

export default function MissionZoneAvailability({ value, isEditing, onChange }: Props) {
  // On utilise une valeur par défaut si "value" est null (évite les crashs au rendu)
  const state = value ?? DEFAULT_VALUE;

  const updateZones = (zones: MissionAvailability["zones"]) => 
    onChange({ ...state, zones });

  const updateRadius = (radiusKm: number) => 
    onChange({ ...state, radiusKm });

  const toggleRule = (key: keyof MissionAvailability["rules"]) =>
    onChange({ ...state, rules: { ...state.rules, [key]: !state.rules[key] } });

  const updateSchedule = (day: WeekDay, input: string) => {
    const otherDays = state.schedule.filter((d) => d.day !== day);
    
    // Parsing sécurisé de la chaîne "08:00-12:00,14:00-18:00"
    const newRanges = input
      .split(",")
      .map((r) => {
        const [start, end] = r.split("-");
        return { start: start?.trim() ?? "", end: end?.trim() ?? "" };
      })
      .filter((r) => r.start.length === 5 && r.end.length === 5); // Vérification basique format HH:mm

    onChange({ ...state, schedule: [...otherDays, { day, ranges: newRanges }] });
  };

  return (
    <div className={styles.container}>
      {/* SECTION CARTE */}
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>📍 Zone d’intervention</h4>
        
        <div className={styles.mapWrapper}>
          <MissionMap
            zones={state.zones}
            radiusKm={state.radiusKm}
            onZonesChange={updateZones}
            onRadiusChange={updateRadius}
            isEditing={isEditing}
          />
        </div>

        <p className={styles.helper}>
          Rayon actuel : <strong>{state.radiusKm} km</strong> autour des points sélectionnés.
        </p>
      </section>

      {/* SECTION HORAIRES */}
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>⏱️ Disponibilités hebdomadaires</h4>
        <div className={styles.scheduleGrid}>
          {WEEK_DAYS.map((day) => {
            const daySchedule = state.schedule.find((s) => s.day === day);
            const ranges = daySchedule?.ranges ?? [];
            const displayValue = ranges.map((r) => `${r.start}-${r.end}`).join(",");

            return (
              <div key={day} className={styles.scheduleRow}>
                <span className={styles.dayLabel}>{DAY_LABELS[day]}</span>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.scheduleInput}
                    placeholder="Ex: 09:00-12:00, 14:00-18:00"
                    defaultValue={displayValue}
                    onBlur={(e) => updateSchedule(day, e.target.value)}
                  />
                ) : (
                  <span className={displayValue ? styles.scheduleDisplay : styles.placeholder}>
                    {displayValue || "Non défini"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION RÈGLES */}
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>🤖 Automatisation</h4>
        <div className={styles.rulesGrid}>
          <label className={`${styles.ruleItem} ${!isEditing ? styles.disabled : ""}`}>
            <input
              type="checkbox"
              checked={state.rules.refuseOutOfZone}
              disabled={!isEditing}
              onChange={() => toggleRule("refuseOutOfZone")}
            />
            <span>Refuser automatiquement hors zone</span>
          </label>
          
          <label className={`${styles.ruleItem} ${!isEditing ? styles.disabled : ""}`}>
            <input
              type="checkbox"
              checked={state.rules.refuseOutOfSchedule}
              disabled={!isEditing}
              onChange={() => toggleRule("refuseOutOfSchedule")}
            />
            <span>Refuser hors horaires définis</span>
          </label>

          <label className={`${styles.ruleItem} ${!isEditing ? styles.disabled : ""}`}>
            <input
              type="checkbox"
              checked={state.rules.autoAcceptEmergency}
              disabled={!isEditing}
              onChange={() => toggleRule("autoAcceptEmergency")}
            />
            <span>Accepter les missions urgentes (24h/24)</span>
          </label>
        </div>
      </section>
    </div>
  );
}