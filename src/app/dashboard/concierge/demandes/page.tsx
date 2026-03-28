"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  owner_profile_id?: string | null;
  recipient_id: string;
  recipient_status: string;
  response_message: string | null;
  owner_name: string;
  conversation_id?: string | null;
  quote_id?: string | null;
  quote_number?: string | null;
  quote_status?: string | null;
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

function formatRecipientStatus(value: string) {
  switch (value) {
    case "sent":
      return "À ouvrir";
    case "viewed":
      return "Consultée";
    case "interested":
      return "Intérêt confirmé";
    case "quoted":
      return "Devis préparé";
    case "declined":
      return "Refusée";
    case "selected":
      return "Retenue";
    case "not_selected":
      return "Non retenue";
    default:
      return value || "En cours";
  }
}

export default function ConciergeDemandesPage() {
  const router = useRouter();
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
    () =>
      items.filter(
        (item) => item.recipient_status === "sent" || item.recipient_status === "viewed",
      ).length,
    [items],
  );
  const quotedCount = useMemo(
    () => items.filter((item) => item.recipient_status === "quoted").length,
    [items],
  );

  async function respond(recipientId: string, status: "interested" | "declined") {
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
          : "Demande refusée.",
      );
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour la demande.");
    } finally {
      setBusyRecipientId(null);
    }
  }

  async function prepareQuote(item: ConciergeRequestRow, options?: { force?: boolean }) {
    try {
      setBusyRecipientId(item.recipient_id);
      setActionMessage(null);
      setError(null);

      const response = await fetch(
        `/api/service-request-recipients/${item.recipient_id}/prepare-quote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options?.force ? { force: true } : {}),
        },
      );
      const payload = await response.json();

      if (!response.ok) {
          throw new Error(payload?.error || "Impossible de préparer le devis.");
      }

      const quoteId =
        payload?.quote && typeof payload.quote.id === "string" ? payload.quote.id : item.quote_id;
      const quoteNumber =
        payload?.quote && typeof payload.quote.quote_number === "string"
          ? payload.quote.quote_number
          : item.quote_number;

      setActionMessage(
        payload?.reused
          ? `Votre brouillon de devis est déjà prêt. Vous pouvez l’ouvrir et le finaliser.`
          : payload?.refreshed
            ? `Votre brouillon de devis a été mis à jour à partir de cette demande.${payload?.summary?.matchedPackageName ? ` Pack suggéré : ${payload.summary.matchedPackageName}.` : ""}${typeof payload?.summary?.matchedPricingCount === "number" && payload.summary.matchedPricingCount > 0 ? ` ${payload.summary.matchedPricingCount} tarif(s) ont été préremplis.` : ""}`
            : `Votre brouillon de devis est prêt.${payload?.summary?.matchedPackageName ? ` Pack suggéré : ${payload.summary.matchedPackageName}.` : ""}${typeof payload?.summary?.matchedPricingCount === "number" && payload.summary.matchedPricingCount > 0 ? ` ${payload.summary.matchedPricingCount} tarif(s) ont été préremplis à partir de la demande.` : ""}`,
      );

      await loadRequests();

      router.push(
        quoteId
          ? `/dashboard/concierge/billing?quote=${encodeURIComponent(quoteId)}&source=request`
          : "/dashboard/concierge/billing?source=request",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de préparer le devis.");
    } finally {
      setBusyRecipientId(null);
    }
  }

  function getConversationHref(item: ConciergeRequestRow) {
    if (item.conversation_id) {
      return `/dashboard/concierge/messages?conversation=${encodeURIComponent(item.conversation_id)}`;
    }
    return "/dashboard/concierge/messages";
  }

  function renderActions(item: ConciergeRequestRow) {
    const isBusy = busyRecipientId === item.recipient_id;
    const quoteHref = item.quote_id
      ? `/dashboard/concierge/billing?quote=${encodeURIComponent(item.quote_id)}&source=request`
      : "/dashboard/concierge/billing?source=request";

    if (item.recipient_status === "quoted") {
      return (
        <>
          <Link href={getConversationHref(item)} className={styles.linkBtn}>
            Ouvrir la conversation
          </Link>
          <Link href={quoteHref} className={styles.secondaryBtn}>
            Ouvrir le devis
          </Link>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={isBusy}
            onClick={() => void prepareQuote(item, { force: true })}
          >
            {isBusy ? "Mise à jour..." : "Relancer la préparation"}
          </button>
        </>
      );
    }

    if (item.recipient_status === "selected") {
      return (
        <>
          <Link href={getConversationHref(item)} className={styles.linkBtn}>
            Ouvrir la conversation
          </Link>
          <Link href={quoteHref} className={styles.secondaryBtn}>
            Ouvrir devis / facturation
          </Link>
        </>
      );
    }

    if (item.recipient_status === "declined" || item.recipient_status === "not_selected") {
      return (
        <Link href={getConversationHref(item)} className={styles.linkBtn}>
          Ouvrir la conversation
        </Link>
      );
    }

    if (item.recipient_status === "interested") {
      return (
        <>
          <Link href={getConversationHref(item)} className={styles.linkBtn}>
            Ouvrir la conversation
          </Link>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={isBusy}
            onClick={() => void prepareQuote(item)}
          >
            {isBusy ? "Préparation..." : "Préparer un devis"}
          </button>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={isBusy}
            onClick={() => void respond(item.recipient_id, "declined")}
          >
            Refuser
          </button>
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={isBusy}
          onClick={() => void respond(item.recipient_id, "interested")}
        >
            {isBusy ? "Mise à jour..." : "Je suis intéressée"}
        </button>
        <Link href={getConversationHref(item)} className={styles.linkBtn}>
          Ouvrir la conversation
        </Link>
        <button
          type="button"
          className={styles.secondaryBtn}
          disabled={isBusy}
          onClick={() => void prepareQuote(item)}
        >
          {isBusy ? "Préparation..." : "Préparer un devis"}
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          disabled={isBusy}
          onClick={() => void respond(item.recipient_id, "declined")}
        >
          Refuser
        </button>
      </>
    );
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
           text: "Confirmez votre intérêt, ouvrez la conversation pré-remplie, puis lancez un devis quand le chiffrage devient l'étape suivante.",
        },
        {
          title: "3. Convertir",
           text: "Une fois choisie par le propriétaire, la demande devient une mission à planifier proprement.",
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
                  <span className={styles.statusBadge}>
                    {formatRecipientStatus(item.recipient_status)}
                  </span>
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

              <div className={styles.actions}>{renderActions(item)}</div>
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
