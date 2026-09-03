import type { DeveloperLogCommit } from "./developerLog";
import type { MasterPlanPlanningItem, MasterPlanView } from "./masterPlan";

export type MissionControlHealthStatus = "healthy" | "warning" | "danger" | "unverifiable";

export type MissionControlHealthCard = {
  label: string;
  status: MissionControlHealthStatus;
  detail: string;
  checkedAt: string;
};

export type MissionControlDecision = {
  date: string;
  category: string;
  title: string;
  summary: string;
};

export type MissionControlCommit = {
  sha: string;
  shortSha: string;
  author: string;
  date: string;
  subject: string;
};

export type MissionControlView = {
  progressionPct: number;
  completedFeatures: number;
  inProgressFeatures: number;
  blockedFeatures: number;
  criticalBugs: number;
  minorBugs: number;
  weeklyDevelopmentMinutes: number;
  weeklyDevelopmentLabel: string;
  weeklyGoal: string;
  nextGoal: string;
  lastBackupAt: string | null;
  currentEnvironment: string;
  projectVersion: string;
  lastDecisions: MissionControlDecision[];
  lastCommits: MissionControlCommit[];
  healthCards: MissionControlHealthCard[];
};

type BuildMissionControlOptions = {
  plan: MasterPlanView;
  markdown: string;
  projectVersion: string;
  commits: DeveloperLogCommit[];
  branch: string | null;
  dirtyFileCount: number;
  repositoryUrl: string | null;
  workflowExists: boolean;
  metadataBaseHost: string | null;
  supabaseHealth: MissionControlHealthCard;
  checkedAt?: string;
};

function estimateCommitMinutes(subject: string) {
  const normalized = subject.toLowerCase();
  if (normalized.includes("control tower") || normalized.includes("health")) return 180;
  if (normalized.includes("dashboard") || normalized.includes("profile")) return 135;
  if (normalized.includes("kpi") || normalized.includes("team")) return 90;
  return 60;
}

function isThisWeek(date: string, referenceNow: Date) {
  const value = new Date(date);
  const monday = new Date(referenceNow);
  monday.setDate(referenceNow.getDate() - 6);
  monday.setHours(0, 0, 0, 0);
  return value >= monday && value <= referenceNow;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining} min`;
  if (remaining === 0) return `${hours} h`;
  return `${hours} h ${remaining} min`;
}

function normalizeComparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function statusCategory(status: string): "done" | "active" | "blocked" | "todo" | "other" {
  const normalized = normalizeComparable(status);
  if (normalized.includes("termine")) return "done";
  if (normalized.includes("bloque")) return "blocked";
  if (normalized.includes("a faire") || normalized.includes("non commence") || normalized.includes("reporte")) return "todo";
  if (normalized.includes("en cours") || normalized.includes("partiel")) return "active";
  return "other";
}

function toMinorBugCount(items: MasterPlanPlanningItem[]) {
  return items.filter((item) => {
    const normalizedPriority = normalizeComparable(item.priority);
    const category = statusCategory(item.status);
    return normalizedPriority === "p3 confort" || normalizedPriority === "p4 evolution future" || category === "active";
  }).length;
}

function extractRecentDecisions(markdown: string) {
  const decisions: MissionControlDecision[] = [];
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");

  for (const line of lines) {
    if (line.startsWith("| 2026-")) {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.length >= 5) {
        decisions.push({
          date: cells[0],
          category: cells[1],
          title: cells[2],
          summary: cells[4],
        });
      }
      continue;
    }

    const proseDecision = /^\*\*(\d{4}-\d{2}-\d{2}) - ([^.]+)\.\*\*\s*(.+)$/.exec(line.trim());
    if (proseDecision) {
      decisions.push({
        date: proseDecision[1],
        category: proseDecision[2].trim(),
        title: proseDecision[3].split(".")[0]?.trim() || proseDecision[3].trim(),
        summary: proseDecision[3].trim(),
      });
    }
  }

  return decisions.sort((left, right) => right.date.localeCompare(left.date)).slice(0, 4);
}

function buildGitHubHealth({
  repositoryUrl,
  workflowExists,
  dirtyFileCount,
  checkedAt,
}: {
  repositoryUrl: string | null;
  workflowExists: boolean;
  dirtyFileCount: number;
  checkedAt: string;
}): MissionControlHealthCard {
  if (!repositoryUrl) {
    return {
      label: "Santé GitHub",
      status: "unverifiable",
      detail: "Remote GitHub absent ou non configuré.",
      checkedAt,
    };
  }

  if (!workflowExists) {
    return {
      label: "Santé GitHub",
      status: "warning",
      detail: "Remote détecté, mais workflow CI GitHub absent.",
      checkedAt,
    };
  }

  return {
    label: "Santé GitHub",
    status: dirtyFileCount > 0 ? "warning" : "healthy",
    detail: dirtyFileCount > 0
      ? `${dirtyFileCount} fichier(s) non validé(s) localement ; workflow CI présent.`
      : "Remote GitHub et workflow CI critiques présents.",
    checkedAt,
  };
}

function buildVercelHealth({
  metadataBaseHost,
  checkedAt,
}: {
  metadataBaseHost: string | null;
  checkedAt: string;
}): MissionControlHealthCard {
  if (!metadataBaseHost) {
    return {
      label: "Santé Vercel",
      status: "unverifiable",
      detail: "Aucun domaine Vercel déclaré dans le layout.",
      checkedAt,
    };
  }

  return {
    label: "Santé Vercel",
    status: metadataBaseHost.includes("vercel.app") ? "healthy" : "warning",
    detail: metadataBaseHost.includes("vercel.app")
      ? `Domaine applicatif déclaré : ${metadataBaseHost}.`
      : `Domaine déclaré : ${metadataBaseHost}, vérifier l'alignement avec Vercel.`,
    checkedAt,
  };
}

