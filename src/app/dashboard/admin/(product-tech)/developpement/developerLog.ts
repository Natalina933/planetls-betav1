import type { MasterPlanPlanningItem, MasterPlanView } from "./masterPlan";

export const DEVELOPER_LOG_PRIORITIES = [
  "P0 Critique",
  "P1 Prioritaire",
  "P2 Important",
  "P3 Confort",
  "P4 Idée / À étudier",
] as const;

export const DEVELOPER_LOG_STATUSES = [
  "✅ Terminé",
  "🟡 En cours",
  "🟠 Partiel",
  "🔴 À faire",
  "⚠️ Bloqué",
  "⏸️ Reporté",
  "❌ Abandonné",
] as const;

export type DeveloperLogPriority = (typeof DEVELOPER_LOG_PRIORITIES)[number];
export type DeveloperLogStatus = (typeof DEVELOPER_LOG_STATUSES)[number];

export type DeveloperLogLink = {
  label: string;
  href: string;
  kind: "commit" | "pull-request" | "document";
};

export type DeveloperLogComment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type DeveloperLogEntry = {
  id: string;
  source: "automatic" | "manual";
  createdAt: string;
  version: string;
  author: string;
  category: string;
  priority: DeveloperLogPriority;
  title: string;
  description: string;
  decisions: string;
  reasons: string;
  difficulties: string;
  solution: string;
  impactSummary: string;
  modifiedFiles: string[];
  roadmapUpdates: string[];
  dependencyUpdates: string[];
  remainingTasks: string[];
  potentialRegressions: string[];
  features: string[];
  links: DeveloperLogLink[];
  screenshotUrl: string | null;
  timeSpentMinutes: number;
  status: DeveloperLogStatus;
};

export type DeveloperLogDailySummary = {
  id: string;
  date: string;
  title: string;
  summary: string;
  entryCount: number;
  modifiedFilesCount: number;
  features: string[];
  roadmapUpdates: string[];
  remainingTasks: string[];
  potentialRegressions: string[];
};

export type DeveloperLogCommit = {
  sha: string;
  shortSha: string;
  author: string;
  date: string;
  subject: string;
};

export type DeveloperLogView = {
  entries: DeveloperLogEntry[];
  authors: string[];
  categories: string[];
  features: string[];
  dailySummaries: DeveloperLogDailySummary[];
};

type BuildDeveloperLogOptions = {
  plan: MasterPlanView;
  projectVersion: string;
  repositoryUrl: string | null;
  commits: DeveloperLogCommit[];
  changedFiles: string[];
  branch: string | null;
  dirtyFileCount: number;
};

