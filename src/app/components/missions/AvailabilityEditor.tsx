// src/app/components/missions/AvailabilityEditor.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { MissionAvailability, TimeHHMM, WeekDay } from "./types";
import styles from "./AvailabilityEditor.module.scss";

type DaySchedule = MissionAvailability["schedule"][number];
type TimeRange = DaySchedule["ranges"][number];

const DAYS: { id: WeekDay; label: string; shortLabel: string; group: "weekday" | "weekend" }[] = [
  { id: "mon", label: "Lundi", shortLabel: "Lun", group: "weekday" },
  { id: "tue", label: "Mardi", shortLabel: "Mar", group: "weekday" },
  { id: "wed", label: "Mercredi", shortLabel: "Mer", group: "weekday" },
  { id: "thu", label: "Jeudi", shortLabel: "Jeu", group: "weekday" },
  { id: "fri", label: "Vendredi", shortLabel: "Ven", group: "weekday" },
  { id: "sat", label: "Samedi", shortLabel: "Sam", group: "weekend" },
  { id: "sun", label: "Dimanche", shortLabel: "Dim", group: "weekend" },
];

const WEEKDAY_IDS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKEND_IDS: WeekDay[] = ["sat", "sun"];
const ALL_DAY_IDS: WeekDay[] = DAYS.map((day) => day.id);
const STANDARD_RANGE: TimeRange = { start: "09:00", end: "18:00" };
const CHECKIN_RANGE: TimeRange = { start: "08:00", end: "20:00" };
const FULL_DAY_RANGE: TimeRange = { start: "00:00", end: "23:59" };

interface AvailabilityEditorProps {
  value: DaySchedule[];
  emergency24h: boolean;
  isEditing: boolean;
  onChange: (value: DaySchedule[], emergency24h: boolean) => void;
}

interface ScheduleTemplate {
  id: string;
  label: string;
  schedule: DaySchedule[];
  emergency24h?: boolean;
}

function sortRanges(ranges: TimeRange[]) {
  return [...ranges].sort((a, b) => a.start.localeCompare(b.start));
}

function validateRanges(ranges: TimeRange[]): string | null {
  const sorted = sortRanges(ranges);

  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].start >= sorted[index].end) {
      return "Heure de fin invalide.";
    }
  }

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].start < sorted[index - 1].end) {
      return "Plages qui se chevauchent.";
    }
  }

  return null;
}

function cloneSchedule(schedule: DaySchedule[]) {
  return schedule.map((day) => ({
    day: day.day,
    ranges: day.ranges.map((range) => ({ ...range })),
  }));
}

function buildScheduleForDays(days: WeekDay[], range: TimeRange): DaySchedule[] {
  return days.map((day) => ({
    day,
    ranges: [{ ...range }],
  }));
}

function buildTemplates(): ScheduleTemplate[] {
  return [
    {
      id: "standard",
      label: "Standard • Lun-Ven 9h-18h",
      schedule: buildScheduleForDays(WEEKDAY_IDS, STANDARD_RANGE),
    },
    {
      id: "checkin",
      label: "Check-in/out • Lun-Dim 8h-20h",
      schedule: buildScheduleForDays(ALL_DAY_IDS, CHECKIN_RANGE),
    },
    {
      id: "fulltime",
      label: "24h/24 complet • Tous les jours",
      schedule: buildScheduleForDays(ALL_DAY_IDS, FULL_DAY_RANGE),
      emergency24h: true,
    },
    {
      id: "weekend",
      label: "Week-end • Sam-Dim 9h-18h",
      schedule: buildScheduleForDays(WEEKEND_IDS, STANDARD_RANGE),
    },
  ];
}

function areRangesEqual(left: TimeRange[], right: TimeRange[]) {
  if (left.length !== right.length) return false;
  return left.every(
    (range, index) => range.start === right[index]?.start && range.end === right[index]?.end,
  );
}

function formatSingleRange(range: TimeRange | null) {
  return range ? `${range.start}-${range.end}` : null;
}

