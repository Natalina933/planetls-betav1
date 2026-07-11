import { normalizeMissionStatus } from "./missionStatus.ts";

export type TeamRole = "manager" | "lead" | "employee" | "collaborator" | "provider";

export type TeamPermission =
  | "missions.assign"
  | "missions.execute"
  | "missions.validate"
  | "planning.manage"
  | "finance.view"
  | "clients.message"
  | "team.manage";

export type TeamMemberInput = {
  id: string;
  name: string;
  role?: TeamRole | string | null;
  title?: string | null;
  availability?: "available" | "busy" | "offline" | null;
  skills?: string[];
  permissions?: TeamPermission[];
};

export type TeamMissionInput = {
  id: string;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  concierge_profile_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type TeamMember = TeamMemberInput & {
  role: TeamRole;
  availability: "available" | "busy" | "offline";
  permissions: TeamPermission[];
  assignedMissionCount: number;
  completedMissionCount: number;
  performanceScore: number;
  notificationCount: number;
};

export type TeamManagementDashboard = {
  members: TeamMember[];
  assignableMissions: Array<TeamMissionInput & { assigned_team_member_id: string | null }>;
  metrics: {
    employees: number;
    collaborators: number;
    available: number;
    assignedMissions: number;
    notifications: number;
    averagePerformance: number;
  };
  roleMatrix: Array<{ role: TeamRole; permissions: TeamPermission[] }>;
  planning: Array<{ memberId: string; memberName: string; label: string; start: string | null; status: string }>;
};

const DEFAULT_PERMISSIONS: Record<TeamRole, TeamPermission[]> = {
  manager: ["missions.assign", "missions.execute", "missions.validate", "planning.manage", "finance.view", "clients.message", "team.manage"],
  lead: ["missions.assign", "missions.execute", "missions.validate", "planning.manage", "clients.message"],
  employee: ["missions.execute", "clients.message"],
  collaborator: ["missions.execute"],
  provider: ["missions.execute"],
};

function normalizeRole(role: TeamMemberInput["role"]): TeamRole {
  if (role === "manager" || role === "lead" || role === "employee" || role === "collaborator" || role === "provider") return role;
  if (role === "concierge" || role === "concierge_pro") return "manager";
  if (role === "artisan" || role === "artisan_pro" || role === "provider_pro") return "provider";
  return "collaborator";
}

function getAssignedTeamMemberId(mission: TeamMissionInput) {
  const metadata = mission.metadata && typeof mission.metadata === "object" && !Array.isArray(mission.metadata) ? mission.metadata : {};
  return typeof metadata.assigned_team_member_id === "string" ? metadata.assigned_team_member_id : null;
}

function isActiveMission(status: string | null | undefined) {
  const normalized = normalizeMissionStatus(status);
  return !["completed", "validated", "closed", "canceled"].includes(normalized);
}

export function buildTeamManagementDashboard(input: {
  members: TeamMemberInput[];
  missions: TeamMissionInput[];
}): TeamManagementDashboard {
  const members = input.members.map((member) => {
    const role = normalizeRole(member.role);
    const assignedMissions = input.missions.filter((mission) => getAssignedTeamMemberId(mission) === member.id);
    const activeAssigned = assignedMissions.filter((mission) => isActiveMission(mission.status));
    const completedMissionCount = assignedMissions.filter((mission) =>
      ["completed", "validated", "closed"].includes(normalizeMissionStatus(mission.status)),
    ).length;
    const performanceScore = assignedMissions.length > 0
      ? Math.round((completedMissionCount / assignedMissions.length) * 100)
      : role === "manager"
        ? 85
        : 70;
    const availability = member.availability ?? (activeAssigned.length >= 3 ? "busy" : "available");
    const notificationCount = activeAssigned.filter((mission) => mission.priority === "urgent" || mission.priority === "high").length;

    return {
      ...member,
      role,
      availability,
      permissions: member.permissions && member.permissions.length > 0 ? member.permissions : DEFAULT_PERMISSIONS[role],
      assignedMissionCount: activeAssigned.length,
      completedMissionCount,
      performanceScore,
      notificationCount,
    };
  });
  const assignableMissions = input.missions.map((mission) => ({
    ...mission,
    assigned_team_member_id: getAssignedTeamMemberId(mission),
  }));
  const assignedMissions = assignableMissions.filter((mission) => mission.assigned_team_member_id).length;
  const notifications = members.reduce((sum, member) => sum + member.notificationCount, 0);

  return {
    members,
    assignableMissions,
    metrics: {
      employees: members.filter((member) => member.role === "employee" || member.role === "lead" || member.role === "manager").length,
      collaborators: members.filter((member) => member.role === "collaborator" || member.role === "provider").length,
      available: members.filter((member) => member.availability === "available").length,
      assignedMissions,
      notifications,
      averagePerformance: members.length > 0 ? Math.round(members.reduce((sum, member) => sum + member.performanceScore, 0) / members.length) : 0,
    },
    roleMatrix: Object.entries(DEFAULT_PERMISSIONS).map(([role, permissions]) => ({ role: role as TeamRole, permissions })),
    planning: assignableMissions
      .filter((mission) => mission.assigned_team_member_id)
      .slice(0, 12)
      .map((mission) => {
        const member = members.find((entry) => entry.id === mission.assigned_team_member_id);
        return {
          memberId: mission.assigned_team_member_id ?? "",
          memberName: member?.name ?? "Equipe",
          label: mission.title || "Mission",
          start: mission.scheduled_start ?? null,
          status: normalizeMissionStatus(mission.status),
        };
      }),
  };
}
