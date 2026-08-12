"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  Building2,
  Compass,
  Gauge,
  Layers3,
  LineChart,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import type { KpiOverviewPayload } from "@/app/api/kpis/overview/shared";
import type { AdminMissionRow, AdminRequestRow } from "../AdminOperations";
import { BusinessCollapsibleSection } from "./BusinessCollapsibleSection";
import { BusinessModelCanvas } from "./BusinessModelCanvas";
import {
  BUSINESS_EVIDENCE_LABELS,
  PLANETLS_BUSINESS_PLAN_REPOSITORY,
  PLANETLS_COMPETITION_MATRIX,
  PLANETLS_MARKET_GROUPS,
  PLANETLS_PERSONA_BUSINESS_PROFILES,
  PLANETLS_POSITIONING_MAP,
  type BusinessEvidenceKind,
} from "./business-plan-reference";
import {
  ACQUISITION_CHANNELS,
  AI_STRATEGY_BLOCKS,
  ANNEX_LINKS,
  BENCHMARK_ROWS,
  BUSINESS_PLAN_SECTIONS,
  BUSINESS_PLAN_STATUS_LABELS,
  BUSINESS_PLAN_STATUS_SCORES,
  BUSINESS_PLAN_TAB_DEFINITIONS,
  MARKET_SCOPE_ROWS,
  MONTHLY_PLAN_ROWS,
  NINETY_DAY_PRIORITIES,
  PERSONA_SEGMENTS,
  PRICING_GUIDANCE_ROWS,
  SOLUTION_PILLARS,
  SWOT_BLOCKS,
  VALUE_PROPOSITIONS,
  VISION_PILLARS,
  PROBLEM_SIGNALS,
  type BusinessPlanSectionId,
  type BusinessPlanStatus,
  type BusinessPlanTabId,
} from "./businessPlanData";
import { PRICING_DECISION_LOG,  PRICING_STRATEGIES, EXISTING_PRODUCTION_OFFERS } from "./economic-model/data";
import { EconomicModelTab } from "./economic-model/EconomicModelTab";
import { FinancialForecastModel } from "./economic-model/FinancialForecastModel";
import { DEFAULT_FINANCIAL_SCENARIOS, computeFinancialScenario } from "./economic-model/financialModel";
import { PricingRevenueSimulator } from "./economic-model/PricingRevenueSimulator";
import {
  goNoGoRules,
  immediateActionGroups,
  initialDiagnostic,
  landingVariants,
  nextDecisions,
  prioritizedHypotheses,
  validationKpis,
  validationTests,
} from "./market-validation/validationData";
import { LeanValidationDashboard } from "./market-validation/LeanValidationDashboard";
import { decisionPrinciples, decisionTriggers } from "./decision-assistant/decisionFramework";
import { StrategicDecisionAssistant } from "./decision-assistant/StrategicDecisionAssistant";
import { businessRisks } from "./risk-register/riskData";
import { RiskRegister } from "./risk-register/RiskRegister";
import styles from "./page.module.scss";

type AdminOverviewPayload = {
  health?: {
    available: boolean;
    availableSources: number;
    totalSources: number;
    reasons: string[];
    updatedAt: string;
  };
  summary: {
    totalUsers: number;
    active7d: number;
    owners: number;
    concierges: number;
    providers: number;
    properties: number;
    missions: number;
    serviceRequests: number;
    invoices: number;
  };
};

type AdminOperationsPayload = {
  health?: {
    available: boolean;
    availableSources: number;
    totalSources: number;
    reasons: string[];
    updatedAt: string;
  };
  requests: AdminRequestRow[];
  missions: AdminMissionRow[];
  invoiceCount: number;
};



function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") return "A mesurer";
  return `${Math.round(value * 100) / 100} %`;
}

function formatMinutes(value: number | null | undefined) {
  if (typeof value !== "number") return "A mesurer";
  if (value >= 1440) {
    return `${Math.round((value / 1440) * 10) / 10} j`;
  }
  if (value >= 60) {
    return `${Math.round((value / 60) * 10) / 10} h`;
  }
  return `${Math.round(value)} min`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: Array<number | null | undefined>) {
  const defined = values.filter((value): value is number => typeof value === "number");
  if (defined.length === 0) return null;
  return defined.reduce((sum, value) => sum + value, 0) / defined.length;
}