type FileInsight = {
  feature: string;
  category: string;
  dependencyUpdate: string | null;
  regression: string | null;
  impact: string | null;
  keywordHints: string[];
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractRepositoryPath(remoteUrl: string | null) {
  if (!remoteUrl) return null;
  const normalized = remoteUrl.replace(/\.git$/, "");
  const httpsMatch = /^https?:\/\/github\.com\/([^/]+\/[^/]+)$/i.exec(normalized);
  if (httpsMatch) return httpsMatch[1];
  const sshMatch = /^git@github\.com:([^/]+\/[^/]+)$/i.exec(normalized);
  return sshMatch ? sshMatch[1] : null;
}

function commitLink(repositoryPath: string | null, sha: string): DeveloperLogLink[] {
  if (!repositoryPath) return [];
  return [
    {
      label: `Commit ${sha.slice(0, 7)}`,
      href: `https://github.com/${repositoryPath}/commit/${sha}`,
      kind: "commit",
    },
  ];
}

function documentLinks(paths: string[]) {
  return paths.map((href, index) => ({
    label: index === 0 ? "Document de pilotage" : `Document ${index + 1}`,
    href,
    kind: "document" as const,
  }));
}

function formatFeatureLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePath(value: string) {
  return value.replace(/\\/g, "/").trim();
}

function inferFileInsight(path: string): FileInsight {
  const normalizedPath = normalizePath(path);
  const haystack = normalize(normalizedPath);

  if (
    haystack.includes("dashboard/admin/developpement")
    || haystack.includes("dashboard/admin/(product-tech)/developpement")
  ) {
    return {
      feature: "Espace Développement",
      category: "Pilotage automatique",
      dependencyUpdate: "La vue Développement reste synchronisée avec le Master Plan, la roadmap et les tests E2E.",
      regression: "Vérifier les états repliés/dépliés, les filtres et la lisibilité mobile de la page Développement.",
      impact: "Le cockpit Developer reflète mieux le code reel et les decisions recentes.",
      keywordHints: ["developpement", "journal", "roadmap", "memoire", "mission control", "pilotage"],
    };
  }

  if (haystack.includes("master-plan-planetls.md")) {
    return {
      feature: "Master Plan",
      category: "Pilotage automatique",
      dependencyUpdate: "Le Master Plan reste la source de vérité des statuts, priorités et prochaines actions.",
      regression: "Verifier la coherence entre le document, la timeline automatique et la roadmap projetee.",
      impact: "Le pilotage quotidien et la documentation produit restent alignes sur le code.",
      keywordHints: ["master plan", "pilotage", "roadmap", "journal"],
    };
  }

  if (haystack.includes("/auth/") || haystack.includes("loginpage")) {
    return {
      feature: "Authentification",
      category: "Authentification",
      dependencyUpdate: "La connexion locale depend de NextAuth, du fallback workspace et de /api/auth/dev-workspace-login.",
      regression: "Verifier la chaine /login -> /dashboard/admin et la lecture du cookie de session.",
      impact: "Les parcours admin locaux restent testables meme si Supabase Auth n'est pas joignable dans le sandbox.",
      keywordHints: ["auth", "identite", "workspace", "login", "admin"],
    };
  }

  if (haystack.startsWith("e2e/") || haystack.includes("playwright")) {
    return {
      feature: "Playwright",
      category: "Qualite",
      dependencyUpdate: "Les comportements critiques restent figes par la spec Playwright ciblee.",
      regression: "Verifier que les libelles accessibles et les etats UI n'ont pas diverge de la spec.",
      impact: "Les regressions UI critiques sont detectees plus tot dans le navigateur.",
      keywordHints: ["e2e", "playwright", "qualite", "tests"],
    };
  }

  if (haystack.startsWith("src/tests/")) {
    return {
      feature: "Tests unitaires",
      category: "Qualite",
      dependencyUpdate: "Les helpers de pilotage restent couverts par des tests de contrat locaux.",
      regression: "Verifier les structures de vue derivees du Master Plan et des donnees Git.",
      impact: "Les regressions sur les syntheses automatiques sont detectees avant l'integration navigateur.",
      keywordHints: ["tests", "qualite", "journal", "roadmap"],
    };
  }

  if (haystack.includes("dashboard/admin")) {
    return {
      feature: "Dashboard Admin",
      category: "Administration",
      dependencyUpdate: "Le cockpit admin reste relie aux donnees de pilotage, aux alertes et a la sante technique.",
      regression: "Verifier les cartes KPI, les alertes et les sections admin dependantes des donnees serveur.",
      impact: "Les equipes admin voient plus vite l'etat reel de la plateforme.",
      keywordHints: ["admin", "pilotage", "control tower", "dashboard"],
    };
  }

  return {
    feature: formatFeatureLabel(normalizedPath.split("/").slice(-2).join(" ")),
    category: "Produit",
    dependencyUpdate: null,
    regression: null,
    impact: null,
    keywordHints: normalizedPath.split("/").slice(-3),
  };
}

function inferCategory(subject: string) {
  const normalized = subject.toLowerCase();
  if (normalized.includes("auth") || normalized.includes("workspace")) return "Authentification";
  if (normalized.includes("admin") || normalized.includes("control tower")) return "Administration";
  if (normalized.includes("kpi") || normalized.includes("monitoring")) return "Pilotage";
  if (normalized.includes("provider") || normalized.includes("profile")) return "Profils";
  if (normalized.includes("team")) return "Equipe";
  if (normalized.includes("ux") || normalized.includes("ui")) return "UX";
  if (normalized.includes("test") || normalized.includes("qa") || normalized.includes("playwright")) return "Qualite";
  return "Produit";
}

function inferPriority(subject: string): DeveloperLogPriority {
  const normalized = subject.toLowerCase();
  if (normalized.includes("health") || normalized.includes("control tower") || normalized.includes("auth")) return "P0 Critique";
  if (normalized.includes("dashboard") || normalized.includes("profile")) return "P1 Prioritaire";
  if (normalized.includes("kpi") || normalized.includes("team") || normalized.includes("journal")) return "P2 Important";
  return "P3 Confort";
}

function inferStatus(subject: string): DeveloperLogStatus {
  const normalized = subject.toLowerCase();
  if (normalized.includes("fix")) return "🟠 Partiel";
  if (normalized.includes("monitoring") || normalized.includes("add") || normalized.includes("implement")) return "🟡 En cours";
  return "✅ Terminé";
}

function extractFeatures(subject: string) {
  const scopeMatch = /^[^(]+\(([^)]+)\)/.exec(subject);
  if (scopeMatch) return [formatFeatureLabel(scopeMatch[1])];
  const tokens = subject
    .replace(/^(feat|fix|docs|chore|refactor|test)(\([^)]+\))?:/i, "")
    .split(/\band\b|,|\+/i)
    .map((token) => formatFeatureLabel(token))
    .filter(Boolean);
  return tokens.length ? tokens.slice(0, 3) : ["Pilotage"];
}

