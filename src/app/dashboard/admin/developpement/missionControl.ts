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

const REFERENCE_NOW = new Date("2026-07-27T12:00:00+02:00");

function sumRegistryRows(plan: MasterPlanView) {
  return Object.values(plan.registryPriorityCounts).reduce((total, count) => total + count, 0);
}

function estimateCommitMinutes(subject: string) {
  const normalized = subject.toLowerCase();
  if (normalized.includes("control tower") || normalized.includes("health")) return 180;
  if (normalized.includes("dashboard") || normalized.includes("profile")) return 135;
  if (normalized.includes("kpi") || normalized.includes("team")) return 90;
  return 60;
}

function isThisWeek(date: string) {
  const value = new Date(date);
  const monday = new Date(REFERENCE_NOW);
  monday.setDate(REFERENCE_NOW.getDate() - 6);
  monday.setHours(0, 0, 0, 0);
  return value >= monday && value <= REFERENCE_NOW;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining} min`;
  if (remaining === 0) return `${hours} h`;
  return `${hours} h ${remaining} min`;
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

  return decisions
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4);
}

function toMinorBugCount(items: MasterPlanPlanningItem[]) {
  return items.filter((item) =>
    item.priority === "P3 Confort" ||
    item.priority === "P4 Évolution future" ||
    item.status === "🟠 Partiel"
  ).length;
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
      : `Domaine déclaré : ${metadataBaseHost}, vérifier l’alignement avec Vercel.`,
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
  const totalFeatures = sumRegistryRows(plan);
  const completedFeatures = Math.max(0, totalFeatures - plan.planning.length);
  const inProgressFeatures = plan.planning.filter((item) => item.status === "🟡 En cours" || item.status === "🟠 Partiel").length;
  const blockedFeatures = plan.planning.filter((item) => item.status === "⚠️ Bloqué").length;
  const criticalBugs = plan.planning.filter((item) => item.priority === "P0 Critique" && item.status !== "✅ Terminé").length;
  const minorBugs = toMinorBugCount(plan.planning);
  const progressionPct = totalFeatures === 0 ? 0 : Math.round((completedFeatures / totalFeatures) * 100);
  const weeklyDevelopmentMinutes = commits.filter((commit) => isThisWeek(commit.date)).reduce(
    (total, commit) => total + estimateCommitMinutes(commit.subject),
    0,
  );
  const weeklyGoal = plan.planning[0]?.feature
    ? `${plan.planning[0].feature} — ${plan.planning[0].nextAction || "prochaine action à préciser"}`
    : "Aucun chantier prioritaire ouvert.";
  const nextGoal = plan.planning[1]?.feature
    ? `${plan.planning[1].feature} — ${plan.planning[1].nextAction || "prochaine action à préciser"}`
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
    currentEnvironment: [process.env.NODE_ENV || "development", branch ? `branche ${branch}` : null, dirtyFileCount > 0 ? `${dirtyFileCount} fichier(s) modifié(s)` : "workspace propre"]
      .filter(Boolean)
      .join(" · "),
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
