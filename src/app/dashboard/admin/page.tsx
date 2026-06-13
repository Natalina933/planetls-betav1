"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { supabaseBrowser } from "@/app/lib/dbClient";
import { getDashboardMissionPaceMeta } from "@/app/components/dashboard/saas";
import {
  AdminAlertList,
  AdminKpiGrid,
  type AdminKpi,
  type AdminMissionRow,
  type AdminRequestRow,
  getElapsedLabel,
  getMissionNextAction,
  getMissionStatus,
  getMissionUrgency,
  getRequestAssignee,
  getRequestNextAction,
  getRequestStatus,
  getRequestUrgency,
  normalizeAdminText,
} from "./AdminOperations";
import styles from "./AdminDashboard.module.scss";

type DashboardStats = {
  users: number;
  activeProviders: number;
  bookings: number;
};

function getArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    activeProviders: 0,
    bookings: 0,
  });
  const [requests, setRequests] = useState<AdminRequestRow[]>([]);
  const [missions, setMissions] = useState<AdminMissionRow[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const supabase = supabaseBrowser();
        const [{ count: usersCount }, { count: providersCount }, { count: bookingsCount }] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).in("type", ["provider", "concierge"]),
          supabase.from("planning_entries").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          users: usersCount ?? 0,
          activeProviders: providersCount ?? 0,
          bookings: bookingsCount ?? 0,
        });

        const [requestsRes, missionsRes, invoicesRes] = await Promise.allSettled([
          fetch("/api/service-requests?limit=200", { cache: "no-store" }),
          fetch("/api/missions?limit=200", { cache: "no-store" }),
          fetch("/api/invoices?limit=100", { cache: "no-store" }),
        ]);

        if (requestsRes.status === "fulfilled" && requestsRes.value.ok) {
          setRequests(getArrayPayload<AdminRequestRow>(await requestsRes.value.json().catch(() => ({}))));
        }
        if (missionsRes.status === "fulfilled" && missionsRes.value.ok) {
          setMissions(getArrayPayload<AdminMissionRow>(await missionsRes.value.json().catch(() => [])));
        }
        if (invoicesRes.status === "fulfilled" && invoicesRes.value.ok) {
          setInvoiceCount(getArrayPayload<unknown>(await invoicesRes.value.json().catch(() => [])).length);
        }
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
    () => missions.filter((mission) => ["Réalisée", "Facturée", "Réglée", "Clôturée"].includes(getMissionStatus(mission))).length,
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
      value: blockedRequests.length + lateMissions.length + acceptedQuotesWithoutMission.length,
      helper: "Actions admin prioritaires",
      tone: blockedRequests.length + lateMissions.length + acceptedQuotesWithoutMission.length ? "danger" : "positive",
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
  ];

  if (loading) return <div className="center">Chargement du cockpit admin...</div>;

  return (
    <DashboardLayout
      persona="admin"
      title="Cockpit de contrôle"
      subtitle="Demandes, devis, missions, plannings et paiements : les points à vérifier en priorité."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d’ensemble", href: "/dashboard/admin" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
        { label: "Propriétaires", href: "/dashboard/owner" },
        { label: "Conciergeries", href: "/dashboard/concierge" },
        { label: "Prestataires", href: "/dashboard/provider" },
      ]}
      stats={[
        { label: "Utilisateurs", value: String(stats.users), hint: "Profils actifs ou inscrits" },
        { label: "Partenaires", value: String(stats.activeProviders), hint: "Conciergeries et prestataires" },
        {
          label: "Planning",
          value: String(stats.bookings),
          hint: `${todayAdminMissionCount} mission(s) aujourd'hui`,
          trend: missionPaceMeta.label,
          visual: missionPaceMeta.icon,
          visualLabel: missionPaceMeta.label,
        },
        { label: "Factures", value: String(invoiceCount), hint: "Pièces de gestion suivies" },
      ]}
      actions={[
        { label: "Contrôler les demandes", href: "/dashboard/admin/demandes" },
        { label: "Contrôler les missions", href: "/dashboard/admin/missions" },
      ]}
      activity={[
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
      ]}
      notifications={alerts.slice(0, 3).map((alert) => ({
        id: alert.id,
        title: alert.title,
        level: alert.tone === "danger" ? "danger" : alert.tone === "warning" ? "warning" : "info",
        href: alert.href,
      }))}
      shortcuts={[
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
        { label: "Owner", href: "/dashboard/owner" },
        { label: "Concierge", href: "/dashboard/concierge" },
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

      <DashboardPanel title="Parcours contrôlé">
        <div className={styles.processStrip}>
          {["Demande", "Devis", "Acceptation", "Mission", "Planning", "Réalisation", "Rapport", "Facture", "Règlement"].map(
            (step) => (
              <span key={step}>{step}</span>
            ),
          )}
        </div>
        <p className={styles.adminNote}>
          L’objectif admin est simple : repérer ce qui bloque, qui doit répondre et si chaque devis accepté déclenche bien
          une mission synchronisée dans les plannings.
        </p>
      </DashboardPanel>

      <DashboardPanel title="Accès métier">
        <div className={styles.categoryGrid}>
          <Link href="/dashboard/admin/demandes" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3>Demandes</h3>
              <span className={styles.categoryBadge}>{requests.length}</span>
            </div>
            <p className={styles.categoryDescription}>Suivre la demande, les réponses conciergerie, les devis et la génération de mission.</p>
            <span className={styles.categoryLink}>Ouvrir le suivi</span>
          </Link>
          <Link href="/dashboard/admin/missions" className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3>Missions</h3>
              <span className={styles.categoryBadge}>{missions.length}</span>
            </div>
            <p className={styles.categoryDescription}>Contrôler le planning, la réalisation, le rapport, la facture et le règlement.</p>
            <span className={styles.categoryLink}>Ouvrir le suivi</span>
          </Link>
        </div>
      </DashboardPanel>
    </DashboardLayout>
  );
}