function minutesFromPriority(priority: DeveloperLogPriority) {
  switch (priority) {
    case "P0 Critique":
      return 180;
    case "P1 Prioritaire":
      return 135;
    case "P2 Important":
      return 90;
    case "P3 Confort":
      return 60;
    default:
      return 45;
  }
}

function planningEntryToLogItem(item: MasterPlanPlanningItem, version: string): DeveloperLogEntry {
  return {
    id: `planning-${item.id}`,
    source: "automatic",
    createdAt: new Date("2026-07-27T09:00:00+02:00").toISOString(),
    version,
    author: "Pilotage PlanetLS",
    category: "Pilotage",
    priority: item.priority as DeveloperLogPriority,
    title: `Point de suivi : ${item.feature}`,
    description: `Le registre de maintenance conserve ce chantier dans l'horizon ${item.horizon.toLowerCase()} pour ${item.audience || "tous les profils"}.`,
    decisions: `Le sujet reste visible dans le cockpit developpement tant que son statut est ${item.status}.`,
    reasons: item.evidence || "La preuve de code reste insuffisante pour cloturer l'element.",
    difficulties: `Le statut actuel (${item.status}) montre qu'une partie du parcours reste a securiser ou valider.`,
    solution: item.nextAction || "Preciser la prochaine action dans le Master Plan.",
    impactSummary: `Cette entree garde la feuille de route visible tant que ${item.feature} n'est pas stabilisee.`,
    modifiedFiles: ["docs/master-plan-planetls.md"],
    roadmapUpdates: [`${item.feature} reste suivi comme ${item.status} avec priorite ${item.priority}.`],
    dependencyUpdates: normalize(item.status).includes("bloque") ? ["Ce chantier depend toujours d'un debloquage explicite dans la roadmap."] : [],
    remainingTasks: item.nextAction ? [item.nextAction] : [],
    potentialRegressions: item.priority === "P0 Critique" ? [`Toute derive sur ${item.feature} peut impacter un parcours critique.`] : [],
    features: [item.feature, item.domain].filter(Boolean),
    links: documentLinks(["#tableau-de-suivi-a-mettre-a-jour-apres-chaque-evolution-importante"]),
    screenshotUrl: null,
    timeSpentMinutes: minutesFromPriority(item.priority as DeveloperLogPriority),
    status: item.status as DeveloperLogStatus,
  };
}

function commitEntry(commit: DeveloperLogCommit, version: string, repositoryPath: string | null): DeveloperLogEntry {
  const priority = inferPriority(commit.subject);
  const features = extractFeatures(commit.subject);
  return {
    id: `commit-${commit.sha}`,
    source: "automatic",
    createdAt: commit.date,
    version,
    author: commit.author,
    category: inferCategory(commit.subject),
    priority,
    title: commit.subject,
    description: `Entree generee automatiquement depuis Git pour garder une trace exploitable de l'evolution "${commit.subject}".`,
    decisions: "Nous conservons ce commit comme jalon visible dans le journal de bord pour relier pilotage, code et revue.",
    reasons: "La page Developer doit pouvoir raconter l'avancement reel sans dependre d'une saisie manuelle systematique.",
    difficulties: "Le message Git seul ne decrit pas toujours le contexte metier complet ni les compromis retenus.",
    solution: "Le journal enrichit chaque commit avec une categorie, une priorite et les fonctionnalites concernees.",
    impactSummary: "Le commit devient consultable depuis la timeline sans quitter la vue de pilotage.",
    modifiedFiles: [],
    roadmapUpdates: [],
    dependencyUpdates: [],
    remainingTasks: [],
    potentialRegressions: [],
    features,
    links: commitLink(repositoryPath, commit.sha),
    screenshotUrl: null,
    timeSpentMinutes: minutesFromPriority(priority),
    status: inferStatus(commit.subject),
  };
}

