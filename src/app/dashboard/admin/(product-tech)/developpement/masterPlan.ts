import { z } from "zod";

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
  { priority: "P3 Confort", scope: "Amélioration, expérimentation ou confort non bloquant" },
  { priority: "P4 Évolution future", scope: "Pari stratégique à valider avant industrialisation" },
] as const;

export const DEVELOPMENT_ITEM_STATUSES = [
  "IDEA",
  "TO_PLAN",
  "READY",
  "IN_PROGRESS",
  "BLOCKED",
  "TO_VERIFY",
  "COMPLETED",
  "DEFERRED",
] as const;

export const DEVELOPMENT_ITEM_PRIORITIES = ["P0", "P1", "P2", "P3", "P4"] as const;
export const DEVELOPMENT_ITEM_HORIZONS = ["MVP", "Pilote", "Après pilote", "Long terme"] as const;

export const DEVELOPMENT_ITEM_TYPES = [
  "feature",
  "improvement",
  "tech_debt",
  "bug",
  "decision",
  "test",
  "documentation",
] as const;

export type MasterPlanSection = {
  id: string;
  level: number;
  title: string;
  content: string;
  statuses: string[];
  priorities: string[];
};

export type MasterPlanFunctionalRow = {
  id: string;
  planetLsId: string;
  githubIssues: number[];
  githubUrls: string[];
  feature: string;
  status: string;
  level: string;
  observations: string;
};

