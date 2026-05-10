import { canTransitionMissionStatus, normalizeMissionStatus, type MissionStatus } from "./missionStatus.ts";

export const ADMIN_ROLES = new Set(["admin", "super_admin"]);
export const CONCIERGE_MISSION_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
export const OWNER_MISSION_ROLES = new Set(["owner", "owner_pro"]);
export const PROVIDER_ROLES = new Set(["provider", "provider_pro", "artisan", "artisan_pro"]);

export type MissionActorRole = "admin" | "concierge" | "owner" | "provider" | "unknown";

export function getMissionActorRole(role: string): MissionActorRole {
  if (ADMIN_ROLES.has(role)) return "admin";
  if (CONCIERGE_MISSION_ROLES.has(role)) return "concierge";
  if (OWNER_MISSION_ROLES.has(role)) return "owner";
  if (PROVIDER_ROLES.has(role)) return "provider";
  return "unknown";
}

export function canAccessMissionForRole(input: {
  role: string;
  userId: string;
  ownerProfileId?: string | null;
  conciergeProfileId?: string | null;
}) {
  const actorRole = getMissionActorRole(input.role);
  if (actorRole === "admin") return true;
  if (actorRole === "owner") return input.ownerProfileId === input.userId;
  if (actorRole === "concierge") return input.conciergeProfileId === input.userId;
  return false;
}

export function canUpdateMissionFields(role: string, fields: string[]) {
  const actorRole = getMissionActorRole(role);
  if (actorRole === "admin") return true;

  const ownerFields = new Set([
    "title",
    "description",
    "priority",
    "scheduled_start",
    "scheduled_end",
    "concierge_profile_id",
  ]);
  const conciergeFields = new Set([
    "title",
    "description",
    "priority",
    "scheduled_start",
    "scheduled_end",
    "amount",
  ]);

  const allowed = actorRole === "owner" ? ownerFields : actorRole === "concierge" ? conciergeFields : new Set();
  return fields.every((field) => allowed.has(field));
}

export function canMutateMissionStatus(role: string, from: unknown, to: MissionStatus) {
  const actorRole = getMissionActorRole(role);
  if (actorRole === "admin") return canTransitionMissionStatus(from, to);
  if (to === "canceled") {
    return (actorRole === "owner" || actorRole === "concierge") && canTransitionMissionStatus(from, to);
  }
  if (to === "assigned") {
    return (actorRole === "owner" || actorRole === "concierge") && canTransitionMissionStatus(from, to);
  }
  return actorRole === "concierge" && canTransitionMissionStatus(from, to);
}

export function getMissionPermissions(role: string, status: unknown) {
  const actorRole = getMissionActorRole(role);
  const normalizedStatus = normalizeMissionStatus(status);
  return {
    canEditPlanning: actorRole === "admin" || actorRole === "owner" || actorRole === "concierge",
    canEditAmount: actorRole === "admin" || actorRole === "concierge",
    canReassignConcierge: actorRole === "admin" || actorRole === "owner",
    canUploadEvidence: actorRole === "admin" || actorRole === "concierge",
    canManageChecklist: actorRole === "admin" || actorRole === "concierge",
    canSignOff: actorRole === "admin" || actorRole === "owner" || actorRole === "concierge",
    canCreateProviderIntervention: actorRole === "admin" || actorRole === "concierge",
    canAccept: canMutateMissionStatus(role, normalizedStatus, "accepted"),
    canStart: canMutateMissionStatus(role, normalizedStatus, "in_progress"),
    canComplete: canMutateMissionStatus(role, normalizedStatus, "completed"),
    canCancel: canMutateMissionStatus(role, normalizedStatus, "canceled"),
  };
}
