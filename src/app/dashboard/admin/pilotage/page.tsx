"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  ClipboardList,
  LayoutDashboard,
  Rocket,
  ShieldAlert,
  Target,
  Users,
} from "lucide-react";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import type { KpiOverviewPayload } from "@/app/api/kpis/overview/shared";
import type { AdminMissionRow, AdminRequestRow } from "../AdminOperations";
import { BusinessCollapsibleSection } from "./BusinessCollapsibleSection";
import { StrategicDecisionAssistant } from "./decision-assistant/StrategicDecisionAssistant";
import { LeanValidationDashboard } from "./market-validation/LeanValidationDashboard";
import { prioritizedHypotheses, validationTests } from "./market-validation/validationData";
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

type AdminControlPayload = {
  summary: {
    onboarding: { total: number; healthy: number; warning: number; danger: number };
    missions: { total: number; healthy: number; warning: number; danger: number };
    messages: { total: number; healthy: number; warning: number; danger: number };
    totalProblems: number;
  };
};

type PilotageTab = "overview" | "strategy" | "validation" | "risks" | "actions";

type OpenSections = Record<string, boolean>;

const TAB_STORAGE_KEY = "planetls-pilotage-tab";
const SECTION_STORAGE_KEY = "planetls-pilotage-sections";

const TAB_ITEMS: Array<{
  id: PilotageTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "strategy", label: "Stratégie", icon: Target },
  { id: "validation", label: "Validation marché", icon: Rocket },
  { id: "risks", label: "Risques", icon: ShieldAlert },
  { id: "actions", label: "Actions & roadmap", icon: ClipboardList },
];

const DEFAULT_OPEN_SECTIONS: OpenSections = {
  strategy_method: true,
  validation_detail: false,
  risks_register: false,
  actions_notes: false,
};

function isPilotageTab(value: string | null): value is PilotageTab {
  return TAB_ITEMS.some((item) => item.id === value);
}

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

function safeReadSections() {
  if (typeof window === "undefined") return DEFAULT_OPEN_SECTIONS;
  try {
    const raw = window.localStorage.getItem(SECTION_STORAGE_KEY);
    if (!raw) return DEFAULT_OPEN_SECTIONS;
    const parsed = JSON.parse(raw) as OpenSections;
    return { ...DEFAULT_OPEN_SECTIONS, ...parsed };
  } catch {
    return DEFAULT_OPEN_SECTIONS;
  }
}

