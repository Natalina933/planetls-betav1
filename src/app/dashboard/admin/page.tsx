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
  FiShield,
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
  AdminGaugeCard,
  AdminToneLegend,
} from "./AdminVisuals";
import { ADMIN_VISUAL_PRESETS } from "./adminVisualPresets";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [operationsRes, overviewRes, controlRes] = await Promise.allSettled([
          fetch("/api/admin/operations?limit=200", { cache: "no-store" }),
          fetch("/api/admin/overview", { cache: "no-store" }),
          fetch("/api/admin/control-tower", { cache: "no-store" }),
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

        setStats({
          users: overviewPayload?.summary.totalUsers ?? 0,
          activePartners: (overviewPayload?.summary.concierges ?? 0) + (overviewPayload?.summary.providers ?? 0),
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
        return status === "Bloquée" || getRequestUrgency(request) === "danger";
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
        const quoteAccepted = getRequestStatus(request) === "Devis accepté";
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
  const missionPaceMeta = useMemo(() => getDashboardMissionPaceMeta(todayAdminMissionCount), [todayAdminMissionCount]);
  const completedMissions = useMemo(
    () =>
      missions.filter((mission) =>
        ["Réalisée", "Facturée", "Réglée", "Clôturée"].includes(getMissionStatus(mission)),
      ).length,
    [missions],
  );

  const kpis: AdminKpi[] = [
    {
      id: "requests",
      label: "Demandes en cours",
      value: requests.length,
      helper: "Demandes à suivre sur le parcours",
      tone: requests.length ? "neutral" : "positive",
    },
    {
      id: "blocked",
      label: "Blocages",
      value:
        blockedRequests.length +
        lateMissions.length +
        acceptedQuotesWithoutMission.length +
        (adminControl?.summary.totalProblems ?? 0),
      helper: "Actions admin prioritaires",
      tone:
        blockedRequests.length + lateMissions.length + acceptedQuotesWithoutMission.length + (adminControl?.summary.totalProblems ?? 0)
          ? "danger"
          : "positive",
    },
    {
      id: "quotes",
      label: "Devis à surveiller",
      value: acceptedQuotesWithoutMission.length,
      helper: "Acceptés sans mission détectée",
      tone: acceptedQuotesWithoutMission.length ? "warning" : "positive",
    },
    {
      id: "missions",
      label: "Missions planifiées",
      value: plannedMissions,
      helper: "Présentes dans le suivi planning",
      tone: "neutral",
    },
    {
      id: "completed",
      label: "Missions réalisées",
      value: completedMissions,
      helper: "Rapport, facture ou clôture à contrôler",
      tone: "positive",
    },
    {
      id: "active-users",
      label: "Connexions 24 h",
      value: stats.active24h,
      helper: "Dernières connexions connues",
      tone: stats.active24h > 0 ? "positive" : "warning",
    },
  ];

  const alerts = [
    ...blockedRequests.slice(0, 4).map((request) => ({
      id: `request-${request.id}`,
      title: `${getRequestStatus(request)} · ${request.property_name || "Logement non renseigné"}`,
      description: `${getRequestNextAction(request)} · ${getRequestAssignee(request)} · ${getElapsedLabel(request.updated_at ?? request.created_at)}`,
      href: "/dashboard/admin/demandes",
      tone: getRequestUrgency(request),
    })),
    ...acceptedQuotesWithoutMission.slice(0, 3).map((request) => ({
      id: `quote-${request.id}`,
      title: `Devis accepté sans mission · ${request.property_name || request.title || "Demande"}`,
      description: "Vérifier que la mission a bien été générée et ajoutée aux plannings.",
      href: "/dashboard/admin/demandes",
      tone: "warning" as const,
    })),
    ...lateMissions.slice(0, 4).map((mission) => ({
      id: `mission-${mission.id}`,
      title: `${getMissionStatus(mission)} · ${mission.property_name || mission.title || "Mission"}`,
      description: `${getMissionNextAction(mission)} · ${getElapsedLabel(mission.updated_at ?? mission.scheduled_start)}`,
      href: "/dashboard/admin/missions",
      tone: getMissionUrgency(mission),
    })),
    ...(adminOverview?.spotlights.onboardingAlerts ?? []).slice(0, 3).map((user) => ({
      id: `user-${user.id}`,
      title: `Compte à débloquer · ${user.displayName}`,
      description: user.healthFlags[0] ?? "Vérification du compte recommandée",
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

  if (loading) return <div className="center">Chargement du cockpit admin...</div>;

  return (
    <DashboardLayout
      persona="admin"
      title="Cockpit de contrôle"
      subtitle="Demandes, utilisateurs, devis, missions, plannings et paiements : les points à vérifier en priorité."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
        { label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
        { label: "Propriétaires", href: "/dashboard/admin/proprietaires" },
        { label: "Conciergeries", href: "/dashboard/admin/conciergeries" },
        { label: "Artisans", href: "/dashboard/admin/artisans" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      stats={[
        { label: "Utilisateurs", value: String(stats.users), hint: "Profils actifs ou inscrits" },
        { label: "Partenaires", value: String(stats.activePartners), hint: "Conciergeries et artisans" },
        {
          label: "Planning",
          value: String(stats.bookings),
          hint: `${todayAdminMissionCount} mission(s) aujourd'hui`,
          trend: missionPaceMeta.label,
          visual: missionPaceMeta.icon,
          visualLabel: missionPaceMeta.label,
        },
        { label: "Factures", value: String(invoiceCount), hint: "Pièces de gestion suivies" },
        {
          label: "Problèmes parcours",
          value: String(adminControl?.summary.totalProblems ?? 0),
          hint: "Inscriptions, missions et messages",
        },
        {
          label: "Connexions 24 h",
          value: String(stats.active24h),
          hint: `${stats.active7d} actif(s) sur 7 jours · ${adminOverview?.summary.workflowEvents ?? 0} événement(s) workflow`,
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
          title: "Étapes et anomalies",
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
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      profile={{
        name: "PlanetLS",
        subtitle: "Qualité opérationnelle",
        badge: "Administration",
      }}
    >
      <DashboardPanel title="Santé opérationnelle">
        <AdminKpiGrid kpis={kpis} />
      </DashboardPanel>

      <DashboardPanel title="Priorités à traiter">
        <AdminAlertList alerts={alerts} />
      </DashboardPanel>

      <DashboardPanel title="Vue visuelle">
        <div className={styles.visualBlock}>
          <div className={styles.visualDonuts}>
            <AdminDonutCard
              title="Inscriptions"
              subtitle="Lecture immédiate de l'état des créations de comptes."
              icon={FiUsers}
              totalLabel="comptes"
              illustrationSrc={ADMIN_VISUAL_PRESETS.onboarding.illustrationSrc}
              illustrationAlt={ADMIN_VISUAL_PRESETS.onboarding.illustrationAlt}
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
              subtitle="Vue camembert des parcours opérationnels."
              icon={FiActivity}
              totalLabel="missions"
              illustrationSrc={ADMIN_VISUAL_PRESETS.missions.illustrationSrc}
              illustrationAlt={ADMIN_VISUAL_PRESETS.missions.illustrationAlt}
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
              illustrationSrc={ADMIN_VISUAL_PRESETS.messages.illustrationSrc}
              illustrationAlt={ADMIN_VISUAL_PRESETS.messages.illustrationAlt}
              textureSrc={ADMIN_VISUAL_PRESETS.messages.textureSrc}
              accentColor={ADMIN_VISUAL_PRESETS.messages.accentColor}
              segments={[
                { label: "Sains", value: adminControl?.summary.messages.healthy ?? 0, color: "#1f9d55" },
                { label: "À suivre", value: adminControl?.summary.messages.warning ?? 0, color: "#f59e0b" },
                { label: "Critiques", value: adminControl?.summary.messages.danger ?? 0, color: "#ef4444" },
              ]}
            />
          </div>

          <AdminBubblePanel
            title="Bulles de signalement"
            subtitle="Les problèmes ressortent tout de suite, sans lire tout le dashboard."
            items={visualBubbles}
            illustrationSrc={ADMIN_VISUAL_PRESETS.alerts.illustrationSrc}
            illustrationAlt={ADMIN_VISUAL_PRESETS.alerts.illustrationAlt}
            textureSrc={ADMIN_VISUAL_PRESETS.alerts.textureSrc}
            accentColor={ADMIN_VISUAL_PRESETS.alerts.accentColor}
          />

          <div className={styles.visualDonuts}>
            <AdminGaugeCard
              title="Fiabilité inscriptions"
              subtitle="Part des comptes sains sur tout le parcours d'inscription."
              icon={FiShield}
              value={adminControl?.summary.onboarding.healthy ?? 0}
              total={adminControl?.summary.onboarding.total ?? 0}
              illustrationSrc={ADMIN_VISUAL_PRESETS.reliability.illustrationSrc}
              illustrationAlt={ADMIN_VISUAL_PRESETS.reliability.illustrationAlt}
              textureSrc={ADMIN_VISUAL_PRESETS.reliability.textureSrc}
              accentColor={ADMIN_VISUAL_PRESETS.reliability.accentColor}
              tone={(adminControl?.summary.onboarding.danger ?? 0) > 0 ? "danger" : (adminControl?.summary.onboarding.warning ?? 0) > 0 ? "warning" : "positive"}
            />
            <AdminGaugeCard
              title="Fiabilité missions"
              subtitle="Part des missions sans blocage ni retard."
              icon={FiActivity}
              value={adminControl?.summary.missions.healthy ?? 0}
              total={adminControl?.summary.missions.total ?? 0}
              illustrationSrc={ADMIN_VISUAL_PRESETS.activity.illustrationSrc}
              illustrationAlt={ADMIN_VISUAL_PRESETS.activity.illustrationAlt}
              textureSrc={ADMIN_VISUAL_PRESETS.activity.textureSrc}
              accentColor={ADMIN_VISUAL_PRESETS.activity.accentColor}
              tone={(adminControl?.summary.missions.danger ?? 0) > 0 ? "danger" : (adminControl?.summary.missions.warning ?? 0) > 0 ? "warning" : "positive"}
            />
            <AdminGaugeCard
              title="Fiabilité messages"
              subtitle="Part des conversations qui tournent correctement."
              icon={FiMessageCircle}
              value={adminControl?.summary.messages.healthy ?? 0}
              total={adminControl?.summary.messages.total ?? 0}
              illustrationSrc={ADMIN_VISUAL_PRESETS.messages.illustrationSrc}
              illustrationAlt={ADMIN_VISUAL_PRESETS.messages.illustrationAlt}
              textureSrc={ADMIN_VISUAL_PRESETS.messages.textureSrc}
              accentColor={ADMIN_VISUAL_PRESETS.messages.accentColor}
              tone={(adminControl?.summary.messages.danger ?? 0) > 0 ? "danger" : (adminControl?.summary.messages.warning ?? 0) > 0 ? "warning" : "positive"}
            />
          </div>

          <AdminToneLegend
            illustrationSrc={ADMIN_VISUAL_PRESETS.legend.illustrationSrc}
            illustrationAlt={ADMIN_VISUAL_PRESETS.legend.illustrationAlt}
            textureSrc={ADMIN_VISUAL_PRESETS.legend.textureSrc}
            accentColor={ADMIN_VISUAL_PRESETS.legend.accentColor}
          />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Parcours contrôlé">
        <div className={styles.processStrip}>
          {["Demande", "Devis", "Acceptation", "Mission", "Planning", "Réalisation", "Rapport", "Facture", "Règlement"].map(
            (step) => (
              <span key={step}>{step}</span>
            ),
          )}
        </div>
        <p className={styles.adminNote}>
          L'objectif admin est double : repérer ce qui bloque dans l'opérationnel et contrôler que la base utilisateurs
          reste activable, joignable et suffisamment complète pour faire tourner la plateforme.
        </p>
      </DashboardPanel>

      <DashboardPanel title="Feux de contrôle">
        <div className={styles.categoryGrid}>
          <Link href="/dashboard/admin/controle?tab=inscriptions" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3>Inscriptions</h3>
              <span className={styles.categoryBadge}>{adminControl?.summary.onboarding.total ?? 0}</span>
            </div>
            <p className={styles.categoryDescription}>
              {adminControl?.summary.onboarding.danger ?? 0} rouge(s) · {adminControl?.summary.onboarding.warning ?? 0} orange(s) sur la création, la confirmation et le parcours d'inscription.
            </p>
            <span className={styles.categoryLink}>Voir les étapes</span>
          </Link>
          <Link href="/dashboard/admin/controle?tab=missions" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3>Missions</h3>
              <span className={styles.categoryBadge}>{adminControl?.summary.missions.total ?? 0}</span>
            </div>
            <p className={styles.categoryDescription}>
              {adminControl?.summary.missions.danger ?? 0} rouge(s) · {adminControl?.summary.missions.warning ?? 0} orange(s) sur devis, planning, exécution et facture.
            </p>
            <span className={styles.categoryLink}>Voir les étapes</span>
          </Link>
          <Link href="/dashboard/admin/controle?tab=messages" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3>Messages</h3>
              <span className={styles.categoryBadge}>{adminControl?.summary.messages.total ?? 0}</span>
            </div>
            <p className={styles.categoryDescription}>
              {adminControl?.summary.messages.danger ?? 0} rouge(s) · {adminControl?.summary.messages.warning ?? 0} orange(s) sur conversations sans réponse ou trop anciennes.
            </p>
            <span className={styles.categoryLink}>Voir les étapes</span>
          </Link>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Accès métier">
        <div className={styles.categoryGrid}>
          <Link href="/dashboard/admin/controle" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryTitleWithIcon}>
                <WorkspaceRoleIcon role="admin" label="Administrateur" size={34} className={styles.roleBadgeIcon} />
                Contrôle détaillé
              </h3>
              <span className={styles.categoryBadge}>{adminControl?.summary.totalProblems ?? 0}</span>
            </div>
            <p className={styles.categoryDescription}>
              Voir les étapes d'inscription, les missions et les messages avec des couleurs de surveillance.
            </p>
            <span className={styles.categoryLink}>Ouvrir l'onglet</span>
          </Link>
          <Link href="/dashboard/admin/utilisateurs" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3>Utilisateurs</h3>
              <span className={styles.categoryBadge}>{stats.users}</span>
            </div>
            <p className={styles.categoryDescription}>
              Voir les connexions, le parcours d'inscription, les e-mails confirmés et la complétude de chaque compte.
            </p>
            <span className={styles.categoryLink}>Ouvrir le pilotage</span>
          </Link>
          <Link href="/dashboard/admin/proprietaires" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryTitleWithIcon}>
                <WorkspaceRoleIcon role="owner" label="Proprietaires" size={34} className={styles.roleBadgeIcon} />
                Propriétaires
              </h3>
              <span className={styles.categoryBadge}>{stats.owners}</span>
            </div>
            <p className={styles.categoryDescription}>
              Contrôler la base propriétaires, leurs logements et leur niveau d'activation.
            </p>
            <span className={styles.categoryLink}>Ouvrir le suivi</span>
          </Link>
          <Link href="/dashboard/admin/conciergeries" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryTitleWithIcon}>
                <WorkspaceRoleIcon role="concierge" label="Conciergeries" size={34} className={styles.roleBadgeIcon} />
                Conciergeries
              </h3>
              <span className={styles.categoryBadge}>{stats.concierges}</span>
            </div>
            <p className={styles.categoryDescription}>
              Suivre la préparation des profils concierge, les services et l'activité récente.
            </p>
            <span className={styles.categoryLink}>Ouvrir le suivi</span>
          </Link>
          <Link href="/dashboard/admin/artisans" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryTitleWithIcon}>
                <WorkspaceRoleIcon role="provider" label="Artisans" size={34} className={styles.roleBadgeIcon} />
                Artisans
              </h3>
              <span className={styles.categoryBadge}>{stats.providers}</span>
            </div>
            <p className={styles.categoryDescription}>
              Vérifier les profils prestataires, leurs tarifs reliés et leur niveau d'activation.
            </p>
            <span className={styles.categoryLink}>Ouvrir le suivi</span>
          </Link>
          <Link href="/dashboard/admin/demandes" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3>Demandes</h3>
              <span className={styles.categoryBadge}>{requests.length}</span>
            </div>
            <p className={styles.categoryDescription}>
              Suivre la demande, les réponses conciergerie, les devis et la génération de mission.
            </p>
            <span className={styles.categoryLink}>Ouvrir le suivi</span>
          </Link>
          <Link href="/dashboard/admin/missions" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3>Missions</h3>
              <span className={styles.categoryBadge}>{missions.length}</span>
            </div>
            <p className={styles.categoryDescription}>
              Contrôler le planning, la réalisation, le rapport, la facture et le règlement.
            </p>
            <span className={styles.categoryLink}>Ouvrir le suivi</span>
          </Link>
        </div>
      </DashboardPanel>
    </DashboardLayout>
  );
}
