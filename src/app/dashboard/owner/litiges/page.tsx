"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../OwnerDashboardPages.module.scss";

type OwnerDisputeRow = {
  id: string;
  title: string | null;
  dispute_type: string | null;
  status: string | null;
  estimated_amount: number | null;
  currency: string | null;
  opened_at: string | null;
  housing_id: number | null;
  housing_name?: string | null;
  housing_city?: string | null;
  evidence_count?: number;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(value: number | null, currency: string | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function OwnerDisputesPage() {
  const [disputes, setDisputes] = useState<OwnerDisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadDisputes() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/disputes?limit=50", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos litiges.");
        }

        setDisputes(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos litiges.");
      } finally {
        setLoading(false);
      }
    }

    void loadDisputes();
  }, []);

  const filteredDisputes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return disputes.filter((dispute) => {
      const matchesStatus = statusFilter === "all" || (dispute.status ?? "") === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        dispute.title,
        dispute.dispute_type,
        dispute.housing_name,
        dispute.housing_city,
        dispute.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [disputes, searchTerm, statusFilter]);

  const openCount = useMemo(
    () => disputes.filter((item) => item.status === "open" || item.status === "in_review").length,
    [disputes],
  );

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Mes litiges</h1>
        <p>Centralisez les litiges voyageurs, suivez leur statut et exportez les dossiers de preuves.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Litiges suivis</h3>
          <p>{loading ? "..." : disputes.length}</p>
        </div>
        <div className="stat-card">
          <h3>Actifs</h3>
          <p>{loading ? "..." : openCount}</p>
        </div>
        <div className="stat-card">
          <h3>Affiches</h3>
          <p>{loading ? "..." : filteredDisputes.length}</p>
        </div>
      </div>

      <div className="main-section">
        <div className={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un litige"
            className={styles.field}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={styles.select}
          >
            <option value="all">Tous statuts</option>
            <option value="open">Ouvert</option>
            <option value="evidence_requested">Preuves demandees</option>
            <option value="in_review">En revue</option>
            <option value="resolved">Resolus</option>
            <option value="rejected">Rejetes</option>
            <option value="closed">Clotures</option>
          </select>
          <Link href="/dashboard/owner/logements" className={styles.buttonSecondary}>
            Retour logements
          </Link>
        </div>

        {loading ? <p>Chargement des litiges...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && filteredDisputes.length === 0 ? (
          <p>Aucun litige a afficher.</p>
        ) : null}

        {!loading && !error && filteredDisputes.length > 0 ? (
          <ul>
            {filteredDisputes.map((dispute) => (
              <li key={dispute.id} className={styles.listItem}>
                <strong>{dispute.title || "Litige"}</strong>
                <br />
                Logement: {dispute.housing_name || `#${dispute.housing_id ?? "-"}`}
                {dispute.housing_city ? ` (${dispute.housing_city})` : ""}
                <br />
                Type: {dispute.dispute_type || "-"} | Statut: {dispute.status || "-"} | Ouvert le: {formatDate(dispute.opened_at)}
                <br />
                Montant estime: {formatAmount(dispute.estimated_amount, dispute.currency)} | Preuves: {dispute.evidence_count ?? 0}
                <br />
                <span className={styles.inlineActions}>
                  <a
                    href={`/api/disputes/${dispute.id}/export`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.linkButton}
                  >
                    Dossier
                  </a>
                  <a
                    href={`/api/disputes/${dispute.id}/export?print=1`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.linkButton}
                  >
                    Imprimer / PDF
                  </a>
                  {typeof dispute.housing_id === "number" ? (
                    <Link href={`/dashboard/owner/logements/${dispute.housing_id}`} className={styles.linkButton}>
                      Voir logement
                    </Link>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
