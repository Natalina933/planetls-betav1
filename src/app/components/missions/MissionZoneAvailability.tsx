"use client";

import { useEffect, useState } from "react";
import styles from "./MissionZoneAvailability.module.scss";
import MissionMap from "./MissionMap";
import type { MissionAvailability, WeekDay } from "./types";

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

// Ordre des jours pour affichage
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
  const [state, setState] = useState<MissionAvailability>(
    value ?? DEFAULT_VALUE
  );

  // 🔄 Sync externe → interne
  useEffect(() => {
    if (value) setState(value);
  }, [value]);

  // 🔄 Sync interne → parent
  useEffect(() => {
    onChange(state);
  }, [state, onChange]);

  /* =========================
     Handlers
  ========================== */

  const updateZones = (zones: MissionAvailability["zones"]) =>
    setState((s) => ({ ...s, zones }));

  const updateRadius = (radiusKm: number) =>
    setState((s) => ({ ...s, radiusKm }));

  const toggleRule = (key: keyof MissionAvailability["rules"]) =>
    setState((s) => ({
      ...s,
      rules: { ...s.rules, [key]: !s.rules[key] },
    }));

  const updateSchedule = (day: WeekDay, ranges: { start: string; end: string }[]) => {
    setState((s) => {
      const otherDays = s.schedule.filter((d) => d.day !== day);
      return {
        ...s,
        schedule: [...otherDays, { day, ranges }],
      };
    });
  };

  /* =========================
     Render
  ========================== */

  return (
    <div className={styles.container}>
      {/* ================= ZONE MAP ================= */}
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>📍 Zone d’intervention</h4>

        <MissionMap
          zones={state.zones}
          radiusKm={state.radiusKm}
          onZonesChange={updateZones}
          onRadiusChange={updateRadius}
          isEditing={isEditing}
        />

        <p className={styles.helper}>
          Rayon actuel : <strong>{state.radiusKm} km</strong>
        </p>
      </section>

      {/* ================= SCHEDULE ================= */}
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>⏱️ Disponibilités</h4>

        {WEEK_DAYS.map((day) => {
          const daySchedule = state.schedule.find((s) => s.day === day);
          const ranges = daySchedule?.ranges ?? [];

          return (
            <div key={day} className={styles.scheduleRow}>
              <strong>{DAY_LABELS[day]}:</strong>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="Ex: 09:00-12:00,14:00-18:00"
                  value={ranges.map((r) => `${r.start}-${r.end}`).join(",")}
                  onChange={(e) => {
                    const newRanges = e.target.value
                      .split(",")
                      .map((r) => {
                        const [start, end] = r.split("-");
                        return { start: start?.trim() ?? "", end: end?.trim() ?? "" };
                      })
                      .filter((r) => r.start && r.end);
                    updateSchedule(day, newRanges);
                  }}
                  className={styles.scheduleInput}
                  disabled={!isEditing}
                />
              ) : ranges.length > 0 ? (
                <span className={styles.scheduleDisplay}>
                  {ranges.map((r) => `${r.start}-${r.end}`).join(", ")}
                </span>
              ) : (
                <span className={styles.placeholder}>Non défini</span>
              )}
            </div>
          );
        })}
      </section>

      {/* ================= RULES ================= */}
      <section className={styles.block}>
        <h4 className={styles.blockTitle}>🤖 Règles automatiques</h4>

        <div className={styles.rulesGrid}>
          <label className={styles.ruleItem}>
            <input
              type="checkbox"
              checked={state.rules.refuseOutOfZone}
              disabled={!isEditing}
              onChange={() => toggleRule("refuseOutOfZone")}
            />
            Refuser automatiquement hors zone
          </label>

          <label className={styles.ruleItem}>
            <input
              type="checkbox"
              checked={state.rules.refuseOutOfSchedule}
              disabled={!isEditing}
              onChange={() => toggleRule("refuseOutOfSchedule")}
            />
            Refuser hors horaires définis
          </label>

          <label className={styles.ruleItem}>
            <input
              type="checkbox"
              checked={state.rules.autoAcceptEmergency}
              disabled={!isEditing}
              onChange={() => toggleRule("autoAcceptEmergency")}
            />
            Accepter automatiquement les missions urgentes
          </label>
        </div>
      </section>
    </div>
  );
}
