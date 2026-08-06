"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Goal,
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
import { prioritizedHypotheses, validationTests } from "./market-validation/validationData";
import { businessRisks } from "./risk-register/riskData";
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

type Scenario = {
  name: string;
  subscribers: number;
  price: number;
  commissionVolume: number;
  commissionPct: number;
};

type BenchmarkRow = {
  actor: string;
  category: string;
  pricing: string;
  positioning: string;
  strengths: string;
  limits: string;
  lesson: string;
};

type PricingRow = {
  actor: string;
  amount: number;
  label: string;
  note: string;
  tone: "planetls" | "direct" | "indirect";
};

type CapabilityRow = {
  label: string;
  easyConcierge: string;
  turno: string;
  breezeway: string;
  guesty: string;
  airbnb: string;
  planetls: string;
};

type MarketScopeRow = {
  scope: string;
  amount: string;
  focus: string;
  note: string;
};

type MonthlyPlanRow = {
  month: string;
  objective: string;
  metric: string;
  expected: string;
};

type BusinessPlanTab = "overview" | "market" | "finance" | "execution";

const SCENARIOS: Scenario[] = [
  { name: "Pilote local", subscribers: 15, price: 99, commissionVolume: 12000, commissionPct: 8 },
  { name: "Traction régionale", subscribers: 45, price: 119, commissionVolume: 38000, commissionPct: 8 },
  { name: "Scale sélectif", subscribers: 90, price: 149, commissionVolume: 85000, commissionPct: 8 },
];

const BENCHMARK_ROWS: BenchmarkRow[] = [
  {
    actor: "Easy Concierge",
    category: "PMS / conciergeries",
    pricing: "À partir de 25 € HT / mois",
    positioning: "PMS français centré sur les conciergeries gérant de 5 à 500+ logements.",
    strengths: "Conformité française, portail propriétaire, réservations et facturation.",
    limits: "Peu de logique marketplace ouverte ou de réseau d'artisans.",
    lesson: "PlanetLS peut rester plus réseau, plus multi-profils et plus orienté collaboration locale.",
  },
  {
    actor: "Turno",
    category: "Marketplace ménage / opérations",
    pricing: "Gratuit dans certains cas, puis abonnement selon usage",
    positioning: "Rotation ménage, checklists, photos, paiements et prestataires locaux.",
    strengths: "Parcours ultra clair, terrain, mobile, marketplace déjà intégrée.",
    limits: "Très fort sur le ménage, beaucoup moins large sur la conciergerie complète.",
    lesson: "PlanetLS doit reprendre cette clarté opérationnelle sans se limiter au ménage.",
  },
  {
    actor: "Breezeway",
    category: "Opérations terrain",
    pricing: "Tarification sur devis",
    positioning: "Qualité, maintenance, tâches, inspections et coordination d'équipes.",
    strengths: "Contrôle qualité, checklists, maintenance, profondeur opérationnelle.",
    limits: "Peu de mise en relation et produit moins accessible aux petits acteurs.",
    lesson: "PlanetLS peut être plus simple, plus local et plus orienté acquisition de missions.",
  },
  {
    actor: "Guesty",
    category: "PMS international",
    pricing: "Offres variables / souvent sur devis",
    positioning: "PMS complet avec automatisation, finance, opérations et IA.",
    strengths: "Marque forte, intégrations nombreuses, ampleur fonctionnelle.",
    limits: "Complexe, coûteux et peu centré sur le réseau local de professionnels.",
    lesson: "PlanetLS ne doit pas copier Guesty, mais traiter ce qu'il couvre moins bien : relations locales et exécution.",
  },
  {
    actor: "Airbnb co-hôtes",
    category: "Réseau de co-hôtes",
    pricing: "Tarification libre / variable",
    positioning: "Mise en relation simple entre hôtes et co-hôtes dans l'écosystème Airbnb.",
    strengths: "Confiance, profils évalués, simplicité et puissance de distribution.",
    limits: "Dépendance à Airbnb, peu d'artisans, peu de workflows complets multi-plateformes.",
    lesson: "PlanetLS peut offrir un réseau indépendant, plus large et plus opérationnel.",
  },
  {
    actor: "AlloVoisins & marketplaces locales",
    category: "Services généralistes",
    pricing: "Variables selon mission",
    positioning: "Demandes locales rapides pour ménage, bricolage, plomberie, etc.",
    strengths: "Volume, proximité, simplicité de publication d'une demande.",
    limits: "Aucun contexte location saisonnière, peu de suivi, peu de preuves et peu de collaboration durable.",
    lesson: "PlanetLS doit apporter le contexte métier, la traçabilité et la continuité de la prestation.",
  },
];

