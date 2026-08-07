import {
  BUSINESS_PLAN_STATUS_LABELS as RECORD_STATUS_LABELS,
  PLANETLS_BUSINESS_PLAN_REPOSITORY,
  type BusinessPlanRecordStatus,
} from "./business-plan-reference";

export type BusinessPlanStatus = "todo" | "review" | "validated" | "update";

export type BusinessPlanTabId =
  | "synthesis"
  | "market"
  | "model"
  | "product"
  | "governance"
  | "annexes";

export type BusinessPlanSectionId =
  | "summary"
  | "vision"
  | "problem"
  | "solution"
  | "value"
  | "personas"
  | "marketStudy"
  | "competition"
  | "canvas"
  | "economicModel"
  | "pricing"
  | "goToMarket"
  | "acquisition"
  | "roadmap"
  | "aiStrategy"
  | "saasKpis"
  | "financialForecasts"
  | "swot"
  | "risks"
  | "hypotheses"
  | "actionPlan"
  | "appendices";

export type BusinessPlanTabDefinition = {
  id: BusinessPlanTabId;
  label: string;
  summary: string;
};

export type BusinessPlanSectionDefinition = {
  id: BusinessPlanSectionId;
  tabId: BusinessPlanTabId;
  order: number;
  title: string;
  eyebrow: string;
  summary: string;
  status: BusinessPlanStatus;
  evidence: string;
};

export type BenchmarkRow = {
  actor: string;
  category: string;
  pricing: string;
  positioning: string;
  strengths: string;
  limits: string;
  lesson: string;
};

export type PricingRow = {
  actor: string;
  amount: number;
  label: string;
  note: string;
  tone: "planetls" | "direct" | "indirect";
};

export type CapabilityRow = {
  label: string;
  easyConcierge: string;
  turno: string;
  breezeway: string;
  guesty: string;
  airbnb: string;
  planetls: string;
};

export type MarketScopeRow = {
  scope: string;
  amount: string;
  focus: string;
  note: string;
};

export type MonthlyPlanRow = {
  month: string;
  objective: string;
  metric: string;
  expected: string;
};

export type NinetyDayPriorityRow = {
  phase: string;
  target: string;
  owner: string;
  proof: string;
};

export type PricingGuidanceRow = {
  profile: string;
  properties: string;
  supportLevel: string;
  monthlyPrice: string;
  whoPays: string;
  note: string;
};

export type FinancialScenario = {
  name: string;
  subscribers: number;
  price: number;
  commissionVolume: number;
  commissionPct: number;
};

function toLegacyStatus(status: BusinessPlanRecordStatus): BusinessPlanStatus {
  switch (status) {
    case "draft":
      return "todo";
    case "to_validate":
      return "review";
    case "validated":
      return "validated";
    case "outdated":
      return "update";
    default:
      return "todo";
  }
}

export const BUSINESS_PLAN_TAB_DEFINITIONS: BusinessPlanTabDefinition[] = [
  {
    id: "synthesis",
    label: "Synthese & vision",
    summary: "These produit, mission, probleme et solution.",
  },
  {
    id: "market",
    label: "Marche & clients",
    summary: "Segments, etude de marche, concurrence et canvas.",
  },
  {
    id: "model",
    label: "Business model",
    summary: "Monetisation, offre, GTM et acquisition.",
  },
  {
    id: "product",
    label: "Produit & IA",
    summary: "Roadmap, strategie IA, KPI SaaS et previsions.",
  },
  {
    id: "governance",
    label: "Pilotage & risques",
    summary: "SWOT, risques, hypotheses et plan d'action.",
  },
  {
    id: "annexes",
    label: "Annexes",
    summary: "Modules detailles, preuves et documents lies.",
  },
];

const SECTION_STATUS = PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses;

