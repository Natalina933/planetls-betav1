// src/app/components/missions/AvailabilityEditor.tsx
"use client";

import React, { useState } from "react";
import type { MissionAvailability, WeekDay } from "./types";
import styles from "./AvailabilityEditor.module.scss";

type DaySchedule = MissionAvailability["schedule"][number];
type TimeRange = DaySchedule["ranges"][number];

const DAYS: { id: WeekDay; label: string }[] = [
  { id: "mon", label: "Lundi" },
  { id: "tue", label: "Mardi" },
  { id: "wed", label: "Mercredi" },
  { id: "thu", label: "Jeudi" },
  { id: "fri", label: "Vendredi" },
  { id: "sat", label: "Samedi" },
  { id: "sun", label: "Dimanche" },
];
const WEEKDAY_IDS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri"];
const ALL_DAY_IDS: WeekDay[] = DAYS.map((day) => day.id);
const DEFAULT_PRESET_RANGE: TimeRange = { start: "09:00", end: "18:00" };

interface AvailabilityEditorProps {
  value: DaySchedule[];
  emergency24h: boolean;
  isEditing: boolean;
  onChange: (value: DaySchedule[], emergency24h: boolean) => void;
}

export default function AvailabilityEditor({
  value,
  emergency24h,
  isEditing,
  onChange,
}: AvailabilityEditorProps) {
  const [dayErrors, setDayErrors] = useState<Partial<Record<WeekDay, string>>>({});

  const validateRanges = (ranges: TimeRange[]): string | null => {
    const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));

    for (let i = 0; i < sorted.length; i += 1) {
      if (sorted[i].start >= sorted[i].end) {
        return "Chaque plage doit avoir une heure de fin supérieure à l'heure de début.";
      }
    }

    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].start < sorted[i - 1].end) {
        return "Les plages se chevauchent. Ajustez les horaires.";
      }
    }

    return null;
  };

  const updateDay = (day: WeekDay, ranges: TimeRange[]) => {
    const validationError = validateRanges(ranges);
    if (validationError) {
      setDayErrors((prev) => ({ ...prev, [day]: validationError }));
      return;
    }

    setDayErrors((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });

    const next = value.filter((d) => d.day !== day);
    if (ranges.length) next.push({ day, ranges });
    onChange(next, emergency24h);
  };

  const updateTimeRange = (
    day: WeekDay,
    rangeIndex: number,
    field: "start" | "end",
    newValue: string
  ) => {
    const dayData = value.find((v) => v.day === day);
    if (!dayData) return;

    const updatedRanges = dayData.ranges.map((range, idx) =>
      idx === rangeIndex ? { ...range, [field]: newValue } : range
    );

    updateDay(day, updatedRanges);
  };

  const removeTimeRange = (day: WeekDay, rangeIndex: number) => {
    const dayData = value.find((v) => v.day === day);
    if (!dayData) return;

    const updatedRanges = dayData.ranges.filter((_, idx) => idx !== rangeIndex);
    updateDay(day, updatedRanges);
  };

  const copyDayToAll = (day: WeekDay) => {
    const source = value.find((v) => v.day === day);
    const ranges = source?.ranges ?? [];
    const normalizedRanges = ranges
      .map((range) => ({ start: range.start, end: range.end }))
      .sort((a, b) => a.start.localeCompare(b.start));

    const validationError = validateRanges(normalizedRanges);
    if (validationError) {
      setDayErrors((prev) => ({ ...prev, [day]: validationError }));
      return;
    }

    setDayErrors({});
    const next = DAYS.map((currentDay) => ({
      day: currentDay.id,
      ranges: normalizedRanges.map((range) => ({ ...range })),
    }));
    onChange(next, emergency24h);
  };

  const applyPreset = (days: WeekDay[]) => {
    setDayErrors({});

    const next = ALL_DAY_IDS.map((day) => ({
      day,
      ranges: days.includes(day) ? [{ ...DEFAULT_PRESET_RANGE }] : [],
    })).filter((item) => item.ranges.length > 0);

    onChange(next, emergency24h);
  };

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>⏱️ Disponibilités hebdomadaires</h4>
      {isEditing && (
        <div className={styles.presetBar}>
          <button
            type="button"
            className={styles.presetBtn}
            onClick={() => applyPreset(WEEKDAY_IDS)}
          >
            Lun-Ven 09:00-18:00
          </button>
          <button
            type="button"
            className={styles.presetBtn}
            onClick={() => applyPreset(ALL_DAY_IDS)}
          >
            7j/7 09:00-18:00
          </button>
          <button
            type="button"
            className={styles.presetBtnGhost}
            onClick={() => {
              setDayErrors({});
              onChange([], emergency24h);
            }}
          >
            Effacer les horaires
          </button>
        </div>
      )}

      <div className={styles.daysGrid}>
        {DAYS.map((d) => {
          const dayData = value.find((v) => v.day === d.id);
          const ranges = dayData?.ranges ?? [];

          return (
            <div key={d.id} className={styles.dayBlock}>
              <div className={styles.dayHeader}>
                <strong className={styles.dayLabel}>{d.label}</strong>
                {isEditing && (
                  <div className={styles.dayActions}>
                    <button
                      type="button"
                      className={styles.addRangeBtn}
                      onClick={() =>
                        updateDay(d.id, [
                          ...ranges,
                          { start: "09:00", end: "18:00" },
                        ])
                      }
                      aria-label={`Ajouter une plage horaire pour ${d.label}`}
                    >
                      + Plage
                    </button>
                    {ranges.length > 0 && (
                      <button
                        type="button"
                        className={styles.copyDayBtn}
                        onClick={() => copyDayToAll(d.id)}
                        aria-label={`Copier les horaires de ${d.label} sur tous les jours`}
                      >
                        Copier sur tous
                      </button>
                    )}
                  </div>
                )}
              </div>

              {ranges.length === 0 ? (
                <p className={styles.noRanges}>
                  {isEditing ? "Aucune plage définie" : "Fermé"}
                </p>
              ) : (
                <div className={styles.rangesList}>
                  {ranges.map((r, i) => (
                    <div key={i} className={styles.rangeItem}>
                      <div className={styles.timeInputWrapper}>
                        <label
                          htmlFor={`${d.id}-start-${i}`}
                          className={styles.srOnly}
                        >
                          Heure de début pour {d.label}, plage {i + 1}
                        </label>
                        <input
                          id={`${d.id}-start-${i}`}
                          type="time"
                          value={r.start}
                          readOnly={!isEditing}
                          disabled={!isEditing}
                          className={styles.timeInput}
                          onChange={(e) =>
                            updateTimeRange(d.id, i, "start", e.target.value)
                          }
                          aria-label={`Heure de début, ${d.label}, ${r.start}`}
                        />
                      </div>

                      <span className={styles.separator} aria-hidden="true">
                        →
                      </span>

                      <div className={styles.timeInputWrapper}>
                        <label
                          htmlFor={`${d.id}-end-${i}`}
                          className={styles.srOnly}
                        >
                          Heure de fin pour {d.label}, plage {i + 1}
                        </label>
                        <input
                          id={`${d.id}-end-${i}`}
                          type="time"
                          value={r.end}
                          readOnly={!isEditing}
                          disabled={!isEditing}
                          className={styles.timeInput}
                          onChange={(e) =>
                            updateTimeRange(d.id, i, "end", e.target.value)
                          }
                          aria-label={`Heure de fin, ${d.label}, ${r.end}`}
                        />
                      </div>

                      {isEditing && (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeTimeRange(d.id, i)}
                          aria-label={`Supprimer la plage ${i + 1} de ${d.label}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {dayErrors[d.id] && (
                <p className={styles.dayError} role="alert">
                  {dayErrors[d.id]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.emergencyToggle}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={emergency24h}
            onChange={(e) => onChange(value, e.target.checked)}
            disabled={!isEditing}
            className={styles.checkbox}
            aria-describedby="emergency-description"
          />
          <div>
            <strong>Disponible 24h/24, 7j/7</strong>
            <span id="emergency-description" className={styles.checkboxDesc}>
              Accepter les missions urgentes à tout moment
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