const PRICING_ROWS: PricingRow[] = [
  {
    actor: "Easy Concierge",
    amount: 25,
    label: "25 € HT",
    note: "Entrée PMS française pour 5 logements",
    tone: "direct",
  },
  {
    actor: "Turno",
    amount: 45,
    label: "Variable",
    note: "Gratuit dans certains cas, puis abonnement selon usage",
    tone: "direct",
  },
  {
    actor: "Breezeway",
    amount: 80,
    label: "Sur devis",
    note: "Positionnement plus haut de gamme / équipes structurées",
    tone: "direct",
  },
  {
    actor: "Guesty",
    amount: 95,
    label: "Variable",
    note: "Plutôt conçu pour structures plus denses",
    tone: "indirect",
  },
  {
    actor: "PlanetLS lancement",
    amount: 99,
    label: "99 € HT",
    note: "Offre recommandée Conciergerie Pro",
    tone: "planetls",
  },
  {
    actor: "PlanetLS cible",
    amount: 149,
    label: "149 € HT",
    note: "Après validation d'usage, de rétention et de profondeur métier",
    tone: "planetls",
  },
];

const CAPABILITY_ROWS: CapabilityRow[] = [
  {
    label: "PMS et réservations",
    easyConcierge: "Très fort",
    turno: "Moyen",
    breezeway: "Faible",
    guesty: "Très fort",
    airbnb: "Airbnb seulement",
    planetls: "Progressif",
  },
  {
    label: "Réseau de concierges",
    easyConcierge: "Faible",
    turno: "Faible",
    breezeway: "Faible",
    guesty: "Faible",
    airbnb: "Très fort",
    planetls: "Très fort",
  },
  {
    label: "Réseau d'artisans",
    easyConcierge: "Faible",
    turno: "Limité",
    breezeway: "Faible",
    guesty: "Faible",
    airbnb: "Très faible",
    planetls: "Très fort",
  },
  {
    label: "Marketplace locale",
    easyConcierge: "Faible",
    turno: "Très fort",
    breezeway: "Faible",
    guesty: "Faible",
    airbnb: "Fort",
    planetls: "Très fort",
  },
  {
    label: "Demandes multi-prestataires",
    easyConcierge: "Faible",
    turno: "Fort",
    breezeway: "Faible",
    guesty: "Faible",
    airbnb: "Partiel",
    planetls: "Très fort",
  },
  {
    label: "Missions, planning, preuves",
    easyConcierge: "Fort",
    turno: "Très fort",
    breezeway: "Très fort",
    guesty: "Fort",
    airbnb: "Moyen",
    planetls: "Très fort",
  },
];

const MARKET_SCOPE_ROWS: MarketScopeRow[] = [
  {
    scope: "TAM",
    amount: "Large marché location saisonnière + services associés",
    focus: "Vision longue : logiciels, coordination terrain, réseau de prestataires.",
    note: "Utile pour la narration investisseur, trop large pour piloter le lancement.",
  },
  {
    scope: "SAM",
    amount: "Conciergeries et exploitants structurés en France",
    focus: "Cible solvable capable de payer un cockpit métier mensuel.",
    note: "Périmètre le plus crédible pour signer les premiers comptes récurrents.",
  },
  {
    scope: "SOM",
    amount: "Zone pilote + quelques dizaines de comptes activés",
    focus: "Petit marché réellement attaquable à 12 mois.",
    note: "Le vrai sujet n'est pas la taille théorique mais la densité locale prouvée.",
  },
];