function findRelevantPlanningItems(plan: MasterPlanView, keywordHints: string[]) {
  const normalizedHints = unique(keywordHints.map((hint) => normalize(hint))).filter((hint) => hint.length >= 3);
  if (!normalizedHints.length) return [] as MasterPlanPlanningItem[];

  return plan.planning.filter((item) => {
    const haystack = normalize(`${item.domain} ${item.feature} ${item.nextAction} ${item.evidence} ${item.audience}`);
    return normalizedHints.some((hint) => haystack.includes(hint));
  }).slice(0, 4);
}

function buildCodexWorkspaceEntry({
  plan,
  projectVersion,
  repositoryUrl,
  changedFiles,
  branch,
  dirtyFileCount,
}: BuildDeveloperLogOptions): DeveloperLogEntry | null {
  if (!changedFiles.length) {
    return null;
  }

  const normalizedFiles = unique(changedFiles.map(normalizePath));
  const insights = normalizedFiles.map((path) => inferFileInsight(path));
  const features = unique(insights.map((insight) => insight.feature)).slice(0, 6);
  const keywordHints = unique(insights.flatMap((insight) => insight.keywordHints));
  const relevantPlanningItems = findRelevantPlanningItems(plan, keywordHints);
  const repositoryPath = extractRepositoryPath(repositoryUrl);

  const roadmapUpdates = unique([
    ...relevantPlanningItems.map(
      (item) => `${item.feature} : ${item.status} (${item.priority}) -> ${item.nextAction || "prochaine action a preciser"}`,
    ),
    ...features.slice(0, 2).map(
      (feature) => `Le lot courant reste rattache a ${feature} dans le pilotage Developer.`,
    ),
  ]).slice(0, 5);

  const dependencyUpdates = unique([
    ...insights.map((insight) => insight.dependencyUpdate ?? ""),
    ...relevantPlanningItems
      .filter((item) => normalize(item.status).includes("bloque"))
      .map((item) => `${item.feature} conserve une dependance bloquante explicite dans la roadmap.`),
  ]).slice(0, 4);

  const remainingTasks = unique([
    ...relevantPlanningItems.map((item) => item.nextAction),
    "Relire les impacts transverses avant cloture du lot local.",
  ]).slice(0, 5);

  const potentialRegressions = unique([
    ...insights.map((insight) => insight.regression ?? ""),
    relevantPlanningItems.length ? "Verifier que le Master Plan, la roadmap et le journal restent synchronises." : "",
  ]).slice(0, 5);

  const impactSummary = unique([
    ...insights.map((insight) => insight.impact ?? ""),
    relevantPlanningItems.length
      ? `Le lot local touche aussi ${relevantPlanningItems.map((item) => item.feature).join(", ")} dans la feuille de route.`
      : "",
  ]).join(" ");

  const priority: DeveloperLogPriority = relevantPlanningItems.some((item) => item.priority === "P0 Critique")
    ? "P0 Critique"
    : features.some((feature) => feature === "Authentification" || feature === "Playwright")
      ? "P1 Prioritaire"
      : "P2 Important";

  const category = insights[0]?.category ?? "Pilotage automatique";
  const modifiedFileCount = normalizedFiles.length;
  const titleFocus = features.slice(0, 3).join(", ");
  const branchLabel = branch ? `sur ${branch}` : "dans le workspace local";

  return {
    id: `codex-${slugify(normalizedFiles.join("-")).slice(0, 40)}`,
    source: "automatic",
    createdAt: new Date("2026-07-27T12:00:00+02:00").toISOString(),
    version: projectVersion,
    author: "Codex",
    category,
    priority,
    title: `Journal automatique Codex : ${titleFocus || "lot local"}`,
    description: `Codex a detecte ${modifiedFileCount} fichier(s) modifie(s) ${branchLabel} et a cree cette synthese automatique pour documenter le lot important en cours.`,
    decisions: "Le lot local est documente automatiquement dans le journal pour garder une trace exploitable des changements, des impacts et des risques avant meme le commit final.",
    reasons: relevantPlanningItems.length
      ? `Ces modifications soutiennent directement ${relevantPlanningItems.map((item) => item.feature).join(", ")} et evitent de dissocier le code reel du pilotage produit.`
      : "Ces modifications ont ete relevees pour maintenir une documentation continue du projet sans dependre d'une saisie manuelle.",
    difficulties: dirtyFileCount > 6
      ? "Le lot touche plusieurs fichiers et peut propager des effets de bord entre la page Developer, la roadmap, l'authentification et les tests."
      : "Le contexte doit rester lisible alors que les changements locaux ne sont pas encore materialises dans un commit final.",
    solution: "Le journal automatique consolide les fichiers modifies, les impacts, la roadmap, les dependances et les regressions potentielles dans une seule entree Codex.",
    impactSummary: impactSummary || "Le lot local reste circonscrit a la zone modifiee sans impact transversal complementaire detecte.",
    modifiedFiles: normalizedFiles,
    roadmapUpdates,
    dependencyUpdates,
    remainingTasks,
    potentialRegressions,
    features,
    links: [
      ...documentLinks([
        "#tableau-de-suivi-a-mettre-a-jour-apres-chaque-evolution-importante",
        repositoryPath ? `https://github.com/${repositoryPath}` : "/dashboard/admin/developpement",
      ]),
    ],
    screenshotUrl: null,
    timeSpentMinutes: Math.min(240, Math.max(45, modifiedFileCount * 20)),
    status: dirtyFileCount > 0 ? "🟡 En cours" : "✅ Terminé",
  };
}

