"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminKpiGrid,
  AdminProcessTimeline,
  AdminStatusBadge,
  formatAdminDate,
  getElapsedLabel,
  getMissionNextAction,
  getMissionStatus,
  getMissionTimeline,
  getMissionUrgency,
  missionStatusOptions,
  normalizeAdminText,
  type AdminKpi,
  type AdminMissionRow,
} from "../AdminOperations";
import styles from "../AdminListPages.module.scss";

function getArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

function getMissionAssignee(mission: AdminMissionRow) {
  return mission.concierge_name || mission.provider_name || "Intervenant non renseigné";
}

function formatAmount(value: AdminMissionRow["amount"], fallback: AdminMissionRow["total_amount"]) {
  const amount = Number(value ?? fallback ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "Non renseigné";
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<AdminMissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tous");

  useEffect(() => {
    async function loadMissions() {
      try {
        const response = await fetch("/api/missions?limit=200", { cache: "no-store" });
        if (!response.ok) return;
        setMissions(getArrayPayload<AdminMissionRow>(await response.json().catch(() => [])));
      } finally {
        setLoading(false);
      }
    }

    void loadMissions();
  }, []);

  const filteredMissions = useMemo(() => {
    const normalizedSearch = normalizeAdminText(search);
    return missions.filter((mission) => {
      const missionStatus = getMissionStatus(mission);
      const matchesStatus = status === "Tous" || missionStatus === status;
      const searchable = normalizeAdminText(
        [
          mission.title,
          mission.owner_name,
          mission.property_name,
          mission.city,
          getMissionAssignee(mission),
          mission.quote_id,
          mission.invoice_id,
        ].join(" "),
      );
      return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [missions, search, status]);

  const completedCount = missions.filter((mission) =>
    ["Réalisée", "Facturée", "Réglée", "Clôturée"].includes(getMissionStatus(mission)),
  ).length;
  const unplannedCount = missions.filter((mission) => !mission.scheduled_start).length;
  const lateCount = missions.filter((mission) => getMissionUrgency(mission) === "danger").length;
  const invoiceMissingCount = missions.filter(
    (mission) => getMissionStatus(mission) === "Réalisée" && !mission.invoice_id,
  ).length;

  const kpis: AdminKpi[] = [
    {
      id: "all",
      label: "Missions suivies",
      value: missions.length,
      helper: "Toutes missions confondues",
      tone: "neutral",
    },
    {
      id: "late",
      label: "En retard",
      value: lateCount,
      helper: "Date passée ou blocage détecté",
      tone: lateCount ? "danger" : "positive",
    },
    {
      id: "unplanned",
      label: "Sans planning",
      value: unplannedCount,
      helper: "Date d’intervention manquante",
      tone: unplannedCount ? "warning" : "positive",
    },
    {
      id: "completed",
      label: "Réalisées",
      value: completedCount,
      helper: "Rapport, facture ou clôture",
      tone: "positive",
    },
    {
      id: "invoice",
      label: "Factures à vérifier",
      value: invoiceMissingCount,
      helper: "Mission réalisée sans facture liée",
      tone: invoiceMissingCount ? "warning" : "positive",
    },
  ];

  if (loading) return <div className="center">Chargement des missions admin...</div>;

  return (
    <DashboardLayout
      persona="admin"
      title="Suivi des missions"
      subtitle="Contrôler la synchronisation planning, l’exécution terrain, les rapports, factures et règlements."
      navTitle="Pilotage admin"
      navItems={[
        { label: "Vue d’ensemble", href: "/dashboard/admin" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ]}
      stats={[
        { label: "Missions", value: String(missions.length), hint: "Toutes missions suivies" },
        { label: "Filtrées", value: String(filteredMissions.length), hint: "Résultat actuel" },
        { label: "En retard", value: String(lateCount), hint: "À traiter en priorité" },
      ]}
      actions={[{ label: "Voir les demandes", href: "/dashboard/admin/demandes" }]}
      activity={[
        {
          id: "admin-missions-list",
          title: "Missions à contrôler",
          description: "Planning, réalisation, facture et règlement",
          href: "/dashboard/admin/missions",
        },
      ]}
      notifications={[
        {
          id: "admin-missions-late",
          title: `${lateCount} mission(s) en retard ou bloquée(s).`,
          level: lateCount > 0 ? "warning" : "info",
          href: "/dashboard/admin/missions",
        },
      ]}
      shortcuts={[
        { label: "Vue admin", href: "/dashboard/admin" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
      ]}
      profile={{ name: "Admin", subtitle: "Contrôle des missions", badge: "Qualité" }}
    >
      <div className={styles.pageBody}>
        <DashboardPanel title="Vue rapide">
          <AdminKpiGrid kpis={kpis} />
        </DashboardPanel>

        <DashboardPanel title="Filtres">
          <AdminFilterBar
            search={search}
            status={status}
            statusOptions={missionStatusOptions}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />
        </DashboardPanel>

        <DashboardPanel title="Missions à contrôler">
          {filteredMissions.length ? (
            <div className={styles.list}>
              {filteredMissions.map((mission) => {
                const currentStatus = getMissionStatus(mission);
                return (
                  <article className={styles.card} key={mission.id}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>
                        <span>Mission</span>
                        <h3>{mission.title || mission.property_name || "Mission de service"}</h3>
                        <p>
                          {mission.owner_name || "Propriétaire non renseigné"} · {mission.property_name || "Logement non renseigné"}
                          {mission.city ? ` · ${mission.city}` : ""}
                        </p>
                      </div>
                      <div className={styles.cardActions}>
                        <AdminStatusBadge label={currentStatus} tone={getMissionUrgency(mission)} />
                        <Link className={styles.primaryLink} href={`/dashboard/owner/missions/${mission.id}`}>
                          Ouvrir la mission
                        </Link>
                      </div>
                    </div>

                    <div className={styles.factsGrid}>
                      <div className={styles.fact}>
                        <span>Intervenant</span>
                        <strong>{getMissionAssignee(mission)}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Date prévue</span>
                        <strong>{formatAdminDate(mission.scheduled_start)}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Montant</span>
                        <strong>{formatAmount(mission.amount, mission.total_amount)}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Prochaine action</span>
                        <strong>{getMissionNextAction(mission)}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Devis lié</span>
                        <strong>{mission.quote_id ? "Oui" : "Non renseigné"}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Demande liée</span>
                        <strong>{mission.service_request_id ? "Oui" : "Non renseignée"}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Facture liée</span>
                        <strong>{mission.invoice_id ? "Oui" : "À vérifier"}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Dernière mise à jour</span>
                        <strong>{getElapsedLabel(mission.updated_at ?? mission.scheduled_start)}</strong>
                      </div>
                    </div>

                    <AdminProcessTimeline steps={getMissionTimeline(mission)} />
                  </article>
                );
              })}
            </div>
          ) : (
            <AdminEmptyState
              title="Aucune mission ne correspond aux filtres"
              description="Modifiez le statut ou la recherche pour retrouver une mission à contrôler."
            />
          )}
        </DashboardPanel>
      </div>
    </DashboardLayout>
  );
}
