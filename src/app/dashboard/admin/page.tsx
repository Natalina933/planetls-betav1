"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { WorkspaceRoleIcon } from "@/components/ui";
import { getDashboardMissionPaceMeta } from "@/app/components/dashboard/saas";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiMessageCircle,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import {
  AdminAlertList,
  AdminKpiGrid,
  getElapsedLabel,
  getMissionNextAction,
  getMissionStatus,
  getMissionUrgency,
  getRequestAssignee,
  getRequestNextAction,
  getRequestStatus,
  getRequestUrgency,
  normalizeAdminText,
  type AdminKpi,
  type AdminMissionRow,
  type AdminRequestRow,
} from "./AdminOperations";
import {
  AdminBubblePanel,
  AdminDonutCard,
  AdminToneLegend,
} from "./AdminVisuals";
import { ADMIN_VISUAL_PRESETS } from "./adminVisualPresets";
import type { KpiOverviewPayload } from "@/app/api/kpis/overview/shared";
import styles from "./AdminDashboard.module.scss";

type DashboardStats = {
  users: number;
  activePartners: number;
  bookings: number;
  active24h: number;
  active7d: number;
  owners: number;
  concierges: number;
  providers: number;
};

type AdminOverviewPayload = {
  summary: {
    totalUsers: number;
    active24h: number;
    active7d: number;
    owners: number;
    concierges: number;
    providers: number;
    onboardingComplete: number;
    emailConfirmed: number;
    planningEntries: number;
    workflowEvents: number;
    onboardingEvents: number;
  };
  spotlights: {
    onboardingAlerts: Array<{
      id: string;
      displayName: string;
      roleBucket: string;
      healthFlags: string[];
      lastSignInAt: string | null;
    }>;
  };
};

type AdminControlPayload = {
  summary: {
    onboarding: { total: number; healthy: number; warning: number; danger: number };
    missions: { total: number; healthy: number; warning: number; danger: number };
    messages: { total: number; healthy: number; warning: number; danger: number };
    totalProblems: number;
  };
};

type AdminOperationsPayload = {
  requests: AdminRequestRow[];
  missions: AdminMissionRow[];
  invoiceCount: number;
};

type PanelKey =
  | "health"
  | "activation"
  | "priorities"
  | "visuals"
  | "journey"
  | "access";

function getDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function resolveAdminSegment(roleBucket: string) {
  if (roleBucket === "owner") return "/dashboard/admin/proprietaires";
  if (roleBucket === "concierge") return "/dashboard/admin/conciergeries";
  if (roleBucket === "provider") return "/dashboard/admin/artisans";
  return "/dashboard/admin/utilisateurs";
}

