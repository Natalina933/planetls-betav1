"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import styles from "./DemandesPage.module.scss";

type ConciergeRequestRow = {
  id: string;
  title: string;
  description: string | null;
  request_type: "ponctuel" | "renfort" | "durable";
  city: string | null;
  postal_code: string | null;
  desired_date: string | null;
  urgency: boolean;
  budget_max: number | null;
  currency: string | null;
  requested_services: string[];
  status: string;
  recipient_id: string;
  recipient_status: string;
  response_message: string | null;
  owner_name: string;
};

function formatDate(value: string | null) {
  if (!value) return "Date à définir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(value: number | null, currency: string | null) {
  if (typeof value !== "number") return "Budget non renseigné";
  return `${value.toFixed(0)} ${currency || "EUR"} max`;
}

function formatType(value: ConciergeRequestRow["request_type"]) {
  if (value === "durable") return "Besoin durable";
  if (value === "renfort") return "Renfort / remplacement";
  return "Besoin ponctuel";
}

export default function ConciergeDemandesPage() {
  const [items, setItems] = useState<ConciergeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyRecipientId, setBusyRecipientId] = useState<string | null>(null);

  const markRequestsAsViewed = useCallback(async (rows: ConciergeRequestRow[]) => {
    const pendingRows = rows.filter((item) => item.recipient_status === "sent");
    if (pendingRows.length === 0) return rows;

    const results = await Promise.allSettled(
      pendingRows.map((item) =>
        fetch(`/api/service-request-recipients/${item.recipient_id}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "viewed" }),
        }),
      ),
    );

    const viewedRecipientIds = new Set<string>();
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.ok) {
        viewedRecipientIds.add(pendingRows[index].recipient_id);
      }
    });

    if (viewedRecipientIds.size === 0) return rows;

    return rows.map((item) =>
      viewedRecipientIds.has(item.recipient_id)
        ? { ...item, recipient_status: "viewed" }
        : item,
    );
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/service-requests?view=concierge&limit=30", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les demandes.");
      }
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      const hydratedItems = await markRequestsAsViewed(nextItems);
      setItems(hydratedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  }, [markRequestsAsViewed]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const urgentCount = useMemo(() => items.filter((item) => item.urgency).length, [items]);
  const openCount = useMemo(
    () => items.filter((item) => item.recipient_status === "sent" || item.recipient_status === "viewed").length,
    [items],
  );
  const quotedCount = useMemo(
    () => items.filter((item) => item.recipient_status === "quoted").length,
    [items],
  );

  async function respond(recipientId: string, status: "interested" | "declined" | "quoted") {
    try {
      setBusyRecipientId(recipientId);
      setActionMessage(null);
      setError(null);

      const response = await fetch(`/api/service-request-recipients/${recipientId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de mettre à jour la demande.");
      }

      setActionMessage(
        status === "interested"
          ? "Demande marquée comme intéressante."
          : status === "quoted"
            ? "Demande marquée comme devis à préparer."
            : "Demande refusée.",
      );
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour la demande.");
    } finally {
      setBusyRecipientId(null);
    }
  }

  return (
    <ConciergeWorkspacePage
      eyebrow="Missions"
      title="Demandes reçues"
      description={
        loading
          ? "Chargement des demandes..."
          : error ||
            "Traitez les nouvelles demandes propriétaires avant qu'elles ne deviennent de vraies missions."
      }
      chips={[`${items.length} demande(s)`, `${urgentCount} urgente(s)`, `${quotedCount} à chiffrer`]}
      metrics={[
        {
          label: "Demandes",
          value: loading ? "..." : String(items.length),
          hint: "Demandes reçues dans votre file",
        },
        {
          label: "À ouvrir",
          value: loading ? "..." : String(openCount),
          hint: "Demandes encore sans réponse claire",
        },
        {
          label: "Urgentes",
          value: loading ? "..." : String(urgentCount),
          hint: "Demandes qui demandent une réaction rapide",
        },
        {
          label: "Devis",
          value: loading ? "..." : String(quotedCount),
          hint: "Demandes déjà basculées en préparation devis",
        },
      ]}
      actions={[
        { label: "Voir mon planning", href: "/dashboard/concierge/planning" },
        { label: "Ouvrir mes messages", href: "/dashboard/concierge/messages" },
        { label: "Configurer mes missions", href: "/dashboard/concierge/profile?tab=missions" },
      ]}
      cards={[
        {
          title: "1. Prioriser",
          text: "Commencez par les urgences et les demandes de remplacement pour capter les opportunités chaudes.",
        },
        {
          title: "2. Qualifier",
          text: "Utilisez 'intéressée' si vous pouvez avancer, ou 'devis à préparer' si le chiffrage est la prochaine étape.",
        },
        {
          title: "3. Convertir",
          text: "Une fois choisie par le propriétaire, la demande deviendra une mission à planifier proprement.",
        },
      ]}
    >
      <div className={styles.page}>
        {actionMessage ? <p className={styles.successBox}>{actionMessage}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}

        <div className={styles.list}>
          {items.map((item) => (
            <article key={item.recipient_id} className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitleBlock}>
                  <p className={styles.ownerName}>{item.owner_name}</p>
                  <h2>{item.title}</h2>
                  <p className={styles.meta}>
                    {formatType(item.request_type)} | {item.city || "Ville à confirmer"} |{" "}
                    {formatDate(item.desired_date)}
                  </p>
                </div>
                <div className={styles.badges}>
                  <span className={styles.statusBadge}>{item.recipient_status}</span>
                  {item.urgency ? <span className={styles.urgentBadge}>Urgent</span> : null}
                </div>
              </div>

              {item.description ? <p className={styles.description}>{item.description}</p> : null}

              <div className={styles.metaGrid}>
                <span>{formatAmount(item.budget_max, item.currency)}</span>
                <span>{item.postal_code || "Code postal non renseigné"}</span>
                <span>{item.status}</span>
              </div>

              <div className={styles.tags}>
                {item.requested_services.length > 0 ? (
                  item.requested_services.map((service) => (
                    <span key={`${item.recipient_id}-${service}`} className={styles.tag}>
                      {service}
                    </span>
                  ))
                ) : (
                  <span className={styles.tagMuted}>Services à préciser</span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={busyRecipientId === item.recipient_id}
                  onClick={() => void respond(item.recipient_id, "interested")}
                >
                  {busyRecipientId === item.recipient_id ? "Mise à jour..." : "Je suis intéressée"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  disabled={busyRecipientId === item.recipient_id}
                  onClick={() => void respond(item.recipient_id, "quoted")}
                >
                  Préparer un devis
                </button>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  disabled={busyRecipientId === item.recipient_id}
                  onClick={() => void respond(item.recipient_id, "declined")}
                >
                  Refuser
                </button>
                <Link href="/dashboard/concierge/messages" className={styles.linkBtn}>
                  Ouvrir messages
                </Link>
              </div>
            </article>
          ))}

          {!loading && !error && items.length === 0 ? (
            <p className={styles.emptyState}>Aucune demande reçue pour le moment.</p>
          ) : null}
        </div>
      </div>
    </ConciergeWorkspacePage>
  );
}