export const BUSINESS_PLAN_SECTIONS: BusinessPlanSectionDefinition[] = [
  {
    id: "summary",
    tabId: "synthesis",
    order: 1,
    title: "Synthese",
    eyebrow: "1. Synthese",
    summary: "Vue directionnelle du business plan, de la traction reelle et des priorites immediates.",
    status: toLegacyStatus(SECTION_STATUS.summary),
    evidence: "Referentiel business plan centralise + KPI admin + Master Plan.",
  },
  {
    id: "vision",
    tabId: "synthesis",
    order: 2,
    title: "Vision et mission",
    eyebrow: "2. Vision et mission",
    summary: "Mission, ambition et angle strategique deja exprimes dans le produit et le Master Plan.",
    status: toLegacyStatus(SECTION_STATUS.vision),
    evidence: "Master Plan PlanetLS.",
  },
  {
    id: "problem",
    tabId: "synthesis",
    order: 3,
    title: "Probleme marche",
    eyebrow: "3. Probleme marche",
    summary: "Frictions terrain et tensions de coordination a valider sur donnees reelles.",
    status: toLegacyStatus(SECTION_STATUS.problem),
    evidence: "Validation marche + hypotheses prioritaires.",
  },
  {
    id: "solution",
    tabId: "synthesis",
    order: 4,
    title: "Solution PlanetLS",
    eyebrow: "4. Solution PlanetLS",
    summary: "Comment PlanetLS combine reseau vertical, marketplace locale et cockpit operationnel.",
    status: toLegacyStatus(SECTION_STATUS.solution),
    evidence: "Master Plan + surfaces produit existantes.",
  },
  {
    id: "value",
    tabId: "synthesis",
    order: 5,
    title: "Proposition de valeur",
    eyebrow: "5. Proposition de valeur",
    summary: "Valeur par cible, benefice coeur et differenciation defendable.",
    status: toLegacyStatus(SECTION_STATUS.value),
    evidence: "Master Plan + referentiel business plan.",
  },
  {
    id: "personas",
    tabId: "market",
    order: 6,
    title: "Personas / segments clients",
    eyebrow: "6. Personas / segments clients",
    summary: "Segments business prioritaires et personas produit documentes dans une source unique.",
    status: toLegacyStatus(SECTION_STATUS.personas),
    evidence: "Referentiel business plan + module modele economique.",
  },
  {
    id: "marketStudy",
    tabId: "market",
    order: 7,
    title: "Etude de marche",
    eyebrow: "7. Etude de marche",
    summary: "TAM / SAM / SOM et lecture du marche a conserver mais a consolider.",
    status: toLegacyStatus(SECTION_STATUS.marketStudy),
    evidence: "Referentiel business plan.",
  },
  {
    id: "competition",
    tabId: "market",
    order: 8,
    title: "Concurrence",
    eyebrow: "8. Concurrence",
    summary: "Benchmark integre present, mais a dater et a actualiser regulierement.",
    status: toLegacyStatus(SECTION_STATUS.competition),
    evidence: "Referentiel business plan.",
  },
  {
    id: "canvas",
    tabId: "market",
    order: 9,
    title: "Business Model Canvas",
    eyebrow: "9. Business Model Canvas",
    summary: "Canvas reconstruit a partir des elements deja presents.",
    status: toLegacyStatus(SECTION_STATUS.canvas),
    evidence: "Referentiel business plan.",
  },
  {
    id: "economicModel",
    tabId: "model",
    order: 10,
    title: "Modele economique",
    eyebrow: "10. Modele economique",
    summary: "Atelier existant pour arbitrer reel, hypothese et simulation.",
    status: toLegacyStatus(SECTION_STATUS.economicModel),
    evidence: "economic-model/data.ts + referentiel central.",
  },
  {
    id: "pricing",
    tabId: "model",
    order: 11,
    title: "Tarification et abonnements",
    eyebrow: "11. Tarification et abonnements",
    summary: "Gamme 29 / 49 / sur devis, offre Stripe reelle et scenarios compares sans dispersion.",
    status: toLegacyStatus(SECTION_STATUS.pricing),
    evidence: "Modele economique + offre Stripe existante.",
  },
  {
    id: "goToMarket",
    tabId: "model",
    order: 12,
    title: "Go-To-Market",
    eyebrow: "12. Go-To-Market",
    summary: "Approche locale, pilotes encadres et montee en gamme progressive.",
    status: toLegacyStatus(SECTION_STATUS.goToMarket),
    evidence: "Validation marche + action plan.",
  },
  {
    id: "acquisition",
    tabId: "model",
    order: 13,
    title: "Acquisition",
    eyebrow: "13. Acquisition",
    summary: "Canaux et messages structures comme machine d'acquisition naissante.",
    status: toLegacyStatus(SECTION_STATUS.acquisition),
    evidence: "Validation marche + referentiel business plan.",
  },
  {
    id: "roadmap",
    tabId: "product",
    order: 14,
    title: "Roadmap produit",
    eyebrow: "14. Roadmap produit",
    summary: "Roadmap business et produit unifiees dans une meme lecture de pilotage.",
    status: toLegacyStatus(SECTION_STATUS.roadmap),
    evidence: "Validation marche + Master Plan.",
  },
  {
    id: "aiStrategy",
    tabId: "product",
    order: 15,
    title: "Strategie IA",
    eyebrow: "15. Strategie IA",
    summary: "Briques IA existantes, avec discipline cout / usage / supervision.",
    status: toLegacyStatus(SECTION_STATUS.aiStrategy),
    evidence: "Master Plan + registre de risques IA.",
  },
  {
    id: "saasKpis",
    tabId: "product",
    order: 16,
    title: "KPI SaaS",
    eyebrow: "16. KPI SaaS",
    summary: "KPI produit reels disponibles, KPI business encore a mesurer ou consolider.",
    status: toLegacyStatus(SECTION_STATUS.saasKpis),
    evidence: "API KPI + referentiel business plan.",
  },
  {
    id: "financialForecasts",
    tabId: "product",
    order: 17,
    title: "Previsions financieres",
    eyebrow: "17. Previsions financieres",
    summary: "Previsions presentes sous forme de scenarios, pas encore comme modele financier canonique.",
    status: toLegacyStatus(SECTION_STATUS.financialForecasts),
    evidence: "Modele economique + referentiel business plan.",
  },
  {
    id: "swot",
    tabId: "governance",
    order: 18,
    title: "SWOT",
    eyebrow: "18. SWOT",
    summary: "Structure reconstruite a partir du Master Plan, des risques et de la validation marche.",
    status: toLegacyStatus(SECTION_STATUS.swot),
    evidence: "Referentiel business plan.",
  },
  {
    id: "risks",
    tabId: "governance",
    order: 19,
    title: "Risques",
    eyebrow: "19. Risques",
    summary: "Registre detaille expose comme source principale du risque business.",
    status: toLegacyStatus(SECTION_STATUS.risks),
    evidence: "risk-register/riskData.ts.",
  },
  {
    id: "hypotheses",
    tabId: "governance",
    order: 20,
    title: "Hypotheses a valider",
    eyebrow: "20. Hypotheses a valider",
    summary: "Hypotheses de validation marche reliees a une structure de donnees unique.",
    status: toLegacyStatus(SECTION_STATUS.hypotheses),
    evidence: "market-validation/validationData.ts.",
  },
  {
    id: "actionPlan",
    tabId: "governance",
    order: 21,
    title: "Plan d'action",
    eyebrow: "21. Plan d'action",
    summary: "Actions court terme et priorites de structuration documentees dans une source unique.",
    status: toLegacyStatus(SECTION_STATUS.actionPlan),
    evidence: "Referentiel business plan + registre de risques.",
  },
  {
    id: "appendices",
    tabId: "annexes",
    order: 22,
    title: "Annexes",
    eyebrow: "22. Annexes",
    summary: "Details operationnels, modules complets et documents de reference lies au pilotage business.",
    status: toLegacyStatus(SECTION_STATUS.appendices),
    evidence: "Docs + modules de pilotage existants.",
  },
];

