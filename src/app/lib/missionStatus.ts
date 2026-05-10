export type MissionStatus =
  | "draft"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "canceled";

export type MissionPriority = "low" | "normal" | "high" | "urgent";

export const VALID_MISSION_STATUSES: MissionStatus[] = [
  "draft",
  "assigned",
  "accepted",
  "in_progress",
  "completed",
  "canceled",
];

export const VALID_MISSION_PRIORITIES: MissionPriority[] = ["low", "normal", "high", "urgent"];

const STATUS_ALIASES: Record<string, MissionStatus> = {
  pending: "draft",
  planned: "assigned",
  validated: "completed",
  provider_intervention: "in_progress",
  quote_accepted: "assigned",
  mission_created: "assigned",
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
      return "Assignée";
    case "accepted":
      return "Acceptée";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminée";
    case "canceled":
      return "Annulée";
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
  if (current === "completed") return false;

  const allowed: Record<MissionStatus, MissionStatus[]> = {
    draft: ["assigned", "accepted", "canceled"],
    assigned: ["accepted", "in_progress", "canceled"],
    accepted: ["in_progress", "completed", "canceled"],
    in_progress: ["completed", "canceled"],
    completed: [],
    canceled: [],
  };

  return allowed[current].includes(next);
}

export function getMissionActionTarget(action: unknown): MissionStatus | null {
  switch (typeof action === "string" ? action : "") {
    case "accept":
      return "accepted";
    case "start":
      return "in_progress";
    case "complete":
      return "completed";
    case "cancel":
      return "canceled";
    default:
      return null;
  }
}

