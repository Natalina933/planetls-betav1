import { cleanString, isRecord, type ReservationRow } from "./reservations.ts";

export type ReservationScheduleField =
  | "check_in_at"
  | "check_out_at"
  | "arrival_time_window"
  | "departure_time_window";

export type StayMissionStep = "checkin" | "checkout" | "cleaning" | "linen";

export type ReservationScheduleChange = {
  field: ReservationScheduleField;
  previous: string | null;
  next: string | null;
  scope: "arrival" | "departure";
};

export type ReservationScheduleChangeSet =
  | {
      ok: true;
      changedFields: ReservationScheduleField[];
      updatePayload: Partial<Record<ReservationScheduleField, string | null>>;
      changes: ReservationScheduleChange[];
      impactedSteps: StayMissionStep[];
    }
  | { ok: false; error: string };

export type LinkedStayMissionLike = {
  id: string;
  title?: string | null;
  status?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  metadata?: unknown;
};

export type ImpactedStayMission = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  step: StayMissionStep;
  impact_reason: "arrival_changed" | "departure_changed";
};

const ARRIVAL_FIELDS = new Set<ReservationScheduleField>(["check_in_at", "arrival_time_window"]);
const DEPARTURE_FIELDS = new Set<ReservationScheduleField>(["check_out_at", "departure_time_window"]);
const ARRIVAL_STEPS: StayMissionStep[] = ["checkin"];
const DEPARTURE_STEPS: StayMissionStep[] = ["checkout", "cleaning", "linen"];

function normalizeIsoDate(value: unknown) {
  const raw = cleanString(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function normalizeComparable(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStep(value: unknown): StayMissionStep | null {
  const normalized = typeof value === "string" ? value.trim().toLowerCase().replace(/[_\s-]+/g, "") : "";
  if (normalized === "checkin" || normalized === "arrival") return "checkin";
  if (normalized === "checkout" || normalized === "departure") return "checkout";
  if (normalized === "cleaning" || normalized === "menage" || normalized === "ménage") return "cleaning";
  if (normalized === "linen" || normalized === "linge") return "linen";
  return null;
}

export function getStayMissionStep(mission: LinkedStayMissionLike): StayMissionStep | null {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  return (
    normalizeStep(metadata.reservation_step) ??
    normalizeStep(metadata.stay_need) ??
    normalizeStep(metadata.mission_step)
  );
}

export function buildReservationScheduleChangeSet(
  reservation: ReservationRow,
  patch: Record<string, unknown>,
): ReservationScheduleChangeSet {
  const updatePayload: Partial<Record<ReservationScheduleField, string | null>> = {};
  const changes: ReservationScheduleChange[] = [];
  const hasCheckInPatch = Object.prototype.hasOwnProperty.call(patch, "check_in_at");
  const hasCheckOutPatch = Object.prototype.hasOwnProperty.call(patch, "check_out_at");
  const nextCheckIn = hasCheckInPatch
    ? normalizeIsoDate(patch.check_in_at)
    : normalizeComparable(reservation.check_in_at);
  const nextCheckOut = hasCheckOutPatch
    ? normalizeIsoDate(patch.check_out_at)
    : normalizeComparable(reservation.check_out_at);

  if (nextCheckIn === undefined) return { ok: false, error: "Date d'arrivée invalide." };
  if (nextCheckOut === undefined) return { ok: false, error: "Date de départ invalide." };
  if (hasCheckInPatch && !nextCheckIn) return { ok: false, error: "Date d'arrivée requise." };
  if (hasCheckOutPatch && !nextCheckOut) return { ok: false, error: "Date de départ requise." };
  if (nextCheckIn && nextCheckOut && new Date(nextCheckOut).getTime() <= new Date(nextCheckIn).getTime()) {
    return { ok: false, error: "La date de départ doit être postérieure à la date d'arrivée." };
  }

  const candidateValues: Partial<Record<ReservationScheduleField, string | null>> = {};
  if (hasCheckInPatch) candidateValues.check_in_at = nextCheckIn;
  if (hasCheckOutPatch) candidateValues.check_out_at = nextCheckOut;
  if (Object.prototype.hasOwnProperty.call(patch, "arrival_time_window")) {
    candidateValues.arrival_time_window = cleanString(patch.arrival_time_window);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "departure_time_window")) {
    candidateValues.departure_time_window = cleanString(patch.departure_time_window);
  }

  for (const field of Object.keys(candidateValues) as ReservationScheduleField[]) {
    const previous = normalizeComparable(reservation[field]);
    const next = normalizeComparable(candidateValues[field]);
    if (previous === next) continue;
    updatePayload[field] = candidateValues[field] ?? null;
    changes.push({
      field,
      previous,
      next,
      scope: ARRIVAL_FIELDS.has(field) ? "arrival" : "departure",
    });
  }

  const impactedSteps = new Set<StayMissionStep>();
  if (changes.some((change) => ARRIVAL_FIELDS.has(change.field))) ARRIVAL_STEPS.forEach((step) => impactedSteps.add(step));
  if (changes.some((change) => DEPARTURE_FIELDS.has(change.field))) DEPARTURE_STEPS.forEach((step) => impactedSteps.add(step));

  return {
    ok: true,
    changedFields: changes.map((change) => change.field),
    updatePayload,
    changes,
    impactedSteps: Array.from(impactedSteps),
  };
}

export function identifyImpactedStayMissions(
  missions: LinkedStayMissionLike[],
  impactedSteps: StayMissionStep[],
): ImpactedStayMission[] {
  const impacted = new Set(impactedSteps);
  return missions
    .map((mission) => ({ mission, step: getStayMissionStep(mission) }))
    .filter((item): item is { mission: LinkedStayMissionLike; step: StayMissionStep } => Boolean(item.step && impacted.has(item.step)))
    .map(({ mission, step }) => ({
      id: mission.id,
      title: mission.title ?? null,
      status: mission.status ?? null,
      scheduled_start: mission.scheduled_start ?? null,
      scheduled_end: mission.scheduled_end ?? null,
      step,
      impact_reason: step === "checkin" ? "arrival_changed" : "departure_changed",
    }));
}
