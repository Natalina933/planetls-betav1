import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  PromptDifficulty,
  PromptDocument,
  PromptLibraryDiagnostic,
  PromptLibraryPayload,
  PromptMetadata,
  PromptRiskLevel,
  PromptRunSummary,
  PromptStatus,
  PromptVariableDefinition,
  PromptVersionEntry,
} from "../../features/prompt-library/types";

const PROMPTS_ROOT = path.join(process.cwd(), "docs", "ai", "prompts");
const RUNS_ROOT = path.join(process.cwd(), "docs", "ai", "runs");

const PROMPT_STATUSES: PromptStatus[] = ["draft", "active", "needs-review", "deprecated", "archived"];
const PROMPT_RISK_LEVELS: PromptRiskLevel[] = ["low", "medium", "high", "critical"];
const PROMPT_DIFFICULTIES: PromptDifficulty[] = ["beginner", "intermediate", "advanced"];

function toPosix(value: string) {
  return value.replaceAll("\\", "/");
}

function relativeFromRepo(filePath: string) {
  return toPosix(path.relative(process.cwd(), filePath));
}

async function collectFiles(root: string, extension: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map(async (entry) => {
    const resolved = path.join(root, entry.name);
    if (entry.isDirectory()) return collectFiles(resolved, extension);
    if (!entry.isFile() || path.extname(entry.name) !== extension) return [];
    return [resolved];
  }));
  return nested.flat().sort((left, right) => left.localeCompare(right, "fr"));
}

function splitFrontmatter(markdown: string) {
  const normalized = markdown.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("Frontmatter YAML manquant.");
  }
  const endIndex = normalized.indexOf("\n---\n", 4);
  if (endIndex < 0) {
    throw new Error("Frontmatter YAML non referme.");
  }
  return {
    frontmatter: normalized.slice(4, endIndex),
    body: normalized.slice(endIndex + 5).trim(),
  };
}

function parseYamlScalar(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(frontmatter: string) {
  const lines = frontmatter.split("\n");
  const result: Record<string, string | string[]> = {};
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "  ");
    if (!line.trim()) continue;
    const listMatch = /^\s*-\s+(.+)$/.exec(line);
    if (listMatch && currentKey) {
      const current = Array.isArray(result[currentKey]) ? [...result[currentKey]] : [];
      current.push(parseYamlScalar(listMatch[1]));
      result[currentKey] = current;
      continue;
    }

    const keyMatch = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!keyMatch) continue;
    const [, key, rawValue] = keyMatch;
    currentKey = key;
    if (!rawValue.trim()) {
      result[key] = [];
      continue;
    }
    result[key] = parseYamlScalar(rawValue);
  }

  return result;
}

function extractSections(body: string) {
  const lines = body.split("\n");
  const sections = new Map<string, string>();
  let currentHeading = "";
  let buffer: string[] = [];

  function flush() {
    if (!currentHeading) return;
    sections.set(currentHeading, buffer.join("\n").trim());
  }

  for (const line of lines) {
    const match = /^##\s+(.+)$/.exec(line.trim());
    if (match) {
      flush();
      currentHeading = match[1].trim().toLowerCase();
      buffer = [];
      continue;
    }
    buffer.push(line);
  }

  flush();
  return sections;
}

function parseListSection(value: string | undefined) {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function parseVariablesSection(value: string | undefined): PromptVariableDefinition[] {
  return parseListSection(value).map((line) => {
    const parts = line.split("|").map((item) => item.trim());
    const key = parts[0].replace(/^-?\s*/, "").trim();
    const definition: PromptVariableDefinition = {
      key,
      label: key.replace(/[{}]/g, "").replaceAll("_", " "),
      required: false,
    };

    for (const segment of parts.slice(1)) {
      const [rawName, ...rest] = segment.split(":");
      const name = rawName?.trim().toLowerCase();
      const rawValue = rest.join(":").trim();
      if (!name) continue;
      if (name === "label") definition.label = rawValue;
      if (name === "description") definition.description = rawValue;
      if (name === "required") definition.required = rawValue === "true";
      if (name === "placeholder") definition.placeholder = rawValue;
      if (name === "default") definition.defaultValue = rawValue;
    }

    return definition;
  });
}

function parseVersionHistory(value: string | undefined): PromptVersionEntry[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2))
    .map((line) => {
      const [versionPart, datePart, ...changeParts] = line.split("|").map((item) => item.trim());
      return {
        version: versionPart || "",
        date: datePart || "",
        changes: changeParts.length > 0 ? changeParts : [],
      };
    })
    .filter((entry) => entry.version && entry.date);
}

function asArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function validateEnum<T extends string>(value: string | undefined, allowed: readonly T[], label: string): T {
  if (!value || !allowed.includes(value as T)) {
    throw new Error(`${label} invalide.`);
  }
  return value as T;
}

function validateVersion(version: string) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("Version semver invalide.");
  }
}

export function parsePromptMarkdown(markdown: string, filePath = "prompt.md"): Omit<PromptDocument, "recentRuns"> {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const metadata = parseFrontmatter(frontmatter);
  const sections = extractSections(body);

  const id = String(metadata.id ?? "").trim();
  const title = String(metadata.title ?? "").trim();
  const description = String(metadata.description ?? "").trim();
  const version = String(metadata.version ?? "").trim();
  validateVersion(version);

  if (!id || !title || !description) {
    throw new Error(`Metadonnees obligatoires manquantes dans ${filePath}.`);
  }

  const promptMetadata: PromptMetadata = {
    id,
    title,
    description,
    category: String(metadata.category ?? "").trim(),
    status: validateEnum(String(metadata.status ?? "").trim(), PROMPT_STATUSES, "Statut"),
    version,
    author: String(metadata.author ?? "PlanetLS").trim(),
    target: validateEnum(String(metadata.target ?? "").trim(), ["codex"], "Target"),
    difficulty: metadata.difficulty
      ? validateEnum(String(metadata.difficulty), PROMPT_DIFFICULTIES, "Difficulte")
      : undefined,
    riskLevel: metadata.riskLevel
      ? validateEnum(String(metadata.riskLevel), PROMPT_RISK_LEVELS, "Niveau de risque")
      : undefined,
    estimatedDuration: metadata.estimatedDuration ? String(metadata.estimatedDuration) : undefined,
    contexts: asArray(metadata.contexts),
    tags: asArray(metadata.tags),
    source: asArray(metadata.source),
    createdAt: String(metadata.createdAt ?? "").trim(),
    updatedAt: String(metadata.updatedAt ?? "").trim(),
  };

  if (!promptMetadata.category || !promptMetadata.createdAt || !promptMetadata.updatedAt) {
    throw new Error(`Metadonnees de contexte incompletes dans ${filePath}.`);
  }

  return {
    metadata: promptMetadata,
    path: toPosix(filePath),
    objective: sections.get("objectif") ?? "",
    useWhen: parseListSection(sections.get("quand utiliser")),
    avoidWhen: parseListSection(sections.get("quand ne pas l'utiliser")),
    variables: parseVariablesSection(sections.get("variables")),
    promptContent: sections.get("prompt") ?? "",
    expectedDeliverables: parseListSection(sections.get("livrables attendus")),
    successCriteria: parseListSection(sections.get("criteres de reussite")),
    versionHistory: parseVersionHistory(sections.get("historique des versions")),
    provenance: parseListSection(sections.get("provenance")),
  };
}

async function readRunSummaries(): Promise<PromptRunSummary[]> {
  const runFiles = await collectFiles(RUNS_ROOT, ".json");
  const runs = await Promise.all(runFiles.map(async (filePath) => {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<PromptRunSummary>;
      if (!parsed.promptId || !parsed.promptVersion || !parsed.createdAt || !parsed.id) return null;
      return {
        id: parsed.id,
        promptId: parsed.promptId,
        promptVersion: parsed.promptVersion,
        objective: parsed.objective ?? "",
        summary: parsed.summary,
        createdAt: parsed.createdAt,
        modifiedFiles: parsed.modifiedFiles ?? [],
        tests: parsed.tests ?? [],
        decisions: parsed.decisions ?? [],
        limitations: parsed.limitations ?? [],
        nextActions: parsed.nextActions ?? [],
        folder: relativeFromRepo(path.dirname(filePath)),
      } satisfies PromptRunSummary;
    } catch {
      return null;
    }
  }));
  return runs.filter((run) => run !== null) as PromptRunSummary[];
}

