export const MASTER_PLAN_STATUSES = [
  "✅ Terminé",
  "🟡 En cours",
  "🟠 Partiel",
  "🔴 À faire",
  "⚠️ Bloqué",
  "⏸️ Reporté",
  "❌ Abandonné",
] as const;

export const MASTER_PLAN_PRIORITIES = [
  "P0 Critique",
  "P1 Prioritaire",
  "P2 Important",
  "P3 Confort",
  "P4 Évolution future",
] as const;

export const MASTER_PLAN_MATURITY_LEVELS = [
  { level: "N0", label: "Idée", definition: "Intention sans conception validée" },
  { level: "N1", label: "Spécifié", definition: "Parcours/règles documentés, pas de réalisation exploitable" },
  { level: "N2", label: "Socle", definition: "UI, helper ou API partielle ; données parfois locales ou en metadata" },
  { level: "N3", label: "Fonctionnel", definition: "Parcours principal persistant et utilisable, finitions ou E2E manquants" },
  { level: "N4", label: "Validé", definition: "Parcours complet, permissions, erreurs, tests et QA réels validés" },
  { level: "N5", label: "Piloté", definition: "N4 + métriques, alertes et amélioration continue" },
] as const;

export const MASTER_PLAN_PRIORITY_GUIDE = [
  { priority: "P0 Critique", scope: "Bloque la fiabilité, la sécurité, la donnée, le lancement ou un parcours de valeur principal" },
  { priority: "P1 Prioritaire", scope: "Augmente fortement conversion, rétention ou efficacité opérationnelle" },
  { priority: "P2 Important", scope: "Améliore nettement le produit ou le pilotage, sans bloquer l’usage principal" },
  { priority: "P3 Confort", scope: "Améliore cohérence, lisibilité ou productivité sans bloquer l’usage" },
  { priority: "P4 Évolution future", scope: "Pari stratégique à valider avant industrialisation" },
] as const;

export type MasterPlanSection = {
  id: string;
  level: number;
  title: string;
  content: string;
  statuses: string[];
  priorities: string[];
};