function buildDailySummaries(entries: DeveloperLogEntry[]) {
  const automaticEntries = entries.filter((entry) => entry.source === "automatic");
  const grouped = new Map<string, DeveloperLogEntry[]>();

  for (const entry of automaticEntries) {
    const date = entry.createdAt.slice(0, 10);
    const bucket = grouped.get(date) ?? [];
    bucket.push(entry);
    grouped.set(date, bucket);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([date, dayEntries]) => {
      const features = unique(dayEntries.flatMap((entry) => entry.features)).slice(0, 6);
      const roadmapUpdates = unique(dayEntries.flatMap((entry) => entry.roadmapUpdates)).slice(0, 4);
      const remainingTasks = unique(dayEntries.flatMap((entry) => entry.remainingTasks)).slice(0, 4);
      const potentialRegressions = unique(dayEntries.flatMap((entry) => entry.potentialRegressions)).slice(0, 4);
      const modifiedFilesCount = unique(dayEntries.flatMap((entry) => entry.modifiedFiles)).length;

      return {
        id: `daily-${date}`,
        date,
        title: `Resume automatique Codex du ${date}`,
        summary: `${dayEntries.length} entree(s) automatiques, ${modifiedFilesCount} fichier(s) suivis et ${features.length} axe(s) produit resumes pour la journee.`,
        entryCount: dayEntries.length,
        modifiedFilesCount,
        features,
        roadmapUpdates,
        remainingTasks,
        potentialRegressions,
      } satisfies DeveloperLogDailySummary;
    });
}

export function createManualLogEntrySeed(version: string, author: string): DeveloperLogEntry {
  const now = new Date().toISOString();
  return {
    id: `manual-${slugify(now)}`,
    source: "manual",
    createdAt: now,
    version,
    author,
    category: "Produit",
    priority: "P2 Important",
    title: "",
    description: "",
    decisions: "",
    reasons: "",
    difficulties: "",
    solution: "",
    impactSummary: "",
    modifiedFiles: [],
    roadmapUpdates: [],
    dependencyUpdates: [],
    remainingTasks: [],
    potentialRegressions: [],
    features: [],
    links: [],
    screenshotUrl: null,
    timeSpentMinutes: 30,
    status: "🟡 En cours",
  };
}

export function buildDeveloperLogView(options: BuildDeveloperLogOptions): DeveloperLogView {
  const { plan, projectVersion, repositoryUrl, commits } = options;
  const repositoryPath = extractRepositoryPath(repositoryUrl);
  const codexEntry = buildCodexWorkspaceEntry(options);
  const automaticEntries = [
    ...(codexEntry ? [codexEntry] : []),
    ...commits.slice(0, 4).map((commit) => commitEntry(commit, projectVersion, repositoryPath)),
    ...plan.planning.slice(0, 3).map((item) => planningEntryToLogItem(item, projectVersion)),
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    entries: automaticEntries,
    authors: Array.from(new Set(automaticEntries.map((entry) => entry.author))).sort((left, right) =>
      left.localeCompare(right, "fr"),
    ),
    categories: Array.from(new Set(automaticEntries.map((entry) => entry.category))).sort((left, right) =>
      left.localeCompare(right, "fr"),
    ),
    features: Array.from(new Set(automaticEntries.flatMap((entry) => entry.features))).sort((left, right) =>
      left.localeCompare(right, "fr"),
    ),
    dailySummaries: buildDailySummaries(automaticEntries),
  };
}