export const BUSINESS_PLAN_STATUS_LABELS: Record<BusinessPlanStatus, string> = {
  todo: RECORD_STATUS_LABELS.draft,
  review: RECORD_STATUS_LABELS.to_validate,
  validated: RECORD_STATUS_LABELS.validated,
  update: RECORD_STATUS_LABELS.outdated,
};

export const BUSINESS_PLAN_STATUS_SCORES: Record<BusinessPlanStatus, number> = {
  todo: 25,
  review: 55,
  validated: 100,
  update: 70,
};

export const BENCHMARK_ROWS: BenchmarkRow[] = PLANETLS_BUSINESS_PLAN_REPOSITORY.competitors.map(
  (item) => item.value,
);

export const PRICING_ROWS: PricingRow[] = PLANETLS_BUSINESS_PLAN_REPOSITORY.pricing.benchmarks.map(
  (item) => item.value,
);

export const CAPABILITY_ROWS: CapabilityRow[] = [
  {
    label: "PMS et reservations",
    easyConcierge: "Tres fort",
    turno: "Moyen",
    breezeway: "Faible",
    guesty: "Tres fort",
    airbnb: "Airbnb seulement",
    planetls: "Progressif",
  },
  {
    label: "Reseau de concierges",
    easyConcierge: "Faible",
    turno: "Faible",
    breezeway: "Faible",
    guesty: "Faible",
    airbnb: "Tres fort",
    planetls: "Tres fort",
  },
  {
    label: "Reseau d'artisans",
    easyConcierge: "Faible",
    turno: "Limite",
    breezeway: "Faible",
    guesty: "Faible",
    airbnb: "Tres faible",
    planetls: "Tres fort",
  },
  {
    label: "Marketplace locale",
    easyConcierge: "Faible",
    turno: "Tres fort",
    breezeway: "Faible",
    guesty: "Faible",
    airbnb: "Fort",
    planetls: "Tres fort",
  },
  {
    label: "Demandes multi-prestataires",
    easyConcierge: "Faible",
    turno: "Fort",
    breezeway: "Faible",
    guesty: "Faible",
    airbnb: "Partiel",
    planetls: "Tres fort",
  },
  {
    label: "Missions, planning, preuves",
    easyConcierge: "Fort",
    turno: "Tres fort",
    breezeway: "Tres fort",
    guesty: "Fort",
    airbnb: "Moyen",
    planetls: "Tres fort",
  },
];

