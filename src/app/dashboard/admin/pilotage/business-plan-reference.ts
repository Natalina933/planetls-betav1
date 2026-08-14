import { EXISTING_PRODUCTION_OFFERS, PRICING_PROFILES, PRICING_STRATEGIES } from "./economic-model/data";
import { prioritizedHypotheses } from "./market-validation/validationData";
import { businessRisks } from "./risk-register/riskData";

export type BusinessPlanRecordStatus = "draft" | "to_validate" | "validated" | "outdated";

export type BusinessPlanConfidence = "low" | "medium" | "high";

export type BusinessPlanSourceType =
  | "master_plan"
  | "business_plan"
  | "economic_model"
  | "market_validation"
  | "risk_register"
  | "production_offer"
  | "manual";

export type BusinessPlanSource = {
  type: BusinessPlanSourceType;
  label: string;
  reference?: string;
};

export type BusinessPlanMeta = {
  source: BusinessPlanSource;
  lastUpdatedAt: string;
  confidence: BusinessPlanConfidence;
  status: BusinessPlanRecordStatus;
  comment?: string;
  owner?: string;
};

export type BusinessPlanField<T> = BusinessPlanMeta & {
  value: T;
};

export type BusinessPlanEntity<T> = BusinessPlanMeta & {
  id: string;
  value: T;
};

export type BusinessPlanList<T> = Array<BusinessPlanEntity<T>>;

export type BusinessPlanSectionStatusMap = Record<string, BusinessPlanRecordStatus>;

export type BusinessPlanRepository = {
  sectionStatuses: BusinessPlanSectionStatusMap;
  summary: BusinessPlanField<string[]>;
  vision: BusinessPlanField<string[]>;
  mission: BusinessPlanField<string>;
  marketProblem: BusinessPlanField<string[]>;
  solution: BusinessPlanField<string[]>;
  valueProposition: BusinessPlanList<{ title: string; text: string }>;
  customerSegments: BusinessPlanList<{ title: string; details: string[] }>;
  personas: BusinessPlanList<{ label: string; details: string[] }>;
  customerProblems: BusinessPlanList<{ title: string; details: string[] }>;
  competitors: BusinessPlanList<{
    actor: string;
    category: string;
    pricing: string;
    positioning: string;
    strengths: string;
    limits: string;
    lesson: string;
  }>;
  competitiveAdvantages: BusinessPlanField<string[]>;
  market: {
    overview: BusinessPlanField<string>;
    tam: BusinessPlanField<string>;
    sam: BusinessPlanField<string>;
    som: BusinessPlanField<string>;
  };
  offers: BusinessPlanList<{
    name: string;
    target: string;
    description: string;
    monthlyPrice: string;
    stripePlanCode?: string | null;
  }>;
  subscriptions: BusinessPlanList<{
    name: string;
    price: string;
    target: string;
    note: string;
  }>;
  pricing: {
    benchmarks: BusinessPlanList<{
      actor: string;
      amount: number;
      label: string;
      note: string;
      tone: "planetls" | "direct" | "indirect";
    }>;
    guidance: BusinessPlanList<{
      profile: string;
      properties: string;
      supportLevel: string;
      monthlyPrice: string;
      whoPays: string;
      note: string;
    }>;
    revenueStreams: BusinessPlanField<string[]>;
  };
  businessModelCanvas: BusinessPlanList<{ title: string; items: string[] }>;
  goToMarket: BusinessPlanField<string[]>;
  acquisition: BusinessPlanList<{ title: string; note: string }>;
  roadmap: {
    annual: BusinessPlanList<{
      month: string;
      objective: string;
      metric: string;
      expected: string;
    }>;
    next90Days: BusinessPlanList<{
      phase: string;
      target: string;
      owner: string;
      proof: string;
    }>;
  };
  aiStrategy: BusinessPlanList<{ title: string; text: string }>;
  kpis: BusinessPlanList<{ title: string; description: string }>;
  hypotheses: BusinessPlanList<{ code: string; title: string; priority: string }>;
  risks: BusinessPlanList<{
    title: string;
    category: string;
    mitigation: string;
    owner: string;
    status: string;
  }>;
  swot: BusinessPlanList<{ title: string; items: string[] }>;
  financialForecasts: BusinessPlanList<{
    name: string;
    subscribers: number;
    price: number;
    commissionVolume: number;
    commissionPct: number;
  }>;
  actionPlan: BusinessPlanList<{ title: string; details: string[] }>;
};

export type BusinessModelCanvasHypothesisStatus = "validated" | "to_validate";

export type BusinessModelCanvasHypothesis = {
  label: string;
  status: BusinessModelCanvasHypothesisStatus;
};

export type BusinessModelCanvasLink = {
  id: string;
  label: string;
};

export type BusinessModelCanvasBlock = {
  id: string;
  title: string;
  shortSummary: string;
  details: string[];
  status: BusinessPlanRecordStatus;
  hypotheses: BusinessModelCanvasHypothesis[];
  validationGaps: string[];
  relatedSections: BusinessModelCanvasLink[];
  source: BusinessPlanSource;
  owner?: string;
};

export type BusinessEvidenceKind = "verified_fact" | "estimate" | "hypothesis";

export type BusinessEvidenceItem = {
  id: string;
  label: string;
  value: string;
  kind: BusinessEvidenceKind;
  source: BusinessPlanSource;
  lastUpdatedAt: string;
  confidence: BusinessPlanConfidence;
  note?: string;
};

export type MarketSectionGroup = {
  id: string;
  title: string;
  items: BusinessEvidenceItem[];
};

export type PersonaBusinessProfile = {
  id: string;
  label: string;
  source: BusinessPlanSource;
  lastUpdatedAt: string;
  confidence: BusinessPlanConfidence;
  fields: Array<{
    label: string;
    value: string;
    kind: BusinessEvidenceKind;
    note?: string;
  }>;
};

export type CompetitionMatrixEntry = {
  id: string;
  competitor: string;
  target: string;
  price: string;
  marketplace: string;
  missionManagement: string;
  quotes: string;
  payments: string;
  professionalNetwork: string;
  automation: string;
  ai: string;
  differentiation: string;
  strengths: string;
  weaknesses: string;
  source: BusinessPlanSource;
  lastUpdatedAt: string;
  confidence: BusinessPlanConfidence;
  note?: string;
};

export type PositioningPoint = {
  id: string;
  label: string;
  x: number;
  y: number;
  tone: "planetls" | "direct" | "indirect";
  kind: BusinessEvidenceKind;
  source: BusinessPlanSource;
  lastUpdatedAt: string;
  confidence: BusinessPlanConfidence;
  note: string;
};

function createField<T>(value: T, meta: BusinessPlanMeta): BusinessPlanField<T> {
  return { value, ...meta };
}

function createEntity<T>(id: string, value: T, meta: BusinessPlanMeta): BusinessPlanEntity<T> {
  return { id, value, ...meta };
}

const MASTER_PLAN_SOURCE: BusinessPlanSource = {
  type: "master_plan",
  label: "Master Plan PlanetLS",
  reference: "docs/master-plan-planetls.md",
};

const PILOTAGE_SOURCE: BusinessPlanSource = {
  type: "business_plan",
  label: "Business Plan admin",
  reference: "src/app/dashboard/admin/pilotage/businessPlanData.ts",
};

const ECONOMIC_MODEL_SOURCE: BusinessPlanSource = {
  type: "economic_model",
  label: "Modele economique PlanetLS",
  reference: "src/app/dashboard/admin/pilotage/economic-model/data.ts",
};

const VALIDATION_SOURCE: BusinessPlanSource = {
  type: "market_validation",
  label: "Validation marche PlanetLS",
  reference: "src/app/dashboard/admin/pilotage/market-validation/validationData.ts",
};

const RISK_SOURCE: BusinessPlanSource = {
  type: "risk_register",
  label: "Registre de risques PlanetLS",
  reference: "src/app/dashboard/admin/pilotage/risk-register/riskData.ts",
};

const PRODUCTION_OFFER_SOURCE: BusinessPlanSource = {
  type: "production_offer",
  label: "Offre Stripe existante",
  reference: "src/app/dashboard/admin/pilotage/economic-model/data.ts",
};

const INSEE_SOURCE: BusinessPlanSource = {
  type: "manual",
  label: "Insee",
  reference: "https://www.insee.fr/",
};

const ATOUT_FRANCE_SOURCE: BusinessPlanSource = {
  type: "manual",
  label: "Atout France",
  reference: "https://www.atout-france.fr/",
};

const SERVICE_PUBLIC_SOURCE: BusinessPlanSource = {
  type: "manual",
  label: "Service Public",
  reference: "https://www.service-public.gouv.fr/",
};

