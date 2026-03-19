// src/app/components/status/userStatusTypes.ts

export type UserStatus =
  | "active"
  | "busy"
  | "away"
  | "vacation"
  | "offline";

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Actif",
  busy: "En service",
  away: "Absent",
  vacation: "En vacances",
  offline: "Hors ligne",
};
