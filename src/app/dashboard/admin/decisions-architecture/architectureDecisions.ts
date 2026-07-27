import { buildTechnicalMemoryView } from "../developpement/technicalMemory.ts";

export type ArchitectureDecision = {
  id: string;
  title: string;
  category: "Stack" | "Architecture" | "Workflow" | "UI" | "Pilotage";
  context: string;
  problem: string;
  options: string[];
  advantages: string[];
  disadvantages: string[];
  choice: string;
  justification: string;
  consequences: string[];
  date: string;
  author: string;
  evidence: string[];
  tags: string[];
  linkedDecisionIds: string[];
  source: "canonique" | "master-plan";
};

export type ArchitectureDecisionCenter = {
  decisions: ArchitectureDecision[];
  categories: ArchitectureDecision["category"][];
  tags: string[];
};

type BuildArchitectureDecisionCenterOptions = {
  markdown: string;
  projectVersion: string;
  workflowExists: boolean;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function mapCanonicalDecision(options: BuildArchitectureDecisionCenterOptions) {
  const technicalMemory = buildTechnicalMemoryView(options);
  const canonicalEntries = technicalMemory.entries.filter((entry) => entry.source === "canonique");

  const explicitLinks: Record<string, string[]> = {
    "memory-supabase": ["memory-nextjs", "memory-workflow", "memory-architecture"],
    "memory-nextjs": ["memory-vercel", "memory-architecture", "memory-workflow"],
    "memory-vercel": ["memory-nextjs", "memory-workflow"],
    "memory-architecture": ["memory-supabase", "memory-nextjs", "memory-components"],
    "memory-components": ["memory-architecture", "memory-workflow"],
    "memory-workflow": ["memory-nextjs", "memory-vercel", "memory-supabase", "memory-components"],
  };

  return canonicalEntries.map((entry) => {
    const baseOptions = entry.id === "memory-supabase"
      ? [
          "Supabase comme socle unifié base + auth + storage",
          "Base PostgreSQL séparée avec auth dédiée",
          "Socle backend custom avec plusieurs services spécialisés",
        ]
      : entry.id === "memory-nextjs"
        ? [
            "Next.js App Router full-stack unique",
            "Frontend React séparé d'un backend dédié",
            "Plusieurs applications par persona",
          ]
        : entry.id === "memory-vercel"
          ? [
              "Vercel aligné au framework Next.js",
              "Hébergement self-managed",
              "Autre plateforme cloud généraliste",
            ]
          : entry.id === "memory-architecture"
            ? [
                "Organisation par rôle et domaine dans un même dépôt",
                "Découpage strict par micro-frontends ou apps séparées",
                "Architecture orientée couches techniques pures",
              ]
            : entry.id === "memory-components"
              ? [
                  "Réutiliser les primitives et composants existants",
                  "Créer une nouvelle couche UI spécifique à chaque lot",
                  "Externaliser trop tôt un design system complet",
                ]
              : [
                  "Pilotage vivant avec Master Plan, tests et preuves",
                  "Documentation manuelle ponctuelle sans synchronisation",
                  "Pilotage uniquement par backlog externe",
                ];

    const advantages = entry.id === "memory-supabase"
      ? [
          "Réduit la fragmentation technique entre données, auth et stockage privé.",
          "Simplifie les permissions multi-rôles grâce à RLS.",
          "Rapproche les briques critiques du produit dans un même socle.",
        ]
      : entry.id === "memory-nextjs"
        ? [
            "Garde pages, routes API et dashboards sécurisés dans une seule base de code.",
            "Facilite le passage du public au privé sans changer de stack.",
            "Accélère les validations produit et les itérations de cockpit.",
          ]
        : entry.id === "memory-vercel"
          ? [
              "Déploiement naturel pour Next.js.",
              "Previews rapides pour valider l'UX et les parcours admin.",
              "Moins de friction entre développement, build et hébergement.",
            ]
          : entry.id === "memory-architecture"
            ? [
                "Navigation plus rapide dans le dépôt.",
                "Meilleure lisibilité des surfaces par persona.",
                "Partage plus simple des helpers métier entre workflows proches.",
              ]
            : entry.id === "memory-components"
              ? [
                  "Réduit les doublons UI.",
                  "Améliore la cohérence des dashboards.",
                  "Limite les divergences de styles et de comportements accessibles.",
                ]
              : [
                  "Conserve une preuve exécutable des décisions importantes.",
                  "Synchronise code, tests et pilotage.",
                  "Réduit le risque de régression silencieuse sur les parcours critiques.",
                ];

    const disadvantages = entry.id === "memory-supabase"
      ? [
          "Dépendance forte à un socle externe unique.",
          "Les indisponibilités réseau peuvent gêner le développement connecté.",
        ]
      : entry.id === "memory-nextjs"
        ? [
            "La frontière frontend/backend est moins nette qu'avec deux dépôts distincts.",
            "Les routes App Router demandent une discipline de structure.",
          ]
        : entry.id === "memory-vercel"
          ? [
              "Dépendance à la plateforme pour certaines habitudes de déploiement.",
              "Certaines vérifications profondes restent limitées en sandbox local.",
            ]
          : entry.id === "memory-architecture"
            ? [
                "La proximité des domaines peut créer des dépendances implicites si elle est mal gouvernée.",
                "Le dépôt demande une discipline documentaire continue.",
              ]
            : entry.id === "memory-components"
              ? [
                  "Certains lots demandent de composer avec des primitives existantes plutôt que repartir de zéro.",
                  "La vitesse initiale perçue peut être moindre sur des demandes purement visuelles.",
                ]
              : [
                  "Le pilotage demande une mise à jour rigoureuse du Master Plan.",
                  "La documentation automatique reste partiellement heuristique.",
                ];

    return {
      id: entry.id,
      title: entry.title,
      category: entry.category,
      context: entry.answer,
      problem: entry.question,
      options: baseOptions,
      advantages,
      disadvantages,
      choice: entry.title,
      justification: entry.rationale,
      consequences: [
        entry.impact,
        `Références de preuve : ${entry.evidence.join(", ")}.`,
      ],
      date: entry.date,
      author: "Équipe PlanetLS",
      evidence: entry.evidence,
      tags: entry.tags,
      linkedDecisionIds: explicitLinks[entry.id] ?? [],
      source: entry.source,
    } satisfies ArchitectureDecision;
  });
}

function extractMasterPlanArchitectureDecisions(options: BuildArchitectureDecisionCenterOptions) {
  const technicalMemory = buildTechnicalMemoryView(options);
  const derivedEntries = technicalMemory.entries.filter((entry) => entry.source === "master-plan");

  return derivedEntries.map((entry) => {
    const normalized = normalize(`${entry.title} ${entry.answer} ${entry.rationale} ${entry.tags.join(" ")}`);
    const relatedCoreIds = [
      normalized.includes("playwright") || normalized.includes("tests") ? "memory-workflow" : "",
      normalized.includes("master plan") || normalized.includes("pilotage") ? "memory-workflow" : "",
      normalized.includes("mission control") ? "memory-architecture" : "",
      normalized.includes("journal") ? "memory-components" : "",
      normalized.includes("roadmap") ? "memory-architecture" : "",
    ];

    return {
      id: `arch-${entry.id}`,
      title: entry.title,
      category: entry.category,
      context: `Décision dérivée du Master Plan à la date du ${entry.date}. ${entry.answer}`,
      problem: `Quel arbitrage cette évolution cherchait-elle à résoudre dans PlanetLS ?`,
      options: [
        "Conserver le comportement précédent",
        "Ajuster l'architecture ou la vue concernée",
        "Reporter la décision en attendant plus de preuves",
      ],
      advantages: [
        "Décision retrouvable rapidement depuis le centre d'architecture.",
        "Lien direct entre pilotage et implementation réelle.",
      ],
      disadvantages: [
        "Le niveau de détail est partiellement reconstruit à partir du Master Plan.",
      ],
      choice: entry.answer,
      justification: entry.rationale,
      consequences: [
        entry.impact,
        "Cette décision enrichit la traçabilité entre documentation, vue développement et architecture.",
      ],
      date: entry.date,
      author: "Pilotage PlanetLS",
      evidence: entry.evidence,
      tags: entry.tags,
      linkedDecisionIds: unique(relatedCoreIds),
      source: entry.source,
    } satisfies ArchitectureDecision;
  });
}

function linkDecisions(decisions: ArchitectureDecision[]) {
  const byId = new Map(decisions.map((decision) => [decision.id, decision] as const));

  return decisions.map((decision) => {
    const normalizedTags = decision.tags.map((tag) => normalize(tag));
    const inferredLinks = decisions
      .filter((candidate) => candidate.id !== decision.id)
      .filter((candidate) => {
        if (decision.linkedDecisionIds.includes(candidate.id)) return false;
        const candidateTags = candidate.tags.map((tag) => normalize(tag));
        const sharedTag = normalizedTags.some((tag) => candidateTags.includes(tag));
        const sameCategory = candidate.category === decision.category;
        return sharedTag || sameCategory;
      })
      .slice(0, 3)
      .map((candidate) => candidate.id);

    return {
      ...decision,
      linkedDecisionIds: unique([
        ...decision.linkedDecisionIds.filter((id) => byId.has(id)),
        ...inferredLinks,
      ]).slice(0, 5),
    };
  });
}

export function buildArchitectureDecisionCenter(
  options: BuildArchitectureDecisionCenterOptions,
): ArchitectureDecisionCenter {
  const decisions = linkDecisions([
    ...mapCanonicalDecision(options),
    ...extractMasterPlanArchitectureDecisions(options),
  ]).sort(
    (left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title, "fr"),
  );

  return {
    decisions,
    categories: ["Stack", "Architecture", "Workflow", "UI", "Pilotage"],
    tags: unique(decisions.flatMap((decision) => decision.tags)).sort((left, right) =>
      left.localeCompare(right, "fr"),
    ),
  };
}
