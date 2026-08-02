import type { MasterPlanPlanningItem, MasterPlanView } from "./masterPlan";

export type RoadmapDifficulty = "Faible" | "Moyenne" | "Élevée";
export type RoadmapImpact = "Faible" | "Moyen" | "Fort" | "Très fort";

export type RoadmapItem = {
  id: string;
  title: string;
  domain: string;
  priority: string;
  difficulty: RoadmapDifficulty;
  dependencies: string[];
  dependencyLabels: string[];
  estimation: string;
  estimationDays: number;
  userGain: RoadmapImpact;
  userGainScore: number;
  businessGain: RoadmapImpact;
  businessGainScore: number;
  technicalDebt: RoadmapImpact;
  technicalDebtScore: number;
  status: string;
  owner: string;
  targetDate: string;
  nextAction: string;
  evidence: string;
  audience: string;
  horizon: MasterPlanPlanningItem["horizon"];
  baseRank: number;
};

export type RoadmapProjectedItem = RoadmapItem & {
  isCompleted: boolean;
  isReady: boolean;
  blockedBy: string[];
  effectivePriorityScore: number;
};

export type RoadmapProjection = {
  items: RoadmapProjectedItem[];
  readyItems: RoadmapProjectedItem[];
  blockedItems: RoadmapProjectedItem[];
  completedItems: RoadmapProjectedItem[];
  nextSuggestion: RoadmapProjectedItem | null;
};

export type RoadmapView = {
  items: RoadmapItem[];
};

const REFERENCE_DATE = new Date("2026-07-27T12:00:00+02:00");

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function impactLabel(score: number): RoadmapImpact {
  if (score >= 5) return "Très fort";
  if (score >= 4) return "Fort";
  if (score >= 3) return "Moyen";
  return "Faible";
}

function inferDifficulty(item: MasterPlanPlanningItem): RoadmapDifficulty {
  const normalized = `${item.domain} ${item.feature} ${item.nextAction} ${item.evidence}`.toLowerCase();
  if (
    item.status.includes("Bloqué")
    || normalized.includes("stripe")
    || normalized.includes("migration")
    || normalized.includes("rls")
    || normalized.includes("e2e")
  ) {
    return "Élevée";
  }
  if (
    item.priority === "P0 Critique"
    || normalized.includes("workflow")
    || normalized.includes("permission")
    || normalized.includes("sante")
  ) {
    return "Moyenne";
  }
  return "Faible";
}

function inferOwner(item: MasterPlanPlanningItem) {
  const normalized = normalize(`${item.domain} ${item.feature}`);
  if (normalized.includes("qualite") || normalized.includes("build") || normalized.includes("tests")) return "Tech & QA";
  if (normalized.includes("pilotage") || normalized.includes("admin") || normalized.includes("dashboard")) return "Produit & Ops";
  if (normalized.includes("data") || normalized.includes("funnel") || normalized.includes("kpi")) return "Data & Produit";
  if (normalized.includes("profil") || normalized.includes("auth")) return "Identity & Produit";
  if (normalized.includes("equipe")) return "Ops terrain";
  return "Produit & Tech";
}

function inferImpactScores(item: MasterPlanPlanningItem) {
  const priorityWeight = item.priority === "P0 Critique"
    ? 5
    : item.priority === "P1 Prioritaire"
      ? 4
      : item.priority === "P2 Important"
        ? 3
        : 2;
  const normalized = normalize(`${item.domain} ${item.feature} ${item.nextAction}`);

  const userGainScore = clamp(
    priorityWeight
      + (normalized.includes("owner") || normalized.includes("concierge") || normalized.includes("provider") ? 1 : 0)
      + (normalized.includes("paiement") || normalized.includes("mission") || normalized.includes("profil") ? 1 : 0),
    2,
    5,
  );
  const businessGainScore = clamp(
    priorityWeight
      + (normalized.includes("paiement") || normalized.includes("activation") || normalized.includes("funnel") ? 1 : 0),
    2,
    5,
  );
  const technicalDebtScore = clamp(
    (item.status.includes("Bloqué") ? 5 : priorityWeight)
      + (normalized.includes("migration") || normalized.includes("build") || normalized.includes("ci") ? 1 : 0),
    2,
    5,
  );

  return {
    userGainScore,
    businessGainScore,
    technicalDebtScore,
  };
}

function inferEstimationDays(item: MasterPlanPlanningItem, difficulty: RoadmapDifficulty) {
  const base = difficulty === "Élevée" ? 8 : difficulty === "Moyenne" ? 5 : 3;
  if (item.priority === "P0 Critique") return base;
  if (item.priority === "P1 Prioritaire") return base + 1;
  if (item.priority === "P2 Important") return base + 2;
  return base + 3;
}

function formatEstimation(days: number) {
  if (days <= 1) return "0,5 à 1 jour";
  if (days <= 3) return `${days} jours`;
  if (days <= 5) return `${days} jours`;
  return `${days}-${days + 2} jours`;
}