function buildScheduleSummary(schedule: DaySchedule[], emergency24h: boolean) {
  if (emergency24h) {
    return "Tous les jours";
  }

  const valueByDay = new Map<WeekDay, TimeRange[]>();
  for (const day of schedule) {
    valueByDay.set(day.day, sortRanges(day.ranges));
  }

  const openDays = DAYS.filter((day) => (valueByDay.get(day.id) ?? []).length > 0);
  if (openDays.length === 0) {
    return "Aucun créneau";
  }

  const weekdayRanges = valueByDay.get("mon") ?? [];
  const sameWeekdays =
    weekdayRanges.length > 0 &&
    WEEKDAY_IDS.every((day) => areRangesEqual(valueByDay.get(day) ?? [], weekdayRanges));
  const weekendRanges = valueByDay.get("sat") ?? [];
  const sameWeekend =
    weekendRanges.length > 0 &&
    WEEKEND_IDS.every((day) => areRangesEqual(valueByDay.get(day) ?? [], weekendRanges));

  if (sameWeekdays && sameWeekend && areRangesEqual(weekdayRanges, weekendRanges)) {
    const firstRange = formatSingleRange(weekdayRanges[0] ?? null);
    return firstRange ? `Lun-Dim ${firstRange}` : "Lun-Dim";
  }

  if (sameWeekdays && WEEKEND_IDS.every((day) => (valueByDay.get(day) ?? []).length === 0)) {
    const firstRange = formatSingleRange(weekdayRanges[0] ?? null);
    return firstRange ? `Lun-Ven ${firstRange}` : "Lun-Ven";
  }

  if (sameWeekend && WEEKDAY_IDS.every((day) => (valueByDay.get(day) ?? []).length === 0)) {
    const firstRange = formatSingleRange(weekendRanges[0] ?? null);
    return firstRange ? `Sam-Dim ${firstRange}` : "Sam-Dim";
  }

  const firstOpenDay = openDays[0];
  const firstRange = formatSingleRange((valueByDay.get(firstOpenDay.id) ?? [])[0] ?? null);
  return firstRange ? `${firstOpenDay.shortLabel} ${firstRange}` : firstOpenDay.shortLabel;
}

function buildDayGroupSummary(days: WeekDay[], valueByDay: Map<WeekDay, TimeRange[]>) {
  const relevantDays = days.filter((day) => (valueByDay.get(day) ?? []).length > 0);
  if (relevantDays.length === 0) {
    return null;
  }

  const reference = valueByDay.get(relevantDays[0]) ?? [];
  const aligned = relevantDays.every((day) => areRangesEqual(valueByDay.get(day) ?? [], reference));
  if (!aligned || reference.length !== 1) {
    return null;
  }

  const prefix = days.length === 5 ? "LUN-VEN" : "SAM-DIM";
  return `${prefix} ${reference[0].start}-${reference[0].end}`;
}

