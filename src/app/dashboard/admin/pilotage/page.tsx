"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CircleDollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import type { KpiOverviewPayload } from "@/app/api/kpis/overview/shared";
import type { AdminMissionRow, AdminRequestRow } from "../AdminOperations";
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

type RoleKey = "owner" | "concierge" | "provider";

const ROLE_LABELS: Record<RoleKey, string> = {
  owner: "Proprietaires",
  concierge: "Conciergeries",
  provider: "Artisans",
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null | undefined, fallback = "n.d.") {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return `${Math.round(value)}%`;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getRoleMetric(kpis: KpiOverviewPayload | null, role: RoleKey) {
  return kpis?.[role] ?? null;
}

export default function AdminBusinessPage() {
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [operations, setOperations] = useState<AdminOperationsPayload | null>(null);
  const [control, setControl] = useState<AdminControlPayload | null>(null);
  const [kpis, setKpis] = useState<KpiOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError("Le pilotage business et financier n'a pas pu etre charge.");
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

  const missionPipelineAmount = useMemo(
    () =>
      missions.reduce(
        (sum, mission) => sum + Math.max(toNumber(mission.total_amount), toNumber(mission.amount)),
        0,
      ),
    [missions],
  );

  const billedMissionAmount = useMemo(
    () =>
      missions
        .filter((mission) => Boolean(mission.invoice_id))
        .reduce(
          (sum, mission) => sum + Math.max(toNumber(mission.total_amount), toNumber(mission.amount)),
          0,
        ),
    [missions],
  );

  const scheduledMissionAmount = useMemo(
    () =>
      missions
        .filter((mission) => Boolean(mission.scheduled_start))
        .reduce(
          (sum, mission) => sum + Math.max(toNumber(mission.total_amount), toNumber(mission.amount)),
          0,
        ),
    [missions],
  );

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

  const activationRates = useMemo(
    () =>
      (["owner", "concierge", "provider"] as RoleKey[]).map((role) => ({
        role,
        label: ROLE_LABELS[role],
        value: getRoleMetric(kpis, role)?.activation_j7 ?? null,
        eligible: getRoleMetric(kpis, role)?.activation_j7_eligible ?? 0,
      })),
    [kpis],
  );

  const averageActivation = useMemo(
    () =>
      average(
        activationRates
          .map((item) => item.value)
          .filter((value): value is number => typeof value === "number"),
      ),
    [activationRates],
  );

  const monetizationRate = useMemo(() => {
    if (missions.length === 0) return null;
    const invoiced = missions.filter((mission) => Boolean(mission.invoice_id)).length;
    return (invoiced / missions.length) * 100;
  }, [missions]);

  const activityRate = useMemo(() => {
    const total = overview?.summary.totalUsers ?? 0;
    if (total === 0) return null;
    return ((overview?.summary.active7d ?? 0) / total) * 100;
  }, [overview]);

  const growthSignals = [
    {
      id: "acquisition",
      icon: Users,
      label: "Base active",
      value: `${overview?.summary.active7d ?? 0}/${overview?.summary.totalUsers ?? 0}`,
      detail: `Comptes actifs sur 7 jours (${formatPercent(activityRate)})`,
    },
    {
      id: "activation",
      icon: TrendingUp,
      label: "Activation moyenne J+7",
      value: formatPercent(averageActivation, "n.d."),
      detail: "Moyenne des cohortes owner, concierge et artisan",
    },
    {
      id: "pipeline",
      icon: BriefcaseBusiness,
      label: "Pipeline missions",
      value: formatCurrency(missionPipelineAmount),
      detail: "Valeur deduite des montants visibles sur missions et devis lies",
    },
    {
      id: "cash",
      icon: CircleDollarSign,
      label: "Missions facturees",
      value: formatCurrency(billedMissionAmount),
      detail: `${operations?.invoiceCount ?? 0} facture(s) visibles dans le cockpit`,
    },
  ];

  const focusCards = [
    {
      title: "Acquisition et densite",
      value: `${overview?.summary.owners ?? 0} / ${overview?.summary.concierges ?? 0} / ${overview?.summary.providers ?? 0}`,
      helper: "Proprietaires, conciergeries et artisans actuellement suivis",
    },
    {
      title: "Conversion commerciale",
      value: formatPercent(getRoleMetric(kpis, "owner")?.quote_to_mission_rate ?? null),
      helper: "Passage devis -> mission cote proprietaires",
    },
    {
      title: "Execution monetisable",
      value: formatPercent(monetizationRate),
      helper: "Part des missions deja reliees a une facture visible",
    },
    {
      title: "Encaissement final",
      value: formatPercent(kpis?.shared.mission_to_paid_invoice_rate ?? null),
      helper: "Missions allant jusqu'a la facture payee",
    },
  ];

  const topAlerts = [
    blockedRequests > 0 ? `${blockedRequests} demande(s) presentent un blocage explicite.` : null,
    acceptedWithoutMission > 0
      ? `${acceptedWithoutMission} devis accepte(s) n'ont pas encore produit de mission.`
      : null,
    lateUnbilledMissions > 0
      ? `${lateUnbilledMissions} mission(s) datee(s) restent sans facture visible.`
      : null,
    (control?.summary.totalProblems ?? 0) > 0
      ? `${control?.summary.totalProblems ?? 0} point(s) de controle restent ouverts sur la plateforme.`
      : null,
  ].filter((item): item is string => Boolean(item));

  const sourceWarnings = Array.from(
    new Set([
      ...(overview?.health?.reasons ?? []),
      ...(operations?.health?.reasons ?? []),
      ...(kpis?.health?.reasons ?? []),
    ]),
  );

  if (loading) {
    return <div className="center">Chargement du pilotage business et financier...</div>;
  }

  if (error) {
    return <div className="center">{error}</div>;
  }

  return (
    <DashboardLayout
      persona="admin"
      title="Pilotage business et financier"
      subtitle="Suivre la croissance utile, le pipeline commercial, la conversion en missions et la tension de tresorerie."
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
          label: "Pipeline missions",
          value: formatCurrency(missionPipelineAmount),
          hint: "Valeur estimee visible",
        },
        {
          label: "Missions facturees",
          value: formatCurrency(billedMissionAmount),
          hint: `${operations?.invoiceCount ?? 0} facture(s)`,
        },
        {
          label: "Activation moyenne",
          value: formatPercent(averageActivation, "n.d."),
          hint: "Cohortes J+7",
        },
        {
          label: "Points de vigilance",
          value: String(topAlerts.length),
          hint: "Blocages et derive cash",
        },
      ]}
      actions={[
        {
          label: "Voir le contrôle détaillé",
          href: "/dashboard/admin/controle",
          description: "Traiter les signaux rouges et orange.",
        },
        {
          label: "Relire les utilisateurs",
          href: "/dashboard/admin/utilisateurs",
          description: "Reprendre la qualite de la base et l'activation.",
        },
        {
          label: "Ouvrir Mission Control dev",
          href: "/dashboard/admin/developpement",
          description: "Aligner produit, dette et roadmap.",
        },
      ]}
      activity={[
        {
          id: "business-pipeline",
          title: "Pipeline missions",
          description: `${missions.length} mission(s) visibles, ${requests.length} demande(s) en suivi.`,
          href: "/dashboard/admin/missions",
        },
        {
          id: "business-activation",
          title: "Activation des cohortes",
          description: `${kpis?.activation_alerts.length ?? 0} alerte(s) KPI actuellement remontees.`,
          href: "/dashboard/admin",
        },
        {
          id: "business-control",
          title: "Controle et execution",
          description: `${control?.summary.totalProblems ?? 0} point(s) de controle a surveiller.`,
          href: "/dashboard/admin/controle",
        },
      ]}
      notifications={[
        {
          id: "business-cash",
          title:
            lateUnbilledMissions > 0
              ? `${lateUnbilledMissions} mission(s) potentiellement realisee(s) sans facture visible.`
              : "Pas d'alerte immediate sur la facturation visible.",
          level: lateUnbilledMissions > 0 ? "warning" : "info",
          href: "/dashboard/admin/missions",
        },
        {
          id: "business-data",
          title:
            sourceWarnings.length > 0
              ? "Certaines sources sont degradees : les montants et taux doivent etre lus avec prudence."
              : "Les principales sources business sont disponibles.",
          level: sourceWarnings.length > 0 ? "warning" : "info",
          href: "/dashboard/admin",
        },
      ]}
      shortcuts={[
        { label: "Cockpit admin", href: "/dashboard/admin" },
        {
          label: "Contrôle détaillé",
          href: "/dashboard/admin/controle",
          badgeCount: control?.summary.totalProblems ?? 0,
        },
        {
          label: "Missions",
          href: "/dashboard/admin/missions",
          badgeCount: lateUnbilledMissions,
        },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
      ]}
      profile={{ name: "PlanetLS", subtitle: "Pilotage business", badge: "Administration" }}
    >
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Cockpit de pilotage</span>
          <h2>Voir si la plateforme grossit sainement, transforme ses demandes en missions et convertit l'execution en cash visible.</h2>
          <p>
            Cette page croise les KPI d&apos;activation, les volumes admin, les missions, les demandes
            et les alertes de controle pour aider a piloter l&apos;entreprise plutot que seulement l&apos;outil.
          </p>
        </div>

        <div className={styles.heroMetrics}>
          {growthSignals.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.id} className={styles.signalCard}>
                <span className={styles.signalIcon} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      {sourceWarnings.length > 0 ? (
        <section className={styles.warningBanner} role="status">
          <AlertTriangle size={18} />
          <div>
            <strong>Lecture prudente recommandee</strong>
            <p>{sourceWarnings.join(" ")}</p>
          </div>
        </section>
      ) : null}

      <section className={styles.grid}>
        <DashboardPanel title="Synthese executive">
          <div className={styles.metricGrid}>
            {focusCards.map((card) => (
              <article key={card.title} className={styles.metricCard}>
                <span>{card.title}</span>
                <strong>{card.value}</strong>
                <p>{card.helper}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Lecture financiere">
          <div className={styles.financeGrid}>
            <article className={styles.financeCard}>
              <span>Pipeline total visible</span>
              <strong>{formatCurrency(missionPipelineAmount)}</strong>
              <p>Valeur deduite des missions avec montant ou devis lie visible.</p>
            </article>
            <article className={styles.financeCard}>
              <span>Valeur deja planifiee</span>
              <strong>{formatCurrency(scheduledMissionAmount)}</strong>
              <p>Montants rattaches a des missions deja datees.</p>
            </article>
            <article className={styles.financeCard}>
              <span>Valeur facturee visible</span>
              <strong>{formatCurrency(billedMissionAmount)}</strong>
              <p>Lecture inferree depuis les missions deja reliees a une facture.</p>
            </article>
            <article className={styles.financeCard}>
              <span>Tresorerie potentiellement en attente</span>
              <strong>{formatCurrency(Math.max(0, scheduledMissionAmount - billedMissionAmount))}</strong>
              <p>Ecart entre execution planifiee et facturation visible.</p>
            </article>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Activation par role">
          <div className={styles.roleStack}>
            {activationRates.map((item) => (
              <article key={item.role} className={styles.roleCard}>
                <div className={styles.roleHeader}>
                  <strong>{item.label}</strong>
                  <span>{formatPercent(item.value)}</span>
                </div>
                <div className={styles.roleBar} aria-hidden="true">
                  <span style={{ width: `${Math.max(6, Math.min(item.value ?? 0, 100))}%` }} />
                </div>
                <p>{item.eligible} profil(s) eligibles dans la cohorte J+7.</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Points de tension">
          <div className={styles.alertList}>
            {topAlerts.length === 0 ? (
              <article className={styles.alertCard} data-tone="positive">
                <strong>Pas de derive immediate visible</strong>
                <p>Les donnees remontees ne montrent pas de blocage business prioritaire.</p>
              </article>
            ) : (
              topAlerts.map((alert) => (
                <article key={alert} className={styles.alertCard} data-tone="warning">
                  <strong>Signal a reprendre</strong>
                  <p>{alert}</p>
                </article>
              ))
            )}
          </div>
        </DashboardPanel>
      </section>

      <section className={styles.bottomGrid}>
        <DashboardPanel title="Prochaines actions recommandees">
          <div className={styles.actionList}>
            <Link href="/dashboard/admin/controle" className={styles.actionCard}>
              <Banknote size={18} />
              <div>
                <strong>Retraiter les points rouges</strong>
                <p>Commencer par les blocages d&apos;execution et les derives de facturation.</p>
              </div>
              <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard/admin/missions" className={styles.actionCard}>
              <CircleDollarSign size={18} />
              <div>
                <strong>Verifier la chaine mission - facture</strong>
                <p>Reduire les missions datees sans facture visible et fiabiliser l&apos;encaissement.</p>
              </div>
              <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard/admin/utilisateurs" className={styles.actionCard}>
              <Users size={18} />
              <div>
                <strong>Ameliorer l&apos;activation par role</strong>
                <p>Identifier le role dont la cohorte J+7 freine le plus la croissance utile.</p>
              </div>
              <ArrowRight size={16} />
            </Link>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Notes de lecture">
          <div className={styles.notes}>
            <p>Les montants affiches sont des estimations issues des champs visibles sur les missions, devis et factures liees.</p>
            <p>Cette vue aide a piloter, mais ne remplace pas encore une comptabilite canonique ni un P&amp;L structure.</p>
            <p>La priorite business immediate est d&apos;aligner activation, generation de mission et facturation visible dans une meme chaine.</p>
          </div>
        </DashboardPanel>
      </section>
    </DashboardLayout>
  );
}