function daysSince(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date("2026-08-07T12:00:00+02:00");
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getCapabilityTone(value: string) {
  if (value.includes("Tres fort")) return "strong";
  if (value.includes("Fort")) return "good";
  if (value.includes("Moyen") || value.includes("Partiel") || value.includes("Progressif")) return "mid";
  if (value.includes("Faible") || value.includes("Limite") || value.includes("Tres faible")) return "weak";
  return "neutral";
}

function getEvidenceTone(value: BusinessEvidenceKind) {
  if (value === "verified_fact") return "strong";
  if (value === "estimate") return "mid";
  return "weak";
}

function isInternalRoute(href: string) {
  return href.startsWith("/dashboard") || href.startsWith("/abonnement");
}

const DEFAULT_OPEN_SECTIONS: Record<BusinessPlanSectionId, boolean> = {
  summary: true,
  vision: false,
  problem: false,
  solution: false,
  value: false,
  personas: true,
  marketStudy: false,
  competition: false,
  canvas: false,
  economicModel: true,
  pricing: true,
  goToMarket: false,
  acquisition: false,
  roadmap: true,
  aiStrategy: false,
  saasKpis: true,
  financialForecasts: false,
  swot: false,
  risks: true,
  hypotheses: true,
  actionPlan: false,
  appendices: false,
};

export default function AdminBusinessPage() {
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [operations, setOperations] = useState<AdminOperationsPayload | null>(null);
  const [kpis, setKpis] = useState<KpiOverviewPayload | null>(null);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BusinessPlanTabId>("synthesis");
  const [openSections, setOpenSections] = useState<Record<BusinessPlanSectionId, boolean>>(
    DEFAULT_OPEN_SECTIONS,
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [overviewRes, operationsRes, kpiRes] = await Promise.allSettled([
          fetch("/api/admin/overview", { cache: "no-store" }),
          fetch("/api/admin/operations?limit=200", { cache: "no-store" }),
          fetch("/api/kpis/overview?window_days=30", { cache: "no-store" }),
        ]);

        if (!active) return;

        setOverview(
          overviewRes.status === "fulfilled" && overviewRes.value.ok
            ? ((await overviewRes.value.json()) as AdminOverviewPayload)
            : null,
        );
        setOperations(
          operationsRes.status === "fulfilled" && operationsRes.value.ok
            ? ((await operationsRes.value.json()) as AdminOperationsPayload)
            : null,
        );
        setKpis(
          kpiRes.status === "fulfilled" && kpiRes.value.ok
            ? ((await kpiRes.value.json()) as KpiOverviewPayload)
            : null,
        );
      } catch (loadError) {
        if (!active) return;
        console.error("Erreur chargement centre de pilotage business :", loadError);
        setError("Le centre de pilotage strategic n'a pas pu etre charge.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const requests = useMemo(() => operations?.requests ?? [], [operations?.requests]);
  const missions = useMemo(() => operations?.missions ?? [], [operations?.missions]);

  const blockedRequests = useMemo(
    () =>
      requests.filter((request) => {
        const status = String(
          request.workflow_status ?? request.request_workflow_status ?? request.status ?? "",
        ).toLowerCase();
        return status.includes("block");
      }).length,
    [requests],
  );

  const acceptedWithoutMission = useMemo(
    () =>
      requests.filter((request) => {
        const quoteStatus = String(request.quote_workflow_status ?? "").toLowerCase();
        return quoteStatus.includes("accept") && !request.mission_id;
      }).length,
    [requests],
  );

  const lateUnbilledMissions = useMemo(
    () =>
      missions.filter((mission) => {
        if (mission.invoice_id || !mission.scheduled_start) return false;
        const scheduled = new Date(mission.scheduled_start).getTime();
        return Number.isFinite(scheduled) && scheduled < Date.now();
      }).length,
    [missions],
  );

  const sourceWarnings = Array.from(
    new Set([
      ...(overview?.health?.reasons ?? []),
      ...(operations?.health?.reasons ?? []),
      ...(kpis?.health?.reasons ?? []),
    ]),
  );

  const tractionBars = useMemo(() => {
    const summary = overview?.summary;
    if (!summary) return [];

    const bars = [
      { label: "Proprietaires", value: summary.owners, color: "gold" as const },
      { label: "Concierges", value: summary.concierges, color: "sage" as const },
      { label: "Artisans", value: summary.providers, color: "ink" as const },
      { label: "Biens", value: summary.properties, color: "sand" as const },
    ];

    const max = Math.max(...bars.map((item) => item.value), 1);
    return bars.map((item) => ({
      ...item,
      ratio: Math.max(8, Math.round((item.value / max) * 100)),
    }));
  }, [overview]);

  const topRisks = useMemo(() => businessRisks.slice(0, 4), []);
  const aiRiskCount = useMemo(
    () => businessRisks.filter((risk) => risk.category === "ia").length,
    [],
  );
  const criticalRisks = useMemo(
    () => businessRisks.filter((item) => item.priority === "critique").length,
    [],
  );

  const sectionsByTab = useMemo(
    () =>
      BUSINESS_PLAN_TAB_DEFINITIONS.map((tab) => ({
        ...tab,
        sections: BUSINESS_PLAN_SECTIONS.filter((section) => section.tabId === tab.id).sort(
          (left, right) => left.order - right.order,
        ),
      })),
    [],
  );



  const statusCounts = useMemo(
    () =>
      BUSINESS_PLAN_SECTIONS.reduce<Record<BusinessPlanStatus, number>>(
        (acc, section) => {
          acc[section.status] += 1;
          return acc;
        },
        { todo: 0, review: 0, validated: 0, update: 0 },
      ),
    [],
  );

  const maturityScore = useMemo(() => {
    const total = BUSINESS_PLAN_SECTIONS.reduce(
      (sum, section) => sum + BUSINESS_PLAN_STATUS_SCORES[section.status],
      0,
    );
    return Math.round(total / BUSINESS_PLAN_SECTIONS.length);
  }, []);

  const completionTone = useMemo(() => {
    if (maturityScore >= 85) return "strong";
    if (maturityScore >= 65) return "good";
    if (maturityScore >= 45) return "mid";
    return "weak";
  }, [maturityScore]);

  const centralFinancialScenario = useMemo(
    () =>
      computeFinancialScenario(
        DEFAULT_FINANCIAL_SCENARIOS.find((scenario) => scenario.id === "central") ??
          DEFAULT_FINANCIAL_SCENARIOS[1],
      ),
    [],
  );
  const centralFinancialYearOne = centralFinancialScenario.years[0];
  const activationAverage = useMemo(
    () =>
      average([
        kpis?.owner.activation_j7,
        kpis?.concierge.activation_j7,
        kpis?.provider.activation_j7,
      ]),
    [kpis],
  );

  const sectionScoreMap = useMemo(
    () =>
      Object.fromEntries(
        BUSINESS_PLAN_SECTIONS.map((section) => [
          section.id,
          BUSINESS_PLAN_STATUS_SCORES[section.status],
        ]),
      ) as Record<BusinessPlanSectionId, number>,
    [],
  );

  const productScore = useMemo(() => {
    const statusBase = average([
      sectionScoreMap.solution,
      sectionScoreMap.roadmap,
      sectionScoreMap.aiStrategy,
      sectionScoreMap.saasKpis,
    ]);
    const score =
      typeof activationAverage === "number"
        ? (statusBase ?? 0) * 0.55 + activationAverage * 0.45
        : statusBase ?? 0;
    return clampScore(score);
  }, [activationAverage, sectionScoreMap]);

  const marketScore = useMemo(() => {
    const statusBase =
      average([
        sectionScoreMap.personas,
        sectionScoreMap.marketStudy,
        sectionScoreMap.competition,
        sectionScoreMap.goToMarket,
        sectionScoreMap.acquisition,
      ]) ?? 0;
    const unresolvedCriticalHypotheses = prioritizedHypotheses.filter(
      (item) => item.priority === "critique",
    ).length;
    return clampScore(statusBase - unresolvedCriticalHypotheses * 4);
  }, [sectionScoreMap]);

  const financialScore = useMemo(() => {
    const statusBase =
      average([
        sectionScoreMap.economicModel,
        sectionScoreMap.pricing,
        sectionScoreMap.financialForecasts,
      ]) ?? 0;
    const observedFinancialSignals = [
      kpis?.shared.mission_to_paid_invoice_rate ? 55 : 25,
      acceptedWithoutMission === 0 ? 60 : Math.max(20, 60 - acceptedWithoutMission * 5),
      lateUnbilledMissions === 0 ? 60 : Math.max(20, 60 - lateUnbilledMissions * 5),
    ];
    return clampScore(statusBase * 0.7 + (average(observedFinancialSignals) ?? 0) * 0.3);
  }, [acceptedWithoutMission, kpis?.shared.mission_to_paid_invoice_rate, lateUnbilledMissions, sectionScoreMap]);

  const productMarketFitScore = useMemo(() => {
    const core = ((productScore + marketScore) / 2) * 0.65 + financialScore * 0.2 + maturityScore * 0.15;
    const penalty = prioritizedHypotheses.filter((item) => item.priority === "critique").length * 4;
    return clampScore(core - penalty);
  }, [financialScore, marketScore, maturityScore, productScore]);

  const scoreCards = useMemo(
    () => [
      {
        label: "Score de maturite",
        value: maturityScore,
        helper: `${statusCounts.validated} sections deja validees sur ${BUSINESS_PLAN_SECTIONS.length}.`,
        icon: Gauge,
      },
      {
        label: "Score Product-Market Fit",
        value: productMarketFitScore,
        helper: "Penalise par les hypotheses critiques encore non prouvees.",
        icon: Target,
      },
      {
        label: "Score financier",
        value: financialScore,
        helper: "Le modele existe, mais les KPI economiques reels restent encore peu instrumentes.",
        icon: Banknote,
      },
      {
        label: "Score marche",
        value: marketScore,
        helper: "Lecture marche structuree, mais plusieurs validations terrain restent ouvertes.",
        icon: Compass,
      },
      {
        label: "Score produit",
        value: productScore,
        helper: "Combine maturite des sections produit et activation observable.",
        icon: BriefcaseBusiness,
      },
    ],
    [
      financialScore,
      marketScore,
      maturityScore,
      productMarketFitScore,
      productScore,
      statusCounts.validated,
    ],
  );

  const topKpiCards = useMemo(
    () => [
      {
        label: "MRR",
        value: "A mesurer",
        helper: `Simulation centrale fin annee 1 : ${formatMoney(centralFinancialYearOne.endMrr)}.`,
      },
      {
        label: "ARR",
        value: "A mesurer",
        helper: `Simulation centrale fin annee 1 : ${formatMoney(centralFinancialYearOne.arr)}.`,
      },
      {
        label: "Utilisateurs",
        value: overview ? String(overview.summary.totalUsers) : "A mesurer",
        helper: "Donnee observee via l'API admin.",
      },
      {
        label: "Clients payants",
        value: "A mesurer",
        helper: `Simulation centrale fin annee 1 : ${centralFinancialYearOne.endingPaidClients.toFixed(0)} comptes payants.`,
      },
      {
        label: "Conversion",
        value: "A mesurer",
        helper: `Hypothese centrale actuelle : ${centralFinancialScenario.scenario.assumptions.freeToPaidConversionPct} %.`,
      },
      {
        label: "Churn",
        value: "A mesurer",
        helper: `Hypothese centrale actuelle : ${centralFinancialScenario.scenario.assumptions.monthlyPaidChurnPct} % / mois.`,
      },
      {
        label: "CAC",
        value: "A mesurer",
        helper: `Simulation centrale fin annee 1 : ${formatMoney(centralFinancialYearOne.cac)}.`,
      },
      {
        label: "LTV",
        value: "A mesurer",
        helper: `Simulation centrale fin annee 1 : ${formatMoney(centralFinancialYearOne.ltv)}.`,
      },
    ],
    [centralFinancialScenario.scenario.assumptions.freeToPaidConversionPct, centralFinancialScenario.scenario.assumptions.monthlyPaidChurnPct, centralFinancialYearOne, overview],
  );

  const topPriorities = useMemo(
    () => [
      ...PLANETLS_BUSINESS_PLAN_REPOSITORY.actionPlan.slice(0, 3).map((item) => ({
        title: item.value.title,
        detail: item.value.details[0] ?? "Action a poursuivre.",
        meta: `${item.owner ?? "Equipe"} · ${item.status}`,
      })),
      ...NINETY_DAY_PRIORITIES.slice(0, 2).map((item) => ({
        title: item.target,
        detail: item.proof,
        meta: `${item.phase} · ${item.owner}`,
      })),
    ].slice(0, 5),
    [],
  );

  const topHypotheses = useMemo(
    () =>
      prioritizedHypotheses.slice(0, 5).map((item) => ({
        title: `${item.code} · ${item.title}`,
        detail: `Importance ${item.importance} · Incertitude ${item.uncertainty}`,
        meta: `${item.priority} · ${item.urgency}`,
      })),
    [],
  );

  const topFiveRisks = useMemo(
    () =>
      businessRisks
        .filter((item) => item.priority === "critique" || item.priority === "prioritaire")
        .slice(0, 5)
        .map((item) => ({
          title: item.title,
          detail: item.mitigation,
          meta: `${item.priority} · ${item.owner}`,
        })),
    [],
  );

  const upcomingDecisions = useMemo(
    () =>
      [
        ...nextDecisions.slice(0, 3).map((item) => ({
          title: item,
          detail: "Decision issue du module de validation marche.",
          meta: "Validation marche",
        })),
        ...PRICING_DECISION_LOG.filter((entry) => entry.status !== "done")
          .slice(0, 2)
          .map((entry) => ({
            title: entry.decision,
            detail: entry.rationale,
            meta: `Revue prevue le ${formatDate(entry.nextReview)}`,
          })),
      ].slice(0, 5),
    [],
  );

  const latestModifications = useMemo(
    () =>
      [
        {
          date: PLANETLS_BUSINESS_PLAN_REPOSITORY.summary.lastUpdatedAt,
          title: "Synthese du Business Plan",
          detail: "Vue executive et structure du cockpit mises a jour.",
        },
        {
          date: PLANETLS_BUSINESS_PLAN_REPOSITORY.market.overview.lastUpdatedAt,
          title: "Marche & concurrence",
          detail: "Sources, confiance et separation faits / hypotheses rafraichies.",
        },
        {
          date: PLANETLS_BUSINESS_PLAN_REPOSITORY.pricing.revenueStreams.lastUpdatedAt,
          title: "Tarification & revenus",
          detail: "Scenario de gamme et monetisation reencadres.",
        },
        {
          date: PLANETLS_BUSINESS_PLAN_REPOSITORY.roadmap.annual[0]?.lastUpdatedAt ?? "2026-08-07",
          title: "Roadmap produit",
          detail: "Lecture 12 mois et priorites 90 jours consolidees.",
        },
        {
          date: PLANETLS_BUSINESS_PLAN_REPOSITORY.financialForecasts[0]?.lastUpdatedAt ?? "2026-08-07",
          title: "Previsions financieres",
          detail: "Modele financier et scenarios internes remis a niveau.",
        },
      ]
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
        .slice(0, 5),
    [],
  );

  const staleMarketDataCount = useMemo(
    () =>
      [
        ...PLANETLS_MARKET_GROUPS.flatMap((group) => group.items),
        ...PLANETLS_COMPETITION_MATRIX,
        ...PLANETLS_PERSONA_BUSINESS_PROFILES,
      ].filter((item) => {
        const age = daysSince(item.lastUpdatedAt);
        return typeof age === "number" && age > 120;
      }).length,
    [],
  );

  const attentionItems = useMemo(() => {
    const items = [
      ...prioritizedHypotheses
        .filter((item) => item.priority === "critique")
        .slice(0, 2)
        .map((item) => ({
          severity: 100,
          title: `Hypothese critique non testee : ${item.code}`,
          detail: item.title,
          action: "Traiter en priorite dans la validation marche.",
        })),
      ...businessRisks
        .filter((item) => item.priority === "critique")
        .slice(0, 2)
        .map((item) => ({
          severity: 95,
          title: `Risque critique : ${item.title}`,
          detail: item.description,
          action: item.mitigation,
        })),
    ];

    if (typeof kpis?.concierge.activation_j7 === "number" && kpis.concierge.activation_j7 < 25) {
      items.push({
        severity: 92,
        title: "KPI sous objectif : activation J+7 concierges",
        detail: `Observe ${formatPercent(kpis.concierge.activation_j7)} pour un objectif minimal de 25 %.`,
        action: "Revoir onboarding, promesse initiale et vitesse de premiere valeur.",
      });
    }
    if (financialScore < 50) {
      items.push({
        severity: 90,
        title: "Lecture financiere encore fragile",
        detail: "Le modele existe, mais MRR, churn, CAC et LTV reels restent encore a mesurer.",
        action: "Instrumenter les cohortes payantes et relier les offres testees a leurs KPI.",
      });
    }
    if (staleMarketDataCount > 0) {
      items.push({
        severity: 82,
        title: "Donnees marche a actualiser",
        detail: `${staleMarketDataCount} elements marche ou concurrence datent de plus de 120 jours au 7 aout 2026.`,
        action: "Relire les sources les plus anciennes avant toute decision de positionnement.",
      });
    }
    if (acceptedWithoutMission > 0) {
      items.push({
        severity: 76,
        title: "Pipeline commercial non transforme",
        detail: `${acceptedWithoutMission} demandes ont un devis accepte sans mission rattachee.`,
        action: "Verifier si le trou est produit, operationnel ou commercial.",
      });
    }
    if (lateUnbilledMissions > 0) {
      items.push({
        severity: 72,
        title: "Missions en retard de facturation",
        detail: `${lateUnbilledMissions} missions demarrees restent sans facture visible.`,
        action: "Securiser la boucle mission -> facture -> paiement.",
      });
    }

    return items.sort((left, right) => right.severity - left.severity).slice(0, 5);
  }, [acceptedWithoutMission, financialScore, kpis?.concierge.activation_j7, lateUnbilledMissions, staleMarketDataCount]);

  const keyAlerts = [
    {
      label: "Hypotheses critiques",
      value: prioritizedHypotheses.filter((item) => item.priority === "critique").length,
      helper: "Hypotheses critiques encore a confronter au terrain.",
      icon: AlertTriangle,
    },
    {
      label: "Risques critiques",
      value: criticalRisks,
      helper: "Risques business majeurs actuellement identifies.",
      icon: ShieldAlert,
    },
    {
      label: "Points a completer",
      value: statusCounts.todo,
      helper: "Sections du business plan qui restent structurellement incomplètes.",
      icon: RefreshCw,
    },
  ];

  const planHighlights = [
    {
      label: "Modele economique",
      value: financialScore >= 60 ? "Cohesion en progression" : "Encore fragile",
      helper: "Lecture rapide de la coherence business et de l'instrumentation financiere.",
      icon: Banknote,
    },
    {
      label: "Validation acquise",
      value: `${statusCounts.validated} zones`,
      helper: "Blocs deja stabilises dans le Business Plan.",
      icon: BadgeCheck,
    },
    {
      label: "Incertitude dominante",
      value: prioritizedHypotheses[0]?.code ?? "A definir",
      helper: "Premiere hypothese a clarifier avant toute acceleration.",
      icon: AlertTriangle,
    },
    {
      label: "Decision la plus proche",
      value: "Offre pilote a figer",
      helper: "Direction commerciale a confirmer sur les prochaines semaines.",
      icon: Building2,
    },
  ];

  const summaryCards = [
    {
      label: "Comptes visibles",
      value: overview ? String(overview.summary.totalUsers) : "A mesurer",
      helper: "Lecture traction depuis l'API admin.",
    },
    {
      label: "Dossiers a clarifier",
      value: String(acceptedWithoutMission),
      helper: "Demandes acceptees sans mission rattachee.",
    },
    {
      label: "Missions non facturees",
      value: String(lateUnbilledMissions),
      helper: "Signaux utiles pour relier execution et business.",
    },
    {
      label: "Tests de validation",
      value: String(validationTests.length),
      helper: "Backlog de tests marche deja structure dans le projet.",
    },
  ];

  const kpiCards = [
    {
      label: "Activation J+7 proprietaires",
      value: formatPercent(kpis?.owner.activation_j7),
      helper: `${kpis?.owner.activation_j7_activated ?? 0}/${kpis?.owner.activation_j7_eligible ?? 0} actives`,
    },
    {
      label: "Activation J+7 concierges",
      value: formatPercent(kpis?.concierge.activation_j7),
      helper: `${kpis?.concierge.activation_j7_activated ?? 0}/${kpis?.concierge.activation_j7_eligible ?? 0} actives`,
    },
    {
      label: "Activation J+7 artisans",
      value: formatPercent(kpis?.provider.activation_j7),
      helper: `${kpis?.provider.activation_j7_activated ?? 0}/${kpis?.provider.activation_j7_eligible ?? 0} actives`,
    },
    {
      label: "Mission -> facture payee",
      value: formatPercent(kpis?.shared.mission_to_paid_invoice_rate),
      helper: "KPI partage produit / revenus.",
    },
    {
      label: "Temps de reponse messages",
      value: formatMinutes(kpis?.shared.median_first_message_response_minutes),
      helper: "Signal de qualite operationnelle transversale.",
    },
    {
      label: "Validation KPI business",
      value: `${validationKpis.length} suivis`,
      helper: "Tableau de validation encore a alimenter.",
    },
  ];

  function toggleSection(id: BusinessPlanSectionId) {
    setOpenSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function openSection(id: BusinessPlanSectionId) {
    setOpenSections((current) => ({
      ...current,
      [id]: true,
    }));
  }

  function navigateToSection(id: string) {
    const targetSection = BUSINESS_PLAN_SECTIONS.find((section) => section.id === id);
    if (!targetSection) return;
    setActiveTab(targetSection.tabId);
    openSection(targetSection.id);
  }

  function renderSummarySection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="A regarder en premier">
          <div className={styles.executiveComparisonGrid}>
            {attentionItems.map((item) => (
              <article key={item.title} className={styles.executiveComparisonCard}>
                <div className={styles.executiveComparisonHeader}>
                  <div>
                    <span className={styles.eyebrow}>Attention immediate</span>
                    <h4>{item.title}</h4>
                  </div>
                  <span className={styles.scorePill} data-tone="weak">
                    Priorite
                  </span>
                </div>
                <p>{item.detail}</p>
                <p>{item.action}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <div className={styles.sectionPanelGrid}>
          <DashboardPanel title="Resume executif">
            <div className={styles.summaryList}>
              {summaryCards.map((item) => (
                <article key={item.label} className={styles.summaryCard}>
                  <Sparkles size={18} />
                  <div>
                    <strong>{item.value}</strong>
                    <p>{item.label}</p>
                    <p>{item.helper}</p>
                  </div>
                </article>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Progression du Business Plan">
            <div className={styles.statusMatrix}>
              {(Object.keys(BUSINESS_PLAN_STATUS_LABELS) as BusinessPlanStatus[]).map((status) => (
                <article key={status} className={styles.statusCard}>
                  <span className={styles.statusLabel}>{BUSINESS_PLAN_STATUS_LABELS[status]}</span>
                  <strong>{statusCounts[status]}</strong>
                  <p>{Math.round((statusCounts[status] / BUSINESS_PLAN_SECTIONS.length) * 100)} % du plan</p>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </div>

        <DashboardPanel title="Alertes de pilotage">
          <div className={styles.highlightGrid}>
            {keyAlerts.map((item) => (
              <article key={item.label} className={styles.highlightCard}>
                <item.icon size={18} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.helper}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <div className={styles.sectionPanelGrid}>
          <DashboardPanel title="Top 5 priorites">
            <div className={styles.decisionList}>
              {topPriorities.map((item) => (
                <article key={item.title} className={styles.decisionCard}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <p>{item.meta}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Top 5 hypotheses">
            <div className={styles.decisionList}>
              {topHypotheses.map((item) => (
                <article key={item.title} className={styles.decisionCard}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <p>{item.meta}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </div>

        <div className={styles.sectionPanelGrid}>
          <DashboardPanel title="Top 5 risques">
            <div className={styles.decisionList}>
              {topFiveRisks.map((item) => (
                <article key={item.title} className={styles.decisionCard}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <p>{item.meta}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Prochaines decisions">
            <div className={styles.decisionList}>
              {upcomingDecisions.map((item) => (
                <article key={item.title} className={styles.decisionCard}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <p>{item.meta}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </div>

        <DashboardPanel title="Dernieres modifications">
          <div className={styles.summaryList}>
            {latestModifications.map((item) => (
              <article key={`${item.date}-${item.title}`} className={styles.summaryCard}>
                <RefreshCw size={18} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <p>Mis a jour le {formatDate(item.date)}</p>
                </div>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderVisionSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Mission PlanetLS">
          <div className={styles.decisionList}>
            {VISION_PILLARS.map((item) => (
              <article key={item} className={styles.decisionCard}>
                <strong>Cap vise</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Lecture de positionnement">
          <div className={styles.sectionCardGrid}>
            <article className={styles.sectionCard}>
              <div className={styles.sectionCardIcon}>
                <Users size={18} />
              </div>
              <span>Reseau</span>
              <strong>Réseau professionnel vertical</strong>
              <p>Pas un annuaire generaliste, mais une base métier specialisee location saisonniere.</p>
            </article>
            <article className={styles.sectionCard}>
              <div className={styles.sectionCardIcon}>
                <Target size={18} />
              </div>
              <span>Execution</span>
              <strong>Continuité entre contact et mission</strong>
              <p>Le produit doit relier la découverte, la demande, le devis, la mission et le suivi.</p>
            </article>
            <article className={styles.sectionCard}>
              <div className={styles.sectionCardIcon}>
                <ShieldAlert size={18} />
              </div>
              <span>Confiance</span>
              <strong>Preuves et traçabilité</strong>
              <p>Identité, documents, preuves terrain et historique sont au cœur de la promesse.</p>
            </article>
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderProblemSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Signaux probleme deja identifies">
          <div className={styles.decisionList}>
            {PROBLEM_SIGNALS.map((item) => (
              <article key={item} className={styles.decisionCard}>
                <strong>Signal terrain</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Diagnostic initial">
          <div className={styles.sectionPanelGrid}>
            {initialDiagnostic.slice(0, 4).map((item) => (
              <article key={item.id} className={styles.sectionCard}>
                <span>{item.title}</span>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderSolutionSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Solution PlanetLS">
          <div className={styles.summaryList}>
            {SOLUTION_PILLARS.map((item) => (
              <article key={item} className={styles.summaryCard}>
                <Layers3 size={18} />
                <div>
                  <strong>{item}</strong>
                </div>
              </article>
            ))}
          </div>
          <p className={styles.sectionNote}>
            PlanetLS ne se limite ni à la mise en relation ni à un PMS. La solution se défend comme une
            couche de coordination métier reliée à des flux réels.
          </p>
        </DashboardPanel>
      </div>
    );
  }

  function renderValueSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Proposition de valeur par cible">
          <div className={styles.profileInsightGrid}>
            {VALUE_PROPOSITIONS.map((item) => (
              <article key={item.title} className={styles.profileInsightCard}>
                <span>{item.title}</span>
                <strong>Valeur defendable</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderPersonasSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Lecture personas orientee decision">
          <div className={styles.profileInsightGrid}>
            {PLANETLS_PERSONA_BUSINESS_PROFILES.map((profile) => (
              <article key={profile.id} className={styles.profileInsightCard}>
                <div className={styles.marketHeader}>
                  <div>
                    <span>{profile.label}</span>
                    <strong>{profile.confidence === "high" ? "Lecture robuste" : "Lecture a consolider"}</strong>
                  </div>
                  <span className={styles.scorePill} data-tone={getCapabilityTone(profile.confidence === "high" ? "Tres fort" : profile.confidence === "medium" ? "Moyen" : "Faible")}>
                    {profile.confidence}
                  </span>
                </div>
                <div className={styles.marketFieldList}>
                  {profile.fields.map((field) => (
                    <div key={`${profile.id}-${field.label}`} className={styles.marketFieldItem}>
                      <span>{field.label}</span>
                      <strong>{field.value}</strong>
                      <div className={styles.marketMetaRow}>
                        <span className={styles.scorePill} data-tone={getEvidenceTone(field.kind)}>
                          {BUSINESS_EVIDENCE_LABELS[field.kind]}
                        </span>
                        {field.note ? <small>{field.note}</small> : null}
                      </div>
                    </div>
                  ))}
                </div>
                <p className={styles.sourceLine}>
                  Source : {profile.source.label} · Date : {profile.lastUpdatedAt} · Confiance : {profile.confidence}
                </p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Segments et priorisation">
          <div className={styles.sectionPanelGrid}>
            {PERSONA_SEGMENTS.map((segment) => (
              <article key={segment.title} className={styles.sectionCard}>
                <span>{segment.status}</span>
                <strong>{segment.title}</strong>
                <ul className={styles.plainList}>
                  {segment.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderMarketStudySection() {
    return (
      <div className={styles.sectionStack}>
        {PLANETLS_MARKET_GROUPS.map((group) => (
          <DashboardPanel key={group.id} title={group.title}>
            <div className={styles.marketInsightGrid}>
              {group.items.map((item) => (
                <article key={item.id} className={styles.marketInsightCard}>
                  <div className={styles.marketHeader}>
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <span className={styles.scorePill} data-tone={getEvidenceTone(item.kind)}>
                      {BUSINESS_EVIDENCE_LABELS[item.kind]}
                    </span>
                  </div>
                  {item.note ? <p>{item.note}</p> : <p>Aucune precision complementaire.</p>}
                  <p className={styles.sourceLine}>
                    Source : {item.source.label} · Date : {item.lastUpdatedAt} · Confiance : {item.confidence}
                  </p>
                </article>
              ))}
            </div>
          </DashboardPanel>
        ))}

        <DashboardPanel title="Lecture historique du perimetre TAM / SAM / SOM">
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Scope</th>
                  <th>Lecture historique</th>
                  <th>Focus</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {MARKET_SCOPE_ROWS.map((row) => (
                  <tr key={row.scope}>
                    <td>{row.scope}</td>
                    <td>{row.amount}</td>
                    <td>{row.focus}</td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Socle actuel exploitable">
          <div className={styles.barChart}>
            {tractionBars.length === 0 ? (
              <p className={styles.sectionNote}>Traction indisponible pour le moment.</p>
            ) : (
              tractionBars.map((item) => (
                <article key={item.label} className={styles.barRow}>
                  <div className={styles.barMeta}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      data-color={item.color}
                      style={{ width: `${item.ratio}%` }}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderCompetitionSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Lecture executive du marche concurrentiel">
          <div className={styles.marketInsightGrid}>
            <article className={styles.marketInsightCard}>
              <div className={styles.marketHeader}>
                <div>
                  <span>Ce qui est etabli</span>
                  <strong>Le marche est deja outille, mais rarement relie en meme temps au reseau local et a l'execution partagee.</strong>
                </div>
                <span className={styles.scorePill} data-tone="strong">Fait verifie</span>
              </div>
              <p>
                Les solutions revuees couvrent surtout le PMS, les operations terrain, ou la mise en relation.
                PlanetLS se distingue s'il prouve la jonction entre reseau professionnel, missions et cockpit.
              </p>
            </article>
            <article className={styles.marketInsightCard}>
              <div className={styles.marketHeader}>
                <div>
                  <span>Ce qui reste a prouver</span>
                  <strong>Que cette combinaison se vend mieux qu'une promesse plus simple et plus etroite.</strong>
                </div>
                <span className={styles.scorePill} data-tone="weak">Hypothese</span>
              </div>
              <p>
                Le risque central n'est pas l'absence de concurrence, mais un positionnement trop large avant
                preuve du noyau de valeur payant.
              </p>
            </article>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Matrice comparative exploitable">
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Concurrent</th>
                  <th>Cible</th>
                  <th>Prix si connu</th>
                  <th>Marketplace</th>
                  <th>Gestion missions</th>
                  <th>Devis</th>
                  <th>Paiements</th>
                  <th>Reseau pro</th>
                  <th>Automatisation</th>
                  <th>IA</th>
                  <th>Differenciation</th>
                  <th>Forces</th>
                  <th>Faiblesses</th>
                </tr>
              </thead>
              <tbody>
                {PLANETLS_COMPETITION_MATRIX.map((row) => (
                  <tr key={row.id}>
                    <td>{row.competitor}</td>
                    <td>{row.target}</td>
                    <td>{row.price}</td>
                    <td>{row.marketplace}</td>
                    <td>{row.missionManagement}</td>
                    <td>{row.quotes}</td>
                    <td>{row.payments}</td>
                    <td>{row.professionalNetwork}</td>
                    <td>{row.automation}</td>
                    <td>{row.ai}</td>
                    <td>{row.differentiation}</td>
                    <td>{row.strengths}</td>
                    <td>{row.weaknesses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.sectionNote}>
            La matrice ci-dessus distingue ce qui est visible sur les sources publiques revues de ce qui reste
            non visible. Une absence d'information n'est pas interpretee comme une absence de fonctionnalite.
          </p>
        </DashboardPanel>

        <DashboardPanel title="Positionnement de PlanetLS">
          <div className={styles.scatterCard}>
            <div className={styles.scatterFrame}>
              <span className={styles.scatterAxisY}>Profondeur operationnelle</span>
              <span className={styles.scatterAxisX}>Densite reseau professionnel</span>
              {PLANETLS_POSITIONING_MAP.map((point) => (
                <div
                  key={point.id}
                  className={styles.scatterPoint}
                  data-tone={point.tone}
                  style={{ left: `${point.x}%`, bottom: `${point.y}%` }}
                >
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.marketLegendGrid}>
              {PLANETLS_POSITIONING_MAP.map((point) => (
                <article key={`legend-${point.id}`} className={styles.marketLegendCard}>
                  <div className={styles.marketHeader}>
                    <div>
                      <span>{point.label}</span>
                      <strong>{point.note}</strong>
                    </div>
                    <span className={styles.scorePill} data-tone={getEvidenceTone(point.kind)}>
                      {BUSINESS_EVIDENCE_LABELS[point.kind]}
                    </span>
                  </div>
                  <p className={styles.sourceLine}>
                    Source : {point.source.label} · Date : {point.lastUpdatedAt} · Confiance : {point.confidence}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Benchmark heritage conserve">
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Categorie</th>
                  <th>Tarification</th>
                  <th>Positionnement</th>
                  <th>Forces</th>
                  <th>Limites</th>
                  <th>Lecon</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARK_ROWS.map((row) => (
                  <tr key={row.actor}>
                    <td>{row.actor}</td>
                    <td>{row.category}</td>
                    <td>{row.pricing}</td>
                    <td>{row.positioning}</td>
                    <td>{row.strengths}</td>
                    <td>{row.limits}</td>
                    <td>{row.lesson}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderCanvasSection() {
    return (
      <BusinessModelCanvas onNavigateToSection={navigateToSection} />
    );
  }

  function renderEconomicModelSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Repere strategique">
          <div className={styles.highlightGrid}>
            <article className={styles.highlightCard}>
              <Layers3 size={18} />
              <span>Strategies suivies</span>
              <strong>{PRICING_STRATEGIES.length}</strong>
              <p>Directions de monetisation actuellement visibles dans l'atelier de modele economique.</p>
            </article>
            <article className={styles.highlightCard}>
              <BriefcaseBusiness size={18} />
              <span>Offre production</span>
              <strong>{EXISTING_PRODUCTION_OFFERS.length}</strong>
              <p>Reference reelle conservee hors simulation.</p>
            </article>
            <article className={styles.highlightCard}>
              <Gauge size={18} />
              <span>Direction prioritaire</span>
              <strong>Strategie B</strong>
              <p>Tarification par niveau `29 / 49 / sur devis` a confronter au terrain.</p>
            </article>
          </div>
        </DashboardPanel>
        <EconomicModelTab />
      </div>
    );
  }

  function renderPricingSection() {
    const productionOffer = EXISTING_PRODUCTION_OFFERS[0];

    return (
      <div className={styles.sectionStack}>
        <div className={styles.sectionPanelGrid}>
          <DashboardPanel title="Offre reelle actuelle">
            <div className={styles.offerCard}>
              <div className={styles.offerHeader}>
                <div>
                  <span className={styles.eyebrow}>Production verrouillee</span>
                  <h3>{productionOffer.name}</h3>
                </div>
                <div className={styles.priceBlock}>
                  <strong>{formatMoney(productionOffer.monthlyPrice ?? 0)}</strong>
                  <span>{productionOffer.stripePlanCode}</span>
                </div>
              </div>
              <div className={styles.offerPoints}>
                {productionOffer.features.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Journal des decisions pricing">
            <div className={styles.decisionList}>
              {PRICING_DECISION_LOG.map((entry) => (
                <article key={entry.id} className={styles.decisionCard}>
                  <strong>{entry.date}</strong>
                  <p>{entry.decision}</p>
                  <p>{entry.rationale}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </div>

        <DashboardPanel title="Qui paie quoi selon le parc gere">
          <div className={styles.ninetyDayFocus}>
            <div className={styles.ninetyDayIntro}>
              <span className={styles.eyebrow}>Lecture 90 jours</span>
              <h3>Traduire la gamme en grille commerciale lisible</h3>
              <p>
                L'objectif reste de rendre l'offre immédiatement compréhensible pour la cible prioritaire,
                sans réouvrir trop tôt la complexité commission ou hybride.
              </p>
            </div>

            <div className={styles.ninetyDayCardGrid}>
              {NINETY_DAY_PRIORITIES.map((item) => (
                <article key={item.phase} className={styles.ninetyDayCard}>
                  <span>{item.phase}</span>
                  <strong>{item.target}</strong>
                  <p><b>Responsable :</b> {item.owner}</p>
                  <p><b>Preuve :</b> {item.proof}</p>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Profil</th>
                  <th>Nombre de biens</th>
                  <th>Accompagnement</th>
                  <th>Prix</th>
                  <th>Payeur naturel</th>
                  <th>Lecture terrain</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_GUIDANCE_ROWS.map((row) => (
                  <tr key={`${row.profile}-${row.properties}`}>
                    <td>{row.profile}</td>
                    <td>{row.properties}</td>
                    <td>{row.supportLevel}</td>
                    <td>{row.monthlyPrice}</td>
                    <td>{row.whoPays}</td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <PricingRevenueSimulator />
      </div>
    );
  }

  function renderGoToMarketSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Go-to-market pilote">
          <div className={styles.roadmapList}>
            <article className={styles.roadmapCard}>
              <Target size={18} />
              <div>
                <strong>30 jours</strong>
                <p>Entretiens, qualification de cible, objections prix et promesse d'entree.</p>
              </div>
            </article>
            <article className={styles.roadmapCard}>
              <LineChart size={18} />
              <div>
                <strong>60 jours</strong>
                <p>Premiers pilotes actives, routines observees et profondeur d'usage.</p>
              </div>
            </article>
            <article className={styles.roadmapCard}>
              <Banknote size={18} />
              <div>
                <strong>90 jours</strong>
                <p>Validation du segment payeur et arbitrage entre 29 EUR, 49 EUR et sur devis.</p>
              </div>
            </article>
            <article className={styles.roadmapCard}>
              <Users size={18} />
              <div>
                <strong>Apres preuve</strong>
                <p>Extension progressive des zones et des profils seulement si la boucle locale tient.</p>
              </div>
            </article>
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderAcquisitionSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Canaux d'acquisition">
          <div className={styles.profileInsightGrid}>
            {ACQUISITION_CHANNELS.map((channel) => (
              <article key={channel.title} className={styles.profileInsightCard}>
                <span>{channel.title}</span>
                <strong>Canal a structurer</strong>
                <p>{channel.note}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Angles de landing deja prepares">
          <div className={styles.sectionPanelGrid}>
            {landingVariants.map((variant) => (
              <article key={variant.id} className={styles.sectionCard}>
                <span>{variant.audience}</span>
                <strong>{variant.headline}</strong>
                <p>{variant.subheadline}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderRoadmapSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Plan 12 mois">
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Objectif</th>
                  <th>Metrique</th>
                  <th>Resultat attendu</th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_PLAN_ROWS.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{row.objective}</td>
                    <td>{row.metric}</td>
                    <td>{row.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Prochaines decisions produit / business">
          <div className={styles.decisionList}>
            {nextDecisions.map((item) => (
              <article key={item} className={styles.decisionCard}>
                <strong>Decision a preparer</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderAiStrategySection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Strategie IA">
          <div className={styles.sectionPanelGrid}>
            {AI_STRATEGY_BLOCKS.map((block) => (
              <article key={block.title} className={styles.sectionCard}>
                <span>{block.title}</span>
                <p>{block.text}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Garde-fous">
          <div className={styles.decisionList}>
            <article className={styles.decisionCard}>
              <strong>Risque IA actuellement recense</strong>
              <p>{aiRiskCount} risque IA formellement documente dans le registre business.</p>
            </article>
            <article className={styles.decisionCard}>
              <strong>Regle produit</strong>
              <p>L'IA reste une option, supervisee humainement et mesuree avant extension.</p>
            </article>
            <article className={styles.decisionCard}>
              <strong>Priorite</strong>
              <p>La preuve terrain sur l'offre et la retention passe avant toute surcouche IA ambitieuse.</p>
            </article>
          </div>
        </DashboardPanel>
      </div>
    );
  }

  function renderSaasKpisSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="KPI SaaS et activation">
          <div className={styles.highlightGrid}>
            {kpiCards.map((item) => (
              <article key={item.label} className={styles.highlightCard}>
                <TrendingUp size={18} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.helper}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Alertes KPI">
          {kpis?.activation_alerts.length ? (
            <div className={styles.decisionList}>
              {kpis.activation_alerts.map((alert) => (
                <article key={alert.id} className={styles.decisionCard}>
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                  <p>{alert.next_action}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.sectionNote}>Aucune alerte KPI critique n'est remontee actuellement.</p>
          )}
        </DashboardPanel>
      </div>
    );
  }

  function renderFinancialForecastsSection() {
    return (
      <FinancialForecastModel />
    );
  }

  function renderSwotSection() {
    return (
      <div className={styles.swotGrid}>
        {SWOT_BLOCKS.map((block) => (
          <article key={block.title} className={styles.swotCard}>
            <span>{block.title}</span>
            <ul className={styles.plainList}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    );
  }

  function renderRisksSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Risques prioritaires">
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Risque</th>
                  <th>Priorite</th>
                  <th>Cause</th>
                  <th>Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {topRisks.map((risk) => (
                  <tr key={risk.id}>
                    <td>{risk.title}</td>
                    <td>{risk.priority}</td>
                    <td>{risk.cause}</td>
                    <td>{risk.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
        <RiskRegister />
      </div>
    );
  }

  function renderHypothesesSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Hypotheses critiques a valider">
          <div className={styles.decisionList}>
            {prioritizedHypotheses.map((item) => (
              <article key={item.id} className={styles.decisionCard}>
                <strong>{item.code}</strong>
                <p>{item.title}</p>
                <p>
                  Importance : {item.importance} | Incertitude : {item.uncertainty} | Priorite : {item.priority}
                </p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Regles Go / Test more / Pivot">
          <div className={styles.sectionPanelGrid}>
            {goNoGoRules.map((rule) => (
              <article key={rule.id} className={styles.sectionCard}>
                <span>{rule.title}</span>
                <ul className={styles.plainList}>
                  {rule.signals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <LeanValidationDashboard />
      </div>
    );
  }

  function renderActionPlanSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Plan d'action immediat">
          <div className={styles.sectionPanelGrid}>
            {immediateActionGroups.map((group) => (
              <article key={group.id} className={styles.sectionCard}>
                <span>{group.title}</span>
                <ul className={styles.plainList}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <div className={styles.sectionPanelGrid}>
          <DashboardPanel title="Principes de decision">
            <ul className={styles.plainList}>
              {decisionPrinciples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </DashboardPanel>
          <DashboardPanel title="Moments ou trancher">
            <ul className={styles.plainList}>
              {decisionTriggers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </DashboardPanel>
        </div>
      </div>
    );
  }

  function renderAppendicesSection() {
    return (
      <div className={styles.sectionStack}>
        <DashboardPanel title="Sources et modules relies">
          <div className={styles.appendixGrid}>
            {ANNEX_LINKS.map((item) => (
              <article key={item.title} className={styles.appendixCard}>
                <span>{item.title}</span>
                <strong>{item.note}</strong>
                {isInternalRoute(item.href) ? (
                  <Link href={item.href} className={styles.inlineLink}>
                    Ouvrir <ArrowRight size={15} />
                  </Link>
                ) : (
                  <code>{item.href}</code>
                )}
              </article>
            ))}
          </div>
        </DashboardPanel>
        <StrategicDecisionAssistant />
      </div>
    );
  }

  function renderSectionContent(sectionId: BusinessPlanSectionId) {
    if (sectionId === "summary") return renderSummarySection();
    if (sectionId === "vision") return renderVisionSection();
    if (sectionId === "problem") return renderProblemSection();
    if (sectionId === "solution") return renderSolutionSection();
    if (sectionId === "value") return renderValueSection();
    if (sectionId === "personas") return renderPersonasSection();
    if (sectionId === "marketStudy") return renderMarketStudySection();
    if (sectionId === "competition") return renderCompetitionSection();
    if (sectionId === "canvas") return renderCanvasSection();
    if (sectionId === "economicModel") return renderEconomicModelSection();
    if (sectionId === "pricing") return renderPricingSection();
    if (sectionId === "goToMarket") return renderGoToMarketSection();
    if (sectionId === "acquisition") return renderAcquisitionSection();
    if (sectionId === "roadmap") return renderRoadmapSection();
    if (sectionId === "aiStrategy") return renderAiStrategySection();
    if (sectionId === "saasKpis") return renderSaasKpisSection();
    if (sectionId === "financialForecasts") return renderFinancialForecastsSection();
    if (sectionId === "swot") return renderSwotSection();
    if (sectionId === "risks") return renderRisksSection();
    if (sectionId === "hypotheses") return renderHypothesesSection();
    if (sectionId === "actionPlan") return renderActionPlanSection();
    return renderAppendicesSection();
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Centre de pilotage strategique"
      subtitle="Business plan SaaS structure, navigation claire et modules detailles conserves sans perte de donnees."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Business plan", href: "/dashboard/admin/pilotage" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
      ]}
      stats={[
        { label: "Maturite globale", value: `${maturityScore}%`, hint: "Centre de pilotage SaaS" },
        { label: "Validees", value: String(statusCounts.validated), hint: "Sections deja stabilisees" },
        { label: "A completer", value: String(statusCounts.todo), hint: "Sections encore tres partielles" },
        { label: "Offre de production", value: "29 EUR", hint: "Concierge Pro existante" },
      ]}
      actions={[]}
      hideQuickActions
      activity={[
        {
          id: "business-plan-maturity",
          title: "Maturite du Business Plan",
          description: `${maturityScore}% de maturite globale calculee sur ${BUSINESS_PLAN_SECTIONS.length} sections.`,
          href: "/dashboard/admin/pilotage",
        },
        {
          id: "business-plan-pricing",
          title: "Monetisation active",
          description:
            "L'offre Concierge Pro reste la reference reelle, les autres configurations restant des hypotheses a tester.",
          href: "/dashboard/admin/pilotage",
        },
        {
          id: "business-plan-risks",
          title: "Risque principal",
          description:
            "Le risque majeur reste de vendre trop large avant d'avoir prouve clairement le segment qui paie.",
          href: "/dashboard/admin/pilotage",
        },
      ]}
      notifications={[
        {
          id: "business-plan-warning",
          title:
            sourceWarnings[0] ??
            "Le business plan reste en partie editorial : centralisation des donnees recommandee.",
          level: sourceWarnings.length > 0 ? "warning" : "info",
          href: "/dashboard/admin/pilotage",
        },
      ]}
      shortcuts={[
        { label: "Cockpit", href: "/dashboard/admin" },
        { label: "Contrôle", href: "/dashboard/admin/controle", badgeCount: blockedRequests },
        { label: "Développement", href: "/dashboard/admin/developpement" },
      ]}
      profile={{ name: "Direction PlanetLS", subtitle: "Pilotage business", badge: "Business plan" }}
    >
      <section className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Business plan PlanetLS</span>
            <h2>Un vrai centre de pilotage strategique SaaS</h2>
            <p>
              Le cockpit business est désormais organisé par grands axes de décision, avec des sous-sections,
              des accordéons, des indicateurs de maturité et la conservation des modules détaillés déjà
              présents dans le projet.
            </p>

            <div className={styles.progressShell}>
              <div className={styles.progressHeader}>
                <strong>Maturite globale du Business Plan</strong>
                <span className={styles.scorePill} data-tone={completionTone}>
                  {maturityScore}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${maturityScore}%` }} />
              </div>
              <div className={styles.progressMeta}>
                <span>{BUSINESS_PLAN_SECTIONS.length} sections structurees</span>
                <span>{statusCounts.validated} validees</span>
                <span>{statusCounts.review} a valider</span>
                <span>{statusCounts.todo} a completer</span>
              </div>
            </div>
          </div>

          <div className={styles.heroAside}>
            {planHighlights.map((item) => (
              <article key={item.label} className={styles.heroCard}>
                <item.icon size={18} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.helper}</p>
              </article>
            ))}
          </div>
        </section>

        {error ? (
          <section className={styles.warningBanner}>
            <AlertTriangle size={18} />
            <div>
              <strong>Chargement partiel</strong>
              <p>{error}</p>
            </div>
          </section>
        ) : null}

        {sourceWarnings.length > 0 ? (
          <section className={styles.warningBanner}>
            <AlertTriangle size={18} />
            <div>
              <strong>Sources a surveiller</strong>
              <p>{sourceWarnings.join(" · ")}</p>
            </div>
          </section>
        ) : null}

        <section className={styles.sectionStack}>
          <DashboardPanel title="Cockpit strategique">
            <div className={styles.heroScoreGrid}>
              {scoreCards.map((item) => (
                <article key={item.label} className={styles.heroScoreCard}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <p>{item.helper}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="KPI principaux">
            <div className={styles.kpiHeroGrid}>
              {topKpiCards.map((item) => (
                <article key={item.label} className={styles.kpiHeroCard}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.helper}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>

          <div className={styles.sectionPanelGrid}>
            <DashboardPanel title="A regarder en premier">
              <div className={styles.decisionList}>
                {attentionItems.map((item) => (
                  <article key={item.title} className={styles.decisionCard}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <p>{item.action}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Prochaines decisions">
              <div className={styles.decisionList}>
                {upcomingDecisions.map((item) => (
                  <article key={item.title} className={styles.decisionCard}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <p>{item.meta}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>
          </div>
        </section>

        <section className={styles.tabsWrap}>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as BusinessPlanTabId)}
          >
            <TabsList className={styles.topTabsList}>
              {sectionsByTab.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className={styles.tabTrigger}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {sectionsByTab.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className={styles.tabContent}>
                <div className={styles.sectionTabHeader}>
                  <div>
                    <span className={styles.eyebrow}>{tab.label}</span>
                    <h3>{tab.summary}</h3>
                  </div>
                  <div className={styles.sectionNav}>
                    {tab.sections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        className={styles.sectionNavButton}
                        onClick={() => openSection(section.id)}
                      >
                        <span>{section.order}. {section.title}</span>
                        <small>{BUSINESS_PLAN_STATUS_LABELS[section.status]}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.accordionStack}>
                  {tab.sections.map((section) => (
                    <BusinessCollapsibleSection
                      key={section.id}
                      id={section.id}
                      eyebrow={section.eyebrow}
                      title={section.title}
                      summary={section.summary}
                      badge={BUSINESS_PLAN_STATUS_LABELS[section.status]}
                      secondaryBadge={section.evidence}
                      isOpen={openSections[section.id]}
                      onToggle={() => toggleSection(section.id)}
                    >
                      {renderSectionContent(section.id)}
                    </BusinessCollapsibleSection>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <div className={styles.inlineLinks}>
          <Link href="/dashboard/admin/controle" className={styles.inlineLink}>
            Voir le contrôle opérationnel <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/developpement" className={styles.inlineLink}>
            Voir le Master Plan <ArrowRight size={15} />
          </Link>
          <Link href="/abonnement/concierge-pro" className={styles.inlineLink}>
            Voir l'offre Concierge Pro <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}
