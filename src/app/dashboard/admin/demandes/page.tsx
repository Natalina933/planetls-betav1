"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { overrideAdminNavItems, overrideAdminShortcuts } from "../adminNavigation";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminIssueList,
  AdminKpiGrid,
  AdminProcessTimeline,
  AdminStatusBadge,
  formatAdminDate,
  getElapsedLabel,
  getRequestAdminIssues,
  getRequestAssignee,
  getRequestNextAction,
  getRequestStatus,
  getRequestTimeline,
  getRequestUrgency,
  normalizeAdminText,
  requestStatusOptions,
  type AdminKpi,
  type AdminRequestRow,
} from "../AdminOperations";
import styles from "../AdminListPages.module.scss";

type AdminOperationsPayload = { requests?: AdminRequestRow[]; nextOffset?: number | null };

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tous");

  const loadRequests = useCallback(async (offset = 0) => {
    if (offset > 0) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/admin/operations?limit=200&offset=${offset}`, { cache: "no-store" });
      if (!response.ok) {
        setHasMore(false);
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as AdminOperationsPayload;
      const nextRequests = Array.isArray(payload.requests) ? payload.requests : [];
      setRequests((current) => {
        if (offset === 0) return nextRequests;
        return Array.from(new Map([...current, ...nextRequests].map((request) => [request.id, request])).values());
      });
      setHasMore(typeof payload.nextOffset === "number");
    } finally {
      if (offset > 0) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const loadMore = () => {
    void loadRequests(requests.length);
  };

  const filteredRequests = useMemo(() => {
    const normalizedSearch = normalizeAdminText(search);
    return requests.filter((request) => {
      const requestStatus = getRequestStatus(request);
      const matchesStatus = status === "Tous" || requestStatus === status;
      const searchable = normalizeAdminText(
        [
          request.title,
          request.id,
          request.mission_id,
          request.owner_name,
          request.property_name,
          request.city,
          getRequestAssignee(request),
          request.requested_services?.join(" "),
        ].join(" "),
      );
      return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [requests, search, status]);

  const kpis: AdminKpi[] = [
    {
      id: "all",
      label: "Demandes suivies",
      value: requests.length,
      helper: "Parcours demande, devis et mission",
      tone: "neutral",
    },
    {
      id: "blocked",
      label: "Blocages",
      value: requests.filter((request) => getRequestStatus(request) === "Bloquée" || getRequestUrgency(request) === "danger").length,
      helper: "Relance ou correction nécessaire",
      tone: "danger",
    },
    {
      id: "waiting",
      label: "Sans réponse",
      value: requests.filter((request) => ["Envoyée", "Reçue", "En attente de réponse"].includes(getRequestStatus(request))).length,
      helper: "Conciergerie ou prestataire à relancer",
      tone: "warning",
    },
    {
      id: "quotes",
      label: "Devis acceptés",
      value: requests.filter((request) => getRequestStatus(request) === "Devis accepté").length,
      helper: "Mission à vérifier ensuite",
      tone: "positive",
    },
  ];

  if (loading) return <div className="center">Chargement des demandes admin...</div>;

  return (
    <DashboardLayout
      persona="admin"
      title="Suivi des demandes"
      subtitle="Contrôler les réponses, les devis, les blocages et la génération des missions."
      navTitle="Admin / Operations"
      navItems={overrideAdminNavItems([
        { label: "Vue d’ensemble", href: "/dashboard/admin" },
        { label: "Demandes", href: "/dashboard/admin/demandes" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ], "operations")}
      stats={[
        { label: "Demandes", value: String(requests.length), hint: "Toutes demandes confondues" },
        { label: "Filtrées", value: String(filteredRequests.length), hint: "Résultat actuel" },
        { label: "Blocages", value: String(kpis[1].value), hint: "À traiter en priorité" },
      ]}
      actions={[{ label: "Voir les missions", href: "/dashboard/admin/missions" }]}
      activity={[
        {
          id: "admin-demandes-list",
          title: "Demandes à contrôler",
          description: "Statuts, devis, relances et génération de mission",
          href: "/dashboard/admin/demandes",
        },
      ]}
      notifications={[
        {
          id: "admin-demandes-blocked",
          title: `${kpis[1].value} demande(s) à surveiller en priorité.`,
          level: Number(kpis[1].value) > 0 ? "warning" : "info",
          href: "/dashboard/admin/demandes",
        },
      ]}
      shortcuts={overrideAdminShortcuts([
        { label: "Vue admin", href: "/dashboard/admin" },
        { label: "Missions", href: "/dashboard/admin/missions" },
      ], "operations")}
      profile={{ name: "Admin", subtitle: "Contrôle des demandes", badge: "Qualité" }}
    >
      <div className={styles.pageBody}>
        <DashboardPanel title="Vue rapide">
          <AdminKpiGrid kpis={kpis} />
        </DashboardPanel>

        <DashboardPanel title="Filtres">
          <AdminFilterBar
            search={search}
            status={status}
            statusOptions={requestStatusOptions}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />
        </DashboardPanel>

        <DashboardPanel title="Demandes à contrôler">
          {filteredRequests.length ? (
            <>
              <div className={styles.list}>
                {filteredRequests.map((request) => {
                const currentStatus = getRequestStatus(request);
                const services = (request.requested_services ?? []).slice(0, 5);
                const missionHref = request.mission_id
                  ? `/dashboard/admin/missions?search=${encodeURIComponent(request.mission_id)}`
                  : "/dashboard/admin/missions";
                return (
                  <article className={styles.card} key={request.id}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>
                        <span>Demande</span>
                        <h3>{request.title || request.property_name || "Demande de services"}</h3>
                        <p>
                          {request.owner_name || "Propriétaire non renseigné"} · {request.property_name || "Logement non renseigné"}
                          {request.city ? ` · ${request.city}` : ""}
                        </p>
                      </div>
                      <div className={styles.cardActions}>
                        <AdminStatusBadge label={currentStatus} tone={getRequestUrgency(request)} />
                        <Link className={styles.primaryLink} href={missionHref}>
                          Voir la mission liée
                        </Link>
                      </div>
                    </div>

                    <div className={styles.factsGrid}>
                      <div className={styles.fact}>
                        <span>Conciergerie sollicitée</span>
                        <strong>{getRequestAssignee(request)}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Créée le</span>
                        <strong>{formatAdminDate(request.created_at)}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Dernière action</span>
                        <strong>{getElapsedLabel(request.updated_at ?? request.created_at)}</strong>
                      </div>
                      <div className={styles.fact}>
                        <span>Prochaine action</span>
                        <strong>{getRequestNextAction(request)}</strong>
                      </div>
                    </div>

                    {services.length ? (
                      <div className={styles.services}>
                        {services.map((service) => (
                          <span key={service}>{service}</span>
                        ))}
                      </div>
                    ) : null}

                    <AdminProcessTimeline steps={getRequestTimeline(request)} />
                    <AdminIssueList issues={getRequestAdminIssues(request)} />
                  </article>
                );
                })}
              </div>
              {hasMore ? (
                <div className={styles.listFooter}>
                  <button type="button" className={styles.ghostButton} onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Chargement..." : "Charger les demandes suivantes"}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <AdminEmptyState
              title="Aucune demande ne correspond aux filtres"
              description="Modifiez le statut ou la recherche pour retrouver une demande à contrôler."
            />
          )}
        </DashboardPanel>
      </div>
    </DashboardLayout>
  );
}
