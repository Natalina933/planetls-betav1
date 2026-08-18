export type TechnicalMemoryEntry = {
  id: string;
  title: string;
  question: string;
  answer: string;
  rationale: string;
  impact: string;
  category: "Stack" | "Architecture" | "Workflow" | "UI" | "Pilotage";
  tags: string[];
  evidence: string[];
  source: "canonique" | "master-plan";
  date: string;
};

export type TechnicalMemoryView = {
  entries: TechnicalMemoryEntry[];
  categories: TechnicalMemoryEntry["category"][];
  tags: string[];
};

type BuildTechnicalMemoryOptions = {
  markdown: string;
  projectVersion: string;
  workflowExists: boolean;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractMasterPlanDecisions(markdown: string) {
  const entries: TechnicalMemoryEntry[] = [];
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");

  for (const line of lines) {
    const proseDecision = /^\*\*(\d{4}-\d{2}-\d{2}) - ([^.]+)\.\*\*\s*(.+)$/.exec(line.trim());
    if (!proseDecision) continue;

    const [, date, categoryLabel, summary] = proseDecision;
    const normalized = `${categoryLabel} ${summary}`.toLowerCase();
    const category: TechnicalMemoryEntry["category"] =
      normalized.includes("build") || normalized.includes("workflow") ? "Workflow"
        : normalized.includes("ux") || normalized.includes("ui") ? "UI"
          : normalized.includes("pilotage") ? "Pilotage"
            : "Architecture";

    entries.push({
      id: `decision-${slugify(date)}-${slugify(summary).slice(0, 48)}`,
      title: summary.split(".")[0]?.trim() || summary.trim(),
      question: `Pourquoi cette décision du ${date} a-t-elle été prise ?`,
      answer: summary.trim(),
      rationale: `Décision tracée dans le Master Plan sous ${categoryLabel.trim()}.`,
      impact: "Elle sert de référence rapide pour retrouver le contexte et éviter de réouvrir un arbitrage déjà posé.",
      category,
      tags: unique([
        categoryLabel.trim(),
        normalized.includes("master plan") ? "master plan" : "",
        normalized.includes("mission control") ? "mission control" : "",
        normalized.includes("roadmap") ? "roadmap" : "",
        normalized.includes("journal") ? "journal" : "",
        normalized.includes("playwright") ? "playwright" : "",
      ]),
      evidence: ["docs/master-plan-planetls.md"],
      source: "master-plan",
      date,
    });
  }

  return entries;
}

export function buildTechnicalMemoryView({
  markdown,
  projectVersion,
  workflowExists,
}: BuildTechnicalMemoryOptions): TechnicalMemoryView {
  const canonicalEntries: TechnicalMemoryEntry[] = [
    {
      id: "memory-supabase",
      title: "Supabase comme socle data",
      question: "Pourquoi Supabase ?",
      answer: "PlanetLS centralise base PostgreSQL, authentification, stockage privé et règles d'accès dans un même socle pour réduire la fragmentation des opérations métier.",
      rationale: "Le produit manipule profils, missions, documents privés et permissions multi-rôles ; Supabase permet de garder ces briques proches avec RLS et SDK serveur/client alignés.",
      impact: "Moins d'intégrations séparées à maintenir, un modèle d'accès plus cohérent et une meilleure traçabilité des données sensibles.",
      category: "Stack",
      tags: ["supabase", "postgres", "auth", "storage", "rls"],
      evidence: ["package.json", "src/types/supabase.generated.ts", "src/server"],
      source: "canonique",
      date: "2026-07-27",
    },
    {
      id: "memory-nextjs",
      title: "Next.js pour un cockpit full-stack unique",
      question: "Pourquoi Next.js ?",
      answer: "PlanetLS utilise Next.js pour réunir pages, routes API, rendu serveur, sécurité des dashboards et surfaces publiques dans une seule application déployable.",
      rationale: "Le projet doit servir des pages publiques, des dashboards sécurisés par rôle et des endpoints métier proches de l'UI sans multiplier les dépôts ni les conventions.",
      impact: "Une base de code plus compacte, une navigation plus homogène et une montée en puissance plus simple pour les parcours admin, owner, concierge et provider.",
      category: "Stack",
      tags: ["next.js", "app router", "api routes", "ssr", `v${projectVersion}`],
      evidence: ["package.json", "src/app", "playwright.config.ts"],
      source: "canonique",
      date: "2026-07-27",
    },
    {
      id: "memory-vercel",
      title: "Vercel pour les déploiements alignés au framework",
      question: "Pourquoi Vercel ?",
      answer: "Le projet s'appuie sur Vercel pour profiter d'un déploiement naturel de l'application Next.js, des previews et d'un hébergement cohérent avec les routes App Router.",
      rationale: "L'objectif est d'accélérer les validations produit sans ajouter une couche d'infrastructure spécifique sur un produit encore en consolidation.",
      impact: "Des environnements plus rapides à ouvrir, moins de friction pour les validations UI et une meilleure continuité entre développement et production.",
      category: "Stack",
      tags: ["vercel", "deployment", "preview", "hosting"],
      evidence: ["docs/master-plan-planetls.md", "src/app/layout.tsx"],
      source: "canonique",
      date: "2026-07-27",
    },
    {
      id: "memory-architecture",
      title: "Architecture unifiée par domaine et par rôle",
      question: "Pourquoi cette architecture ?",
      answer: "PlanetLS regroupe les écrans par rôle dans `src/app/dashboard/*` et les helpers métier à proximité pour garder les workflows lisibles depuis le code produit.",
      rationale: "Le produit comporte plusieurs personas, mais les workflows restent liés ; l'architecture vise à éviter une séparation trop rigide qui compliquerait les partages de logique métier.",
      impact: "On retrouve plus vite les surfaces par rôle, les helpers workflow et les routes API, ce qui réduit le coût de navigation dans le dépôt.",
      category: "Architecture",
      tags: ["dashboard", "roles", "app router", "workflow", "domaines"],
      evidence: ["src/app/dashboard", "src/features", "src/app/api"],
      source: "canonique",
      date: "2026-07-27",
    },
    {
      id: "memory-components",
      title: "Réutiliser les composants existants avant d'en créer de nouveaux",
      question: "Pourquoi ce composant ou cette famille de composants ?",
      answer: "Le projet privilégie les primitives UI existantes et les composants déjà présents pour éviter les strates parallèles et conserver une interface homogène.",
      rationale: "Le Master Plan rappelle explicitement de réutiliser composants et helpers existants avant toute nouvelle couche visuelle ou métier.",
      impact: "Moins de duplication, moins de styles concurrents et une maintenance plus prévisible sur les dashboards complexes.",
      category: "UI",
      tags: ["components", "design system", "ui", "reuse"],
      evidence: ["docs/master-plan-planetls.md", "src/components/ui", "src/features/shared"],
      source: "canonique",
      date: "2026-07-27",
    },
    {
      id: "memory-workflow",
      title: "Workflow de preuve par tests et pilotage vivant",
      question: "Pourquoi ce workflow de développement ?",
      answer: "Chaque évolution importante doit mettre à jour le Master Plan, garder une preuve exécutable et, quand c'est pertinent, être couverte par tests unitaires, build et Playwright.",
      rationale: "Le produit a assez de parcours critiques pour que les décisions non tracées ou non testées deviennent rapidement des régressions coûteuses.",
      impact: "Le contexte produit reste consultable en quelques secondes et les parcours critiques sont vérifiables dans le navigateur.",
      category: "Workflow",
      tags: unique(["master plan", "tests", "playwright", workflowExists ? "ci" : "ci-local"]),
      evidence: ["AGENTS.md", "docs/master-plan-planetls.md", ".github/workflows/e2e.yml"],
      source: "canonique",
      date: "2026-07-27",
    },
  ];

  const entries = [...canonicalEntries, ...extractMasterPlanDecisions(markdown)]
    .sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title, "fr"));

  return {
    entries,
    categories: ["Stack", "Architecture", "Workflow", "UI", "Pilotage"],
    tags: unique(entries.flatMap((entry) => entry.tags)).sort((left, right) => left.localeCompare(right, "fr")),
  };
}
