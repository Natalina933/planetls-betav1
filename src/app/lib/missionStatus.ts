export type MissionStatus =
  | "draft"
  | "assigned"
  | "to_schedule"
  | "date_requested"
  | "date_proposed"
  | "date_confirmed"
  | "scheduled"
  | "accepted"
  | "in_progress"
  | "awaiting_owner_validation"
  | "validated"
  | "completed"
  | "closed"
  | "canceled";

export type MissionPriority = "low" | "normal" | "high" | "urgent";

export const VALID_MISSION_STATUSES: MissionStatus[] = [
  "draft",
  "assigned",
  "to_schedule",
  "date_requested",
  "date_proposed",
  "date_confirmed",
  "scheduled",
  "accepted",
  "in_progress",
  "awaiting_owner_validation",
  "validated",
  "completed",
  "closed",
  "canceled",
];

export const VALID_MISSION_PRIORITIES: MissionPriority[] = ["low", "normal", "high", "urgent"];

const STATUS_ALIASES: Record<string, MissionStatus> = {
  pending: "draft",
  planned: "scheduled",
  provider_intervention: "in_progress",
  quote_accepted: "to_schedule",
  mission_created: "to_schedule",
  awaiting_validation: "awaiting_owner_validation",
  awaiting_owner_signoff: "awaiting_owner_validation",
};

export function normalizeMissionStatus(value: unknown): MissionStatus {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (VALID_MISSION_STATUSES.includes(raw as MissionStatus)) return raw as MissionStatus;
  return STATUS_ALIASES[raw] ?? "draft";
}

export function normalizeMissionPriority(value: unknown): MissionPriority {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return VALID_MISSION_PRIORITIES.includes(raw as MissionPriority) ? (raw as MissionPriority) : "normal";
}

export function getMissionStatusLabel(status: unknown): string {
  switch (normalizeMissionStatus(status)) {
    case "draft":
      return "A qualifier";
    case "assigned":
    case "to_schedule":
      return "A planifier";
    case "date_requested":
      return "Date demandee";
    case "date_proposed":
      return "Date proposee";
    case "date_confirmed":
      return "Date confirmee";
    case "scheduled":
      return "Planifiee";
    case "accepted":
      return "Acceptee";
    case "in_progress":
      return "En cours";
    case "awaiting_owner_validation":
      return "Validation proprietaire";
    case "validated":
      return "Validee";
    case "completed":
      return "Terminee";
    case "closed":
      return "Cloturee";
    case "canceled":
      return "Annulee";
  }
}

export function getMissionPriorityLabel(priority: unknown): string {
  switch (normalizeMissionPriority(priority)) {
    case "low":
      return "Basse";
    case "normal":
      return "Normale";
    case "high":
      return "Haute";
    case "urgent":
      return "Urgente";
  }
}

export function canTransitionMissionStatus(from: unknown, to: unknown): boolean {
  const current = normalizeMissionStatus(from);
  const next = normalizeMissionStatus(to);
  if (current === next) return true;
  if (current === "canceled") return false;
  if (current === "closed") return false;

  const allowed: Record<MissionStatus, MissionStatus[]> = {
    draft: ["assigned", "to_schedule", "date_requested", "date_proposed", "date_confirmed", "scheduled", "accepted", "canceled"],
    assigned: ["to_schedule", "date_requested", "date_proposed", "date_confirmed", "scheduled", "accepted", "in_progress", "canceled"],
    to_schedule: ["date_requested", "date_proposed", "date_confirmed", "scheduled", "accepted", "canceled"],
    date_requested: ["date_proposed", "date_confirmed", "scheduled", "accepted", "canceled"],
    date_proposed: ["date_confirmed", "scheduled", "accepted", "canceled"],
    date_confirmed: ["scheduled", "accepted", "in_progress", "canceled"],
    scheduled: ["accepted", "in_progress", "awaiting_owner_validation", "completed", "canceled"],
    accepted: ["scheduled", "in_progress", "awaiting_owner_validation", "completed", "canceled"],
    in_progress: ["awaiting_owner_validation", "completed", "canceled"],
    awaiting_owner_validation: ["validated", "completed", "canceled"],
    validated: ["closed", "canceled"],
    completed: ["validated", "closed"],
    closed: [],
    canceled: [],
  };

  return allowed[current].includes(next);
}

export function getMissionActionTarget(action: unknown): MissionStatus | null {
  switch (typeof action === "string" ? action : "") {
    case "accept":
      return "accepted";
    case "request_date":
      return "date_requested";
    case "propose_date":
      return "date_proposed";
    case "confirm_date":
      return "date_confirmed";
    case "schedule":
      return "scheduled";
    case "start":
      return "in_progress";
    case "complete":
      return "awaiting_owner_validation";
    case "validate_completion":
      return "validated";
    case "close":
      return "closed";
    case "cancel":
      return "canceled";
    default:
      return null;
  }
}