const EASY_CONCIERGE_SOURCE: BusinessPlanSource = {
  type: "manual",
  label: "Easy Concierge",
  reference: "https://easy-concierge.fr/tarifs.html",
};

const TURNO_SOURCE: BusinessPlanSource = {
  type: "manual",
  label: "Turno",
  reference: "https://turno.com/tarifs/",
};

const BREEZEWAY_SOURCE: BusinessPlanSource = {
  type: "manual",
  label: "Breezeway",
  reference: "https://www.breezeway.io/breezeway-pricing",
};

const GUESTY_SOURCE: BusinessPlanSource = {
  type: "manual",
  label: "Guesty",
  reference: "https://www.guesty.com/pricing/",
};

const AIRBNB_SOURCE: BusinessPlanSource = {
  type: "manual",
  label: "Airbnb",
  reference: "https://www.airbnb.fr/help/article/3472",
};

export const BUSINESS_PLAN_STATUS_LABELS: Record<BusinessPlanRecordStatus, string> = {
  draft: "A completer",
  to_validate: "A valider",
  validated: "Valide",
  outdated: "A actualiser",
};

export const PLANETLS_BUSINESS_PLAN_REPOSITORY: BusinessPlanRepository = {
  sectionStatuses: {
    summary: "to_validate",
    vision: "validated",
    problem: "to_validate",
    solution: "validated",
    value: "to_validate",
    personas: "outdated",
    marketStudy: "draft",
    competition: "outdated",
    canvas: "draft",
    economicModel: "to_validate",
    pricing: "to_validate",
    goToMarket: "to_validate",
    acquisition: "draft",
    roadmap: "to_validate",
    aiStrategy: "draft",
    saasKpis: "to_validate",
    financialForecasts: "draft",
    swot: "draft",
    risks: "to_validate",
    hypotheses: "to_validate",
    actionPlan: "to_validate",
    appendices: "outdated",
  },
  summary: createField(
    [
      "PlanetLS porte une these hybride reseau vertical + marketplace locale + cockpit operationnel.",
      "La traction produit existe surtout sur le plan fonctionnel ; la validation business reste a consolider.",
      "La cible la plus credible a court terme reste la conciergerie independante ou structuree.",
    ],
    {
      source: MASTER_PLAN_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "medium",
      status: "to_validate",
      comment: "Lecture de synthese utile pour le cockpit, mais encore partiellement editoriale.",
      owner: "Produit",
    },
  ),
  vision: createField(
    [
      "Devenir le reseau professionnel operationnel de reference de la location saisonniere en France.",
      "Combiner reseau vertical, marketplace locale et cockpit metier dans un meme environnement.",
      "Faire converger personnes, entreprises, logements, zones, services, demandes, missions, sejours et preuves.",
    ],
    {
      source: MASTER_PLAN_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "high",
      status: "validated",
      owner: "Direction produit",
    },
  ),
  mission: createField(
    "PlanetLS aide les professionnels de la location saisonniere a se trouver, se faire confiance et travailler ensemble dans un meme environnement.",
    {
      source: MASTER_PLAN_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "high",
      status: "validated",
      owner: "Direction produit",
    },
  ),
  marketProblem: createField(
    [
      "Informations de sejour dispersees entre WhatsApp, appels, feuilles et outils partiels.",
      "Coordination fragile entre proprietaire, conciergerie, equipe terrain et artisans.",
      "Suivi incomplet des changements, preuves, missions, devis, paiements et responsabilites.",
      "Difficulte a vendre une collaboration fiable quand la valeur reste invisible ou peu tracable.",
    ],
    {
      source: VALIDATION_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "medium",
      status: "to_validate",
      comment: "Problemes credibles mais encore a recouper avec davantage de preuves terrain recentes.",
      owner: "Produit / GTM",
    },
  ),
  solution: createField(
    [
      "Reseau vertical specialise pour trouver les bons professionnels locaux.",
      "Marketplace de demandes, devis et missions reliee a l'execution reelle.",
      "Cockpit operationnel partage pour sejours, planning, preuves, finances et suivi.",
    ],
    {
      source: MASTER_PLAN_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "high",
      status: "validated",
      owner: "Produit",
    },
  ),
  valueProposition: [
    createEntity(
      "owners",
      {
        title: "Proprietaires",
        text: "Trouver des professionnels fiables, comparer clairement et garder de la visibilite sans complexite operationnelle.",
      },
      {
        source: MASTER_PLAN_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "Produit",
      },
    ),
    createEntity(
      "concierges",
      {
        title: "Concierges / conciergeries",
        text: "Gagner des mandats, piloter l'exploitation, coordonner equipe et artisans, et rendre la valeur visible au quotidien.",
      },
      {
        source: MASTER_PLAN_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "high",
        status: "validated",
        owner: "Produit",
      },
    ),
    createEntity(
      "providers",
      {
        title: "Prestataires / artisans",
        text: "Recevoir des missions locales qualifiees, prouver son serieux et simplifier devis, intervention et facturation.",
      },
      {
        source: MASTER_PLAN_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "Produit",
      },
    ),
  ],
  customerSegments: [
    createEntity(
      "priority",
      {
        title: "Segment prioritaire actuel",
        details: [
          "Concierges independants et petites conciergeries structurees.",
          "Structures ayant assez de coordination pour ressentir la douleur et accepter un abonnement.",
        ],
      },
      {
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "GTM",
      },
    ),
    createEntity(
      "secondary",
      {
        title: "Segments secondaires utiles",
        details: [
          "Proprietaires travaillant deja avec une concierge.",
          "Prestataires recurrents intervenant sur plusieurs logements.",
          "Structures multi-biens ou multisites a traiter plus tard sur devis.",
        ],
      },
      {
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "outdated",
        owner: "GTM",
      },
    ),
  ],
  personas: PRICING_PROFILES.map((profile) =>
    createEntity(
      profile.id,
      {
        label: profile.label,
        details: [profile.description],
      },
      {
        source: ECONOMIC_MODEL_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: profile.id === "concierges" ? "validated" : "to_validate",
        owner: "Produit",
      },
    ),
  ),
  customerProblems: [
    createEntity(
      "coordination",
      {
        title: "Coordination et execution",
        details: [
          "Les passages entre demande, devis, mission, sejour et paiement restent disperses.",
          "Les preuves d'execution et responsabilites sont difficiles a rendre visibles.",
        ],
      },
      {
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "Produit",
      },
    ),
    createEntity(
      "commercial",
      {
        title: "Montrer la valeur et vendre une offre claire",
        details: [
          "Les petits acteurs ont besoin d'un outil simple, mais la promesse PlanetLS reste encore large.",
          "Le prix et la forme de l'offre doivent etre valides par des tests reels.",
        ],
      },
      {
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "GTM / Pricing",
      },
    ),
  ],
  competitors: [
    createEntity(
      "easy-concierge",
      {
        actor: "Easy Concierge",
        category: "PMS / conciergeries",
        pricing: "A partir de 25 EUR HT / mois",
        positioning: "PMS francais centre sur les conciergeries gerant de 5 a 500+ logements.",
        strengths: "Conformite francaise, portail proprietaire, reservations et facturation.",
        limits: "Peu de logique marketplace ouverte ou de reseau d'artisans.",
        lesson: "PlanetLS peut rester plus reseau, plus multi-profils et plus oriente collaboration locale.",
      },
      {
        source: PILOTAGE_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "low",
        status: "outdated",
        comment: "Benchmark interne utile, mais sans collecte automatisee ni datation externe.",
        owner: "Produit",
      },
    ),
    createEntity(
      "turno",
      {
        actor: "Turno",
        category: "Marketplace menage / operations",
        pricing: "Gratuit dans certains cas, puis abonnement selon usage",
        positioning: "Rotation menage, checklists, photos, paiements et prestataires locaux.",
        strengths: "Parcours ultra clair, terrain, mobile, marketplace deja integree.",
        limits: "Tres fort sur le menage, beaucoup moins large sur la conciergerie complete.",
        lesson: "PlanetLS doit reprendre cette clarte operationnelle sans se limiter au menage.",
      },
      {
        source: PILOTAGE_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "low",
        status: "outdated",
        owner: "Produit",
      },
    ),
    createEntity(
      "breezeway",
      {
        actor: "Breezeway",
        category: "Operations terrain",
        pricing: "Tarification sur devis",
        positioning: "Qualite, maintenance, taches, inspections et coordination d'equipes.",
        strengths: "Controle qualite, maintenance, profondeur operationnelle.",
        limits: "Peu de mise en relation et produit moins accessible aux petits acteurs.",
        lesson: "PlanetLS peut etre plus simple, plus local et plus oriente acquisition de missions.",
      },
      {
        source: PILOTAGE_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "low",
        status: "outdated",
        owner: "Produit",
      },
    ),
    createEntity(
      "guesty",
      {
        actor: "Guesty",
        category: "PMS international",
        pricing: "Offres variables / souvent sur devis",
        positioning: "PMS complet avec automatisation, finance, operations et IA.",
        strengths: "Marque forte, integrations nombreuses, ampleur fonctionnelle.",
        limits: "Complexe, couteux et peu centre sur le reseau local de professionnels.",
        lesson: "PlanetLS ne doit pas copier Guesty, mais traiter ce qu'il couvre moins bien : relations locales et execution.",
      },
      {
        source: PILOTAGE_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "low",
        status: "outdated",
        owner: "Produit",
      },
    ),
    createEntity(
      "airbnb-cohosts",
      {
        actor: "Airbnb co-hotes",
        category: "Reseau de co-hotes",
        pricing: "Tarification libre / variable",
        positioning: "Mise en relation simple entre hotes et co-hotes dans l'ecosysteme Airbnb.",
        strengths: "Confiance, profils evalues, simplicite et puissance de distribution.",
        limits: "Dependance a Airbnb, peu d'artisans, peu de workflows complets multi-plateformes.",
        lesson: "PlanetLS peut offrir un reseau independant, plus large et plus operationnel.",
      },
      {
        source: PILOTAGE_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "low",
        status: "outdated",
        owner: "Produit",
      },
    ),
    createEntity(
      "allovoisins",
      {
        actor: "AlloVoisins & marketplaces locales",
        category: "Services generalistes",
        pricing: "Variables selon mission",
        positioning: "Demandes locales rapides pour menage, bricolage, plomberie, etc.",
        strengths: "Volume, proximite, simplicite de publication d'une demande.",
        limits: "Aucun contexte location saisonniere, peu de suivi, peu de preuves et peu de collaboration durable.",
        lesson: "PlanetLS doit apporter le contexte metier, la tracabilite et la continuite de la prestation.",
      },
      {
        source: PILOTAGE_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "low",
        status: "outdated",
        owner: "Produit",
      },
    ),
  ],
  competitiveAdvantages: createField(
    [
      "Positionnement vertical sur la location saisonniere.",
      "Continuite entre decouverte, demande, mission, preuve et paiement.",
      "Lecture partagee entre proprietaires, conciergeries et intervenants terrain.",
    ],
    {
      source: MASTER_PLAN_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "medium",
      status: "validated",
      owner: "Produit",
    },
  ),
  market: {
    overview: createField("Marche de la location saisonniere et des services associes, a cadrer d'abord sur une zone pilote et un segment payeur restreint.", {
      source: VALIDATION_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "medium",
      status: "to_validate",
      owner: "GTM",
    }),
    tam: createField("Large marche location saisonniere + services associes", {
      source: PILOTAGE_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "low",
      status: "draft",
      comment: "Narration utile, sans chiffrage canonique source dans le depot.",
      owner: "Finance / GTM",
    }),
    sam: createField("Conciergeries et exploitants structures en France", {
      source: PILOTAGE_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "medium",
      status: "to_validate",
      owner: "Finance / GTM",
    }),
    som: createField("Zone pilote + quelques dizaines de comptes actives", {
      source: PILOTAGE_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "medium",
      status: "to_validate",
      owner: "Finance / GTM",
    }),
  },
  offers: EXISTING_PRODUCTION_OFFERS.map((offer) =>
    createEntity(
      offer.id,
      {
        name: offer.name,
        target: offer.targetProfileIds.join(", "),
        description: offer.description,
        monthlyPrice: offer.monthlyPrice === null ? "A definir" : `${offer.monthlyPrice} EUR`,
        stripePlanCode: offer.stripePlanCode,
      },
      {
        source: PRODUCTION_OFFER_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "high",
        status: "validated",
        comment: offer.isLockedProduction
          ? "Offre de production verrouillee, utile comme reference reelle."
          : undefined,
        owner: "Finance / Produit",
      },
    ),
  ),
  subscriptions: [
    createEntity(
      "launch",
      {
        name: "PlanetLS Owner Pro",
        price: "19,90 EUR HT / mois",
        target: "Proprietaire multi-biens structure",
        note: "Premier palier payant defendable pour tester la centralisation et l'automatisation legere.",
      },
      {
        source: ECONOMIC_MODEL_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "Pricing",
      },
    ),
    createEntity(
      "pro",
      {
        name: "PlanetLS Pro",
        price: "49 EUR HT / mois",
        target: "Conciergerie structuree",
        note: "Palier plus defendable si l'usage hebdomadaire devient reel.",
      },
      {
        source: ECONOMIC_MODEL_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "Pricing",
      },
    ),
    createEntity(
      "custom",
      {
        name: "PlanetLS Business",
        price: "149 EUR HT / mois",
        target: "Conciergerie multi-biens ou equipe dense",
        note: "Palier structure a vendre sur la coordination, le reporting et le support prioritaire.",
      },
      {
        source: ECONOMIC_MODEL_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "Pricing",
      },
    ),
  ],
  pricing: {
    benchmarks: [
      createEntity(
        "easy-concierge",
        { actor: "Easy Concierge", amount: 25, label: "25 EUR HT", note: "Entree PMS francaise pour 5 logements", tone: "direct" },
        { source: PILOTAGE_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "outdated", owner: "Pricing" },
      ),
      createEntity(
        "turno",
        { actor: "Turno", amount: 45, label: "Variable", note: "Gratuit dans certains cas, puis abonnement selon usage", tone: "direct" },
        { source: PILOTAGE_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "outdated", owner: "Pricing" },
      ),
      createEntity(
        "breezeway",
        { actor: "Breezeway", amount: 80, label: "Sur devis", note: "Positionnement plus haut de gamme / equipes structurees", tone: "direct" },
        { source: PILOTAGE_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "outdated", owner: "Pricing" },
      ),
      createEntity(
        "guesty",
        { actor: "Guesty", amount: 95, label: "Variable", note: "Plutot concu pour structures plus denses", tone: "indirect" },
        { source: PILOTAGE_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "outdated", owner: "Pricing" },
      ),
      createEntity(
        "planetls-launch",
        { actor: "PlanetLS Owner Pro", amount: 19.9, label: "19,90 EUR HT", note: "Premier palier payant lie a la centralisation de plusieurs logements", tone: "planetls" },
        { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Pricing" },
      ),
      createEntity(
        "planetls-pro",
        { actor: "PlanetLS Concierge Pro", amount: 49, label: "49 EUR HT", note: "Palier cible simple a defendre si l'usage hebdomadaire tient", tone: "planetls" },
        { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Pricing" },
      ),
      createEntity(
        "planetls-custom",
        { actor: "PlanetLS Business", amount: 149, label: "149 EUR HT", note: "Palier structure pour multi-biens, multi-utilisateurs et support prioritaire", tone: "planetls" },
        { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Pricing" },
      ),
    ],
    guidance: [
      createEntity(
        "guidance-solo",
        {
          profile: "Proprietaire multi-biens structure",
          properties: "2 a 5 biens",
          supportLevel: "Standard",
          monthlyPrice: "19,90 EUR HT / mois",
          whoPays: "Le proprietaire",
          note: "Bon point d'entree si le besoin principal est de centraliser et automatiser sans changer d'outil principal.",
        },
        { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Pricing" },
      ),
      createEntity(
        "guidance-structured",
        {
          profile: "Conciergerie structuree",
          properties: "3 a 15 biens",
          supportLevel: "Priorise",
          monthlyPrice: "49 EUR HT / mois",
          whoPays: "La conciergerie",
          note: "Palier defendable quand PlanetLS devient un outil de routine.",
        },
        { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Pricing" },
      ),
      createEntity(
        "guidance-custom",
        {
          profile: "Conciergerie multi-biens ou equipe dense",
          properties: "15 a 40 biens",
          supportLevel: "Prioritaire",
          monthlyPrice: "149 EUR HT / mois",
          whoPays: "La conciergerie ou la structure gestionnaire",
          note: "Palier structure a vendre sur la valeur de coordination, de reporting et de productivite equipe.",
        },
        { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Pricing" },
      ),
    ],
    revenueStreams: createField(
      ["Abonnement mensuel", "Montee en gamme par valeur creee", "Commission en hypothese secondaire seulement"],
      {
        source: ECONOMIC_MODEL_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "Finance",
      },
    ),
  },
  businessModelCanvas: [
    createEntity("segments", { title: "Segments clients", items: ["Conciergeries structurees", "Concierges independants", "Proprietaires relies a une concierge", "Prestataires locaux recurrents"] }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Produit" }),
    createEntity("value", { title: "Proposition de valeur", items: ["Coordination plus claire", "Tracabilite terrain", "Reseau local qualifie", "Execution reliee au commercial"] }, { source: MASTER_PLAN_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Produit" }),
    createEntity("channels", { title: "Canaux", items: ["Prospection directe", "Entretiens terrain", "Landing pages de validation", "Reseau local metier"] }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "GTM" }),
    createEntity("relationships", { title: "Relations clients", items: ["Pilotes accompagnes", "Onboarding fondateur", "Support direct", "Preuves d'usage et retours structures"] }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "GTM" }),
    createEntity("revenue", { title: "Revenus", items: ["Abonnement Owner Pro 19,90 EUR", "Palier Concierge Pro 49 EUR", "Palier Business 149 EUR", "Commission seulement en hypothese secondaire"] }, { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-14", confidence: "medium", status: "to_validate", owner: "Finance" }),
    createEntity("resources", { title: "Ressources clefs", items: ["Produit Next.js / Supabase", "Offre Concierge Pro existante", "Base locale d'acteurs", "Temps de la fondatrice"] }, { source: MASTER_PLAN_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Produit" }),
    createEntity("activities", { title: "Activites clefs", items: ["Validation terrain", "Onboarding pilotes", "Amelioration du cockpit", "Support et arbitrage business"] }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Produit / GTM" }),
    createEntity("partners", { title: "Partenaires clefs", items: ["Stripe", "Conciergeries pilotes", "Prestataires locaux", "Apports reseau locaux"] }, { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Partenariats" }),
    createEntity("costs", { title: "Structure de couts", items: ["Developpement produit", "Support / onboarding", "Acquisition terrain", "Couts IA eventuels a discipliner"] }, { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Finance" }),
  ],
  goToMarket: createField(
    [
      "Cibler une zone pilote et quelques conciergeries suffisamment structurees pour payer.",
      "Vendre d'abord une promesse simple de coordination et d'exploitation.",
      "Mesurer activation, retention et objections avant d'elargir la promesse reseau.",
    ],
    {
      source: VALIDATION_SOURCE,
      lastUpdatedAt: "2026-08-07",
      confidence: "medium",
      status: "to_validate",
      owner: "GTM",
    },
  ),
  acquisition: [
    createEntity("direct", { title: "Prospection directe", note: "Canal le plus credible a court terme pour signer des pilotes qualifies." }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "validated", owner: "GTM" }),
    createEntity("network", { title: "Reseau local et recommandations", note: "Essentiel pour densifier une premiere zone et credibiliser l'offre." }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "validated", owner: "GTM" }),
    createEntity("landing", { title: "Landing pages de validation", note: "Utiles pour tester le message avant d'industrialiser un canal plus large." }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "GTM" }),
    createEntity("partnerships", { title: "Partenariats metier", note: "A explorer plus tard si la promesse et le segment payeur sont confirmes." }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "draft", owner: "GTM" }),
  ],
  roadmap: {
    annual: [
      createEntity("m1-m2", { month: "M1-M2", objective: "Entretiens, discours commercial, qualification de la cible", metric: "Entretiens et objections structurees", expected: "Une proposition de valeur nette et un segment prioritaire assume" }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "GTM" }),
      createEntity("m3-m4", { month: "M3-M4", objective: "Signer des pilotes et mesurer la premiere valeur", metric: "Comptes payants ou pilotes actives", expected: "Premiers comptes recurrents avec usage reel dans la semaine" }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "GTM" }),
      createEntity("m5-m6", { month: "M5-M6", objective: "Prouver retention, routine d'usage et profondeur operationnelle", metric: "Usage hebdomadaire, missions suivies, churn pilote", expected: "Signaux credibles de reachat ou maintien sur abonnement" }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Produit / GTM" }),
      createEntity("m7-m9", { month: "M7-M9", objective: "Standardiser onboarding, support et cas d'usage dominants", metric: "Temps d'onboarding et marge de service", expected: "Une vente plus simple et un cout d'accompagnement mieux tenu" }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Operations" }),
      createEntity("m10-m12", { month: "M10-M12", objective: "Etendre selectivement et arbitrer le poids du sur devis ou d'une commission", metric: "MRR, activation multi-zones, comptes sur devis et volume mission intermedie", expected: "Decision claire entre gamme simple et surcouche transactionnelle" }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Finance / GTM" }),
    ],
    next90Days: [
      createEntity("d1-30", { phase: "Jours 1-30", target: "Qualifier les objections prix et clarifier la promesse d'entree Free / Owner Pro.", owner: "Fondatrice / produit", proof: "Entretiens notes, objections regroupees, wording stabilise" }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-14", confidence: "medium", status: "to_validate", owner: "Fondatrice / Produit" }),
      createEntity("d31-60", { phase: "Jours 31-60", target: "Signer quelques pilotes actifs sur l'offre la plus comprehensible.", owner: "Fondatrice / vente", proof: "Comptes actives, premieres routines visibles, premiers retours de paiement" }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Fondatrice / Vente" }),
      createEntity("d61-90", { phase: "Jours 61-90", target: "Verifier si 49 EUR puis 149 EUR deviennent des paliers naturels et defendables.", owner: "Fondatrice / finance", proof: "Retours tarifaires consolides, usage hebdomadaire, premiers signaux de retention" }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-14", confidence: "medium", status: "to_validate", owner: "Fondatrice / Finance" }),
    ],
  },
  aiStrategy: [
    createEntity("position", { title: "Position actuelle", text: "L'IA doit rester une surcouche disciplinee au service de l'execution, pas le moteur principal de la promesse business." }, { source: MASTER_PLAN_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "validated", owner: "Produit / IA" }),
    createEntity("existing", { title: "Briques existantes", text: "Centre IA, bibliotheque de prompts et composants de pilotage existent deja dans le projet, mais sans preuve business directe encore etablie." }, { source: MASTER_PLAN_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "draft", owner: "Produit / IA" }),
    createEntity("governance", { title: "Regle de pilotage", text: "Conserver supervision humaine, mesure d'usage reel et cadrage des couts avant toute extension plus large." }, { source: RISK_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "validated", owner: "Produit / IA" }),
  ],
  kpis: [
    createEntity("activation", { title: "Activation J+7", description: "Disponible via /api/kpis/overview, a relier explicitement aux cohortes business." }, { source: MASTER_PLAN_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "validated", owner: "Data / Produit" }),
    createEntity("time-to-value", { title: "Temps de premiere valeur", description: "Mesure attendue pour juger l'onboarding et la vitesse de mise au travail." }, { source: MASTER_PLAN_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Data / Produit" }),
    createEntity("conversion", { title: "Conversion vers offre payante", description: "Encore incomplete ; doit distinguer curiosite, pilote, abonnement et retention." }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Finance / GTM" }),
    createEntity("churn", { title: "Churn et retention", description: "Hypothese critique encore peu outillee sur des cohortes payantes reelles." }, { source: RISK_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "draft", owner: "Finance / Data" }),
    createEntity("cac-ltv", { title: "CAC / LTV", description: "Absence de verite economique observee a ce stade ; mesure prioritaire avant scale." }, { source: RISK_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "draft", owner: "Finance / Data" }),
  ],
  hypotheses: prioritizedHypotheses.map((hypothesis) =>
    createEntity(
      hypothesis.id,
      {
        code: hypothesis.code,
        title: hypothesis.title,
        priority: hypothesis.priority,
      },
      {
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        status: "to_validate",
        owner: "Produit / GTM",
      },
    ),
  ),
  risks: businessRisks.map((risk) =>
    createEntity(
      risk.id,
      {
        title: risk.title,
        category: risk.category,
        mitigation: risk.mitigation,
        owner: risk.owner,
        status: risk.status,
      },
      {
        source: RISK_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "high",
        status: risk.status === "identifie" ? "to_validate" : "draft",
        owner: risk.owner,
      },
    ),
  ),
  swot: [
    createEntity("strengths", { title: "Forces", items: ["Produit deja riche fonctionnellement.", "Positionnement vertical et differenciation reseau + execution.", "Offre Stripe reelle deja visible pour les conciergeries."] }, { source: MASTER_PLAN_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "Produit" }),
    createEntity("weaknesses", { title: "Faiblesses", items: ["Business plan tres editorial et disperse.", "Modele economique encore non valide sur donnees reelles.", "Dependance forte a la fondatrice pour vente, support et arbitrage."] }, { source: RISK_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "to_validate", owner: "Produit / Finance" }),
    createEntity("opportunities", { title: "Opportunites", items: ["Besoin reel de coordination locale plus tracable.", "Cible solvable des petites conciergeries structurees.", "Capacite a relier acquisition, operations et reseau local dans une meme offre."] }, { source: VALIDATION_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "medium", status: "to_validate", owner: "GTM" }),
    createEntity("threats", { title: "Menaces", items: ["Positionnement trop large entre SaaS, marketplace et reseau.", "Liquidite locale insuffisante hors zone pilote.", "Desintermediation et retour hors plateforme apres premier match."] }, { source: RISK_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "to_validate", owner: "Direction" }),
  ],
  financialForecasts: [
    createEntity("pilot", { name: "Pilote local", subscribers: 15, price: 29, commissionVolume: 12000, commissionPct: 0 }, { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "draft", comment: "Scenario de simulation, non modele financier canonique.", owner: "Finance" }),
    createEntity("regional", { name: "Traction regionale", subscribers: 35, price: 49, commissionVolume: 22000, commissionPct: 0 }, { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "low", status: "draft", comment: "Scenario de simulation, non modele financier canonique.", owner: "Finance" }),
    createEntity("custom", { name: "Business", subscribers: 12, price: 149, commissionVolume: 40000, commissionPct: 8 }, { source: ECONOMIC_MODEL_SOURCE, lastUpdatedAt: "2026-08-14", confidence: "low", status: "draft", comment: "Scenario de simulation, non modele financier canonique.", owner: "Finance" }),
  ],
  actionPlan: [
    createEntity("focus-offer", { title: "Focaliser l'offre testee", details: ["Geler une offre principale pendant 60 jours.", "Mesurer activation, conversion et retention sur cette seule base."] }, { source: RISK_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "to_validate", owner: "Pricing / GTM" }),
    createEntity("zone-pilot", { title: "Concentrer la densite locale", details: ["Choisir une zone pilote explicite.", "Eviter la dispersion nationale avant preuve de liquidite."] }, { source: RISK_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "validated", owner: "GTM / Operations" }),
    createEntity("instrumentation", { title: "Rendre les chiffres defendables", details: ["Relier les KPI de produit aux offres testees.", "Mesurer churn, CAC, LTV et cout d'onboarding sur cohortes reelles."] }, { source: RISK_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "to_validate", owner: "Finance / Data" }),
    createEntity("cleanup", { title: "Eviter la dispersion documentaire", details: ["Faire deriver les composants UI depuis le referentiel central.", "Documenter partout le statut reel de chaque donnee strategique."] }, { source: PILOTAGE_SOURCE, lastUpdatedAt: "2026-08-07", confidence: "high", status: "validated", owner: "Produit / Tech" }),
  ],
};

export const BUSINESS_PLAN_PRICING_STRATEGY_SUMMARY = PRICING_STRATEGIES.map((strategy) => ({
  id: strategy.id,
  name: strategy.name,
  status: strategy.status,
  type: strategy.type,
  source: ECONOMIC_MODEL_SOURCE,
  lastUpdatedAt: "2026-08-07",
}));

export const BUSINESS_EVIDENCE_LABELS: Record<BusinessEvidenceKind, string> = {
  verified_fact: "Fait verifie",
  estimate: "Estimation",
  hypothesis: "Hypothese",
};

export const PLANETLS_MARKET_GROUPS: MarketSectionGroup[] = [
  {
    id: "definition-segments",
    title: "Definition du marche et segments",
    items: [
      {
        id: "market-definition",
        label: "Definition du marche",
        value:
          "PlanetLS se positionne sur la coordination professionnelle de la location saisonniere : relation entre proprietaires, conciergeries, prestataires et execution terrain.",
        kind: "estimate",
        source: MASTER_PLAN_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        note: "Definition produit interne, utile pour cadrer le marche servi, pas une taxonomie officielle.",
      },
      {
        id: "tourism-definition",
        label: "Definition reglementaire du meuble de tourisme",
        value:
          "Un meuble de tourisme est un logement meuble loue a une clientele de passage pour un sejour a la journee, a la semaine ou au mois.",
        kind: "verified_fact",
        source: SERVICE_PUBLIC_SOURCE,
        lastUpdatedAt: "2025-01-20",
        confidence: "high",
        note: "Reprise du rappel de l'article L.324-1-1 du Code du tourisme cite par Service Public.",
      },
      {
        id: "priority-segment",
        label: "Segment prioritaire actuel",
        value: "Concierges independants et petites conciergeries structurees.",
        kind: "hypothesis",
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        note: "Priorite interne issue de la validation marche, encore a confirmer sur prospects reels.",
      },
      {
        id: "secondary-segments",
        label: "Segments secondaires",
        value:
          "Proprietaires deja relies a une concierge, prestataires recurrents, structures multi-biens plus denses.",
        kind: "hypothesis",
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        note: "Segments utiles mais non encore traites comme noyau payeur principal.",
      },
    ],
  },
  {
    id: "trends-size",
    title: "Tendances, taille de marche et perimetres TAM / SAM / SOM",
    items: [
      {
        id: "intl-arrivals",
        label: "Tendance touristique France",
        value: "102 millions d'arrivees internationales en France en 2025, soit +3 % vs 2024.",
        kind: "verified_fact",
        source: ATOUT_FRANCE_SOURCE,
        lastUpdatedAt: "2026-06-03",
        confidence: "high",
      },
      {
        id: "merchant-nights",
        label: "Nuitees en locations, gites et chambres d'hotes",
        value: "176,9 millions de nuitees pour motif personnel en 2025.",
        kind: "verified_fact",
        source: INSEE_SOURCE,
        lastUpdatedAt: "2026-07-23",
        confidence: "high",
        note: "Indicateur utile pour lire la profondeur du marche locatif touristique cote demande.",
      },
      {
        id: "tourism-consumption",
        label: "Taille macro du tourisme en France",
        value: "222 milliards d'euros de consommation touristique interieure en 2025.",
        kind: "verified_fact",
        source: ATOUT_FRANCE_SOURCE,
        lastUpdatedAt: "2026-06-03",
        confidence: "high",
        note: "Ceci decrit le secteur tourisme au sens large, pas le marche directement adressable par PlanetLS.",
      },
      {
        id: "tourism-receipts",
        label: "Recettes touristiques internationales",
        value: "77,5 milliards d'euros en 2025, soit +9 %.",
        kind: "verified_fact",
        source: ATOUT_FRANCE_SOURCE,
        lastUpdatedAt: "2026-06-03",
        confidence: "high",
      },
      {
        id: "tam",
        label: "TAM",
        value:
          "Borne haute a estimer : economie francaise du tourisme et de l'hebergement, trop large pour servir de marche directement adressable PlanetLS.",
        kind: "estimate",
        source: ATOUT_FRANCE_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "low",
        note: "Upper bound conceptuel fonde sur les chiffres macro tourisme ; a ne pas presenter comme marche adressable direct.",
      },
      {
        id: "sam",
        label: "SAM",
        value:
          "A definir quantitativement. Perimetre de travail : conciergeries et exploitants structures de location saisonniere en France.",
        kind: "hypothesis",
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        note: "Perimetre cible credible, mais sans chiffrage canonique sourcé dans le depot.",
      },
      {
        id: "som",
        label: "SOM",
        value: "Zone pilote + quelques dizaines de comptes actives a 12 mois.",
        kind: "hypothesis",
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
        note: "Objectif d'attaque realiste, pas une taille de marche observee.",
      },
    ],
  },
  {
    id: "drivers-frictions",
    title: "Facteurs de croissance, freins et opportunites",
    items: [
      {
        id: "growth-smoothing",
        label: "Facteur de croissance",
        value:
          "Les flux touristiques se repartissent davantage sur l'annee et les ailes de saison se consolident.",
        kind: "verified_fact",
        source: ATOUT_FRANCE_SOURCE,
        lastUpdatedAt: "2026-06-03",
        confidence: "high",
      },
      {
        id: "growth-value-up",
        label: "Facteur de croissance",
        value: "Le tourisme francais monte en valeur avec une hausse de la depense internationale moyenne.",
        kind: "verified_fact",
        source: ATOUT_FRANCE_SOURCE,
        lastUpdatedAt: "2026-06-03",
        confidence: "high",
      },
      {
        id: "driver-compliance",
        label: "Facteur de croissance",
        value:
          "La complexite operationnelle et reglementaire des meubles de tourisme renforce le besoin d'outils de coordination, de preuve et de suivi.",
        kind: "estimate",
        source: SERVICE_PUBLIC_SOURCE,
        lastUpdatedAt: "2025-01-20",
        confidence: "medium",
        note: "Inference produit a partir du durcissement des regles et du besoin de pilotage local.",
      },
      {
        id: "friction-liquidity",
        label: "Frein",
        value: "Liquidite locale insuffisante si une zone ne concentre pas assez de conciergeries, prestataires et missions.",
        kind: "hypothesis",
        source: RISK_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "high",
      },
      {
        id: "friction-broad-positioning",
        label: "Frein",
        value: "Positionnement trop large entre SaaS, marketplace et reseau, donc comprehension et vente plus difficiles.",
        kind: "hypothesis",
        source: RISK_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "high",
      },
      {
        id: "opportunity-regulated-ops",
        label: "Opportunite",
        value:
          "Positionner PlanetLS comme couche de coordination, de tracabilite et de conformite autour d'un reseau local specialise.",
        kind: "estimate",
        source: MASTER_PLAN_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
      },
      {
        id: "opportunity-concierges",
        label: "Opportunite",
        value:
          "Cible solvable la plus defendable a court terme : petites conciergeries structurees qui ressentent deja la douleur operationnelle.",
        kind: "hypothesis",
        source: VALIDATION_SOURCE,
        lastUpdatedAt: "2026-08-07",
        confidence: "medium",
      },
    ],
  },
  {
    id: "regulation",
    title: "Reglementation pertinente",
    items: [
      {
        id: "reg-declaration",
        label: "Declaration obligatoire",
        value:
          "Au plus tard le 20 mai 2026, toutes les locations de meubles touristiques devront faire l'objet d'une declaration via un teleservice national dedie.",
        kind: "verified_fact",
        source: SERVICE_PUBLIC_SOURCE,
        lastUpdatedAt: "2025-01-20",
        confidence: "high",
      },
      {
        id: "reg-fiscal",
        label: "Fiscalite 2025",
        value:
          "Abattement de 50 % pour les biens classes et chambres d'hotes, 30 % pour les biens non classes, applique aux revenus perçus a partir du 1er janvier 2025.",
        kind: "verified_fact",
        source: SERVICE_PUBLIC_SOURCE,
        lastUpdatedAt: "2025-01-20",
        confidence: "high",
      },
      {
        id: "reg-dpe",
        label: "DPE",
        value:
          "Les nouveaux meubles de tourisme soumis a changement d'usage doivent respecter les exigences DPE ; les logements classes G ne sont plus autorises depuis le 1er janvier 2025.",
        kind: "verified_fact",
        source: SERVICE_PUBLIC_SOURCE,
        lastUpdatedAt: "2025-01-20",
        confidence: "high",
      },
      {
        id: "reg-mayors",
        label: "Pouvoirs des maires",
        value:
          "Les communes peuvent fixer des quotas, limiter la location de residence principale a 90 jours et sanctionner le defaut ou la fausse declaration.",
        kind: "verified_fact",
        source: SERVICE_PUBLIC_SOURCE,
        lastUpdatedAt: "2025-01-20",
        confidence: "high",
      },
    ],
  },
];

export const PLANETLS_PERSONA_BUSINESS_PROFILES: PersonaBusinessProfile[] = [
  {
    id: "owner",
    label: "Proprietaire",
    source: MASTER_PLAN_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    fields: [
      {
        label: "Probleme",
        value:
          "Trouver des professionnels fiables et garder de la visibilite sur les interventions sans multiplier les outils.",
        kind: "estimate",
      },
      {
        label: "Besoins",
        value: "Confiance, comparaison claire, suivi des missions, documents et paiements.",
        kind: "estimate",
      },
      {
        label: "Frequence d'utilisation potentielle",
        value: "Ponctuelle a reguliere selon le degre de delegation.",
        kind: "hypothesis",
        note: "Usage probable plus faible que pour une conciergerie tant que le proprietaire n'opere pas au quotidien.",
      },
      {
        label: "Disposition a payer",
        value: "Hypothese a valider.",
        kind: "hypothesis",
        note: "Le projet cible d'abord la conciergerie comme payeur naturel.",
      },
      {
        label: "Fonctionnalites importantes",
        value: "Visibilite, preuves, comparaison, coordination avec la conciergerie, factures.",
        kind: "estimate",
      },
      {
        label: "Objections",
        value: "Je passe deja par ma concierge / je ne veux pas un outil de plus.",
        kind: "hypothesis",
      },
      {
        label: "Declencheurs d'achat",
        value: "Manque de confiance, incidents recurrentes, perte de visibilite, besoin de centraliser les preuves.",
        kind: "hypothesis",
      },
    ],
  },
  {
    id: "independent-concierge",
    label: "Concierge independant",
    source: VALIDATION_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    fields: [
      {
        label: "Probleme",
        value: "Coordonner sejours, missions, prestataires, voyageurs et proprietaires avec des outils disperses.",
        kind: "estimate",
      },
      {
        label: "Besoins",
        value: "Planning, demandes, missions, preuves, messagerie, suivi proprietaire, offre simple.",
        kind: "estimate",
      },
      {
        label: "Frequence d'utilisation potentielle",
        value: "Quotidienne en periode d'exploitation.",
        kind: "hypothesis",
      },
      {
        label: "Disposition a payer",
        value: "La plus probable parmi les profils etudies, mais encore a valider sur offre gelee.",
        kind: "hypothesis",
      },
      {
        label: "Fonctionnalites importantes",
        value: "Missions, planning, coordination locale, preuves, relation proprietaire, routines hebdomadaires.",
        kind: "estimate",
      },
      {
        label: "Objections",
        value: "Offre trop large, onboarding chronophage, doute sur la valeur vs outils actuels.",
        kind: "hypothesis",
      },
      {
        label: "Declencheurs d'achat",
        value: "Croissance du parc, multiplication des oublis, besoin de rendre la valeur visible aux proprietaires.",
        kind: "hypothesis",
      },
    ],
  },
  {
    id: "conciergerie",
    label: "Conciergerie",
    source: VALIDATION_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    fields: [
      {
        label: "Probleme",
        value: "Piloter plusieurs biens, equipes et prestataires sans perte de marge ni d'information.",
        kind: "estimate",
      },
      {
        label: "Besoins",
        value: "Cockpit d'exploitation, collaboration equipe, reporting, suivi missions, support operations.",
        kind: "estimate",
      },
      {
        label: "Frequence d'utilisation potentielle",
        value: "Quotidienne et multi-utilisateur.",
        kind: "hypothesis",
      },
      {
        label: "Disposition a payer",
        value: "Plus defendable quand l'usage hebdomadaire est prouve et la valeur visible sur plusieurs biens.",
        kind: "hypothesis",
      },
      {
        label: "Fonctionnalites importantes",
        value: "Gestion missions, planning, finance, suivi proprietaire, prestataires, traçabilite.",
        kind: "estimate",
      },
      {
        label: "Objections",
        value: "Migration depuis PMS existant, cout du changement, besoin d'integrations.",
        kind: "hypothesis",
      },
      {
        label: "Declencheurs d'achat",
        value: "Portefeuille qui grossit, besoin de standardiser l'equipe et de structurer la coordination terrain.",
        kind: "hypothesis",
      },
    ],
  },
  {
    id: "provider",
    label: "Artisan / prestataire",
    source: MASTER_PLAN_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    fields: [
      {
        label: "Probleme",
        value: "Recevoir des demandes non qualifiees, prouver son serieux et suivre interventions / paiements.",
        kind: "estimate",
      },
      {
        label: "Besoins",
        value: "Missions locales qualifiees, preuves, disponibilites, devis, facturation, reputation.",
        kind: "estimate",
      },
      {
        label: "Frequence d'utilisation potentielle",
        value: "Reguliere si les missions locales sont recurrentes ; sinon opportuniste.",
        kind: "hypothesis",
      },
      {
        label: "Disposition a payer",
        value: "A definir.",
        kind: "hypothesis",
        note: "Le projet ne prouve pas encore un modele payeur principal cote prestataire.",
      },
      {
        label: "Fonctionnalites importantes",
        value: "Reception de missions, preuves, suivi des interventions, messagerie, facturation.",
        kind: "estimate",
      },
      {
        label: "Objections",
        value: "Je prefere mes relations directes / je ne veux pas dependre d'une plateforme de plus.",
        kind: "hypothesis",
      },
      {
        label: "Declencheurs d'achat",
        value: "Besoin de missions recurrentes, simplification administrative, volonte de prouver la qualite.",
        kind: "hypothesis",
      },
    ],
  },
];

export const PLANETLS_COMPETITION_MATRIX: CompetitionMatrixEntry[] = [
  {
    id: "easy-concierge",
    competitor: "Easy Concierge",
    target: "Conciergeries PMS / gestionnaires",
    price: "25 / 40 / 90 EUR HT / mois",
    marketplace: "Non visible sur la source revue",
    missionManagement: "Visible",
    quotes: "Partiel / non visible comme workflow central",
    payments: "Visible",
    professionalNetwork: "Partiel",
    automation: "Visible",
    ai: "Visible",
    differentiation: "PMS francais avec conformite, operations et paiements.",
    strengths: "Tarification publique, automatisations, paiements, tchat equipe/prestataires/proprietaires.",
    weaknesses: "Moins oriente reseau professionnel ouvert ou marketplace locale.",
    source: EASY_CONCIERGE_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "high",
    note: "Lecture fondee sur la page tarifs publique revue le 7 aout 2026.",
  },
  {
    id: "turno",
    competitor: "Turno",
    target: "Hosts, property managers, cleaners",
    price: "0 USD ou 10 USD / property / month selon configuration",
    marketplace: "Visible",
    missionManagement: "Visible",
    quotes: "Non visible sur la source revue",
    payments: "Visible",
    professionalNetwork: "Visible",
    automation: "Visible",
    ai: "Non visible sur la source revue",
    differentiation: "Marketplace cleaners + scheduling + payments tres specialise nettoyage/turnover.",
    strengths: "55K+ cleaners, marketplace, paiements automatiques, checklists, maintenance.",
    weaknesses: "Tres centre turnover / cleaning, moins large sur relation proprietaire et cockpit multi-acteurs.",
    source: TURNO_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "high",
  },
  {
    id: "breezeway",
    competitor: "Breezeway",
    target: "Hosts and managers, especially multi-unit operators",
    price: "Freemium premier bien, puis a partir de 19.99 USD / unit / month ou devis",
    marketplace: "Non visible sur la source revue",
    missionManagement: "Visible",
    quotes: "Non visible sur la source revue",
    payments: "Visible",
    professionalNetwork: "Non visible sur la source revue",
    automation: "Visible",
    ai: "Visible",
    differentiation: "Operations, maintenance, inspections et guest experience AI-powered.",
    strengths: "Operations profondes, work orders, dashboards, owner reporting, IA guest messaging.",
    weaknesses: "Peu de signal reseau professionnel local ou mise en relation ouverte.",
    source: BREEZEWAY_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "high",
  },
  {
    id: "guesty",
    competitor: "Guesty",
    target: "De 1 listing a 200+ listings",
    price: "A partir de 9 USD / month / listing puis devis selon plan",
    marketplace: "Partiel",
    missionManagement: "Visible",
    quotes: "Partiel",
    payments: "Visible",
    professionalNetwork: "Non visible sur la source revue",
    automation: "Visible",
    ai: "Visible",
    differentiation: "PMS tout-en-un avec forte profondeur produit et nombreux add-ons.",
    strengths: "Owners portal, paiements, CRM, task management, automatisations, nombreuses briques IA.",
    weaknesses: "Complexe, plutot oriente gestionnaire structure que reseau local multi-acteurs.",
    source: GUESTY_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "high",
  },
  {
    id: "airbnb-cohost-network",
    competitor: "Airbnb Reseau de co-hotes",
    target: "Hotes Airbnb cherchant un co-hote local",
    price: "Prix non publicise par Airbnb ; relation directe entre hote et co-hote",
    marketplace: "Visible",
    missionManagement: "Partiel",
    quotes: "Non visible sur la source revue",
    payments: "Non visible sur la source revue",
    professionalNetwork: "Visible",
    automation: "Partiel",
    ai: "Non visible sur la source revue",
    differentiation: "Acces a un reseau qualifie de co-hotes locaux dans l'univers Airbnb.",
    strengths: "Expertise locale, proximite, controle conserve par l'hote, reseau disponible en France.",
    weaknesses:
      "Airbnb ne se presente pas comme intermediaire ou courtier ; peu de preuves d'un cockpit complet multi-prestataires ou multi-plateformes.",
    source: AIRBNB_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "high",
  },
  {
    id: "planetls",
    competitor: "PlanetLS",
    target: "Conciergeries, concierges, proprietaires, prestataires",
    price: "29 EUR HT / mois reelle pour Concierge Pro ; 19,90 EUR / 49 EUR / 149 EUR = gamme de travail admin",
    marketplace: "Visible",
    missionManagement: "Visible",
    quotes: "Visible",
    payments: "Visible",
    professionalNetwork: "Visible",
    automation: "Partiel",
    ai: "Partiel",
    differentiation: "Reseau professionnel vertical + marketplace locale + cockpit operationnel partage.",
    strengths: "Continuite reseau -> demande -> devis -> mission -> preuve -> paiement.",
    weaknesses: "Positionnement large et validation business encore incomplete.",
    source: MASTER_PLAN_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    note: "Lecture interne du produit actuel, pas benchmark externe.",
  },
];

export const PLANETLS_POSITIONING_MAP: PositioningPoint[] = [
  {
    id: "easy-concierge",
    label: "Easy Concierge",
    x: 38,
    y: 72,
    tone: "direct",
    kind: "estimate",
    source: EASY_CONCIERGE_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    note: "Position estimee : bonne profondeur operationnelle, faible reseau professionnel ouvert.",
  },
  {
    id: "turno",
    label: "Turno",
    x: 68,
    y: 64,
    tone: "direct",
    kind: "estimate",
    source: TURNO_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    note: "Position estimee : forte marketplace services, profondeur operationnelle centree turnover.",
  },
  {
    id: "breezeway",
    label: "Breezeway",
    x: 30,
    y: 88,
    tone: "direct",
    kind: "estimate",
    source: BREEZEWAY_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    note: "Position estimee : operations tres profondes, peu de reseau professionnel visible.",
  },
  {
    id: "guesty",
    label: "Guesty",
    x: 26,
    y: 82,
    tone: "indirect",
    kind: "estimate",
    source: GUESTY_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    note: "Position estimee : PMS complet, faible dimension reseau professionnel local.",
  },
  {
    id: "airbnb",
    label: "Airbnb co-hotes",
    x: 82,
    y: 34,
    tone: "indirect",
    kind: "estimate",
    source: AIRBNB_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    note: "Position estimee : reseau fort, execution operationnelle limitee au cadre Airbnb et moins outillee.",
  },
  {
    id: "planetls",
    label: "PlanetLS",
    x: 74,
    y: 78,
    tone: "planetls",
    kind: "hypothesis",
    source: MASTER_PLAN_SOURCE,
    lastUpdatedAt: "2026-08-07",
    confidence: "medium",
    note: "Positionnement cible estime : reseau professionnel dense + execution partagee profonde.",
  },
];

export const PLANETLS_BUSINESS_MODEL_CANVAS: BusinessModelCanvasBlock[] = [
  {
    id: "customer-segments",
    title: "Segments clients",
    shortSummary: "Priorite actuelle : concierges independants et petites conciergeries structurees.",
    details: [
      "Segment prioritaire actuel : concierges independants et petites conciergeries structurees.",
      "Segments secondaires utiles : proprietaires deja relies a une concierge, prestataires recurrents, structures multi-biens plus tard.",
      "Personas deja presents dans le projet : proprietaires, concierges, artisans/prestataires, partenaires.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.personas,
    hypotheses: [
      {
        label: "Les concierges independants ou petites conciergeries sont le meilleur premier segment payeur.",
        status: "to_validate",
      },
      {
        label: "Une approche multi-profils immediate serait moins efficace qu'un focus initial conciergeries.",
        status: "to_validate",
      },
    ],
    validationGaps: [
      "Confirmer le segment payeur dominant sur prospects reels.",
      "Mesurer si les segments secondaires meritent une offre distincte ou simplement une phase ulterieure.",
    ],
    relatedSections: [
      { id: "personas", label: "Personas / segments clients" },
      { id: "marketStudy", label: "Etude de marche" },
      { id: "goToMarket", label: "Go-To-Market" },
    ],
    source: VALIDATION_SOURCE,
    owner: "GTM",
  },
  {
    id: "value-proposition",
    title: "Proposition de valeur",
    shortSummary: "Coordination plus claire, tracabilite terrain et reseau local qualifie.",
    details: [
      "Proprietaires : trouver des professionnels fiables et garder de la visibilite.",
      "Concierges : gagner des mandats, piloter l'exploitation et rendre la valeur visible.",
      "Prestataires : recevoir des missions qualifiees et simplifier devis, intervention et facturation.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.value,
    hypotheses: [
      {
        label: "La promesse de centralisation entre proprietaires, concierges et prestataires suscite un interet mesurable.",
        status: "to_validate",
      },
      {
        label: "Un parcours simple centre sur un usage essentiel vaut plus qu'une plateforme tres large au demarrage.",
        status: "to_validate",
      },
    ],
    validationGaps: [
      "Mesurer quelle promesse convertit le mieux en entretien ou en pilote.",
      "Valider quelle composante est vraiment indispensable a la premiere valeur.",
    ],
    relatedSections: [
      { id: "value", label: "Proposition de valeur" },
      { id: "problem", label: "Probleme marche" },
      { id: "solution", label: "Solution PlanetLS" },
    ],
    source: MASTER_PLAN_SOURCE,
    owner: "Produit",
  },
  {
    id: "channels",
    title: "Canaux",
    shortSummary: "Prospection directe, reseau local, recommandations et landing pages de validation.",
    details: [
      "Prospection directe : canal le plus credible pour signer les premiers pilotes qualifies.",
      "Reseau local et recommandations : essentiel pour densifier une premiere zone.",
      "Landing pages de validation : utiles pour tester le message avant industrialisation.",
      "Partenariats metier : piste encore a definir apres validation du noyau de valeur.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.acquisition,
    hypotheses: [
      {
        label: "Une approche locale est plus realiste qu'un lancement marketplace national immediat.",
        status: "to_validate",
      },
      {
        label: "Les landing pages aideront a qualifier le message avant le scale commercial.",
        status: "to_validate",
      },
    ],
    validationGaps: [
      "Identifier le canal qui genere les prospects les plus actives, pas seulement de la curiosite.",
      "Verifier si les partenariats metier meritent d'etre actives avant la fin des pilotes.",
    ],
    relatedSections: [
      { id: "acquisition", label: "Acquisition" },
      { id: "goToMarket", label: "Go-To-Market" },
      { id: "roadmap", label: "Roadmap produit" },
    ],
    source: VALIDATION_SOURCE,
    owner: "GTM",
  },
  {
    id: "customer-relationships",
    title: "Relations clients",
    shortSummary: "Pilotes accompagnes, onboarding fondateur, support direct et preuves d'usage.",
    details: [
      "Pilotes accompagnes avec suivi rapproché des frictions.",
      "Onboarding fondateur et support direct pour obtenir des signaux qualifiants.",
      "Relation basee sur la preuve d'usage, pas seulement sur un discours commercial.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.goToMarket,
    hypotheses: [
      {
        label: "Un accompagnement humain fort est necessaire au lancement pour activer correctement les comptes.",
        status: "validated",
      },
      {
        label: "Le support direct peut ensuite etre standardise sans perdre la valeur percue.",
        status: "to_validate",
      },
    ],
    validationGaps: [
      "Mesurer le cout d'onboarding et d'accompagnement par compte.",
      "Identifier quelles parties de la relation peuvent etre standardisees sans casser l'activation.",
    ],
    relatedSections: [
      { id: "goToMarket", label: "Go-To-Market" },
      { id: "actionPlan", label: "Plan d'action" },
      { id: "risks", label: "Risques" },
    ],
    source: VALIDATION_SOURCE,
    owner: "Operations / GTM",
  },
  {
    id: "revenue-streams",
    title: "Sources de revenus",
    shortSummary: "Abonnement mensuel d'abord, montee en gamme par valeur ensuite, commission seulement en hypothese secondaire.",
    details: [
      "Offre reelle existante : Conciergerie Pro avec abonnement Stripe deja branche.",
      "Gamme de travail actuelle : Free / Owner Pro 19,90 EUR / Concierge Pro 49 EUR / Business 149 EUR.",
      "Commission : conservee comme hypothese secondaire, non comme moteur principal valide.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.pricing,
    hypotheses: [
      {
        label: "Les conciergeries paieront un abonnement si PlanetLS simplifie reellement l'exploitation quotidienne.",
        status: "to_validate",
      },
      {
        label: "Un abonnement SaaS est plus simple a lancer qu'une logique de commission comme moteur principal.",
        status: "to_validate",
      },
      {
        label: "L'offre reelle Concierge Pro prouve qu'une base de monétisation existe deja techniquement.",
        status: "validated",
      },
    ],
    validationGaps: [
      "Mesurer conversion, retention et objections prix sur une offre gelee.",
      "Confirmer si le sur devis est percu comme juste ou seulement tolere.",
    ],
    relatedSections: [
      { id: "economicModel", label: "Modele economique" },
      { id: "pricing", label: "Tarification et abonnements" },
      { id: "financialForecasts", label: "Previsions financieres" },
    ],
    source: ECONOMIC_MODEL_SOURCE,
    owner: "Finance / Pricing",
  },
  {
    id: "key-resources",
    title: "Ressources cles",
    shortSummary: "Produit Next.js/Supabase, offre Stripe existante, base locale d'acteurs et temps fondateur.",
    details: [
      "Produit deja riche fonctionnellement avec cockpit admin et parcours metier credibles.",
      "Offre Concierge Pro existante comme reference de production.",
      "Base locale d'acteurs et reseau terrain encore a densifier.",
      "Temps de la fondatrice comme ressource critique a ce stade.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.summary,
    hypotheses: [
      {
        label: "Le produit actuel est suffisant pour faire tourner des pilotes sans ajouter de nouvelle couche majeure.",
        status: "validated",
      },
      {
        label: "Le reseau local existant est assez dense pour produire les premiers apprentissages utiles.",
        status: "to_validate",
      },
    ],
    validationGaps: [
      "Mesurer la densite reelle du reseau local par zone pilote.",
      "Reduire la dependance aux ressources fondatrice sur vente, support et arbitrage.",
    ],
    relatedSections: [
      { id: "summary", label: "Synthese" },
      { id: "roadmap", label: "Roadmap produit" },
      { id: "risks", label: "Risques" },
    ],
    source: MASTER_PLAN_SOURCE,
    owner: "Produit / Operations",
  },
  {
    id: "key-activities",
    title: "Activites cles",
    shortSummary: "Validation terrain, onboarding pilotes, amelioration du cockpit et support business.",
    details: [
      "Validation terrain continue : entretiens, pilotes, objections prix et observation des parcours reels.",
      "Onboarding des premiers comptes actives.",
      "Amelioration du cockpit et reduction des frictions du noyau de valeur.",
      "Support business et arbitrage pricing / segment / roadmap.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.roadmap,
    hypotheses: [
      {
        label: "Le meilleur MVP proche du reel est le parcours conciergerie centre sur sejour, mission, planning et preuve.",
        status: "to_validate",
      },
      {
        label: "Les activites de validation doivent rester concentrees plutot que multipliees en parallele.",
        status: "validated",
      },
    ],
    validationGaps: [
      "Confirmer que ces activites generent vraiment les signaux business les plus utiles.",
      "Prioriser plus clairement ce qui releve de validation terrain versus profondeur produit.",
    ],
    relatedSections: [
      { id: "roadmap", label: "Roadmap produit" },
      { id: "hypotheses", label: "Hypotheses a valider" },
      { id: "actionPlan", label: "Plan d'action" },
    ],
    source: VALIDATION_SOURCE,
    owner: "Produit / GTM",
  },
  {
    id: "key-partners",
    title: "Partenaires cles",
    shortSummary: "Stripe, conciergeries pilotes, prestataires locaux et apports reseau terrain.",
    details: [
      "Stripe : socle de monétisation deja branche pour l'offre existante.",
      "Conciergeries pilotes : partenaires critiques pour valider la proposition et l'abonnement.",
      "Prestataires locaux : necessaires pour la promesse de coordination terrain.",
      "Apports reseau locaux : utiles pour la densite et les recommandations.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.canvas,
    hypotheses: [
      {
        label: "Les conciergeries pilotes peuvent jouer le role de partenaires d'apprentissage avant de devenir references.",
        status: "to_validate",
      },
      {
        label: "Stripe est deja un partenaire technique valide pour la monetisation de base.",
        status: "validated",
      },
    ],
    validationGaps: [
      "Formaliser quels partenaires sont indispensables au lancement et lesquels peuvent attendre.",
      "Verifier si les prestataires locaux doivent etre acquis avant ou apres les premiers comptes payants.",
    ],
    relatedSections: [
      { id: "canvas", label: "Business Model Canvas" },
      { id: "pricing", label: "Tarification et abonnements" },
      { id: "acquisition", label: "Acquisition" },
    ],
    source: ECONOMIC_MODEL_SOURCE,
    owner: "Partenariats / GTM",
  },
  {
    id: "cost-structure",
    title: "Structure de couts",
    shortSummary: "Developpement produit, support/onboarding, acquisition terrain et couts IA eventuels.",
    details: [
      "Developpement produit.",
      "Support et onboarding des pilotes.",
      "Acquisition terrain.",
      "Couts IA eventuels a discipliner.",
      "Chiffrage detaille du cout d'onboarding, CAC et marge brute : A definir.",
    ],
    status: PLANETLS_BUSINESS_PLAN_REPOSITORY.sectionStatuses.financialForecasts,
    hypotheses: [
      {
        label: "La croissance peut devenir non rentable si le temps humain par compte reste trop eleve.",
        status: "to_validate",
      },
      {
        label: "Les fonctionnalites IA doivent rester sous controle tant que leur ROI n'est pas prouve.",
        status: "validated",
      },
    ],
    validationGaps: [
      "Mesurer CAC, cout d'onboarding, marge brute et effort support sur comptes reels.",
      "Transformer la structure de couts en lecture plus financiere et moins seulement editoriale.",
    ],
    relatedSections: [
      { id: "financialForecasts", label: "Previsions financieres" },
      { id: "aiStrategy", label: "Strategie IA" },
      { id: "risks", label: "Risques" },
    ],
    source: RISK_SOURCE,
    owner: "Finance",
  },
];
