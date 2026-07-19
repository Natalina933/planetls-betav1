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
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function countOccurrences(source: string, token: string) {
  return source.split(token).length - 1;
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
  return {
    title: headings[0]?.title ?? "Master Plan PlanetLS", updatedAt, sections,
    statusCounts: Object.fromEntries(MASTER_PLAN_STATUSES.map((status) => [status, countOccurrences(normalized, status)])),
    priorityCounts: Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [priority, countOccurrences(normalized, priority)])),
    lineCount: lines.length,
  };
}