export type MasterPlanView = {
  title: string;
  updatedAt: string;
  sections: MasterPlanSection[];
  updates: MasterPlanUpdateEntry[];
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  lineCount: number;
  registryPriorityCounts: Record<string, number>;
  remainingPriorityCounts: Record<string, number>;
  functionalRows: MasterPlanFunctionalRow[];
  functionalLevelCounts: Record<string, number>;
  functionalStatusCounts: Record<string, number>;
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

export type MasterPlanFunctionalRow = {
  feature: string;
  status: string;
  level: string;
  observations: string;
};

export type MasterPlanUpdateEntry = {
  id: string;
  title: string;
  subject: string;
  status: string;
  priority: string;
  scope: string[];
  productChanges: string[];
  decisions: string[];
  contradictions: string[];
  verifications: string[];
  nextActions: string[];
  ideas: string[];
  isNew: boolean;
  statusChanged: boolean;
  priorityChanged: boolean;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeComparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalFunctionalStatus(value: string) {
  const normalized = normalizeComparable(value);
  if (normalized.includes("en cours")) return "en cours";
  if (normalized.includes("partiel")) return "partiel";
  if (normalized.includes("termine")) return "termine";
  if (normalized.includes("a faire")) return "a faire";
  if (normalized.includes("bloque")) return "bloque";
  if (normalized.includes("reporte")) return "reporte";
  if (normalized.includes("abandonne")) return "abandonne";
  return normalized;
}

function canonicalPriority(value: string) {
  const normalized = normalizeComparable(value);
  if (normalized.includes("p0")) return "p0";
  if (normalized.includes("p1")) return "p1";
  if (normalized.includes("p2")) return "p2";
  if (normalized.includes("p3")) return "p3";
  if (normalized.includes("p4")) return "p4";
  return normalized;
}

function countSectionsWithToken(
  sections: Array<{ statuses: string[]; priorities: string[] }>,
  token: string,
  kind: "status" | "priority",
) {
  return sections.filter((section) => (
    kind === "status" ? section.statuses.includes(token) : section.priorities.includes(token)
  )).length;
}

function markdownCells(line: string) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/[`*_]/g, ""));
}

function hasHeader(cells: string[], expected: string[]) {
  const normalized = cells.map(normalizeComparable);
  return expected.every((header) => normalized.includes(normalizeComparable(header)));
}

function findFunctionalTableHeaderIndex(lines: string[]) {
  const strictHeaderIndex = lines.findIndex((line) => hasHeader(markdownCells(line), [
    "Fonctionnalité",
    "État",
    "Niveau",
    "Observations factuelles",
  ]));
  if (strictHeaderIndex >= 0) return strictHeaderIndex;

  return lines.findIndex((line) => {
    const normalizedLine = normalizeComparable(line);
    return line.trim().startsWith("|")
      && normalizedLine.includes("niveau")
      && normalizedLine.includes("observations factuelles")
      && (normalizedLine.includes("fonctionnal") || normalizedLine.includes("fonct"))
      && (normalizedLine.includes("etat") || normalizedLine.includes("tat"));
  });
}

function registryRows(lines: string[]) {
  const headerIndex = lines.findIndex((line) => hasHeader(markdownCells(line), [
    "Domaine",
    "Fonctionnalité",
    "Prochaine action",
  ]));
  if (headerIndex < 0) return [] as string[][];

  const rows: string[][] = [];
  for (let index = headerIndex + 2; index < lines.length && lines[index].trim().startsWith("|"); index += 1) {
    rows.push(markdownCells(lines[index]));
  }
  return rows;
}

function buildPlanning(lines: string[]) {
  const headerIndex = lines.findIndex((line) => hasHeader(markdownCells(line), [
    "Domaine",
    "Fonctionnalité",
    "Prochaine action",
  ]));
  if (headerIndex < 0) return [] as MasterPlanPlanningItem[];

  const headers = markdownCells(lines[headerIndex]);
  const normalizedHeaders = headers.map(normalizeComparable);
  const column = (name: string) => normalizedHeaders.indexOf(normalizeComparable(name));
  const priorityOrder = new Map(MASTER_PLAN_PRIORITIES.map((priority, index) => [priority, index]));
  const rows: MasterPlanPlanningItem[] = [];

  for (let index = headerIndex + 2; index < lines.length && lines[index].trim().startsWith("|"); index += 1) {
    const cells = markdownCells(lines[index]);
    const status = cells[column("Statut")] ?? "";
    const priority = cells[column("Priorité")] ?? "";
    if (!priorityOrder.has(priority as typeof MASTER_PLAN_PRIORITIES[number])) continue;
    if (normalizeComparable(status).includes("termine")) continue;

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

function buildFunctionalRows(lines: string[]) {
  const headerIndex = findFunctionalTableHeaderIndex(lines);
  if (headerIndex < 0) return [] as MasterPlanFunctionalRow[];

  const rows: MasterPlanFunctionalRow[] = [];
  for (let index = headerIndex + 2; index < lines.length && lines[index].trim().startsWith("|"); index += 1) {
    const cells = markdownCells(lines[index]);
    rows.push({
      feature: cells[0] ?? "",
      status: cells[1] ?? "",
      level: cells[2] ?? "",
      observations: cells[3] ?? "",
    });
  }

  return rows.filter((row) => row.feature && row.status && row.level);
}

function normalizedFieldKey(value: string) {
  return normalizeComparable(value)
    .replace(/^-\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseUpdateFields(content: string) {
  const fields = new Map<string, string[]>();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    const match = /^-?\s*([^:]+):\s*(.+)$/.exec(line);
    if (!match) continue;
    const key = normalizedFieldKey(match[1]);
    const value = match[2].trim().replace(/`/g, "");
    if (!key || !value) continue;
    fields.set(key, [...(fields.get(key) ?? []), value]);
  }
  return fields;
}

function pickField(fields: Map<string, string[]>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields.get(normalizedFieldKey(key));
    if (value?.length) return value;
  }
  return [];
}

