export type MissionRow = {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
};

type WorkspaceTone = "default" | "warning" | "success";

export type PlanningItem = {
  title: string;
  meta: string;
  description: string;
  href: string;
  actionLabel: string;
  tone?: WorkspaceTone;
};

function takeFirst<T>(items: T[], count: number) {
  return items.slice(0, count);
}

export function toTimestamp(value: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function formatPlanningDate(value: string | null) {
  if (!value) return "À planifier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function normalizePlanningStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "non renseigné";
}

export function isPlanningDone(status: string | null) {
  return status === "completed" || status === "canceled";
}

export function getStartOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

export function getEndOfToday() {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.getTime();
}

export function toPlanningItem(
  mission: MissionRow,
  actionLabel: string,
  tone?: WorkspaceTone,
): PlanningItem {
  return {
    title: mission.title || "Mission sans titre",
    meta: formatPlanningDate(mission.scheduled_start),
    description: `${normalizePlanningStatus(mission.status)}${mission.priority ? ` - priorité ${mission.priority}` : ""}`,
    href: "/dashboard/concierge/profile?tab=missions",
    actionLabel,
    tone: tone || (mission.priority === "urgent" ? "warning" : "default"),
  };
}

export function buildPlanningStatusBreakdown(missions: MissionRow[]): PlanningItem[] {
  const groups = new Map<string, number>();
  missions.forEach((mission) => {
    const key = mission.status || "non_renseigne";
    groups.set(key, (groups.get(key) || 0) + 1);
  });

  return takeFirst(
    Array.from(groups.entries()).sort((a, b) => b[1] - a[1]),
    5,
  ).map(([status, count]) => ({
    title: normalizePlanningStatus(status),
    meta: `${count} mission(s)`,
    description: "Répartition actuelle de votre activité opérationnelle.",
    href: "/dashboard/concierge/profile?tab=missions",
    actionLabel: "Voir les missions",
    tone:
      status === "completed"
        ? "success"
        : status === "canceled"
          ? "warning"
          : "default",
  }));
}
