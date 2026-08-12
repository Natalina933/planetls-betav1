import type { MissionControlView } from "./missionControl";
import type { MasterPlanView } from "./masterPlan";
import type { RoadmapProjection } from "./roadmap";
import type { TechnicalMemoryView } from "./technicalMemory";

export type AdvisorConfidence = "Factuel" | "Croisé" | "Heuristique";
export type AdvisorTone = "success" | "warning" | "neutral";

export type ProjectAdvisorAnswer = {
  id: string;
  question: string;
  answer: string;
  detail: string;
  evidence: string[];
  confidence: AdvisorConfidence;
  tone: AdvisorTone;
  tags: string[];
};

export type ProjectAdvisorView = {
  generatedAt: string;
  answers: ProjectAdvisorAnswer[];
};

export type ProjectAdvisorCodeInsight = {
  route: string;
  file: string;
  lines: number;
  signals: string[];
  testReferences: string[];
};

export type ProjectAdvisorLargeFile = {
  file: string;
  lines: number;
};

export type ProjectAdvisorComponentUsage = {
  component: string;
  count: number;
  evidence: string[];
};

export type ProjectAdvisorInput = {
  checkedAt: string;
  plan: MasterPlanView;
  missionControl: MissionControlView;
  roadmap: RoadmapProjection;
  technicalMemory: TechnicalMemoryView;
  codeInsights: {
    designSystemDriftPages: ProjectAdvisorCodeInsight[];
    productionReadyPages: ProjectAdvisorCodeInsight[];
    largeFiles: ProjectAdvisorLargeFile[];
    underusedComponents: ProjectAdvisorComponentUsage[];
    missingTestCandidates: Array<{
      title: string;
      priority: string;
      nextAction: string;
      evidence: string;
    }>;
  };
};

function formatList(items: string[], fallback: string, limit = 3) {
  if (!items.length) return fallback;
  return items.slice(0, limit).join(", ");
}