function splitScope(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function updateSubject(title: string) {
  return title
    .replace(/^Mise à jour ciblée\s*[-–:]\s*/i, "")
    .trim();
}

function inferUpdateIdeas(values: string[]) {
  return values.filter((value) => {
    const normalized = normalizeComparable(value);
    return normalized.includes("ajout")
      || normalized.includes("idee")
      || normalized.includes("priorite p");
  });
}

function buildUpdates(sections: MasterPlanSection[]) {
  const updateSections = sections.filter((section) => normalizeComparable(section.title).startsWith("mise a jour ciblee"));
  const previousBySubject = new Map<string, { status: string; priority: string }>();

  return updateSections.map((section) => {
    const fields = parseUpdateFields(section.content);
    const subject = updateSubject(section.title);
    const subjectKey = normalizeComparable(subject);
    const status = pickField(fields, "Statut")[0] ?? "";
    const priority = pickField(fields, "Priorite", "Priorité")[0] ?? "";
    const scope = splitScope(pickField(fields, "Perimetre mis a jour", "Périmètre mis à jour")[0] ?? "");
    const productChanges = pickField(fields, "Realite produit", "Réalité produit");
    const decisions = pickField(fields, "Decision de pilotage", "Décision de pilotage");
    const contradictions = pickField(fields, "Contradictions detectees", "Contradictions détectées");
    const verifications = pickField(fields, "Verification", "Vérification");
    const nextActions = pickField(fields, "Prochaine etape recommandee", "Prochaine étape recommandée");
    const ideas = inferUpdateIdeas([...productChanges, ...decisions, ...nextActions]);
    const previous = previousBySubject.get(subjectKey);
    previousBySubject.set(subjectKey, {
      status: canonicalFunctionalStatus(status),
      priority: canonicalPriority(priority),
    });

    return {
      id: section.id,
      title: section.title,
      subject,
      status,
      priority,
      scope,
      productChanges,
      decisions,
      contradictions,
      verifications,
      nextActions,
      ideas,
      isNew: !previous,
      statusChanged: previous ? previous.status !== canonicalFunctionalStatus(status) : false,
      priorityChanged: previous ? previous.priority !== canonicalPriority(priority) : false,
    } satisfies MasterPlanUpdateEntry;
  });
}

export function parseMasterPlan(markdown: string, updatedAt: string): MasterPlanView {
  const normalized = markdown.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  const headings = lines
    .map((line, index) => {
      const match = /^(#{1,4})\s+(.+)$/.exec(line);
      return match ? { index, level: match[1].length, title: match[2].trim() } : null;
    })
    .filter((heading): heading is NonNullable<typeof heading> => Boolean(heading));

  const usedIds = new Map<string, number>();
  const sections = headings.slice(1).map((heading, headingIndex) => {
    const end = headings[headingIndex + 2]?.index ?? lines.length;
    const content = lines.slice(heading.index + 1, end).join("\n").trim();
    const baseId = slugify(heading.title) || `section-${headingIndex + 1}`;
    const duplicateIndex = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, duplicateIndex + 1);
    return {
      id: duplicateIndex ? `${baseId}-${duplicateIndex + 1}` : baseId,
      level: heading.level,
      title: heading.title,
      content,
      statuses: MASTER_PLAN_STATUSES.filter((status) => content.includes(status)),
      priorities: MASTER_PLAN_PRIORITIES.filter((priority) => content.includes(priority)),
    };
  });

  const planning = buildPlanning(lines);
  const registry = registryRows(lines);
  const functionalRows = buildFunctionalRows(lines);
  const updates = buildUpdates(sections);

  const registryPriorityCounts = Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [
    priority,
    registry.filter((cells) => cells.includes(priority)).length,
  ]));

  const remainingPriorityCounts = Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [
    priority,
    planning.filter((item) => item.priority === priority).length,
  ]));

  return {
    title: headings[0]?.title ?? "Master Plan PlanetLS",
    updatedAt,
    sections,
    updates,
    statusCounts: Object.fromEntries(MASTER_PLAN_STATUSES.map((status) => [
      status,
      countSectionsWithToken(sections, status, "status"),
    ])),
    priorityCounts: Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [
      priority,
      countSectionsWithToken(sections, priority, "priority"),
    ])),
    registryPriorityCounts,
    remainingPriorityCounts,
    functionalRows,
    functionalLevelCounts: Object.fromEntries(MASTER_PLAN_MATURITY_LEVELS.map((item) => [
      item.level,
      functionalRows.filter((row) => row.level === item.level).length,
    ])),
    functionalStatusCounts: Object.fromEntries(MASTER_PLAN_STATUSES.map((status) => [
      status,
      functionalRows.filter((row) => (
        row.status === status
        || canonicalFunctionalStatus(row.status) === canonicalFunctionalStatus(status)
      )).length,
    ])),
    lineCount: lines.length,
    planning,
  };
}