export default function AvailabilityEditor({
  value,
  emergency24h,
  isEditing,
  onChange,
}: AvailabilityEditorProps) {
  const [dayErrors, setDayErrors] = useState<Partial<Record<WeekDay, string>>>({});

  const templates = useMemo(() => buildTemplates(), []);
  const valueByDay = useMemo(() => {
    const map = new Map<WeekDay, TimeRange[]>();
    for (const day of value) {
      map.set(day.day, sortRanges(day.ranges));
    }
    return map;
  }, [value]);

  const canEditSchedule = isEditing && !emergency24h;
  const openDaysCount = useMemo(
    () => DAYS.filter((day) => (valueByDay.get(day.id) ?? []).length > 0).length,
    [valueByDay],
  );
  const scheduleSummary = useMemo(
    () => buildScheduleSummary(value, emergency24h),
    [value, emergency24h],
  );
  const weekdaySummary = useMemo(
    () => buildDayGroupSummary(WEEKDAY_IDS, valueByDay),
    [valueByDay],
  );
  const weekendSummary = useMemo(
    () => buildDayGroupSummary(WEEKEND_IDS, valueByDay),
    [valueByDay],
  );

  const commitDay = (day: WeekDay, ranges: TimeRange[]) => {
    const sorted = sortRanges(ranges);
    const error = validateRanges(sorted);

    setDayErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[day] = error;
      } else {
        delete next[day];
      }
      return next;
    });

    const next = value.filter((item) => item.day !== day);
    if (sorted.length > 0) {
      next.push({ day, ranges: sorted });
    }
    onChange(next, emergency24h);
  };

  const updateTimeRange = (
    day: WeekDay,
    rangeIndex: number,
    field: "start" | "end",
    newValue: string,
  ) => {
    const ranges = valueByDay.get(day);
    if (!ranges) return;

    const updated = ranges.map((range, index) =>
      index === rangeIndex ? { ...range, [field]: newValue as TimeHHMM } : range,
    );

    commitDay(day, updated);
  };

  const addTimeRange = (day: WeekDay) => {
    const ranges = valueByDay.get(day) ?? [];
    commitDay(day, [...ranges, { ...STANDARD_RANGE }]);
  };

  const removeTimeRange = (day: WeekDay, rangeIndex: number) => {
    const ranges = valueByDay.get(day);
    if (!ranges) return;
    commitDay(
      day,
      ranges.filter((_, index) => index !== rangeIndex),
    );
  };

  const copyToDays = (sourceDay: WeekDay, targetDays: WeekDay[]) => {
    const ranges = sortRanges(valueByDay.get(sourceDay) ?? []);
    const error = validateRanges(ranges);

    if (error) {
      setDayErrors((prev) => ({ ...prev, [sourceDay]: error }));
      return;
    }

    const preserved = value.filter((item) => !targetDays.includes(item.day));
    const copied = targetDays.map((day) => ({
      day,
      ranges: ranges.map((range) => ({ ...range })),
    }));
    onChange([...preserved, ...copied], emergency24h);
  };

  const applyTemplate = (template: ScheduleTemplate) => {
    setDayErrors({});
    onChange(cloneSchedule(template.schedule), Boolean(template.emergency24h));
  };

  const clearSchedule = () => {
    setDayErrors({});
    onChange([], false);
  };

  const renderGroup = (
    title: string,
    summary: string | null,
    days: { id: WeekDay; label: string; shortLabel: string; group: "weekday" | "weekend" }[],
    copyTargetDays: WeekDay[],
    allowCopy = false,
  ) => (
    <section className={styles.groupBlock}>
      <div className={styles.groupHeader}>
        <div className={styles.groupTitleRow}>
          <strong className={styles.groupTitle}>{title}</strong>
          {summary ? <span className={styles.groupSummary}>{summary}</span> : null}
        </div>
        {isEditing && allowCopy && summary ? (
          <button
            type="button"
            className={styles.copyGroupBtn}
            onClick={() => copyToDays(days[0].id, copyTargetDays)}
            disabled={!canEditSchedule}
          >
            Copier
          </button>
        ) : null}
      </div>

      <div className={styles.dayList}>
        {days.map((day) => {
          const ranges = valueByDay.get(day.id) ?? [];

          return (
            <div key={day.id} className={styles.dayRow}>
              <div className={styles.dayName}>{day.label}</div>

              {ranges.length === 0 ? (
                <div className={styles.emptyRow}>
                  <span className={styles.closedLabel}>Fermé</span>
                  {isEditing ? (
                    <button
                      type="button"
                      className={styles.addRangeBtn}
                      onClick={() => addTimeRange(day.id)}
                      disabled={!canEditSchedule}
                    >
                      + Plage
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className={styles.rangeList}>
                  {ranges.map((range, index) => (
                    <div key={`${day.id}-${range.start}-${range.end}-${index}`} className={styles.rangeRow}>
                      <input
                        type="time"
                        value={range.start}
                        readOnly={!canEditSchedule}
                        disabled={!canEditSchedule}
                        className={styles.timeInput}
                        aria-label={`${day.label} début ${index + 1}`}
                        onChange={(event) =>
                          updateTimeRange(day.id, index, "start", event.target.value)
                        }
                      />
                      <span className={styles.separator} aria-hidden="true">
                        →
                      </span>
                      <input
                        type="time"
                        value={range.end}
                        readOnly={!canEditSchedule}
                        disabled={!canEditSchedule}
                        className={styles.timeInput}
                        aria-label={`${day.label} fin ${index + 1}`}
                        onChange={(event) =>
                          updateTimeRange(day.id, index, "end", event.target.value)
                        }
                      />
                      {canEditSchedule ? (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeTimeRange(day.id, index)}
                          aria-label={`Supprimer la plage ${index + 1} de ${day.label}`}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {dayErrors[day.id] ? (
                <p className={styles.dayError} role="alert">
                  {dayErrors[day.id]}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className={styles.container}>
      <div className={styles.summaryRow}>
        <span className={styles.summaryItem}>{openDaysCount}/7</span>
        <span className={styles.summaryDivider}>•</span>
        <span className={styles.summaryItem}>{scheduleSummary}</span>
        <span className={styles.summaryDivider}>•</span>
        <span className={styles.summaryItem}>24/7 urgences {emergency24h ? "✓" : "—"}</span>
        {Object.keys(dayErrors).length > 0 ? (
          <>
            <span className={styles.summaryDivider}>•</span>
            <span className={styles.summaryError}>Plages à corriger</span>
          </>
        ) : null}
      </div>

      <p className={styles.helperText}>
        Les propriétaires lisent surtout des créneaux simples : check-in/out sur des horaires fixes,
        ménage en journée, urgences en 24/7 pour les profils les plus réactifs.
      </p>

      {isEditing ? (
        <div className={styles.templatesRow}>
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={styles.templateBtn}
              onClick={() => applyTemplate(template)}
            >
              {template.label}
            </button>
          ))}
          <button type="button" className={styles.clearBtn} onClick={clearSchedule}>
            Effacer
          </button>
        </div>
      ) : null}

      <div className={styles.editorBlock}>
        {renderGroup(
          "LUN-VEN",
          weekdaySummary,
          DAYS.filter((day) => day.group === "weekday"),
          WEEKDAY_IDS,
          true,
        )}
        {renderGroup(
          "SAM-DIM",
          weekendSummary,
          DAYS.filter((day) => day.group === "weekend"),
          WEEKEND_IDS,
        )}
      </div>

      <div className={styles.footerRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={emergency24h}
            onChange={(event) => onChange(value, event.target.checked)}
            disabled={!isEditing}
            className={styles.checkbox}
          />
          <span>24/7 urgences</span>
        </label>
      </div>
    </div>
  );
}