function _normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function routeLabel(route: string) {
  return route === "/" ? "/home" : route;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function buildProjectAdvisorView({
  checkedAt,
  plan,
  missionControl,
  roadmap,
  technicalMemory,
  codeInsights,
}: ProjectAdvisorInput): ProjectAdvisorView {
  const rentableCandidate = [...roadmap.readyItems]
    .sort((left, right) => (
      right.businessGainScore - left.businessGainScore
      || right.userGainScore - left.userGainScore
      || left.estimationDays - right.estimationDays
    ))[0] ?? roadmap.nextSuggestion;

  const completedModules = plan.sections
    .filter((section) => section.statuses.includes("✅ Terminé") && section.statuses.length === 1)
    .slice(0, 4);

  const blockedFeatures = roadmap.blockedItems.slice(0, 3);
  const blockerLabels = blockedFeatures.flatMap((item) => item.blockedBy).map((dependencyId) => (
    roadmap.items.find((candidate) => candidate.id === dependencyId)?.title ?? dependencyId
  ));

  const productionReadyPages = codeInsights.productionReadyPages.slice(0, 4);
  const designSystemDriftPages = codeInsights.designSystemDriftPages.slice(0, 4);
  const underusedComponents = codeInsights.underusedComponents.slice(0, 4);
  const largeFiles = codeInsights.largeFiles.slice(0, 4);
  const missingTestCandidates = codeInsights.missingTestCandidates.slice(0, 4);

  const designMemory = technicalMemory.entries.find((entry) => entry.category === "UI");

  const answers: ProjectAdvisorAnswer[] = [
    {
      id: "next-profitable-feature",
      question: "Quelle est la prochaine fonctionnalité la plus rentable à développer ?",
      answer: rentableCandidate
        ? `${rentableCandidate.title} semble offrir le meilleur couple valeur business / friction d'exécution à court terme.`
        : "Aucune fonctionnalité ouverte n'est actuellement assez structurée pour sortir une recommandation fiable.",
      detail: rentableCandidate
        ? `${rentableCandidate.domain} · ${rentableCandidate.priority} · gain business ${rentableCandidate.businessGain}. ${rentableCandidate.isReady ? "Elle est prête à lancer maintenant." : `Elle reste bloquée par ${rentableCandidate.blockedBy.length} dépendance(s).`} Prochaine action : ${rentableCandidate.nextAction || "à préciser dans le registre"}.`
        : "La roadmap n'expose pas de chantier assez priorisé ou assez détaillé pour arbitrer la rentabilité suivante.",
      evidence: rentableCandidate
        ? unique([
          `Roadmap · ${rentableCandidate.domain}`,
          rentableCandidate.nextAction,
          rentableCandidate.evidence,
        ])
        : ["Roadmap intelligente"],
      confidence: rentableCandidate ? "Croisé" : "Heuristique",
      tone: rentableCandidate?.isReady ? "success" : "warning",
      tags: unique([
        rentableCandidate?.priority ?? "",
        rentableCandidate?.domain ?? "",
        "roadmap",
        "valeur business",
      ]),
    },
    {
      id: "current-blockers",
      question: "Quelles dépendances me bloquent actuellement ?",
      answer: blockedFeatures.length
        ? `${blockedFeatures.length} chantier(s) prioritaire(s) restent freinés par des dépendances amont clairement visibles.`
        : "Aucune dépendance bloquante majeure ne remonte dans la projection actuelle.",
      detail: blockedFeatures.length
        ? `Les verrous les plus exposés sont ${formatList(blockerLabels, "aucune dépendance nommée")}. Mission Control remonte aussi ${missionControl.blockedFeatures} blocage(s) actif(s) et ${missionControl.criticalBugs} bug(s) critique(s).`
        : "La roadmap ne montre pas de chaîne de dépendance ouverte sur les chantiers restants.",
      evidence: blockedFeatures.length
        ? unique([
          ...blockedFeatures.map((item) => `${item.title} → ${formatList(item.blockedBy.map((dependencyId) => roadmap.items.find((candidate) => candidate.id === dependencyId)?.title ?? dependencyId), "dépendance à préciser")}`),
          `Mission Control · ${missionControl.blockedFeatures} blocage(s)`,
        ])
        : ["Mission Control", "Roadmap intelligente"],
      confidence: "Factuel",
      tone: blockedFeatures.length ? "warning" : "success",
      tags: ["blocages", "dépendances", "pilotage"],
    },
    {
      id: "underused-components",
      question: "Quels composants sont sous-utilisés ?",
      answer: underusedComponents.length
        ? `${underusedComponents.length} composant(s) UI semblent très peu réemployés et méritent une revue avant d'ajouter de nouvelles variantes.`
        : "Aucun composant faiblement utilisé ne ressort assez nettement dans l'analyse courante.",
      detail: underusedComponents.length
        ? `${underusedComponents.map((item) => `${item.component} (${item.count} import${item.count > 1 ? "s" : ""})`).join(", ")}. Ce signal reste heuristique : il mesure la présence dans les imports du repo, pas la qualité d'usage réelle.`
        : "L'inventaire d'imports ne montre pas de composant isolé avec un usage anormalement faible.",
      evidence: underusedComponents.flatMap((item) => item.evidence).slice(0, 6),
      confidence: "Heuristique",
      tone: underusedComponents.length ? "warning" : "neutral",
      tags: ["design system", "réutilisation", "ui"],
    },
    {
      id: "completed-modules",
      question: "Quels modules sont terminés à 100 % ?",
      answer: completedModules.length
        ? `${completedModules.length} blocs du Master Plan sont marqués en terminé sans autre statut concurrent.`
        : "Le Master Plan ne fait pas encore remonter de bloc entièrement clôturé avec un statut isolé suffisamment net.",
      detail: completedModules.length
        ? completedModules.map((section) => section.title).join(" · ")
        : "Beaucoup de surfaces sont encore en consolidation ou mélangent des niveaux de maturité différents.",
      evidence: completedModules.length
        ? completedModules.map((section) => `Master Plan · ${section.title}`)
        : ["docs/master-plan-planetls.md"],
      confidence: completedModules.length ? "Factuel" : "Heuristique",
      tone: completedModules.length ? "success" : "neutral",
      tags: ["master plan", "terminé", "couverture"],
    },
    {
      id: "design-system-drift",
      question: "Quels écrans ne respectent pas encore le design system ?",
      answer: designSystemDriftPages.length
        ? `${designSystemDriftPages.length} page(s) ressortent comme candidates à une revue de conformité design system.`
        : "Aucun écran ne ressort actuellement comme dérive évidente dans le scan heuristique.",
      detail: designSystemDriftPages.length
        ? `${designSystemDriftPages.map((page) => `${routeLabel(page.route)} (${page.lines} lignes)`).join(", ")}. Signal heuristique : ces pages n'importent pas les briques UI/shared attendues ou portent encore des surfaces très locales.`
        : "Les pages scannées importent déjà les briques partagées attendues ou ne montrent pas de dérive simple à détecter automatiquement.",
      evidence: unique([
        ...(designSystemDriftPages.map((page) => page.file)),
        ...(designMemory ? designMemory.evidence : []),
      ]).slice(0, 6),
      confidence: "Heuristique",
      tone: designSystemDriftPages.length ? "warning" : "success",
      tags: ["design system", "écrans", "ui"],
    },
    {
      id: "production-ready-pages",
      question: "Quelles pages sont les plus proches d'une mise en production ?",
      answer: productionReadyPages.length
        ? `${productionReadyPages.length} page(s) cumulent le plus de signaux favorables dans le repo.`
        : "Aucune page ne cumule encore assez de signaux convergents pour être mise en avant avec confiance.",
      detail: productionReadyPages.length
        ? productionReadyPages.map((page) => `${routeLabel(page.route)} · ${formatList(page.signals, "signaux non précisés", 4)}`).join(" | ")
        : "Le scan n'a pas trouvé assez de recoupements entre tests, structure partagée et lisibilité de surface.",
      evidence: unique(productionReadyPages.flatMap((page) => [page.file, ...page.testReferences])).slice(0, 8),
      confidence: productionReadyPages.length ? "Croisé" : "Heuristique",
      tone: productionReadyPages.length ? "success" : "neutral",
      tags: ["production", "tests", "pages"],
    },
    {
      id: "large-files",
      question: "Quels fichiers deviennent trop volumineux et méritent un découpage ?",
      answer: largeFiles.length
        ? `${largeFiles.length} fichier(s) dépassent le seuil de taille surveillé et devraient être regardés avant de continuer à empiler de la logique.`
        : "Aucun fichier ne dépasse actuellement le seuil surveillé dans l'analyse locale.",
      detail: largeFiles.length
        ? largeFiles.map((item) => `${item.file} (${item.lines} lignes)`).join(", ")
        : "Le scan n'a pas identifié de fichier au-dessus du seuil de revue.",
      evidence: largeFiles.map((item) => item.file),
      confidence: "Factuel",
      tone: largeFiles.length ? "warning" : "success",
      tags: ["refactor", "taille", "maintenance"],
    },
    {
      id: "missing-tests",
      question: "Quels tests manquent avant la mise en production ?",
      answer: missingTestCandidates.length
        ? `${missingTestCandidates.length} chantier(s) P0/P1 prêts ou presque prêts restent sans signal de test suffisamment visible.`
        : "Aucun manque de test prioritaire évident ne ressort dans le radar actuel.",
      detail: missingTestCandidates.length
        ? missingTestCandidates.map((item) => `${item.title} (${item.priority}) · ${item.nextAction || item.evidence || "preuve de test à préciser"}`).join(" | ")
        : "Le radar de tests ne voit pas de lot critique sans piste de validation associée.",
      evidence: unique(missingTestCandidates.flatMap((item) => [item.title, item.evidence])).slice(0, 8),
      confidence: "Croisé",
      tone: missingTestCandidates.length ? "warning" : "success",
      tags: ["tests", "release", "qa"],
    },
  ];

  return {
    generatedAt: checkedAt,
    answers: answers.filter((answer) => answer.answer.trim().length > 0),
  };
}
