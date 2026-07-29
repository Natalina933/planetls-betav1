export const MASTER_PLAN_STATUSES = [
  "✅ Terminé", "🟡 En cours", "🟠 Partiel", "🔴 À faire", "⚠️ Bloqué", "⏸️ Reporté", "❌ Abandonné",
] as const;

export const MASTER_PLAN_PRIORITIES = [
  "P0 Critique", "P1 Prioritaire", "P2 Important", "P3 Confort", "P4 Évolution future",
] as const;

export type MasterPlanSection = {
  id: string; level: number; title: string; content: string; statuses: string[]; priorities: string[];
};

export type MasterPlanView = {
  title: string; updatedAt: string; sections: MasterPlanSection[];
  statusCounts: Record<string, number>; priorityCounts: Record<string, number>; lineCount: number;
  registryPriorityCounts: Record<string, number>;
  remainingPriorityCounts: Record<string, number>;
  planning: MasterPlanPlanningItem[];
};

export type MasterPlanPlanningItem = {
  id: string;
  order: number;
  horizon: "Maintenant" | "Ensuite" | "Après stabilisation" | "Plus tard";
  domain: string;
  feature: string;
  audience: string;
  status: string;
  priority: string;
  evidence: string;
  nextAction: string;
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function countOccurrences(source: string, token: string) {
  return source.split(token).length - 1;
}

function countSectionsWithToken(sections: Array<{ statuses: string[]; priorities: string[] }>, token: string, kind: "status" | "priority") {
  return sections.filter((section) => (
    kind === "status" ? section.statuses.includes(token) : section.priorities.includes(token)
  )).length;
}

function markdownCells(line: string) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/[`*_]/g, ""));
}

function registryRows(lines: string[]) {
  const headerIndex = lines.findIndex((line) => {
    const cells = markdownCells(line);
    return cells.includes("Domaine") && cells.includes("Fonctionnalité") && cells.includes("Prochaine action");
  });
  if (headerIndex < 0) return [] as string[][];
  const rows: string[][] = [];
  for (let index = headerIndex + 2; index < lines.length && lines[index].trim().startsWith("|"); index += 1) {
    rows.push(markdownCells(lines[index]));
  }
  return rows;
}

function buildPlanning(lines: string[]) {
  const headerIndex = lines.findIndex((line) => {
    const cells = markdownCells(line);
    return cells.includes("Domaine") && cells.includes("Fonctionnalité") && cells.includes("Prochaine action");
  });
  if (headerIndex < 0) return [];
  const headers = markdownCells(lines[headerIndex]);
  const column = (name: string) => headers.indexOf(name);
  const priorityOrder = new Map(MASTER_PLAN_PRIORITIES.map((priority, index) => [priority, index]));
  const rows: MasterPlanPlanningItem[] = [];
  for (let index = headerIndex + 2; index < lines.length && lines[index].trim().startsWith("|"); index += 1) {
    const cells = markdownCells(lines[index]);
    const status = cells[column("Statut")] ?? "";
    const priority = cells[column("Priorité")] ?? "";
    if (!priorityOrder.has(priority as typeof MASTER_PLAN_PRIORITIES[number]) || status === "✅ Terminé") continue;
    const rank = priorityOrder.get(priority as typeof MASTER_PLAN_PRIORITIES[number]) ?? 99;
    rows.push({
      id: `${slugify(cells[column("Domaine")] ?? "")}-${slugify(cells[column("Fonctionnalité")] ?? "")}`,
      order: rank,
      horizon: rank === 0 ? "Maintenant" : rank === 1 ? "Ensuite" : rank === 2 ? "Après stabilisation" : "Plus tard",
      domain: cells[column("Domaine")] ?? "",
      feature: cells[column("Fonctionnalité")] ?? "",
      audience: cells[column("Profil concerné")] ?? "",
      status,
      priority,
      evidence: cells[column("Preuves dans le code")] ?? "",
      nextAction: cells[column("Prochaine action")] ?? "",
    });
  }
  return rows.sort((left, right) => left.order - right.order || left.feature.localeCompare(right.feature, "fr"));
}

export function parseMasterPlan(markdown: string, updatedAt: string): MasterPlanView {
  const normalized = markdown.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  const headings = lines.map((line, index) => {
    const match = /^(#{1,4})\s+(.+)$/.exec(line);
    return match ? { index, level: match[1].length, title: match[2].trim() } : null;
  }).filter((heading): heading is NonNullable<typeof heading> => Boolean(heading));
  const usedIds = new Map<string, number>();
  const sections = headings.slice(1).map((heading, headingIndex) => {
    const end = headings[headingIndex + 2]?.index ?? lines.length;
    const content = lines.slice(heading.index + 1, end).join("\n").trim();
    const baseId = slugify(heading.title) || `section-${headingIndex + 1}`;
    const duplicateIndex = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, duplicateIndex + 1);
    return {
      id: duplicateIndex ? `${baseId}-${duplicateIndex + 1}` : baseId,
      level: heading.level, title: heading.title, content,
      statuses: MASTER_PLAN_STATUSES.filter((status) => content.includes(status)),
      priorities: MASTER_PLAN_PRIORITIES.filter((priority) => content.includes(priority)),
    };
  });
  const planning = buildPlanning(lines);
  const registry = registryRows(lines);
  const registryPriorityCounts = Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [
    priority,
    registry.filter((cells) => cells.includes(priority)).length,
  ]));
  const remainingPriorityCounts = Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [
    priority,
    planning.filter((item) => item.priority === priority).length,
  ]));
  return {
    title: headings[0]?.title ?? "Master Plan PlanetLS", updatedAt, sections,
    statusCounts: Object.fromEntries(MASTER_PLAN_STATUSES.map((status) => [status, countSectionsWithToken(sections, status, "status")])),
    priorityCounts: Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [priority, countSectionsWithToken(sections, priority, "priority")])),
    registryPriorityCounts,
    remainingPriorityCounts,
    lineCount: lines.length,
    planning,
  };
}
