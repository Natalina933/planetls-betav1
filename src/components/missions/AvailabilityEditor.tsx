// src/app/components/missions/AvailabilityEditor.tsx
"use client";

import React, { useMemo, useState } from "react";
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

function sortRanges(ranges: TimeRange[]) {
  return [...ranges].sort((a, b) => a.start.localeCompare(b.start));
}

function validateRanges(ranges: TimeRange[]): string | null {
  const sorted = sortRanges(ranges);

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
}

function rangeKey(day: WeekDay, r: TimeRange, index: number) {
  // clé stable tant que les valeurs ne changent pas
  return `${day}-${r.start}-${r.end}-${index}`;
}

export default function AvailabilityEditor({
  value,
  emergency24h,
  isEditing,
  onChange,
}: AvailabilityEditorProps) {
  const [dayErrors, setDayErrors] = useState<Partial<Record<WeekDay, string>>>(
    {}
  );

  const canEditSchedule = isEditing && !emergency24h;

  const valueByDay = useMemo(() => {
    const map = new Map<WeekDay, TimeRange[]>();
    for (const d of value) map.set(d.day, d.ranges);
    return map;
  }, [value]);

  const commitDay = (day: WeekDay, ranges: TimeRange[]) => {
    const sorted = sortRanges(ranges);
    const error = validateRanges(sorted);

    setDayErrors((prev) => {
      const next = { ...prev };
      if (error) next[day] = error;
      else delete next[day];
      return next;
    });

    // IMPORTANT: on commit même si invalide => UX fluide
    const next = value.filter((d) => d.day !== day);
    if (sorted.length) next.push({ day, ranges: sorted });
    onChange(next, emergency24h);
  };

  const updateTimeRange = (
    day: WeekDay,
    rangeIndex: number,
    field: "start" | "end",
    newValue: string
  ) => {
    const ranges = valueByDay.get(day);
    if (!ranges) return;

    const updated = ranges.map((range, idx) =>
      idx === rangeIndex ? { ...range, [field]: newValue } : range
    );

    commitDay(day, updated);
  };

  const addTimeRange = (day: WeekDay) => {
    const ranges = valueByDay.get(day) ?? [];
    commitDay(day, [...ranges, { ...DEFAULT_PRESET_RANGE }]);
  };

  const removeTimeRange = (day: WeekDay, rangeIndex: number) => {
    const ranges = valueByDay.get(day);
    if (!ranges) return;
    commitDay(
      day,
      ranges.filter((_, idx) => idx !== rangeIndex)
    );
  };

  const copyDayToAll = (day: WeekDay, target: "all" | "weekdays" | "weekend") => {
    const ranges = sortRanges(valueByDay.get(day) ?? []);
    const error = validateRanges(ranges);

    if (error) {
      setDayErrors((prev) => ({ ...prev, [day]: error }));
      return;
    }

    setDayErrors({});

    const targets =
      target === "all"
        ? ALL_DAY_IDS
        : target === "weekdays"
        ? WEEKDAY_IDS
        : (["sat", "sun"] as WeekDay[]);

    const next = targets.map((d) => ({
      day: d,
      ranges: ranges.map((r) => ({ ...r })),
    }));

    // On conserve aussi les jours non ciblés déjà présents
    const preserved = value.filter((d) => !targets.includes(d.day));
    onChange([...preserved, ...next], emergency24h);
  };

  const applyPreset = (days: WeekDay[]) => {
    setDayErrors({});
    const next = ALL_DAY_IDS.map((day) => ({
      day,
      ranges: days.includes(day) ? [{ ...DEFAULT_PRESET_RANGE }] : [],
    })).filter((item) => item.ranges.length > 0);

    onChange(next, emergency24h);
  };

  const clearSchedule = () => {
    setDayErrors({});
    onChange([], emergency24h);
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
            disabled={emergency24h}
            aria-disabled={emergency24h}
            title={emergency24h ? "Désactivez le mode 24/7 pour éditer" : undefined}
          >
            Lun-Ven 09:00-18:00
          </button>

          <button
            type="button"
            className={styles.presetBtn}
            onClick={() => applyPreset(ALL_DAY_IDS)}
            disabled={emergency24h}
            aria-disabled={emergency24h}
            title={emergency24h ? "Désactivez le mode 24/7 pour éditer" : undefined}
          >
            7j/7 09:00-18:00
          </button>

          <button
            type="button"
            className={styles.presetBtnGhost}
            onClick={clearSchedule}
            disabled={emergency24h}
            aria-disabled={emergency24h}
          >
            Effacer les horaires
          </button>
        </div>
      )}

      <div
        className={styles.daysGrid}
        aria-disabled={!canEditSchedule}
        data-disabled={!canEditSchedule ? "true" : "false"}
      >
        {DAYS.map((d) => {
          const ranges = valueByDay.get(d.id) ?? [];

          return (
            <div key={d.id} className={styles.dayBlock}>
              <div className={styles.dayHeader}>
                <strong className={styles.dayLabel}>{d.label}</strong>

                {isEditing && (
                  <div className={styles.dayActions}>
                    <button
                      type="button"
                      className={styles.addRangeBtn}
                      onClick={() => addTimeRange(d.id)}
                      disabled={!canEditSchedule}
                      aria-label={`Ajouter une plage horaire pour ${d.label}`}
                    >
                      + Plage
                    </button>

                    {ranges.length > 0 && (
                      <>
                        <button
                          type="button"
                          className={styles.copyDayBtn}
                          onClick={() => copyDayToAll(d.id, "all")}
                          disabled={!canEditSchedule}
                          aria-label={`Copier les horaires de ${d.label} sur tous les jours`}
                        >
                          Copier sur tous
                        </button>

                        <button
                          type="button"
                          className={styles.copyDayBtn}
                          onClick={() => copyDayToAll(d.id, "weekdays")}
                          disabled={!canEditSchedule}
                          aria-label={`Copier les horaires de ${d.label} sur les jours ouvrés`}
                        >
                          → Jours ouvrés
                        </button>
                      </>
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
                    <div key={rangeKey(d.id, r, i)} className={styles.rangeItem}>
                      <div className={styles.timeInputWrapper}>
                        <label htmlFor={`${d.id}-start-${i}`} className={styles.srOnly}>
                          Heure de début pour {d.label}, plage {i + 1}
                        </label>
                        <input
                          id={`${d.id}-start-${i}`}
                          type="time"
                          value={r.start}
                          readOnly={!canEditSchedule}
                          disabled={!canEditSchedule}
                          className={styles.timeInput}
                          onChange={(e) =>
                            updateTimeRange(d.id, i, "start", e.target.value)
                          }
                        />
                      </div>

                      <span className={styles.separator} aria-hidden="true">
                        →
                      </span>

                      <div className={styles.timeInputWrapper}>
                        <label htmlFor={`${d.id}-end-${i}`} className={styles.srOnly}>
                          Heure de fin pour {d.label}, plage {i + 1}
                        </label>
                        <input
                          id={`${d.id}-end-${i}`}
                          type="time"
                          value={r.end}
                          readOnly={!canEditSchedule}
                          disabled={!canEditSchedule}
                          className={styles.timeInput}
                          onChange={(e) => updateTimeRange(d.id, i, "end", e.target.value)}
                        />
                      </div>

                      {canEditSchedule && (
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
              Accepter les missions urgentes à tout moment (désactive l’édition des horaires)
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}