function buildDiagnostic(promptFiles: string[]): PromptLibraryDiagnostic {
  return {
    existingPromptSources: [
      "docs/prompt-13-module-voyageurs-sejours-2026-07-12.md",
      "docs/systeme-gestion-prompts-planetls-2026-08-03.md",
      "docs/audit-*.md",
      "Pièces jointes Codex désormais consolidées dans docs/ai/",
    ],
    existingAuditDocs: [
      "docs/audit-complet-parcours-metier-proprietaire-concierge-2026-06-06.md",
      "docs/audit-parcours-demande-devis-mission-2026-06-05.md",
      "docs/audit-parcours-paiement-devis-mission-2026-06-06.md",
      "docs/audit-complet-code-routes-permissions-2026-06-18.md",
      "docs/ui-harmonization-audit.md",
    ],
    reusableComponents: [
      "src/components/ui/Tabs",
      "src/components/ui/SearchBar",
      "src/components/ui/Badge",
      "src/components/dashboard/DashboardPanel",
      "src/app/dashboard/admin/pilotage/BusinessCollapsibleSection.tsx",
    ],
    storageApproach: "Fichiers Markdown versionnes dans docs/ai/prompts + runs JSON legers dans docs/ai/runs.",
    migrationRisks: [
      "Doublon documentaire si le contenu complet des prompts est copie dans l'interface.",
      "Derive du contexte si les prompts ne referencent pas planetls-context.md.",
      "Prompts historiques parfois melanges avec comptes rendus de livraison, donc provenance a clarifier.",
    ],
    duplicatesDetected: [
      "Contexte PlanetLS repete dans plusieurs audits et prompts historiques.",
      "Methodes d'audit UX et metier proches mais dispersées entre plusieurs fichiers docs/.",
    ],
    proposedTree: [
      "docs/ai/planetls-context.md",
      "docs/ai/codex-rules.md",
      "docs/ai/contexts/*.md",
      "docs/ai/prompts/<categorie>/*.md",
      "docs/ai/runs/YYYY/MM/<run>/metadata.json",
    ],
  };
}

export async function loadPromptLibrary(): Promise<PromptLibraryPayload> {
  const promptFiles = (await collectFiles(PROMPTS_ROOT, ".md"))
    .filter((filePath) => !filePath.endsWith("README.md") && !filePath.endsWith("_template.md"));
  const runSummaries = await readRunSummaries();
  const prompts = await Promise.all(promptFiles.map(async (filePath) => {
    const markdown = await fs.readFile(filePath, "utf8");
    const parsed = parsePromptMarkdown(markdown, relativeFromRepo(filePath));
    return {
      ...parsed,
      path: relativeFromRepo(filePath),
      recentRuns: runSummaries
        .filter((run) => run.promptId === parsed.metadata.id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 5),
    } satisfies PromptDocument;
  }));

  const categories = Array.from(new Set(prompts.map((prompt) => prompt.metadata.category))).sort((a, b) => a.localeCompare(b, "fr"));
  const updatedAt = prompts
    .map((prompt) => prompt.metadata.updatedAt)
    .sort((left, right) => right.localeCompare(left))[0] ?? new Date().toISOString().slice(0, 10);

  return {
    prompts: prompts.sort((left, right) => right.metadata.updatedAt.localeCompare(left.metadata.updatedAt) || left.metadata.title.localeCompare(right.metadata.title, "fr")),
    stats: {
      total: prompts.length,
      active: prompts.filter((prompt) => prompt.metadata.status === "active").length,
      needsReview: prompts.filter((prompt) => prompt.metadata.status === "needs-review").length,
      favoritesSupported: true,
      runs: runSummaries.length,
      categories: categories.length,
    },
    filters: {
      categories,
      statuses: PROMPT_STATUSES,
      riskLevels: PROMPT_RISK_LEVELS,
      difficulties: PROMPT_DIFFICULTIES,
    },
    diagnostic: buildDiagnostic(promptFiles.map(relativeFromRepo)),
    updatedAt,
  };
}
