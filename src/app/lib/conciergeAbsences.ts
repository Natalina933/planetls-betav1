export type ConciergeAbsenceReason =
  | "vacation"
  | "sick_leave"
  | "training"
  | "personal"
  | "other";

export type ConciergeAbsenceRow = {
  id: string;
  profile_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const ABSENCE_REASON_LABELS: Record<ConciergeAbsenceReason, string> = {
  vacation: "Conges",
  sick_leave: "Maladie",
  training: "Formation",
  personal: "Indisponibilite personnelle",
  other: "Autre",
};

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeAbsenceReason(value: string | null | undefined): ConciergeAbsenceReason {
  if (
    value === "vacation" ||
    value === "sick_leave" ||
    value === "training" ||
    value === "personal" ||
    value === "other"
  ) {
    return value;
  }

  return "other";
}

function toUtcDayTimestamp(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function isAbsenceActiveOn(
  absence: Pick<ConciergeAbsenceRow, "start_date" | "end_date">,
  date = getTodayIsoDate(),
) {
  return absence.start_date <= date && absence.end_date >= date;
}

export function getAbsenceStatus(
  absence: Pick<ConciergeAbsenceRow, "start_date" | "end_date">,
  date = getTodayIsoDate(),
) {
  if (isAbsenceActiveOn(absence, date)) return "active";
  return absence.start_date > date ? "upcoming" : "past";
}

export function countAbsenceDays(absence: Pick<ConciergeAbsenceRow, "start_date" | "end_date">) {
  const start = toUtcDayTimestamp(absence.start_date);
  const end = toUtcDayTimestamp(absence.end_date);
  if (!start || !end || end < start) return 0;
  return Math.floor((end - start) / 86400000) + 1;
}

export function formatAbsenceDate(value: string) {
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function formatAbsenceRange(absence: Pick<ConciergeAbsenceRow, "start_date" | "end_date">) {
  if (absence.start_date === absence.end_date) {
    return formatAbsenceDate(absence.start_date);
  }

  return `${formatAbsenceDate(absence.start_date)} au ${formatAbsenceDate(absence.end_date)}`;
}

export function sortAbsencesByStartDate<T extends Pick<ConciergeAbsenceRow, "start_date" | "end_date">>(
  rows: T[],
) {
  return [...rows].sort((a, b) => {
    if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
    return a.end_date.localeCompare(b.end_date);
  });
}

export function findActiveAbsence<T extends Pick<ConciergeAbsenceRow, "start_date" | "end_date">>(
  rows: T[],
  date = getTodayIsoDate(),
) {
  return rows.find((row) => isAbsenceActiveOn(row, date)) ?? null;
}