const MONTHLY_PLAN_ROWS: MonthlyPlanRow[] = [
  {
    month: "M1-M2",
    objective: "Entretiens, discours commercial, qualification de la cible",
    metric: "Entretiens et objections structurées",
    expected: "Une proposition de valeur nette et un segment prioritaire assumé",
  },
  {
    month: "M3-M4",
    objective: "Signer des pilotes et mesurer la première valeur",
    metric: "Comptes payants ou pilotes activés",
    expected: "Premiers comptes récurrents avec usage réel dans la semaine",
  },
  {
    month: "M5-M6",
    objective: "Prouver rétention, routine d'usage et profondeur opérationnelle",
    metric: "Usage hebdomadaire, missions suivies, churn pilote",
    expected: "Signaux crédibles de réachat ou maintien sur abonnement",
  },
  {
    month: "M7-M9",
    objective: "Standardiser onboarding, support et cas d'usage dominants",
    metric: "Temps d'onboarding et marge de service",
    expected: "Une vente plus simple et un coût d'accompagnement mieux tenu",
  },
  {
    month: "M10-M12",
    objective: "Étendre sélectivement et arbitrer l'ajout d'une commission",
    metric: "MRR, activation multi-zones, volume mission intermédié",
    expected: "Décision claire entre SaaS pur renforcé ou hybride SaaS + commission",
  },
];

