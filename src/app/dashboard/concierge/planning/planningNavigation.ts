import { addDays, addMonths, endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";

export const PLANNING_MODES = [
  { value: "month", label: "Mois" },
  { value: "week", label: "Semaine" },
  { value: "day", label: "Jour" },
  { value: "agenda", label: "Agenda" },
  { value: "terrain", label: "Terrain" },
] as const;

export type PlanningMode = typeof PLANNING_MODES[number]["value"];

// Même longueur que la vue Agenda de react-big-calendar installée.
export const PLANNING_AGENDA_LENGTH = 30;

export function navigatePlanningDate(date: Date, mode: PlanningMode, direction: -1 | 1) {
  if (mode === "month") return addMonths(date, direction);
  return addDays(date, direction * (mode === "day" ? 1 : mode === "agenda" ? PLANNING_AGENDA_LENGTH : 7));
}

export function getPlanningPeriod(date: Date, mode: PlanningMode) {
  if (mode === "month") {
    // Inclut les jours adjacents affichés dans la grille mensuelle.
    return { start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }) };
  }
  if (mode === "week" || mode === "terrain") {
    return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
  }
  return { start: startOfDay(date), end: endOfDay(mode === "agenda" ? addDays(date, PLANNING_AGENDA_LENGTH) : date) };
}

export function formatPlanningPeriod(date: Date, mode: PlanningMode) {
  if (mode === "month") return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
  const period = getPlanningPeriod(date, mode);
  const formatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return mode === "day" ? formatter.format(date) : `${formatter.format(period.start)} – ${formatter.format(period.end)}`;
}