export type MasterPlanPlanningItem = {
  id: string;
  planetLsId: string;
  githubIssues: number[];
  githubUrls: string[];
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

export type DevelopmentRegistryItem = {
  id: string;
  trackingId: string;
  domain: string;
  title: string;
  summary: string;
  status: typeof DEVELOPMENT_ITEM_STATUSES[number];
  statusLabel: string;
  priority: typeof DEVELOPMENT_ITEM_PRIORITIES[number];
  priorityLabel: string;
  horizon: typeof DEVELOPMENT_ITEM_HORIZONS[number];
  type: typeof DEVELOPMENT_ITEM_TYPES[number];
  persona: string;
  phase: string;
  addedAt: string;
  updatedAt: string;
  nextAction: string;
  validationCriteria: string[];
  validatedCriteria: string[];
  dependencies: string[];
  blocker: string | null;
  routes: string[];
  files: string[];
  progressLabel: string;
  source: string;
  evidence: string[];
  missingWork: string[];
  githubIssues: Array<{ number: number; url: string }>;
};

export type DevelopmentRegistryDiagnostics = {
  source: "structured" | "legacy";
  itemCount: number;
  lastStructuredUpdate: string | null;
  nextSuggestedId: string | null;
  errors: string[];
  warnings: string[];
  duplicateIds: string[];
  invalidStatuses: string[];
  invalidPriorities: string[];
  missingNextActions: string[];
  completedWithoutEvidence: string[];
  unknownDependencies: string[];
  staleItems: string[];
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
  registryItems: DevelopmentRegistryItem[];
  diagnostics: DevelopmentRegistryDiagnostics;
};

const developmentRegistrySchema = z.object({
  version: z.literal(1),
  items: z.array(z.object({
    id: z.string().min(3),
    domain: z.string().min(2),
    title: z.string().min(2),
    summary: z.string().min(2),
    status: z.enum(DEVELOPMENT_ITEM_STATUSES),
    priority: z.enum(DEVELOPMENT_ITEM_PRIORITIES),
    horizon: z.enum(DEVELOPMENT_ITEM_HORIZONS).optional(),
    type: z.enum(DEVELOPMENT_ITEM_TYPES),
    persona: z.string().min(2),
    phase: z.string().min(2),
    addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    nextAction: z.string().default(""),
    validationCriteria: z.array(z.string().min(2)).default([]),
    validatedCriteria: z.array(z.string().min(2)).default([]),
    dependencies: z.array(z.string().min(1)).default([]),
    blocker: z.string().nullable().optional(),
    routes: z.array(z.string().min(1)).default([]),
    files: z.array(z.string().min(1)).default([]),
    progressLabel: z.string().min(2),
    source: z.string().min(2),
    evidence: z.array(z.string().min(1)).default([]),
    missingWork: z.array(z.string().min(2)).default([]),
    githubIssues: z.array(z.object({
      number: z.number().int().positive(),
      url: z.string().url(),
    })).default([]),
  })).default([]),
});

type RawDevelopmentRegistry = z.infer<typeof developmentRegistrySchema>;

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
    const cells = markdownCells(line);
    const normalizedLine = normalizeComparable(line);
    return line.trim().startsWith("|")
      && cells.length >= 4
      && normalizedLine.includes("niveau")
      && normalizedLine.includes("observations factuelles")
      && (normalizedLine.includes("etat")
        || normalizedLine.includes("statut")
        || normalizedLine.includes("fonctionnal")
        || normalizeComparable(cells[0] ?? "").startsWith("fonction"));
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

function buildLegacyPlanning(lines: string[]) {
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
      planetLsId: "",
      githubIssues: [],
      githubUrls: [],
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

function buildLegacyFunctionalRows(lines: string[]) {
  const headerIndex = findFunctionalTableHeaderIndex(lines);
  if (headerIndex < 0) return [] as MasterPlanFunctionalRow[];

  const rows: MasterPlanFunctionalRow[] = [];
  for (let index = headerIndex + 2; index < lines.length && lines[index].trim().startsWith("|"); index += 1) {
    const cells = markdownCells(lines[index]);
    rows.push({
      id: `PLS-MP-${slugify(cells[0] ?? "").toUpperCase()}`,
      planetLsId: "",
      githubIssues: [],
      githubUrls: [],
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
    .replace(/^Mise à jour ciblée\s*[-–:>]+\s*/i, "")
    .trim();
}

function inferUpdateIdeas(values: string[]) {
  return values.filter((value) => {
    const normalized = normalizeComparable(value);
    return normalized.includes("ajout")
      || normalized.includes("idee")
      || normalized.includes("idée")
      || normalized.includes("priorite p");
  });
}

function updateTrackingId(priority: string, subject: string, usedIds: Set<string>) {
  const prefix = /P[0-4]/.exec(priority)?.[0] ?? "P3";
  let hash = 2166136261;
  for (const character of normalizeComparable(subject)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  let sequence = (hash >>> 0) % 1000;
  let id = `${prefix}-${String(sequence).padStart(3, "0")}`;
  while (usedIds.has(id)) {
    sequence = (sequence + 1) % 1000;
    id = `${prefix}-${String(sequence).padStart(3, "0")}`;
  }
  usedIds.add(id);
  return id;
}

function buildUpdates(sections: MasterPlanSection[]) {
  const updateSections = sections.filter((section) => normalizeComparable(section.title).startsWith("mise a jour ciblee"));
  const previousBySubject = new Map<string, { status: string; priority: string }>();
  const usedTrackingIds = new Set<string>();

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
      id: updateTrackingId(priority, subject, usedTrackingIds),
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

function statusLabelFromRegistry(status: DevelopmentRegistryItem["status"]) {
  switch (status) {
    case "COMPLETED":
      return "✅ Terminé";
    case "IN_PROGRESS":
      return "🟡 En cours";
    case "TO_VERIFY":
      return "🟠 Partiel";
    case "READY":
      return "🔴 À faire";
    case "TO_PLAN":
      return "Non planifié";
    case "IDEA":
      return "Idée à étudier";
    case "BLOCKED":
      return "⚠️ Bloqué";
    case "DEFERRED":
      return "⏸️ Reporté";
    default:
      return "❌ Abandonné";
  }
}

function statusFromValidatedCriteria(item: RawDevelopmentRegistry["items"][number]) {
  if (item.status === "BLOCKED" || item.status === "DEFERRED" || item.status === "COMPLETED") {
    return item.status;
  }

  if (item.validationCriteria.length === 0) return item.status;

  const validatedCriteria = new Set(item.validatedCriteria.map(normalizeComparable));
  const isFullyValidated = item.validationCriteria.every((criterion) =>
    validatedCriteria.has(normalizeComparable(criterion)),
  );

  return isFullyValidated ? "COMPLETED" : item.status;
}

function priorityLabelFromRegistry(priority: DevelopmentRegistryItem["priority"]) {
  switch (priority) {
    case "P0":
      return "P0 Critique";
    case "P1":
      return "P1 Prioritaire";
    case "P2":
      return "P2 Important";
    case "P3":
      return "P3 Confort";
    case "P4":
      return "P4 Évolution future";
    default:
      return "P3 Confort";
  }
}

function trackingIdFromRegistry(item: Pick<DevelopmentRegistryItem, "trackingId">) {
  return item.trackingId;
}

function maturityLevelFromRegistry(item: RawDevelopmentRegistry["items"][number]) {
  if (item.status === "IDEA") return "N0";
  if (item.status === "TO_PLAN") return "N1";
  if (item.status === "READY") return "N2";
  if (item.status === "COMPLETED") return "N4";
  if (item.status === "DEFERRED") return "N1";
  return "N3";
}

function horizonFromPriority(priority: DevelopmentRegistryItem["priority"]): DevelopmentRegistryItem["horizon"] {
  if (priority === "P0") return "MVP";
  if (priority === "P1") return "Pilote";
  if (priority === "P2") return "Après pilote";
  return "Long terme";
}

function extractStructuredRegistryBlock(markdown: string) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const headingIndex = lines.findIndex((line) => normalizeComparable(line.replace(/^#+\s+/, "")) === "registre structure du developpement");
  if (headingIndex < 0) {
    return { json: null, warnings: [] as string[] };
  }

  const fenceIndex = lines.findIndex((line, index) => index > headingIndex && line.trim().startsWith("```json"));
  if (fenceIndex < 0) {
    return {
      json: null,
      warnings: ["Le registre structuré du développement est annoncé dans le Master Plan, mais aucun bloc ```json n’a été trouvé."],
    };
  }

  const endFenceIndex = lines.findIndex((line, index) => index > fenceIndex && line.trim() === "```");
  if (endFenceIndex < 0) {
    return {
      json: null,
      warnings: ["Le bloc JSON du registre structuré du développement n’est pas refermé."],
    };
  }

  return {
    json: lines.slice(fenceIndex + 1, endFenceIndex).join("\n").trim(),
    warnings: [] as string[],
  };
}

function validateStructuredRegistry(markdown: string) {
  const diagnostics: DevelopmentRegistryDiagnostics = {
    source: "legacy",
    itemCount: 0,
    lastStructuredUpdate: null,
    nextSuggestedId: null,
    errors: [],
    warnings: [],
    duplicateIds: [],
    invalidStatuses: [],
    invalidPriorities: [],
    missingNextActions: [],
    completedWithoutEvidence: [],
    unknownDependencies: [],
    staleItems: [],
  };

  const { json, warnings } = extractStructuredRegistryBlock(markdown);
  diagnostics.warnings.push(...warnings);
  if (!json) return { items: [] as DevelopmentRegistryItem[], diagnostics };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(json);
  } catch (error) {
    diagnostics.errors.push(error instanceof Error ? `JSON invalide dans le registre structuré : ${error.message}` : "JSON invalide dans le registre structuré.");
    return { items: [] as DevelopmentRegistryItem[], diagnostics };
  }

  const result = developmentRegistrySchema.safeParse(parsedJson);
  if (!result.success) {
    diagnostics.errors.push(...result.error.issues.map((issue) => {
      const pathLabel = issue.path.length ? issue.path.join(".") : "racine";
      return `Registre structuré invalide sur ${pathLabel} : ${issue.message}`;
    }));
    return { items: [] as DevelopmentRegistryItem[], diagnostics };
  }

  const rawRegistry = result.data;
  const idCounts = new Map<string, number>();
  for (const item of rawRegistry.items) {
    idCounts.set(item.id, (idCounts.get(item.id) ?? 0) + 1);
  }
  diagnostics.duplicateIds = Array.from(idCounts.entries()).filter(([, count]) => count > 1).map(([id]) => id);
  if (diagnostics.duplicateIds.length) {
    diagnostics.errors.push(`Identifiants dupliqués dans le registre structuré : ${diagnostics.duplicateIds.join(", ")}`);
  }

  const existingIds = new Set(rawRegistry.items.map((item) => item.id));
  const today = new Date("2026-08-24T00:00:00.000Z");
  const trackingSequences = new Map<typeof DEVELOPMENT_ITEM_PRIORITIES[number], number>();
  const items: DevelopmentRegistryItem[] = rawRegistry.items.map((item) => {
    const status = statusFromValidatedCriteria(item);
    const nextSequence = (trackingSequences.get(item.priority) ?? 0) + 1;
    trackingSequences.set(item.priority, nextSequence);
    if (!item.nextAction.trim()) diagnostics.missingNextActions.push(item.id);
    if (status === "COMPLETED" && item.evidence.length === 0) diagnostics.completedWithoutEvidence.push(item.id);
    for (const dependency of item.dependencies) {
      if (!existingIds.has(dependency)) diagnostics.unknownDependencies.push(`${item.id} -> ${dependency}`);
    }
    const updatedAt = new Date(`${item.updatedAt}T00:00:00.000Z`);
    const dayDiff = Number.isNaN(updatedAt.getTime()) ? 999 : Math.floor((today.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff > 45) diagnostics.staleItems.push(item.id);

    return {
      ...item,
      status,
      // The tracking number stays unique even when registry IDs use different prefixes.
      trackingId: `${item.priority}-${String(nextSequence).padStart(3, "0")}`,
      statusLabel: statusLabelFromRegistry(status),
      priorityLabel: priorityLabelFromRegistry(item.priority),
      horizon: item.horizon ?? horizonFromPriority(item.priority),
      blocker: item.blocker ?? null,
      // Historical entries predate this field; their last known update remains the fallback.
      addedAt: item.addedAt ?? item.updatedAt,
    };
  });

  diagnostics.source = "structured";
  diagnostics.itemCount = items.length;
  diagnostics.lastStructuredUpdate = items
    .map((item) => item.updatedAt)
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
  diagnostics.nextSuggestedId = DEVELOPMENT_ITEM_PRIORITIES.map((priority) => {
    const nextSequence = (trackingSequences.get(priority) ?? 0) + 1;
    return `${priority}-${String(nextSequence).padStart(3, "0")}`;
  }).join(" · ");

  if (diagnostics.missingNextActions.length) {
    diagnostics.errors.push(`Éléments sans prochaine action : ${diagnostics.missingNextActions.join(", ")}`);
  }
  if (diagnostics.completedWithoutEvidence.length) {
    diagnostics.errors.push(`Éléments terminés sans preuve : ${diagnostics.completedWithoutEvidence.join(", ")}`);
  }
  if (diagnostics.unknownDependencies.length) {
    diagnostics.errors.push(`Dépendances inconnues : ${diagnostics.unknownDependencies.join(", ")}`);
  }
  if (diagnostics.staleItems.length) {
    diagnostics.warnings.push(`Éléments potentiellement obsolètes (>45 jours sans mise à jour) : ${diagnostics.staleItems.join(", ")}`);
  }

  return { items, diagnostics };
}

function planningFromRegistry(items: DevelopmentRegistryItem[]) {
  return items
    .map((item) => ({
      id: trackingIdFromRegistry(item),
      planetLsId: item.id,
      githubIssues: item.githubIssues.map((issue) => issue.number),
      githubUrls: item.githubIssues.map((issue) => issue.url),
      order: DEVELOPMENT_ITEM_PRIORITIES.indexOf(item.priority),
      horizon: item.horizon === "MVP" ? "Maintenant" : item.horizon === "Pilote" ? "Ensuite" : item.horizon === "Après pilote" ? "Après stabilisation" : "Plus tard",
      domain: item.domain,
      feature: item.title,
      audience: item.persona,
      status: item.statusLabel,
      priority: item.priorityLabel,
      evidence: item.evidence.join(" · "),
      nextAction: item.nextAction,
    } satisfies MasterPlanPlanningItem))
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, "fr"));
}

function functionalRowsFromRegistry(items: DevelopmentRegistryItem[]) {
  return items.map((item) => ({
    id: trackingIdFromRegistry(item),
    planetLsId: item.id,
    githubIssues: item.githubIssues.map((issue) => issue.number),
    githubUrls: item.githubIssues.map((issue) => issue.url),
    feature: item.title,
    status: item.statusLabel,
    level: maturityLevelFromRegistry(item),
    observations: item.progressLabel,
  } satisfies MasterPlanFunctionalRow));
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

  const updates = buildUpdates(sections);
  const legacyPlanning = buildLegacyPlanning(lines);
  const legacyFunctionalRows = buildLegacyFunctionalRows(lines);
  const registry = validateStructuredRegistry(markdown);
  const planning = registry.items.length ? planningFromRegistry(registry.items) : legacyPlanning;
  const functionalRows = registry.items.length ? functionalRowsFromRegistry(registry.items) : legacyFunctionalRows;
  const registryPrioritySource = registry.items.length
    ? registry.items.map((item) => item.priorityLabel)
    : registryRows(lines).flat();

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
    registryPriorityCounts: Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [
      priority,
      registryPrioritySource.filter((value) => value === priority).length,
    ])),
    remainingPriorityCounts: Object.fromEntries(MASTER_PLAN_PRIORITIES.map((priority) => [
      priority,
      planning.filter((item) => item.priority === priority).length,
    ])),
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
    registryItems: registry.items,
    diagnostics: registry.diagnostics,
  };
}