const RISK_PRIORITY_LABELS: Record<string, string> = {
  critique: "Critique",
  prioritaire: "Prioritaire",
  surveiller: "À surveiller",
  acceptable: "Acceptable",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function sumScenarioRevenue(scenario: Scenario) {
  return scenario.subscribers * scenario.price;
}

function sumScenarioCommission(scenario: Scenario) {
  return Math.round((scenario.commissionVolume * scenario.commissionPct) / 100);
}

function getCapabilityTone(value: string) {
  if (value.includes("Très fort")) return "strong";
  if (value.includes("Fort")) return "good";
  if (value.includes("Moyen") || value.includes("Partiel") || value.includes("Progressif")) return "mid";
  if (value.includes("Faible") || value.includes("Limité") || value.includes("Très faible")) return "weak";
  return "neutral";
}

export default function AdminBusinessPage() {
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [operations, setOperations] = useState<AdminOperationsPayload | null>(null);
  const [kpis, setKpis] = useState<KpiOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BusinessPlanTab>("overview");

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
        console.error("Erreur chargement pilotage business admin :", loadError);
        setError("Le business plan n'a pas pu être chargé.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const requests = operations?.requests ?? [];
  const missions = operations?.missions ?? [];

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

  const lastUpdated = useMemo(() => {
    const dates = [
      overview?.health?.updatedAt,
      operations?.health?.updatedAt,
      kpis?.health?.updated_at,
    ].filter((item): item is string => Boolean(item));
    if (dates.length === 0) return null;
    return dates
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((left, right) => right.getTime() - left.getTime())[0]
      ?.toISOString();
  }, [kpis, operations, overview]);

  const tractionBars = useMemo(() => {
    const summary = overview?.summary;
    if (!summary) return [];

    const bars = [
      { label: "Propriétaires", value: summary.owners, color: "gold" as const },
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

  const pricingRows = useMemo(() => {
    const max = Math.max(...PRICING_ROWS.map((item) => item.amount), 1);
    return PRICING_ROWS.map((item) => ({
      ...item,
      ratio: Math.max(14, Math.round((item.amount / max) * 100)),
    }));
  }, []);

  const financeScenarioRows = SCENARIOS.map((scenario) => {
    const mrr = sumScenarioRevenue(scenario);
    const monthlyCommission = sumScenarioCommission(scenario);
    const totalMonthly = mrr + monthlyCommission;
    return {
      ...scenario,
      mrr,
      monthlyCommission,
      totalMonthly,
      arr: totalMonthly * 12,
    };
  });

  const topRisks = businessRisks.slice(0, 4);
  const criticalRisks = businessRisks.filter((item) => item.priority === "critique").length;
  const validationCounts = {
    tests: validationTests.length,
    hypotheses: prioritizedHypotheses.length,
  };

  const planHighlights = [
    {
      label: "Cible prioritaire",
      value: "Conciergeries structurées",
      helper: "Le segment le plus crédible pour fréquence d'usage, coordination et panier mensuel.",
      icon: Building2,
    },
    {
      label: "Offre cœur",
      value: "Conciergerie Pro",
      helper: "Abonnement logiciel pilotant réseau local, demandes, missions, preuves et suivi.",
      icon: BriefcaseBusiness,
    },
    {
      label: "Modèle recommandé",
      value: "Abonnement d'abord",
      helper: "Base récurrente plus lisible, commission en surcouche seulement si le terrain la valide.",
      icon: CircleDollarSign,
    },
    {
      label: "Horizon stratégique",
      value: "90 jours",
      helper: "Prouver le segment payeur, l'activation utile et la capacité de rétention pilote.",
      icon: Goal,
    },
  ];

  const quickActions = [
    {
      label: "Ouvrir le contrôle admin",
      href: "/dashboard/admin/controle",
      description: "Relier les arbitrages business aux tensions opérationnelles visibles.",
    },
    {
      label: "Ouvrir le développement",
      href: "/dashboard/admin/developpement",
      description: "Vérifier l'alignement entre priorité business, roadmap et réalité du code.",
    },
  ];

  const boardNarrative = [
    "PlanetLS possède déjà un socle produit crédible sur les demandes, devis, missions, preuves et dashboards métier.",
    "La priorité n'est plus la largeur fonctionnelle mais la preuve qu'une conciergerie paie et reste active pour ce cockpit.",
    "Le scénario de création de valeur le plus défendable est un abonnement B2B clair, avec éventuelle commission seulement après preuve de flux.",
  ];

  const competitorInsights = [
    "Easy Concierge montre qu'un prix d'entrée bas rassure les conciergeries françaises, mais ne couvre pas la logique réseau local multi-profils.",
    "Turno confirme que la simplicité terrain, le mobile et les preuves sont devenus non négociables pour les interventions.",
    "Breezeway et Guesty montrent qu'un marché mature attend une profondeur opérationnelle forte, mais souvent au prix de la complexité.",
    "Airbnb et les marketplaces locales prouvent que la mise en relation seule ne suffit pas : la continuité de la prestation reste le vrai différenciateur.",
  ];

  if (loading) {
    return <div className="center">Chargement du business plan...</div>;
  }

  if (error) {
    return <div className="center">{error}</div>;
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Business plan PlanetLS"
      subtitle="Une lecture unique pour cadrer la traction, le modèle économique, le benchmark et les priorités de lancement."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Business plan", href: "/dashboard/admin/pilotage" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
      ]}
      stats={[
        { label: "Offre cible", value: "Conciergerie Pro", hint: "Segment B2B prioritaire" },
        { label: "Prix d'appel", value: "99 € HT", hint: "Lancement recommandé" },
        { label: "Commission testée", value: "8 %", hint: "À valider sur missions réelles" },
        {
          label: "Validation terrain",
          value: `${validationCounts.tests} tests`,
          hint: `${validationCounts.hypotheses} hypothèses à challenger`,
        },
      ]}
      actions={quickActions}
      activity={[
        {
          id: "business-thesis",
          title: "Thèse produit",
          description:
            "PlanetLS doit se vendre comme cockpit métier + réseau local spécialisé, pas comme PMS générique.",
          href: "/dashboard/admin/pilotage",
        },
        {
          id: "business-traction",
          title: "Traction réelle",
          description: overview
            ? `${overview.summary.totalUsers} comptes, ${overview.summary.properties} biens, ${overview.summary.serviceRequests} demandes visibles.`
            : "Traction indisponible.",
          href: "/dashboard/admin",
        },
        {
          id: "business-risks",
          title: "Risque principal",
          description:
            "Le plus grand risque reste de lancer trop large avant d'avoir prouvé la cible qui paie vraiment.",
          href: "/dashboard/admin/pilotage",
        },
      ]}
      notifications={[
        {
          id: "business-priority",
          title:
            "Le risque principal reste de lancer trop large avant d'avoir prouvé la cible qui paie vraiment.",
          level: criticalRisks > 0 ? "warning" : "info",
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
            <span className={styles.eyebrow}>Business plan 2026</span>
            <h2>Construire un SaaS métier qui connecte acquisition locale et exécution terrain.</h2>
            <p>
              PlanetLS a déjà un socle produit crédible. Le prochain enjeu n&apos;est pas d&apos;ajouter
              encore des modules, mais de prouver qu&apos;une conciergerie paie pour un cockpit qui relie
              réseau local, demandes, devis, missions, preuves et suivi opérationnel.
            </p>
          </div>

          <div className={styles.heroAside}>
            <article className={styles.heroCard}>
              <span>Décision fondatrice</span>
              <strong>Abonnement d&apos;abord, commission ensuite</strong>
              <p>
                Prioriser un revenu récurrent lisible, puis tester une surcouche de commission seulement
                si la mise en relation produit génère déjà assez de flux.
              </p>
            </article>
            <article className={styles.heroCard}>
              <span>Dernière mise à jour</span>
              <strong>{formatDateTime(lastUpdated)}</strong>
              <p>Lecture alimentée par les endpoints admin et par le cadre business déjà présent dans le projet.</p>
            </article>
          </div>
        </section>

        {sourceWarnings.length > 0 ? (
          <section className={styles.warningBanner} role="status">
            <AlertTriangle size={18} />
            <div>
              <strong>Lecture prudente recommandée</strong>
              <p>{sourceWarnings.join(" ")}</p>
            </div>
          </section>
        ) : null}

        <section className={styles.highlightGrid}>
          {planHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className={styles.highlightCard}>
                <Icon size={18} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.helper}</p>
              </article>
            );
          })}
        </section>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BusinessPlanTab)}>
          <div className={styles.tabsWrap}>
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="overview" className={styles.tabTrigger}>Vue d&apos;ensemble</TabsTrigger>
              <TabsTrigger value="market" className={styles.tabTrigger}>Marché & offre</TabsTrigger>
              <TabsTrigger value="finance" className={styles.tabTrigger}>Finance</TabsTrigger>
              <TabsTrigger value="execution" className={styles.tabTrigger}>Exécution & risques</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className={styles.tabContent}>
            <section className={styles.grid}>
              <DashboardPanel title="Narration board / investisseur">
                <div className={styles.decisionList}>
                  {boardNarrative.map((item) => (
                    <article key={item} className={styles.decisionCard}>
                      <strong>Point clé</strong>
                      <p>{item}</p>
                    </article>
                  ))}
                </div>
              </DashboardPanel>

              <DashboardPanel title="Résumé exécutif">
                <div className={styles.summaryList}>
                  <article className={styles.summaryCard}>
                    <Sparkles size={18} />
                    <div>
                      <strong>Positionnement</strong>
                      <p>
                        PlanetLS doit se positionner comme réseau professionnel opérationnel de la location
                        saisonnière, avec exécution intégrée après la mise en relation.
                      </p>
                    </div>
                  </article>
                  <article className={styles.summaryCard}>
                    <TrendingUp size={18} />
                    <div>
                      <strong>Objectif 90 jours</strong>
                      <p>
                        Signer des conciergeries pilotes, mesurer l&apos;usage réel, puis verrouiller prix,
                        activation et rétention avant tout scale plus large.
                      </p>
                    </div>
                  </article>
                  <article className={styles.summaryCard}>
                    <ShieldAlert size={18} />
                    <div>
                      <strong>Risque à éviter</strong>
                      <p>
                        Multiplier les promesses pour quatre profils à la fois sans segment payeur clairement
                        assumé ni métrique de valeur répétable.
                      </p>
                    </div>
                  </article>
                </div>
              </DashboardPanel>

              <DashboardPanel title="Traction actuelle">
                <div className={styles.metricGrid}>
                  <article className={styles.metricCard}>
                    <span>Comptes</span>
                    <strong>{overview?.summary.totalUsers ?? 0}</strong>
                    <p>{overview?.summary.active7d ?? 0} actifs sur 7 jours.</p>
                  </article>
                  <article className={styles.metricCard}>
                    <span>Demandes</span>
                    <strong>{overview?.summary.serviceRequests ?? 0}</strong>
                    <p>{blockedRequests} blocage(s) explicite(s) repérés.</p>
                  </article>
                  <article className={styles.metricCard}>
                    <span>Missions</span>
                    <strong>{overview?.summary.missions ?? 0}</strong>
                    <p>{lateUnbilledMissions} mission(s) passées sans facture visible.</p>
                  </article>
                  <article className={styles.metricCard}>
                    <span>Devis acceptés à transformer</span>
                    <strong>{acceptedWithoutMission}</strong>
                    <p>Point direct entre promesse commerciale et exécution réelle.</p>
                  </article>
                </div>
              </DashboardPanel>
            </section>
          </TabsContent>

          <TabsContent value="market" className={styles.tabContent}>
            <section className={styles.grid}>
              <DashboardPanel title="Tarifs du marché">
                <div className={styles.comparisonChart}>
                  {pricingRows.map((row) => (
                    <article key={row.actor} className={styles.comparisonRow}>
                      <div className={styles.comparisonMeta}>
                        <span>{row.actor}</span>
                        <strong>{row.label}</strong>
                      </div>
                      <div className={styles.comparisonTrack}>
                        <div
                          className={styles.comparisonFill}
                          data-tone={row.tone}
                          style={{ width: `${row.ratio}%` }}
                        />
                      </div>
                      <p>{row.note}</p>
                    </article>
                  ))}
                </div>
                <p className={styles.sectionNote}>
                  Lecture comparative construite à partir de l&apos;étude concurrentielle interne d&apos;août 2026.
                  Pour les acteurs sur devis ou variables, la barre sert de repère visuel de positionnement et non de tarif contractuel exact.
                </p>
              </DashboardPanel>

              <DashboardPanel title="TAM / SAM / SOM">
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Scope</th>
                        <th>Lecture</th>
                        <th>Focus</th>
                        <th>Interprétation</th>
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
                <p className={styles.sectionNote}>
                  La lecture marché est volontairement qualitative ici. Pour PlanetLS, la crédibilité ne viendra
                  pas d&apos;un grand TAM théorique mais d&apos;un SOM réellement conquis et bien retenu.
                </p>
              </DashboardPanel>

              <DashboardPanel title="Répartition du socle actuel">
                <div className={styles.barChart}>
                  {tractionBars.map((item) => (
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
                  ))}
                </div>
                <p className={styles.sectionNote}>
                  Ce graphe lit la base actuelle comme point de départ traction. Il ne remplace pas une étude
                  de marché, mais aide à visualiser où PlanetLS possède déjà un minimum de matière exploitable.
                </p>
              </DashboardPanel>

              <DashboardPanel title="Offre et proposition de valeur">
                <div className={styles.offerCard}>
                  <div className={styles.offerHeader}>
                    <div>
                      <span className={styles.eyebrow}>Offre recommandée</span>
                      <h3>Conciergerie Pro</h3>
                    </div>
                    <div className={styles.priceBlock}>
                      <strong>99 € HT</strong>
                      <span>lancement</span>
                    </div>
                  </div>
                  <div className={styles.offerPoints}>
                    <p>1. Centraliser demandes, devis, missions, preuves et suivi dans une seule interface.</p>
                    <p>2. Aider la conciergerie à orchestrer propriétaires, équipes et artisans locaux.</p>
                    <p>3. Créer une valeur visible dès la première semaine avec un besoin réellement piloté.</p>
                    <p>4. Monter vers 149 € HT après validation d&apos;usage, de rétention et de profondeur métier.</p>
                  </div>
                </div>
              </DashboardPanel>

              <DashboardPanel title="Benchmark concurrentiel intégré">
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Catégorie</th>
                        <th>Tarification</th>
                        <th>Positionnement</th>
                        <th>Forces</th>
                        <th>Limites</th>
                        <th>Leçon pour PlanetLS</th>
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

              <DashboardPanel title="Tableau comparatif synthétique">
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Critère</th>
                        <th>Easy Concierge</th>
                        <th>Turno</th>
                        <th>Breezeway</th>
                        <th>Guesty</th>
                        <th>Airbnb co-hôtes</th>
                        <th>PlanetLS cible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CAPABILITY_ROWS.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td><span className={styles.scorePill} data-tone={getCapabilityTone(row.easyConcierge)}>{row.easyConcierge}</span></td>
                          <td><span className={styles.scorePill} data-tone={getCapabilityTone(row.turno)}>{row.turno}</span></td>
                          <td><span className={styles.scorePill} data-tone={getCapabilityTone(row.breezeway)}>{row.breezeway}</span></td>
                          <td><span className={styles.scorePill} data-tone={getCapabilityTone(row.guesty)}>{row.guesty}</span></td>
                          <td><span className={styles.scorePill} data-tone={getCapabilityTone(row.airbnb)}>{row.airbnb}</span></td>
                          <td><span className={styles.scorePill} data-tone={getCapabilityTone(row.planetls)}>{row.planetls}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardPanel>

              <DashboardPanel title="Enseignements du benchmark">
                <div className={styles.decisionList}>
                  {competitorInsights.map((item) => (
                    <article key={item} className={styles.decisionCard}>
                      <strong>Signal marché</strong>
                      <p>{item}</p>
                    </article>
                  ))}
                </div>
              </DashboardPanel>
            </section>
          </TabsContent>

          <TabsContent value="finance" className={styles.tabContent}>
            <section className={styles.grid}>
              <DashboardPanel title="Scénarios financiers">
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Scénario</th>
                        <th>Abonnés</th>
                        <th>Prix mensuel</th>
                        <th>MRR abonnement</th>
                        <th>Commission mensuelle</th>
                        <th>Revenu mensuel total</th>
                        <th>ARR théorique</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeScenarioRows.map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td>{row.subscribers}</td>
                          <td>{formatMoney(row.price)}</td>
                          <td>{formatMoney(row.mrr)}</td>
                          <td>{formatMoney(row.monthlyCommission)}</td>
                          <td>{formatMoney(row.totalMonthly)}</td>
                          <td>{formatMoney(row.arr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={styles.sectionNote}>
                  Ces scénarios servent de repères de décision internes. Ils traduisent l&apos;hypothèse
                  abonnement + commission testée dans le projet, pas des revenus déjà acquis.
                </p>
              </DashboardPanel>

              <DashboardPanel title="Économie unitaire cible">
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Levier</th>
                        <th>Cible de travail</th>
                        <th>Pourquoi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Prix d&apos;entrée</td>
                        <td>99 € HT / mois</td>
                        <td>Permet un test commercial simple et lisible.</td>
                      </tr>
                      <tr>
                        <td>Prix cible</td>
                        <td>149 € HT / mois</td>
                        <td>À défendre si le cockpit devient central dans l&apos;exploitation quotidienne.</td>
                      </tr>
                      <tr>
                        <td>Commission optionnelle</td>
                        <td>8 %</td>
                        <td>Seulement si PlanetLS apporte réellement les missions et la coordination.</td>
                      </tr>
                      <tr>
                        <td>Délai première valeur</td>
                        <td>&lt; 7 jours</td>
                        <td>Le pilote doit ressentir un bénéfice très vite pour rester engagé.</td>
                      </tr>
                      <tr>
                        <td>Signal de rétention</td>
                        <td>Usage hebdomadaire récurrent</td>
                        <td>Condition minimale avant industrialisation commerciale plus large.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DashboardPanel>
            </section>
          </TabsContent>

          <TabsContent value="execution" className={styles.tabContent}>
            <section className={styles.grid}>
              <DashboardPanel title="Go-to-market piloté">
                <div className={styles.roadmapList}>
                  <article className={styles.roadmapCard}>
                    <Target size={18} />
                    <div>
                      <strong>30 jours</strong>
                      <p>Entretiens, tests de discours, objections prix, qualification du segment payeur.</p>
                    </div>
                  </article>
                  <article className={styles.roadmapCard}>
                    <BarChart3 size={18} />
                    <div>
                      <strong>60 jours</strong>
                      <p>Signer les premiers pilotes, suivre activation réelle, verrouiller les cas d&apos;usage répétés.</p>
                    </div>
                  </article>
                  <article className={styles.roadmapCard}>
                    <Banknote size={18} />
                    <div>
                      <strong>90 jours</strong>
                      <p>Décider si le modèle abonnement suffit ou si une commission doit compléter le revenu.</p>
                    </div>
                  </article>
                  <article className={styles.roadmapCard}>
                    <Users size={18} />
                    <div>
                      <strong>Après preuve</strong>
                      <p>Étendre à plus de zones et à davantage d&apos;artisans seulement quand la boucle locale tient.</p>
                    </div>
                  </article>
                </div>
              </DashboardPanel>

              <DashboardPanel title="Plan 12 mois">
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Période</th>
                        <th>Objectif</th>
                        <th>Métrique suivie</th>
                        <th>Résultat attendu</th>
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

              <DashboardPanel title="Conditions avant accélération">
                <div className={styles.decisionList}>
                  <article className={styles.decisionCard}>
                    <strong>Condition 1</strong>
                    <p>Des comptes pilotes doivent payer ou confirmer une intention de paiement défendable.</p>
                  </article>
                  <article className={styles.decisionCard}>
                    <strong>Condition 2</strong>
                    <p>Le gain opérationnel doit être visible sur un cas d&apos;usage répété, pas seulement apprécié en démo.</p>
                  </article>
                  <article className={styles.decisionCard}>
                    <strong>Condition 3</strong>
                    <p>Le support et l&apos;onboarding doivent commencer à se standardiser avant toute expansion plus large.</p>
                  </article>
                </div>
              </DashboardPanel>

              <DashboardPanel title="Risques prioritaires">
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Risque</th>
                        <th>Priorité</th>
                        <th>Cause principale</th>
                        <th>Réponse attendue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRisks.map((risk) => (
                        <tr key={risk.id}>
                          <td>{risk.title}</td>
                          <td>{RISK_PRIORITY_LABELS[risk.priority] ?? risk.priority}</td>
                          <td>{risk.cause}</td>
                          <td>{risk.mitigation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={styles.sectionNote}>
                  {criticalRisks} risque(s) critique(s) restent documentés dans le registre global. Ici, seuls les
                  risques les plus structurants pour le business plan sont remontés.
                </p>
              </DashboardPanel>

              <DashboardPanel title="Points de décision immédiats">
                <div className={styles.decisionList}>
                  <article className={styles.decisionCard}>
                    <strong>Choisir le segment prioritaire sans ambiguïté</strong>
                    <p>Conciergeries structurées en premier, avant d&apos;élargir la narration aux quatre espaces.</p>
                  </article>
                  <article className={styles.decisionCard}>
                    <strong>Vendre un bénéfice concret, pas une plateforme totale</strong>
                    <p>Le discours doit partir d&apos;un gain opérationnel visible, pas d&apos;une promesse trop large.</p>
                  </article>
                  <article className={styles.decisionCard}>
                    <strong>Relier preuve commerciale et preuve produit</strong>
                    <p>Un pilote signé doit immédiatement nourrir les métriques d&apos;activation et les tensions terrain.</p>
                  </article>
                </div>
                <div className={styles.inlineLinks}>
                  <Link href="/dashboard/admin/controle" className={styles.inlineLink}>
                    Voir le contrôle opérationnel <ArrowRight size={15} />
                  </Link>
                  <Link href="/dashboard/admin/developpement" className={styles.inlineLink}>
                    Voir le Master Plan <ArrowRight size={15} />
                  </Link>
                </div>
              </DashboardPanel>
            </section>
          </TabsContent>
        </Tabs>
      </section>
    </DashboardLayout>
  );
}