function targetDateFor(item: MasterPlanPlanningItem, index: number) {
  const offset = item.horizon === "Maintenant"
    ? 3 + index * 2
    : item.horizon === "Ensuite"
      ? 10 + index * 3
      : item.horizon === "Après stabilisation"
        ? 24 + index * 4
        : 45 + index * 5;
  const next = new Date(REFERENCE_DATE);
  next.setDate(next.getDate() + offset);
  return next.toISOString().slice(0, 10);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function findDependencyIds(items: MasterPlanPlanningItem[], index: number) {
  const item = items[index];
  const normalized = normalize(`${item.domain} ${item.feature} ${item.nextAction}`);
  const earlierItems = items.slice(0, index);
  const dependencies: string[] = [];

  if (item.priority !== "P0 Critique") {
    const higherPriority = earlierItems.find((candidate) => candidate.order < item.order);
    if (higherPriority) dependencies.push(higherPriority.id);
  }

  if (item.status.includes("Bloqué") && earlierItems[0]) {
    dependencies.push(earlierItems[0].id);
  }

  if (normalized.includes("stripe") || normalized.includes("paiement") || normalized.includes("checkout") || normalized.includes("transactionnel")) {
    const qualityAnchor = items.find((candidate) => {
      const haystack = normalize(`${candidate.domain} ${candidate.feature}`);
      return haystack.includes("smoke") || haystack.includes("baseline") || haystack.includes("tests");
    });
    if (qualityAnchor) dependencies.push(qualityAnchor.id);
  }

  if (normalized.includes("profil") || normalized.includes("identite") || normalized.includes("auth")) {
    const authAnchor = items.find((candidate) => normalize(`${candidate.domain} ${candidate.feature}`).includes("acces rapide"));
    if (authAnchor) dependencies.push(authAnchor.id);
  }

  const sameDomainAnchor = earlierItems.find((candidate) => normalize(candidate.domain) === normalize(item.domain));
  if (sameDomainAnchor && dependencies.length === 0 && item.priority !== "P0 Critique") {
    dependencies.push(sameDomainAnchor.id);
  }

  return unique(dependencies).filter((dependencyId) => dependencyId !== item.id).slice(0, 3);
}

function priorityScore(priority: string) {
  if (priority === "P0 Critique") return 120;
  if (priority === "P1 Prioritaire") return 95;
  if (priority === "P2 Important") return 74;
  if (priority === "P3 Confort") return 52;
  return 30;
}

function itemScore(item: RoadmapItem, blockedBy: string[], isReady: boolean, isCompleted: boolean) {
  if (isCompleted) return -1;
  const readinessBonus = isReady ? 18 : -20;
  const blockedPenalty = blockedBy.length * 8;
  return priorityScore(item.priority) + item.userGainScore * 6 + item.businessGainScore * 5 + item.technicalDebtScore * 4 + readinessBonus - blockedPenalty;
}

export function buildRoadmapView(plan: MasterPlanView): RoadmapView {
  const items = plan.planning.map((item, index, allItems) => {
    const difficulty = inferDifficulty(item);
    const estimationDays = inferEstimationDays(item, difficulty);
    const dependencies = findDependencyIds(allItems, index);
    const { userGainScore, businessGainScore, technicalDebtScore } = inferImpactScores(item);

    return {
      id: item.id,
      title: item.feature,
      domain: item.domain,
      priority: item.priority,
      difficulty,
      dependencies,
      dependencyLabels: [],
      estimation: formatEstimation(estimationDays),
      estimationDays,
      userGain: impactLabel(userGainScore),
      userGainScore,
      businessGain: impactLabel(businessGainScore),
      businessGainScore,
      technicalDebt: impactLabel(technicalDebtScore),
      technicalDebtScore,
      status: item.status,
      owner: inferOwner(item),
      targetDate: targetDateFor(item, index),
      nextAction: item.nextAction,
      evidence: item.evidence,
      audience: item.audience,
      horizon: item.horizon,
      baseRank: item.order,
    } satisfies RoadmapItem;
  });

  const labelById = new Map(items.map((item) => [item.id, item.title] as const));
  return {
    items: items.map((item) => ({
      ...item,
      dependencyLabels: item.dependencies.map((dependencyId) => labelById.get(dependencyId) ?? dependencyId),
    })),
  };
}

export function projectRoadmap(view: RoadmapView, completedIds: string[]): RoadmapProjection {
  const completedSet = new Set(completedIds);
  const projectedItems = view.items.map((item) => {
    const isCompleted = completedSet.has(item.id) || item.status.includes("Terminé");
    const isPaused = item.status.includes("Reporté") || item.status.includes("Abandonné");
    const blockedBy = item.dependencies.filter((dependencyId) => !completedSet.has(dependencyId));
    const isReady = !isCompleted && !isPaused && blockedBy.length === 0;
    return {
      ...item,
      isCompleted,
      isReady,
      blockedBy,
      effectivePriorityScore: itemScore(item, blockedBy, isReady, isCompleted),
    } satisfies RoadmapProjectedItem;
  });

  const sorted = [...projectedItems].sort(
    (left, right) => right.effectivePriorityScore - left.effectivePriorityScore || left.targetDate.localeCompare(right.targetDate) || left.title.localeCompare(right.title, "fr"),
  );
  const readyItems = sorted.filter((item) => item.isReady);
  const blockedItems = sorted.filter((item) => !item.isCompleted && !item.isReady && !item.status.includes("Reporté") && !item.status.includes("Abandonné"));
  const completedItems = sorted.filter((item) => item.isCompleted);

  return {
    items: projectedItems,
    readyItems,
    blockedItems,
    completedItems,
    nextSuggestion: readyItems[0] ?? blockedItems[0] ?? null,
  };
}