export default function AdminBusinessPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [operations, setOperations] = useState<AdminOperationsPayload | null>(null);
  const [control, setControl] = useState<AdminControlPayload | null>(null);
  const [kpis, setKpis] = useState<KpiOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PilotageTab>("overview");
  const [openSections, setOpenSections] = useState<OpenSections>(DEFAULT_OPEN_SECTIONS);

  useEffect(() => {
    const queryTab =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("tab")
        : null;
    const nextTab = isPilotageTab(queryTab)
      ? queryTab
      : typeof window !== "undefined" && isPilotageTab(window.localStorage.getItem(TAB_STORAGE_KEY))
        ? (window.localStorage.getItem(TAB_STORAGE_KEY) as PilotageTab)
        : "overview";
    setActiveTab(nextTab);
    setOpenSections(safeReadSections());
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [overviewRes, operationsRes, controlRes, kpiRes] = await Promise.allSettled([
          fetch("/api/admin/overview", { cache: "no-store" }),
          fetch("/api/admin/operations?limit=200", { cache: "no-store" }),
          fetch("/api/admin/control-tower", { cache: "no-store" }),
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
        setControl(
          controlRes.status === "fulfilled" && controlRes.value.ok
            ? ((await controlRes.value.json()) as AdminControlPayload)
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
        setError("Le pilotage business et financier n'a pas pu être chargé.");
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

  const topAlerts = [
    blockedRequests > 0 ? `${blockedRequests} demande(s) présentent un blocage explicite.` : null,
    acceptedWithoutMission > 0
      ? `${acceptedWithoutMission} devis acceptés n'ont pas encore produit de mission.`
      : null,
    lateUnbilledMissions > 0
      ? `${lateUnbilledMissions} mission(s) datées restent sans facture visible.`
      : null,
    (control?.summary.totalProblems ?? 0) > 0
      ? `${control?.summary.totalProblems ?? 0} point(s) de contrôle restent ouverts sur la plateforme.`
      : null,
  ].filter((item): item is string => Boolean(item));

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
      .sort((a, b) => b.getTime() - a.getTime())[0]
      ?.toISOString();
  }, [kpis, operations, overview]);

  const riskSummary = useMemo(
    () => ({
      total: businessRisks.length,
      critical: businessRisks.filter((item) => item.priority === "critique").length,
      priority: businessRisks.filter((item) => item.priority === "prioritaire").length,
      market: businessRisks.filter((item) => item.category === "marketplace" || item.category === "marche")
        .length,
    }),
    [],
  );

  const validationSummary = useMemo(
    () => ({
      tests: validationTests.length,
      problem: validationTests.filter((item) => item.phase === "problem").length,
      interest: validationTests.filter((item) => item.phase === "interest").length,
      pay: validationTests.filter((item) => item.phase === "willingness_to_pay").length,
      hypotheses: prioritizedHypotheses.length,
    }),
    [],
  );

  const priorityItems = [
    {
      level: "Critique",
      title: "Choisir le premier segment payeur",
      reason: "La page, le prix et les tests resteront flous tant que la cible prioritaire n'est pas tranchée.",
      deadline: "Cette semaine",
      status: "En attente",
      href: "/dashboard/admin/pilotage?tab=validation",
      action: "Ouvrir la validation",
    },
    {
      level: "Important",
      title: "Lancer les entretiens terrain",
      reason: "Aucune décision pricing ou offre ne doit être gelée avant les retours comportementaux.",
      deadline: "Sous 7 jours",
      status: "À faire",
      href: "/dashboard/admin/pilotage?tab=validation",
      action: "Voir les tests",
    },
    {
      level: "Important",
      title: "Réduire les points de friction opérationnels",
      reason: topAlerts[0] ?? "Les blocages métier doivent rester visibles tant que l'exécution n'est pas stabilisée.",
      deadline: "Sous 14 jours",
      status: topAlerts.length > 0 ? "À reprendre" : "Sous contrôle",
      href: "/dashboard/admin/controle",
      action: "Voir le contrôle",
    },
    {
      level: "À planifier",
      title: "Structurer le registre des risques persistant",
      reason: "Le registre actuel est utile, mais encore statique et sans historique de traitement.",
      deadline: "Après validation marché",
      status: "Plus tard",
      href: "/dashboard/admin/pilotage?tab=risks",
      action: "Voir les risques",
    },
  ];

  const overviewHighlights = [
    {
      title: "Situation actuelle",
      value: "Produit large, offre non figée",
      helper: "Le meilleur usage est crédible, mais pas encore le meilleur moteur économique.",
    },
    {
      title: "Décisions en attente",
      value: "Segment, prix, format pilote",
      helper: "Trois arbitrages pilotent la suite sans nécessiter de gros développement.",
    },
    {
      title: "Risques critiques",
      value: `${riskSummary.critical}`,
      helper: "Le positionnement, le pricing et la liquidité locale restent les plus sensibles.",
    },
    {
      title: "Progression validation",
      value: `${validationSummary.tests} tests cadrés`,
      helper: "Le plan 30 jours est prêt, il faut maintenant l'exécuter proprement.",
    },
  ];

  const strategyCards = [
    {
      title: "Moteur prioritaire",
      value: "SaaS d'abord",
      helper: "À challenger face à la logique de commission, mais plus simple à tester et à vendre rapidement.",
    },
    {
      title: "Offre à privilégier",
      value: "Conciergerie Pro",
      helper: "Le segment le plus susceptible d'avoir fréquence d'usage, coordination et capacité de paiement.",
    },
    {
      title: "Critère de pivot",
      value: "Douleur et paiement",
      helper: "Pas de scaling si le terrain ne confirme ni douleur forte ni engagement économique concret.",
    },
    {
      title: "Ligne de conduite",
      value: "Simplicité avant largeur",
      helper: "Le produit doit d'abord gagner sur un parcours essentiel, pas sur une promesse totale.",
    },
  ];

  const actionRoadmap = [
    {
      title: "30 jours",
      body: "Valider le problème, la promesse, la cible et la première offre pilote avec les 13 tests Lean.",
    },
    {
      title: "90 jours",
      body: "Concentrer l'exécution sur le segment confirmé, fiabiliser le MVP utile et mesurer activation + engagement.",
    },
    {
      title: "6 mois",
      body: "Industrialiser uniquement ce que les pilotes utilisent et acceptent de payer, sans élargir trop tôt la marketplace.",
    },
  ];

  const quickActions = [
    {
      label: "Ouvrir la validation marché",
      href: "/dashboard/admin/pilotage?tab=validation",
      description: "Lancer les tests avant d'ajouter de nouveaux développements.",
    },
    {
      label: "Voir les risques critiques",
      href: "/dashboard/admin/pilotage?tab=risks",
      description: "Revenir aux risques qui menacent directement la monétisation et la clarté du projet.",
    },
    {
      label: "Consulter le contrôle détaillé",
      href: "/dashboard/admin/controle",
      description: "Traiter les signaux rouges côté exécution et qualité de la donnée.",
    },
  ];

  function handleTabChange(nextTab: string) {
    if (!isPilotageTab(nextTab)) return;
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TAB_STORAGE_KEY, nextTab);
      const params = new URLSearchParams(window.location.search);
      params.set("tab", nextTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }

  function toggleSection(sectionId: keyof OpenSections) {
    setOpenSections((current) => {
      const next = { ...current, [sectionId]: !current[sectionId] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  if (loading) {
    return <div className="center">Chargement du cockpit stratégique...</div>;
  }

  if (error) {
    return <div className="center">{error}</div>;
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Pilotage business et financier"
      subtitle="Un cockpit stratégique plus clair, organisé par vues, pour arbitrer sans se perdre dans une page trop dense."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Pilotage business", href: "/dashboard/admin/pilotage" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
      ]}
      stats={[
        {
          label: "Statut global",
          value: "En cadrage actif",
          hint: "Produit crédible, offre encore à valider",
        },
        {
          label: "Décisions urgentes",
          value: "3",
          hint: "Segment, prix, offre pilote",
        },
        {
          label: "Risques critiques",
          value: String(riskSummary.critical),
          hint: "Positionnement, prix, liquidité",
        },
        {
          label: "Validation marché",
          value: `${validationSummary.tests} tests`,
          hint: "Plan 30 jours prêt à exécuter",
        },
      ]}
      actions={quickActions}
      activity={[
        {
          id: "business-overview",
          title: "Lecture immédiate",
          description: "La synthèse générale, les priorités et les alertes doivent être compréhensibles en moins de 10 secondes.",
          href: "/dashboard/admin/pilotage?tab=overview",
        },
        {
          id: "business-validation",
          title: "Validation terrain",
          description: `${validationSummary.tests} tests cadrés, ${validationSummary.hypotheses} hypothèses prioritaires à challenger.`,
          href: "/dashboard/admin/pilotage?tab=validation",
        },
        {
          id: "business-risks",
          title: "Risques critiques",
          description: `${riskSummary.critical} risque(s) critiques, ${riskSummary.priority} prioritaire(s).`,
          href: "/dashboard/admin/pilotage?tab=risks",
        },
      ]}
      notifications={[
        {
          id: "business-data",
          title:
            sourceWarnings.length > 0
              ? "Certaines sources sont dégradées : les chiffres doivent être lus avec prudence."
              : "Les principales sources business sont disponibles.",
          level: sourceWarnings.length > 0 ? "warning" : "info",
          href: "/dashboard/admin",
        },
        {
          id: "business-ops",
          title:
            topAlerts.length > 0
              ? `${topAlerts.length} signal(s) opérationnel(s) à reprendre côté admin.`
              : "Pas de dérive opérationnelle majeure visible dans les données remontées.",
          level: topAlerts.length > 0 ? "warning" : "info",
          href: "/dashboard/admin/controle",
        },
      ]}
      shortcuts={[
        { label: "Vue d'ensemble", href: "/dashboard/admin/pilotage?tab=overview" },
        { label: "Stratégie", href: "/dashboard/admin/pilotage?tab=strategy" },
        { label: "Validation", href: "/dashboard/admin/pilotage?tab=validation" },
        { label: "Risques", href: "/dashboard/admin/pilotage?tab=risks", badgeCount: riskSummary.critical },
      ]}
      profile={{ name: "PlanetLS", subtitle: "Cockpit stratégique", badge: "Administration" }}
    >
      <section className={styles.headerShell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Cockpit stratégique</span>
            <h2>Comprendre la situation actuelle, les décisions prioritaires et les prochaines actions sans scroller toute la page.</h2>
            <p>
              La page `Pilotage Business` devient un espace de synthèse et de navigation. Les analyses
              détaillées restent accessibles, mais elles sont désormais regroupées par vues et
              dépliées seulement quand elles aident vraiment la décision.
            </p>
          </div>

          <div className={styles.heroMeta}>
            <article className={styles.metaCard}>
              <span>État général</span>
              <strong>Validation en cours</strong>
              <p>Le produit semble crédible, mais la preuve économique reste à construire.</p>
            </article>
            <article className={styles.metaCard}>
              <span>Dernière mise à jour</span>
              <strong>{formatDateTime(lastUpdated)}</strong>
              <p>Lecture issue des endpoints admin et des modules stratégiques actuels.</p>
            </article>
            <article className={styles.metaCard}>
              <span>Période de travail</span>
              <strong>Août 2026</strong>
              <p>Accent sur les 30 à 90 prochains jours, pas sur la vision complète à long terme.</p>
            </article>
          </div>
        </header>

        <section className={styles.priorityStrip} aria-labelledby="priority-strip-title">
          <div className={styles.priorityHeader}>
            <div>
              <span className={styles.eyebrow}>À traiter maintenant</span>
              <h3 id="priority-strip-title">3 à 4 sujets à ne pas perdre de vue</h3>
            </div>
            <div className={styles.quickActions}>
              {quickActions.map((item) => (
                <Link key={item.label} href={item.href} className={styles.quickAction}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.priorityGrid}>
            {priorityItems.map((item) => (
              <article key={item.title} className={styles.priorityCard} data-level={item.level}>
                <span className={styles.priorityLevel}>{item.level}</span>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
                <div className={styles.priorityFooter}>
                  <span>{item.deadline}</span>
                  <span>{item.status}</span>
                </div>
                <Link href={item.href} className={styles.priorityLink}>
                  {item.action} <ArrowRight size={14} />
                </Link>
              </article>
            ))}
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
      </section>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className={styles.tabsWrap}>
          <TabsList className={styles.tabsList}>
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon;
              const badgeCount =
                tab.id === "risks"
                  ? riskSummary.critical
                  : tab.id === "validation"
                    ? validationSummary.tests
                    : tab.id === "actions"
                      ? priorityItems.length
                      : tab.id === "overview"
                        ? topAlerts.length
                        : undefined;

              return (
                <TabsTrigger key={tab.id} value={tab.id} className={styles.tabTrigger}>
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {badgeCount ? <span className={styles.tabBadge}>{badgeCount}</span> : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="overview" className={styles.tabContent}>
          <section className={styles.overviewGrid}>
            <DashboardPanel title="Situation actuelle">
              <div className={styles.metricGrid}>
                {overviewHighlights.map((item) => (
                  <article key={item.title} className={styles.metricCard}>
                    <span>{item.title}</span>
                    <strong>{item.value}</strong>
                    <p>{item.helper}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Alertes critiques">
              <div className={styles.alertList}>
                {topAlerts.length === 0 ? (
                  <article className={styles.alertCard} data-tone="positive">
                    <strong>Pas de dérive immédiate visible</strong>
                    <p>Les données remontées ne montrent pas de blocage business prioritaire.</p>
                  </article>
                ) : (
                  topAlerts.map((alert) => (
                    <article key={alert} className={styles.alertCard} data-tone="warning">
                      <strong>À reprendre</strong>
                      <p>{alert}</p>
                    </article>
                  ))
                )}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Résumé validation marché">
              <div className={styles.summaryStack}>
                <article className={styles.summaryCard}>
                  <Activity size={18} />
                  <div>
                    <strong>{validationSummary.tests} tests prévus</strong>
                    <p>{validationSummary.problem} problème, {validationSummary.interest} intérêt, {validationSummary.pay} paiement.</p>
                  </div>
                </article>
                <article className={styles.summaryCard}>
                  <Users size={18} />
                  <div>
                    <strong>{validationSummary.hypotheses} hypothèses prioritaires</strong>
                    <p>Le premier vrai enjeu est de confirmer le segment payeur avant de raffiner l'offre.</p>
                  </div>
                </article>
                <Link href="/dashboard/admin/pilotage?tab=validation" className={styles.inlineLinkCard}>
                  Voir le détail de la validation <ArrowRight size={15} />
                </Link>
              </div>
            </DashboardPanel>

            <DashboardPanel title="Résumé risques">
              <div className={styles.summaryStack}>
                <article className={styles.summaryCard}>
                  <ShieldAlert size={18} />
                  <div>
                    <strong>{riskSummary.critical} risques critiques</strong>
                    <p>Les plus sensibles concernent le positionnement, le pricing et la liquidité locale.</p>
                  </div>
                </article>
                <article className={styles.summaryCard}>
                  <Target size={18} />
                  <div>
                    <strong>{riskSummary.market} risques marché / marketplace</strong>
                    <p>La densité locale et la désintermédiation restent les plus structurants avant lancement.</p>
                  </div>
                </article>
                <Link href="/dashboard/admin/pilotage?tab=risks" className={styles.inlineLinkCard}>
                  Ouvrir le registre des risques <ArrowRight size={15} />
                </Link>
              </div>
            </DashboardPanel>

            <DashboardPanel title="Prochaines actions">
              <div className={styles.actionList}>
                {quickActions.map((item) => (
                  <Link key={item.label} href={item.href} className={styles.actionCard}>
                    <Banknote size={18} />
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.description}</p>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Progression du plan 90 jours">
              <div className={styles.roadmapGrid}>
                {actionRoadmap.map((item) => (
                  <article key={item.title} className={styles.roadmapCard}>
                    <span>{item.title}</span>
                    <strong>{item.body}</strong>
                  </article>
                ))}
              </div>
            </DashboardPanel>
          </section>
        </TabsContent>

        <TabsContent value="strategy" className={styles.tabContent}>
          <section className={styles.overviewGrid}>
            <DashboardPanel title="Repères de décision">
              <div className={styles.metricGrid}>
                {strategyCards.map((card) => (
                  <article key={card.title} className={styles.metricCard}>
                    <span>{card.title}</span>
                    <strong>{card.value}</strong>
                    <p>{card.helper}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Décisions en attente">
              <div className={styles.notes}>
                <p>Définir précisément ce qui est inclus dans l'offre Conciergerie Pro.</p>
                <p>Arbitrer abonnement prioritaire ou logique hybride seulement après preuves terrain.</p>
                <p>Garder le périmètre du MVP centré sur le parcours le plus douloureux et le plus fréquent.</p>
              </div>
            </DashboardPanel>
          </section>

          <BusinessCollapsibleSection
            id="strategy-method"
            eyebrow="Analyse détaillée"
            title="Méthode de décision stratégique"
            summary="Le cadre complet pour challenger chaque grande décision avant implémentation."
            badge="8 étapes"
            secondaryBadge="Lecture guidée"
            isOpen={openSections.strategy_method}
            onToggle={() => toggleSection("strategy_method")}
          >
            <StrategicDecisionAssistant />
          </BusinessCollapsibleSection>
        </TabsContent>

        <TabsContent value="validation" className={styles.tabContent}>
          <section className={styles.overviewGrid}>
            <DashboardPanel title="Résumé validation">
              <div className={styles.metricGrid}>
                <article className={styles.metricCard}>
                  <span>Phase 1</span>
                  <strong>{validationSummary.problem} tests</strong>
                  <p>Comprendre si le problème est fréquent, pénible et prioritaire.</p>
                </article>
                <article className={styles.metricCard}>
                  <span>Phase 2</span>
                  <strong>{validationSummary.interest} MVP légers</strong>
                  <p>Tester la promesse, la compréhension et l'intention d'essai.</p>
                </article>
                <article className={styles.metricCard}>
                  <span>Phase 3</span>
                  <strong>{validationSummary.pay} tests de paiement</strong>
                  <p>Aller jusqu'à un engagement fort, pas seulement une curiosité.</p>
                </article>
                <article className={styles.metricCard}>
                  <span>Risque majeur</span>
                  <strong>Tester trop large</strong>
                  <p>Ne pas lancer tous les profils et toutes les promesses en même temps.</p>
                </article>
              </div>
            </DashboardPanel>
          </section>

          <BusinessCollapsibleSection
            id="validation-detail"
            eyebrow="Plan Lean"
            title="Validation marché détaillée"
            summary="Le plan de 30 jours, les 13 tests, les scripts, les KPI et la grille GO / TEST MORE / PIVOT."
            badge={`${validationSummary.tests} tests`}
            secondaryBadge="30 jours"
            isOpen={openSections.validation_detail}
            onToggle={() => toggleSection("validation_detail")}
          >
            <LeanValidationDashboard />
          </BusinessCollapsibleSection>
        </TabsContent>

        <TabsContent value="risks" className={styles.tabContent}>
          <section className={styles.overviewGrid}>
            <DashboardPanel title="Vue rapide des risques">
              <div className={styles.metricGrid}>
                <article className={styles.metricCard}>
                  <span>Critiques</span>
                  <strong>{riskSummary.critical}</strong>
                  <p>À garder visibles tant que le produit n'a pas encore de validation commerciale forte.</p>
                </article>
                <article className={styles.metricCard}>
                  <span>Prioritaires</span>
                  <strong>{riskSummary.priority}</strong>
                  <p>À traiter dès qu'un risque bloque l'exécution ou la crédibilité du projet.</p>
                </article>
                <article className={styles.metricCard}>
                  <span>Marché & liquidité</span>
                  <strong>{riskSummary.market}</strong>
                  <p>Le plus fort risque stratégique avant toute expansion marketplace.</p>
                </article>
                <article className={styles.metricCard}>
                  <span>Signal de gestion</span>
                  <strong>Registre statique</strong>
                  <p>Très utile pour piloter, mais encore sans persistance ni historique de traitement.</p>
                </article>
              </div>
            </DashboardPanel>
          </section>

          <BusinessCollapsibleSection
            id="risks-register"
            eyebrow="Registre"
            title="Registre des risques détaillé"
            summary="Filtres rapides, profils impactés, mitigations, échéances et signaux d'alerte."
            badge={`${riskSummary.total} risques`}
            secondaryBadge={`${riskSummary.critical} critiques`}
            isOpen={openSections.risks_register}
            onToggle={() => toggleSection("risks_register")}
          >
            <RiskRegister />
          </BusinessCollapsibleSection>
        </TabsContent>

        <TabsContent value="actions" className={styles.tabContent}>
          <section className={styles.overviewGrid}>
            <DashboardPanel title="Ce qu'il faut valider maintenant">
              <div className={styles.notes}>
                <p>Définir précisément ce qui est inclus dans l'offre Conciergerie Pro.</p>
                <p>Tester le prix et les objections en entretien avant toute industrialisation Stripe.</p>
                <p>Valider une zone pilote avec assez de densité locale pour produire de vraies interactions.</p>
                <p>Mesurer la première valeur en moins de 7 jours sur des comptes réellement suivis.</p>
              </div>
            </DashboardPanel>

            <DashboardPanel title="Points de tension">
              <div className={styles.alertList}>
                {topAlerts.length === 0 ? (
                  <article className={styles.alertCard} data-tone="positive">
                    <strong>Pas de dérive immédiate visible</strong>
                    <p>Les données remontées ne montrent pas de blocage business prioritaire.</p>
                  </article>
                ) : (
                  topAlerts.map((alert) => (
                    <article key={alert} className={styles.alertCard} data-tone="warning">
                      <strong>Signal à reprendre</strong>
                      <p>{alert}</p>
                    </article>
                  ))
                )}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Roadmap courte">
              <div className={styles.roadmapGrid}>
                {actionRoadmap.map((item) => (
                  <article key={item.title} className={styles.roadmapCard}>
                    <span>{item.title}</span>
                    <strong>{item.body}</strong>
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Actions rapides">
              <div className={styles.actionList}>
                {quickActions.map((item) => (
                  <Link key={item.label} href={item.href} className={styles.actionCard}>
                    <Users size={18} />
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.description}</p>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            </DashboardPanel>
          </section>

          <BusinessCollapsibleSection
            id="actions-notes"
            eyebrow="Lecture"
            title="Notes de pilotage"
            summary="Pourquoi la page privilégie la synthèse, les onglets et les vues détaillées repliables."
            badge="UX cockpit"
            isOpen={openSections.actions_notes}
            onToggle={() => toggleSection("actions_notes")}
          >
            <div className={styles.notesPanel}>
              <p>Les indicateurs rapides trop fragiles ont été retirés du haut de page pour éviter la fausse précision.</p>
              <p>Les blocs détaillés restent disponibles, mais seulement dans les vues où ils aident réellement à arbitrer.</p>
              <p>La prochaine étape UX naturelle sera de relier certaines synthèses à des données canoniques et à des filtres plus fins, sans transformer cette page en usine à gaz.</p>
            </div>
          </BusinessCollapsibleSection>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