export const MARKET_SCOPE_ROWS: MarketScopeRow[] = [
  {
    scope: "TAM",
    amount: PLANETLS_BUSINESS_PLAN_REPOSITORY.market.tam.value,
    focus: "Vision longue : logiciels, coordination terrain, reseau de prestataires.",
    note: "Utile pour la narration investisseur, trop large pour piloter le lancement.",
  },
  {
    scope: "SAM",
    amount: PLANETLS_BUSINESS_PLAN_REPOSITORY.market.sam.value,
    focus: "Cible solvable capable de payer un cockpit metier mensuel.",
    note: "Perimetre le plus credible pour signer les premiers comptes recurrents.",
  },
  {
    scope: "SOM",
    amount: PLANETLS_BUSINESS_PLAN_REPOSITORY.market.som.value,
    focus: "Petit marche reellement attaquable a 12 mois.",
    note: "Le vrai sujet n'est pas la taille theorique mais la densite locale prouvee.",
  },
];

export const MONTHLY_PLAN_ROWS: MonthlyPlanRow[] =
  PLANETLS_BUSINESS_PLAN_REPOSITORY.roadmap.annual.map((item) => item.value);

export const NINETY_DAY_PRIORITIES: NinetyDayPriorityRow[] =
  PLANETLS_BUSINESS_PLAN_REPOSITORY.roadmap.next90Days.map((item) => item.value);

export const PRICING_GUIDANCE_ROWS: PricingGuidanceRow[] =
  PLANETLS_BUSINESS_PLAN_REPOSITORY.pricing.guidance.map((item) => item.value);

export const FINANCIAL_SCENARIOS: FinancialScenario[] =
  PLANETLS_BUSINESS_PLAN_REPOSITORY.financialForecasts.map((item) => item.value);

export const VISION_PILLARS = PLANETLS_BUSINESS_PLAN_REPOSITORY.vision.value;

export const PROBLEM_SIGNALS = PLANETLS_BUSINESS_PLAN_REPOSITORY.marketProblem.value;

export const SOLUTION_PILLARS = PLANETLS_BUSINESS_PLAN_REPOSITORY.solution.value;

export const VALUE_PROPOSITIONS = PLANETLS_BUSINESS_PLAN_REPOSITORY.valueProposition.map(
  (item) => item.value,
);

export const PERSONA_SEGMENTS = [
  {
    title: "Segment prioritaire actuel",
    status: BUSINESS_PLAN_STATUS_LABELS.review,
    items: PLANETLS_BUSINESS_PLAN_REPOSITORY.customerSegments[0]?.value.details ?? [],
  },
  {
    title: "Segments secondaires utiles",
    status: BUSINESS_PLAN_STATUS_LABELS.update,
    items: PLANETLS_BUSINESS_PLAN_REPOSITORY.customerSegments[1]?.value.details ?? [],
  },
  {
    title: "Base personas existante",
    status: BUSINESS_PLAN_STATUS_LABELS.validated,
    items: PLANETLS_BUSINESS_PLAN_REPOSITORY.personas.map(
      (persona) => `${persona.value.label} - ${persona.value.details.join(" ")}`,
    ),
  },
];

export const BUSINESS_MODEL_CANVAS_BLOCKS =
  PLANETLS_BUSINESS_PLAN_REPOSITORY.businessModelCanvas.map((item) => item.value);

export const ACQUISITION_CHANNELS = PLANETLS_BUSINESS_PLAN_REPOSITORY.acquisition.map(
  (item) => item.value,
);

export const AI_STRATEGY_BLOCKS = PLANETLS_BUSINESS_PLAN_REPOSITORY.aiStrategy.map(
  (item) => item.value,
);

export const SWOT_BLOCKS = PLANETLS_BUSINESS_PLAN_REPOSITORY.swot.map((item) => item.value);

export const ANNEX_LINKS = [
  {
    title: "Audit Business Plan",
    href: "/docs/business-plan-audit.md",
    note: "Photographie detaillee des donnees, doublons, manques et priorites.",
  },
  {
    title: "Modele de donnees Business Plan",
    href: "/docs/business-plan-data-model.md",
    note: "Documentation du referentiel central et des regles de gouvernance de donnees.",
  },
  {
    title: "Master Plan PlanetLS",
    href: "/dashboard/admin/developpement",
    note: "Source de pilotage globale produit, metier et technique.",
  },
  {
    title: "Controle admin",
    href: "/dashboard/admin/controle",
    note: "Lecture operationnelle des tensions et incidents relies au business.",
  },
  {
    title: "Abonnement Concierge Pro",
    href: "/abonnement/concierge-pro",
    note: "Reference de production actuelle pour l'offre payante existante.",
  },
];