export function buildMissionControlView({
  plan,
  markdown,
  projectVersion,
  commits,
  branch,
  dirtyFileCount,
  repositoryUrl,
  workflowExists,
  metadataBaseHost,
  supabaseHealth,
  checkedAt = new Date().toISOString(),
}: BuildMissionControlOptions): MissionControlView {
  const referenceNow = new Date(checkedAt);
  const functionalRows = plan.functionalRows;
  const totalFeatures = functionalRows.length
    || Math.max(0, Object.values(plan.registryPriorityCounts).reduce((total, count) => total + count, 0));
  const completedFeatures = functionalRows.length
    ? functionalRows.filter((row) => statusCategory(row.status) === "done").length
    : Math.max(0, totalFeatures - plan.planning.length);
  const inProgressFeatures = functionalRows.length
    ? functionalRows.filter((row) => statusCategory(row.status) === "active").length
    : plan.planning.filter((item) => statusCategory(item.status) === "active").length;
  const blockedFeatures = functionalRows.length
    ? functionalRows.filter((row) => statusCategory(row.status) === "blocked").length
    : plan.planning.filter((item) => statusCategory(item.status) === "blocked").length;
  const criticalBugs = plan.planning.filter(
    (item) => normalizeComparable(item.priority) === "p0 critique" && statusCategory(item.status) !== "done",
  ).length;
  const minorBugs = toMinorBugCount(plan.planning);
  const progressionPct = totalFeatures === 0 ? 0 : Math.round((completedFeatures / totalFeatures) * 100);
  const weeklyDevelopmentMinutes = commits
    .filter((commit) => isThisWeek(commit.date, referenceNow))
    .reduce((total, commit) => total + estimateCommitMinutes(commit.subject), 0);

  const weeklyGoal = plan.planning[0]?.feature
    ? `${plan.planning[0].feature} - ${plan.planning[0].nextAction || "prochaine action à préciser"}`
    : "Aucun chantier prioritaire ouvert.";
  const nextGoal = plan.planning[1]?.feature
    ? `${plan.planning[1].feature} - ${plan.planning[1].nextAction || "prochaine action à préciser"}`
    : weeklyGoal;

  return {
    progressionPct,
    completedFeatures,
    inProgressFeatures,
    blockedFeatures,
    criticalBugs,
    minorBugs,
    weeklyDevelopmentMinutes,
    weeklyDevelopmentLabel: formatMinutes(weeklyDevelopmentMinutes),
    weeklyGoal,
    nextGoal,
    lastBackupAt: commits[0]?.date ?? null,
    currentEnvironment: [
      process.env.NODE_ENV || "development",
      branch ? `branche ${branch}` : null,
      dirtyFileCount > 0 ? `${dirtyFileCount} fichier(s) modifié(s)` : "workspace propre",
    ].filter(Boolean).join(" · "),
    projectVersion,
    lastDecisions: extractRecentDecisions(markdown),
    lastCommits: commits.slice(0, 4).map((commit) => ({
      sha: commit.sha,
      shortSha: commit.shortSha,
      author: commit.author,
      date: commit.date,
      subject: commit.subject,
    })),
    healthCards: [
      supabaseHealth,
      buildVercelHealth({ metadataBaseHost, checkedAt }),
      buildGitHubHealth({ repositoryUrl, workflowExists, dirtyFileCount, checkedAt }),
    ],
  };
}