function FoldableSectionHeader({
  title,
  summary,
  isOpen,
  onToggle,
  controlsId,
}: {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  return (
    <button
      type="button"
      className={styles.foldableToggle}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={controlsId}
    >
      <div className={styles.foldableHeading}>
        <span className={styles.foldableLabel}>{title}</span>
        <p>{summary}</p>
      </div>
      <span className={styles.foldableMeta}>
        <span>{isOpen ? "Replier" : "Deplier"}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} aria-hidden="true" />
      </span>
    </button>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    activePartners: 0,
    bookings: 0,
    active24h: 0,
    active7d: 0,
    owners: 0,
    concierges: 0,
    providers: 0,
  });
  const [requests, setRequests] = useState<AdminRequestRow[]>([]);
  const [missions, setMissions] = useState<AdminMissionRow[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [adminOverview, setAdminOverview] = useState<AdminOverviewPayload | null>(null);
  const [adminControl, setAdminControl] = useState<AdminControlPayload | null>(null);
  const [kpiOverview, setKpiOverview] = useState<KpiOverviewPayload | null>(null);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState<Record<PanelKey, boolean>>({
    health: true,
    activation: false,
    priorities: true,
    visuals: false,
    journey: true,
    access: false,
  });

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [operationsRes, overviewRes, controlRes, kpiRes] = await Promise.allSettled([
          fetch("/api/admin/operations?limit=200", { cache: "no-store" }),
          fetch("/api/admin/overview", { cache: "no-store" }),
          fetch("/api/admin/control-tower", { cache: "no-store" }),
          fetch("/api/kpis/overview?window_days=30", { cache: "no-store" }),
        ]);

        let overviewPayload: AdminOverviewPayload | null = null;

        if (operationsRes.status === "fulfilled" && operationsRes.value.ok) {
          const operations = (await operationsRes.value.json().catch(() => null)) as AdminOperationsPayload | null;
          setRequests(operations?.requests ?? []);
          setMissions(operations?.missions ?? []);
          setInvoiceCount(operations?.invoiceCount ?? 0);
        }
        if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
          overviewPayload = (await overviewRes.value.json().catch(() => null)) as AdminOverviewPayload | null;
          setAdminOverview(overviewPayload);
        }
        if (controlRes.status === "fulfilled" && controlRes.value.ok) {
          setAdminControl((await controlRes.value.json().catch(() => null)) as AdminControlPayload | null);
        }
        if (kpiRes.status === "fulfilled" && kpiRes.value.ok) {
          setKpiOverview((await kpiRes.value.json().catch(() => null)) as KpiOverviewPayload | null);
        } else {
          setKpiError("Indicateurs d’activation indisponibles.");
        }

        setStats({
          users: overviewPayload?.summary.totalUsers ?? 0,
          activePartners:
            (overviewPayload?.summary.concierges ?? 0) + (overviewPayload?.summary.providers ?? 0),
          bookings: overviewPayload?.summary.planningEntries ?? 0,
          active24h: overviewPayload?.summary.active24h ?? 0,
          active7d: overviewPayload?.summary.active7d ?? 0,
          owners: overviewPayload?.summary.owners ?? 0,
          concierges: overviewPayload?.summary.concierges ?? 0,
          providers: overviewPayload?.summary.providers ?? 0,
        });
      } catch (error) {
        console.error("Erreur chargement cockpit admin :", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchAdminData();
  }, []);

  const blockedRequests = useMemo(
    () =>
      requests.filter((request) => {
        const status = getRequestStatus(request);
        return status === "Bloquee" || getRequestUrgency(request) === "danger";
      }),
    [requests],
  );

  const lateMissions = useMemo(
    () => missions.filter((mission) => getMissionUrgency(mission) === "danger"),
    [missions],
  );

  const acceptedQuotesWithoutMission = useMemo(
    () =>
      requests.filter((request) => {
        const quoteAccepted = getRequestStatus(request) === "Devis accepte";
        return quoteAccepted && !normalizeAdminText(request.mission_workflow_status);
      }),
    [requests],
  );

  const plannedMissions = useMemo(
    () => missions.filter((mission) => Boolean(mission.scheduled_start)).length,
    [missions],
  );

  const todayAdminMissionCount = useMemo(
    () =>
      missions.filter((mission) => {
        const date = getDateTime(mission.scheduled_start);
        return date ? isSameLocalDay(date, new Date()) : false;
      }).length,
    [missions],
  );

  const missionPaceMeta = useMemo(
    () => getDashboardMissionPaceMeta(todayAdminMissionCount),
    [todayAdminMissionCount],
  );

  const completedMissions = useMemo(
    () =>
      missions.filter((mission) =>
        ["Realisee", "Facturee", "Reglee", "Cloturee"].includes(getMissionStatus(mission)),
      ).length,
    [missions],
  );

  const totalPrioritySignals =
    blockedRequests.length +
    lateMissions.length +
    acceptedQuotesWithoutMission.length +
    (adminControl?.summary.totalProblems ?? 0);

  const kpis: AdminKpi[] = [
    {
      id: "requests",
      label: "Demandes en cours",
      value: requests.length,
      helper: "Demandes à suivre",
      tone: requests.length ? "neutral" : "positive",
    },
    {
      id: "blocked",
      label: "Blocages",
      value: totalPrioritySignals,
      helper: "Actions admin prioritaires",
      tone: totalPrioritySignals ? "danger" : "positive",
    },
    {
      id: "quotes",
      label: "Devis à surveiller",
      value: acceptedQuotesWithoutMission.length,
      helper: "Acceptés sans mission",
      tone: acceptedQuotesWithoutMission.length ? "warning" : "positive",
    },
    {
      id: "missions",
      label: "Missions planifiées",
      value: plannedMissions,
      helper: "Avec date prévue",
      tone: "neutral",
    },
    {
      id: "completed",
      label: "Missions réalisées",
      value: completedMissions,
      helper: "Rapport, facture ou clôture",
      tone: "positive",
    },
  ];

  const alerts = [
    ...blockedRequests.slice(0, 4).map((request) => ({
      id: `request-${request.id}`,
      title: `${getRequestStatus(request)} | ${request.property_name || "Logement non renseigne"}`,
      description: `${getRequestNextAction(request)} | ${getRequestAssignee(request)} | ${getElapsedLabel(request.updated_at ?? request.created_at)}`,
      href: "/dashboard/admin/demandes",
      tone: getRequestUrgency(request),
    })),
    ...acceptedQuotesWithoutMission.slice(0, 3).map((request) => ({
      id: `quote-${request.id}`,
      title: `Devis accepte sans mission | ${request.property_name || request.title || "Demande"}`,
      description: "Vérifier que la mission a bien été générée.",
      href: "/dashboard/admin/demandes",
      tone: "warning" as const,
    })),
    ...lateMissions.slice(0, 4).map((mission) => ({
      id: `mission-${mission.id}`,
      title: `${getMissionStatus(mission)} | ${mission.property_name || mission.title || "Mission"}`,
      description: `${getMissionNextAction(mission)} | ${getElapsedLabel(mission.updated_at ?? mission.scheduled_start)}`,
      href: "/dashboard/admin/missions",
      tone: getMissionUrgency(mission),
    })),
    ...(adminOverview?.spotlights.onboardingAlerts ?? []).slice(0, 3).map((user) => ({
      id: `user-${user.id}`,
      title: `Compte à débloquer | ${user.displayName}`,
      description: user.healthFlags[0] ?? "Vérification recommandée",
      href: resolveAdminSegment(user.roleBucket),
      tone: user.lastSignInAt ? ("warning" as const) : ("danger" as const),
    })),
  ];

  const visualBubbles = [
    {
      id: "red",
      label: "Alertes rouges",
      value:
        (adminControl?.summary.onboarding.danger ?? 0) +
        (adminControl?.summary.missions.danger ?? 0) +
        (adminControl?.summary.messages.danger ?? 0),
      tone: "danger" as const,
      icon: FiAlertTriangle,
      href: "/dashboard/admin/controle?severity=danger",
    },
    {
      id: "orange",
      label: "Points à suivre",
      value:
        (adminControl?.summary.onboarding.warning ?? 0) +
        (adminControl?.summary.missions.warning ?? 0) +
        (adminControl?.summary.messages.warning ?? 0),
      tone: "warning" as const,
      icon: FiTarget,
      href: "/dashboard/admin/controle?severity=warning",
    },
    {
      id: "green",
      label: "Étapes saines",
      value:
        (adminControl?.summary.onboarding.healthy ?? 0) +
        (adminControl?.summary.missions.healthy ?? 0) +
        (adminControl?.summary.messages.healthy ?? 0),
      tone: "positive" as const,
      icon: FiCheckCircle,
      href: "/dashboard/admin/controle?severity=positive",
    },
    {
      id: "users",
      label: "Comptes actifs 24 h",
      value: stats.active24h,
      tone: stats.active24h > 0 ? ("positive" as const) : ("neutral" as const),
      icon: FiUsers,
      href: "/dashboard/admin/utilisateurs",
    },
  ];

  const activationRoles = kpiOverview
    ? [
        { key: "owner" as const, label: "Propriétaires", metric: kpiOverview.owner },
        { key: "concierge" as const, label: "Conciergeries", metric: kpiOverview.concierge },
        { key: "provider" as const, label: "Artisans", metric: kpiOverview.provider },
      ]
    : [];

  const healthSummary = `${totalPrioritySignals} signal(s) prioritaires, ${plannedMissions} mission(s) planifiee(s), ${completedMissions} mission(s) realisee(s).`;
  const activationSummary = kpiError
    ? kpiError
    : activationRoles.length === 0
      ? "Aucun groupe mature sur les 30 derniers jours."
      : `${activationRoles.length} rôle(s) suivis, ${kpiOverview?.activation_alerts.length ?? 0} alerte(s) d’activation.`;
  const prioritySummary = alerts.length
    ? `${alerts.length} alerte(s), dont ${blockedRequests.length} demande(s) et ${lateMissions.length} mission(s) critiques.`
    : "Aucune alerte prioritaire en ce moment.";
  const visualSummary = `${visualBubbles[0]?.value ?? 0} rouge(s), ${visualBubbles[1]?.value ?? 0} orange(s), ${visualBubbles[2]?.value ?? 0} étape(s) saine(s).`;
  const journeySummary = `${adminControl?.summary.totalProblems ?? 0} problème(s) sur inscriptions, missions et messages.`;
  const accessSummary = "Accès rapide aux écrans admin utiles.";

  function togglePanel(panel: PanelKey) {
    setPanelOpen((current) => ({ ...current, [panel]: !current[panel] }));
  }

  if (loading) return <div className="center">Chargement du cockpit admin...</div>;

  return (
    <DashboardLayout
      persona="admin"
      title="Cockpit de contrôle"
      subtitle="Les points à vérifier en priorité sur PlanetLS."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Propriétaires", href: "/dashboard/admin/proprietaires" },
        { label: "Conciergeries", href: "/dashboard/admin/conciergeries" },
        { label: "Artisans", href: "/dashboard/admin/artisans" },
        { label: "Décisions architecture", href: "/dashboard/admin/decisions-architecture" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      stats={[
        { label: "Utilisateurs", value: String(stats.users), hint: "Profils actifs ou inscrits" },
        { label: "Partenaires", value: String(stats.activePartners), hint: "Conciergeries et artisans" },
        {
          label: "Planning",
          value: String(stats.bookings),
          hint: `${todayAdminMissionCount} mission(s) aujourd’hui`,
          trend: missionPaceMeta.label,
          visual: missionPaceMeta.icon,
          visualLabel: missionPaceMeta.label,
        },
        { label: "Factures", value: String(invoiceCount), hint: "Pièces suivies" },
        {
          label: "Problèmes parcours",
          value: String(adminControl?.summary.totalProblems ?? 0),
          hint: "Inscriptions, missions et messages",
        },
        {
          label: "Connexions 24 h",
          value: String(stats.active24h),
          hint: `${stats.active7d} actif(s) sur 7 jours | ${adminOverview?.summary.workflowEvents ?? 0} événement(s) workflow`,
        },
      ]}
      actions={[
        { label: "Contrôler les utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Ouvrir le contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Contrôler les demandes", href: "/dashboard/admin/demandes" },
        { label: "Contrôler les missions", href: "/dashboard/admin/missions" },
      ]}
      activity={[
        {
          id: "admin-users",
          title: "Base utilisateurs",
          description: `${stats.owners} propriétaire(s), ${stats.concierges} conciergerie(s), ${stats.providers} artisan(s)`,
          href: "/dashboard/admin/utilisateurs",
        },
        {
          id: "admin-requests",
          title: "Demandes et devis",
          description: "Réponses attendues, devis acceptés et missions générées",
          href: "/dashboard/admin/demandes",
        },
        {
          id: "admin-missions",
          title: "Missions et planning",
          description: "Synchronisation propriétaire, concierge et réalisation terrain",
          href: "/dashboard/admin/missions",
        },
        {
          id: "admin-control",
          title: "Etapes et anomalies",
          description: "Feux de contrôle sur inscription, mission et messages",
          href: "/dashboard/admin/controle",
        },
      ]}
      notifications={alerts.slice(0, 3).map((alert) => ({
        id: alert.id,
        title: alert.title,
        level: alert.tone === "danger" ? "danger" : alert.tone === "warning" ? "warning" : "info",
        href: alert.href,
      }))}
      shortcuts={[
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Propriétaires", href: "/dashboard/admin/proprietaires" },
        { label: "Conciergeries", href: "/dashboard/admin/conciergeries" },
        { label: "Artisans", href: "/dashboard/admin/artisans" },
        { label: "Décisions architecture", href: "/dashboard/admin/decisions-architecture" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      profile={{
        name: "PlanetLS",
        subtitle: "Qualité opérationnelle",
        badge: "Administration",
      }}
    >
      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title="Santé opérationnelle"
          summary={healthSummary}
          isOpen={panelOpen.health}
          onToggle={() => togglePanel("health")}
          controlsId="admin-health-panel"
        />
        {panelOpen.health ? (
          <div id="admin-health-panel" className={styles.foldableContent}>
            <DashboardPanel title="Santé opérationnelle">
              <AdminKpiGrid kpis={kpis} />
            </DashboardPanel>
          </div>
        ) : null}
      </section>

      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title="Activation J+7"
          summary={activationSummary}
          isOpen={panelOpen.activation}
          onToggle={() => togglePanel("activation")}
          controlsId="admin-activation-panel"
        />
        {panelOpen.activation ? (
          <div id="admin-activation-panel" className={styles.foldableContent}>
            <DashboardPanel title="Activation J+7">
              {kpiError ? <p className={styles.kpiState}>{kpiError}</p> : null}
              {!kpiError && activationRoles.length === 0 ? (
                <p className={styles.kpiState}>Aucun groupe mature sur les 30 derniers jours.</p>
              ) : null}
              {kpiOverview?.activation_alerts.length ? (
                <div className={styles.activationAlerts} aria-label="Alertes d’activation">
                  {kpiOverview.activation_alerts.map((alert) => (
                    <article key={alert.id} data-severity={alert.severity}>
                      <div>
                        <strong>{alert.title}</strong>
                        <span>{alert.detail}</span>
                      </div>
                      <p>{alert.next_action}</p>
                      <Link
                        href={
                          alert.role === "owner"
                            ? "/dashboard/admin/proprietaires"
                            : alert.role === "concierge"
                              ? "/dashboard/admin/conciergeries"
                              : "/dashboard/admin/artisans"
                        }
                      >
                        Ouvrir les profils concernés
                      </Link>
                    </article>
                  ))}
                </div>
              ) : null}
              <div className={styles.activationGrid}>
                {activationRoles.map(({ key, label, metric }) => {
                  const zones = kpiOverview?.activation_by_zone[key] ?? [];
                  const series = (kpiOverview?.activation_series[key] ?? []).slice(-4);
                  return (
                    <article className={styles.activationCard} key={key}>
                      <div className={styles.activationHeader}>
                        <div>
                          <span>{label}</span>
                          <strong>{metric.activation_j7 === null ? "-" : `${metric.activation_j7}%`}</strong>
                        </div>
                        <small>
                          {metric.activation_j7_activated}/{metric.activation_j7_eligible} actives
                        </small>
                      </div>
                      <div className={styles.activationBars} aria-label={`Tendance d’activation ${label}`}>
                        {series.map((point) => (
                          <span
                            key={point.period_start}
                            title={`${point.rate ?? 0}% - ${point.activated}/${point.eligible}`}
                          >
                            <i style={{ height: `${Math.max(4, point.rate ?? 0)}%` }} />
                          </span>
                        ))}
                      </div>
                      <p>
                        {zones[0]
                          ? `Zone principale : ${zones[0].zone} (${zones[0].activated}/${zones[0].eligible})`
                          : "Aucune zone avec groupe mature"}
                      </p>
                      <small>
                        Définition : {metric.activation_definition} | cible{" "}
                        {kpiOverview?.activation_alert_policy.roles[key].target_rate}% | alerte critique sous{" "}
                        {kpiOverview?.activation_alert_policy.roles[key].critical_rate}%
                      </small>
                    </article>
                  );
                })}
              </div>
            </DashboardPanel>
          </div>
        ) : null}
      </section>

      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title="Priorités à traiter"
          summary={prioritySummary}
          isOpen={panelOpen.priorities}
          onToggle={() => togglePanel("priorities")}
          controlsId="admin-priorities-panel"
        />
        {panelOpen.priorities ? (
          <div id="admin-priorities-panel" className={styles.foldableContent}>
            <DashboardPanel title="Priorités à traiter">
              <AdminAlertList alerts={alerts} />
            </DashboardPanel>
          </div>
        ) : null}
      </section>

      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title="Lecture visuelle"
          summary={visualSummary}
          isOpen={panelOpen.visuals}
          onToggle={() => togglePanel("visuals")}
          controlsId="admin-visuals-panel"
        />
        {panelOpen.visuals ? (
          <div id="admin-visuals-panel" className={styles.foldableContent}>
            <DashboardPanel title="Lecture visuelle">
              <div className={styles.visualBlock}>
                <div className={styles.visualDonuts}>
                  <AdminDonutCard
                    title="Inscriptions"
                    subtitle="Vue rapide des créations de comptes."
                    icon={FiUsers}
                    totalLabel="comptes"
                    textureSrc={ADMIN_VISUAL_PRESETS.onboarding.textureSrc}
                    accentColor={ADMIN_VISUAL_PRESETS.onboarding.accentColor}
                    segments={[
                      { label: "Sains", value: adminControl?.summary.onboarding.healthy ?? 0, color: "#1f9d55" },
                      { label: "À suivre", value: adminControl?.summary.onboarding.warning ?? 0, color: "#f59e0b" },
                      { label: "Critiques", value: adminControl?.summary.onboarding.danger ?? 0, color: "#ef4444" },
                    ]}
                  />
                  <AdminDonutCard
                    title="Missions"
                    subtitle="Répartition des parcours opérationnels."
                    icon={FiActivity}
                    totalLabel="missions"
                    textureSrc={ADMIN_VISUAL_PRESETS.missions.textureSrc}
                    accentColor={ADMIN_VISUAL_PRESETS.missions.accentColor}
                    segments={[
                      { label: "Saines", value: adminControl?.summary.missions.healthy ?? 0, color: "#1f9d55" },
                      { label: "À suivre", value: adminControl?.summary.missions.warning ?? 0, color: "#f59e0b" },
                      { label: "Critiques", value: adminControl?.summary.missions.danger ?? 0, color: "#ef4444" },
                    ]}
                  />
                  <AdminDonutCard
                    title="Messages"
                    subtitle="Réponses et conversations à surveiller."
                    icon={FiMessageCircle}
                    totalLabel="fils"
                    textureSrc={ADMIN_VISUAL_PRESETS.messages.textureSrc}
                    accentColor={ADMIN_VISUAL_PRESETS.messages.accentColor}
                    segments={[
                      { label: "Sains", value: adminControl?.summary.messages.healthy ?? 0, color: "#1f9d55" },
                      { label: "À suivre", value: adminControl?.summary.messages.warning ?? 0, color: "#f59e0b" },
                      { label: "Critiques", value: adminControl?.summary.messages.danger ?? 0, color: "#ef4444" },
                    ]}
                  />
                </div>

                <div className={styles.visualSupportRow}>
                  <AdminBubblePanel
                    title="Bulles de signalement"
                    subtitle="Les problèmes à traiter ressortent immédiatement."
                    items={visualBubbles}
                    textureSrc={ADMIN_VISUAL_PRESETS.alerts.textureSrc}
                    accentColor={ADMIN_VISUAL_PRESETS.alerts.accentColor}
                  />

                  <AdminToneLegend
                    textureSrc={ADMIN_VISUAL_PRESETS.legend.textureSrc}
                    accentColor={ADMIN_VISUAL_PRESETS.legend.accentColor}
                  />
                </div>
              </div>
            </DashboardPanel>
          </div>
        ) : null}
      </section>

      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title="Parcours et feux de contrôle"
          summary={journeySummary}
          isOpen={panelOpen.journey}
          onToggle={() => togglePanel("journey")}
          controlsId="admin-journey-panel"
        />
        {panelOpen.journey ? (
          <div id="admin-journey-panel" className={styles.foldableContent}>
            <DashboardPanel title="Parcours et feux de contrôle">
              <div className={styles.processStrip}>
                {[
                  "Demande",
                  "Devis",
                  "Acceptation",
                  "Mission",
                  "Planning",
                  "Réalisation",
                  "Rapport",
                  "Facture",
                  "Reglement",
                ].map((step) => (
                  <span key={step}>{step}</span>
                ))}
              </div>
              <p className={styles.adminNote}>
                Repérer les blocages opérationnels et vérifier que la base utilisateurs reste exploitable.
              </p>
              <div className={styles.categoryGrid}>
                <Link href="/dashboard/admin/controle?tab=inscriptions" className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3>Inscriptions</h3>
                    <span className={styles.categoryBadge}>{adminControl?.summary.onboarding.total ?? 0}</span>
                  </div>
                  <p className={styles.categoryDescription}>
                    {adminControl?.summary.onboarding.danger ?? 0} rouge(s) |{" "}
                    {adminControl?.summary.onboarding.warning ?? 0} orange(s) sur le parcours d’inscription.
                  </p>
                  <span className={styles.categoryLink}>Voir les étapes</span>
                </Link>
                <Link href="/dashboard/admin/controle?tab=missions" className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3>Missions</h3>
                    <span className={styles.categoryBadge}>{adminControl?.summary.missions.total ?? 0}</span>
                  </div>
                  <p className={styles.categoryDescription}>
                    {adminControl?.summary.missions.danger ?? 0} rouge(s) |{" "}
                    {adminControl?.summary.missions.warning ?? 0} orange(s) sur devis, planning, exécution et facture.
                  </p>
                  <span className={styles.categoryLink}>Voir les étapes</span>
                </Link>
                <Link href="/dashboard/admin/controle?tab=messages" className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3>Messages</h3>
                    <span className={styles.categoryBadge}>{adminControl?.summary.messages.total ?? 0}</span>
                  </div>
                  <p className={styles.categoryDescription}>
                    {adminControl?.summary.messages.danger ?? 0} rouge(s) |{" "}
                    {adminControl?.summary.messages.warning ?? 0} orange(s) sur conversations sans réponse ou trop anciennes.
                  </p>
                  <span className={styles.categoryLink}>Voir les étapes</span>
                </Link>
              </div>
            </DashboardPanel>
          </div>
        ) : null}
      </section>

      <section className={styles.foldablePanel}>
        <FoldableSectionHeader
          title="Accès métier"
          summary={accessSummary}
          isOpen={panelOpen.access}
          onToggle={() => togglePanel("access")}
          controlsId="admin-access-panel"
        />
        {panelOpen.access ? (
          <div id="admin-access-panel" className={styles.foldableContent}>
            <DashboardPanel title="Accès métier">
              <div className={styles.categoryGrid}>
                <Link href="/dashboard/admin/controle" className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3 className={styles.categoryTitleWithIcon}>
                      <WorkspaceRoleIcon
                        role="admin"
                        label="Administrateur"
                        size={34}
                        className={styles.roleBadgeIcon}
                      />
                      Contrôle détaillé
                    </h3>
                    <span className={styles.categoryBadge}>{adminControl?.summary.totalProblems ?? 0}</span>
                  </div>
                  <p className={styles.categoryDescription}>
                    Ouvrir les inscriptions, missions et messages à surveiller.
                  </p>
                  <span className={styles.categoryLink}>Ouvrir</span>
                </Link>
                <Link href="/dashboard/admin/utilisateurs" className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3>Utilisateurs</h3>
                    <span className={styles.categoryBadge}>{stats.users}</span>
                  </div>
                  <p className={styles.categoryDescription}>
                    Voir les connexions, les rôles et la complétude des comptes.
                  </p>
                  <span className={styles.categoryLink}>Ouvrir</span>
                </Link>
                <Link href="/dashboard/admin/demandes" className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3>Demandes</h3>
                    <span className={styles.categoryBadge}>{requests.length}</span>
                  </div>
                  <p className={styles.categoryDescription}>
                    Suivre demandes, réponses conciergerie, devis et génération de mission.
                  </p>
                  <span className={styles.categoryLink}>Ouvrir</span>
                </Link>
                <Link href="/dashboard/admin/missions" className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3>Missions</h3>
                    <span className={styles.categoryBadge}>{missions.length}</span>
                  </div>
                  <p className={styles.categoryDescription}>
                    Contrôler planning, réalisation, rapport, facture et règlement.
                  </p>
                  <span className={styles.categoryLink}>Ouvrir</span>
                </Link>
                <Link href="/dashboard/admin/decisions-architecture" className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3>Decisions architecture</h3>
                    <span className={styles.categoryBadge}>ADR</span>
                  </div>
                  <p className={styles.categoryDescription}>
                    Retrouver rapidement les arbitrages techniques et leur justification.
                  </p>
                  <span className={styles.categoryLink}>Ouvrir</span>
                </Link>
              </div>
            </DashboardPanel>
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  );
}
