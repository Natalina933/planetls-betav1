"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CalendarPlus,
  CheckCircle,
  CircleDollarSign,
  ClipboardList,
  Clock,
  FileText,
  Home,
  MapPinned,
  MessageSquare,
  Send,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { RequestStatusBadge } from "@/components/ui";
import { deriveRequestWorkflowStatus } from "@/app/lib/requestStatus";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import styles from "./DemandesPage.module.scss";

type ConciergeRequestRow = {
  id: string;
  title: string;
  description: string | null;
  request_type: "ponctuel" | "renfort" | "durable";
  city: string | null;
  postal_code: string | null;
  property_name?: string | null;
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
  workflow_status?: string | null;
  mission_status?: string | null;
  mission_id?: string | null;
};

type RequestFilter = "active" | "quote" | "selected" | "closed";

const FILTER_ICONS: Record<RequestFilter, LucideIcon> = {
  active: ClipboardList,
  quote: FileText,
  selected: BadgeCheck,
  closed: XCircle,
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
  if (typeof value !== "number") return "Budget indicatif non renseigné";
  return `Budget indicatif du propriétaire : ${value.toFixed(0)} ${currency || "EUR"}`;
}

function formatType(value: ConciergeRequestRow["request_type"]) {
  if (value === "durable") return "Besoin durable";
  if (value === "renfort") return "Renfort / remplacement";
  return "Besoin ponctuel";
}

function getWorkflow(item: ConciergeRequestRow) {
  return deriveRequestWorkflowStatus({
    workflowStatus: item.workflow_status,
    serviceRequestStatus: item.status,
    recipientStatus: item.recipient_status,
    quoteStatus: item.quote_status,
    missionStatus: item.mission_status,
    hasMission: Boolean(item.mission_id),
  });
}

function getRequestFilter(item: ConciergeRequestRow): RequestFilter {
  if (item.recipient_status === "declined" || item.recipient_status === "not_selected") return "closed";
  if (item.recipient_status === "selected" || item.mission_id) return "selected";
  if (item.quote_id || item.recipient_status === "quoted") return "quote";
  return "active";
}

function getNextStepLabel(item: ConciergeRequestRow) {
  if (item.recipient_status === "selected" || item.mission_id) return "Collaboration acceptée";
  if (item.recipient_status === "quoted") return "Devis à suivre";
  if (item.recipient_status === "interested") return "Préparer le devis";
  if (item.recipient_status === "declined") return "Refusée";
  if (item.recipient_status === "not_selected") return "Non retenue";
  return "Qualifier la demande";
}

function getNextStepIcon(item: ConciergeRequestRow): LucideIcon {
  if (item.recipient_status === "selected" || item.mission_id) return CalendarPlus;
  if (item.recipient_status === "quoted") return Send;
  if (item.recipient_status === "interested") return FileText;
  if (item.recipient_status === "declined" || item.recipient_status === "not_selected") return XCircle;
  return ClipboardList;
}

function getNextStepDescription(item: ConciergeRequestRow) {
  if (item.recipient_status === "selected" || item.mission_id) {
    return "Le devis a été accepté. La demande commerciale est archivée, les futures tâches passent dans le module Missions.";
  }
  if (item.recipient_status === "quoted") {
    return "Le devis est prêt côté concierge. Suivez la réponse du propriétaire.";
  }
  if (item.recipient_status === "interested") {
    return "Vous avez confirmé votre intérêt. Finalisez maintenant le devis.";
  }
  return "Commencez par qualifier la demande ou préparez directement un devis.";
}

function ConciergeDemandesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusedRecipientId = searchParams.get("recipient");
  const [items, setItems] = useState<ConciergeRequestRow[]>([]);
  const [filter, setFilter] = useState<RequestFilter>("active");
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
    () =>
      items.filter(
        (item) =>
          deriveRequestWorkflowStatus({
            workflowStatus: item.workflow_status,
            serviceRequestStatus: item.status,
            recipientStatus: item.recipient_status,
            quoteStatus: item.quote_status,
            missionStatus: item.mission_status,
            hasMission: Boolean(item.mission_id),
          }) === "QUOTE_SENT",
      ).length,
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (focusedRecipientId && item.recipient_id === focusedRecipientId) return true;
        return getRequestFilter(item) === filter;
      }),
    [filter, focusedRecipientId, items],
  );

  const filterCounts = useMemo(
    () => ({
      active: items.filter((item) => getRequestFilter(item) === "active").length,
      quote: items.filter((item) => getRequestFilter(item) === "quote").length,
      selected: items.filter((item) => getRequestFilter(item) === "selected").length,
      closed: items.filter((item) => getRequestFilter(item) === "closed").length,
    }),
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
      setActionMessage(
        payload?.reused
          ? `Votre brouillon de devis est déjà prêt. Vous pouvez l'ouvrir et le finaliser.`
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
            <MessageSquare size={15} aria-hidden="true" />
            Ouvrir la conversation
          </Link>
          <Link href={quoteHref} className={styles.secondaryBtn}>
            <FileText size={15} aria-hidden="true" />
            Ouvrir le devis
          </Link>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={isBusy}
            onClick={() => void prepareQuote(item, { force: true })}
          >
            <FileText size={15} aria-hidden="true" />
            {isBusy ? "Mise à jour..." : "Relancer la préparation"}
          </button>
        </>
      );
    }

    if (item.recipient_status === "selected") {
      return (
        <>
          <Link href={getConversationHref(item)} className={styles.linkBtn}>
            <MessageSquare size={15} aria-hidden="true" />
            Ouvrir la conversation
          </Link>
          <Link href={quoteHref} className={styles.secondaryBtn}>
            <FileText size={15} aria-hidden="true" />
            Ouvrir devis / facturation
          </Link>
          <Link href="/dashboard/concierge/planning" className={styles.primaryBtn}>
            <CalendarPlus size={15} aria-hidden="true" />
            Planifier la mission
          </Link>
        </>
      );
    }

    if (item.recipient_status === "declined" || item.recipient_status === "not_selected") {
      return (
        <Link href={getConversationHref(item)} className={styles.linkBtn}>
          <MessageSquare size={15} aria-hidden="true" />
          Ouvrir la conversation
        </Link>
      );
    }

    if (item.recipient_status === "interested") {
      return (
        <>
          <Link href={getConversationHref(item)} className={styles.linkBtn}>
            <MessageSquare size={15} aria-hidden="true" />
            Ouvrir la conversation
          </Link>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={isBusy}
            onClick={() => void prepareQuote(item)}
          >
            <FileText size={15} aria-hidden="true" />
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
          <CheckCircle size={15} aria-hidden="true" />
            {isBusy ? "Mise à jour..." : "Je suis intéressée"}
        </button>
        <Link href={getConversationHref(item)} className={styles.linkBtn}>
          <MessageSquare size={15} aria-hidden="true" />
          Ouvrir la conversation
        </Link>
        <button
          type="button"
          className={styles.secondaryBtn}
          disabled={isBusy}
          onClick={() => void prepareQuote(item)}
        >
          <FileText size={15} aria-hidden="true" />
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
      eyebrow="Demandes concierge"
      title="Demandes propriétaires reçues"
      description={
        loading
          ? "Chargement des demandes..."
          : error ||
            "Qualifiez les demandes propriétaires, préparez un devis, puis basculez uniquement les dossiers acceptés en missions opérationnelles."
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
           text: "Une fois le devis accepté par le propriétaire, la demande est archivée et la collaboration peut recevoir des missions.",
        },
      ]}
    >
      <div className={styles.page}>
        {actionMessage ? <p className={styles.successBox}>{actionMessage}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}

        <div className={styles.workflowBar} aria-label="Parcours de conversion">
          <span>1. Demande reçue</span>
          <span>2. Devis préparé</span>
          <span>3. Propriétaire accepte</span>
          <span>4. Collaboration active</span>
        </div>

        <div className={styles.filterBar} role="tablist" aria-label="Filtrer les demandes">
          {[
            ["active", "À qualifier", filterCounts.active],
            ["quote", "Devis", filterCounts.quote],
            ["selected", "Acceptées", filterCounts.selected],
            ["closed", "Clôturées", filterCounts.closed],
          ].map(([key, label, count]) => {
            const filterKey = key as RequestFilter;
            const Icon = FILTER_ICONS[filterKey];
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={filter === key ? styles.filterActive : ""}
                onClick={() => setFilter(filterKey)}
              >
                <Icon size={15} aria-hidden="true" />
                {label} <strong>{count}</strong>
              </button>
            );
          })}
        </div>

        <div className={styles.list}>
          {filteredItems.map((item) => {
            const NextStepIcon = getNextStepIcon(item);

            return (
              <article
                key={item.recipient_id}
                id={`request-${item.recipient_id}`}
                className={`${styles.card} ${focusedRecipientId === item.recipient_id ? styles.cardFocused : ""}`}
              >
              <div className={styles.cardHead}>
                <div className={styles.cardTitleBlock}>
                  <p className={styles.ownerName}>{item.owner_name}</p>
                  <h2>
                    <Sparkles size={18} aria-hidden="true" />
                    {item.title}
                  </h2>
                  <p className={styles.meta}>
                    {formatType(item.request_type)} | {item.property_name || item.city || "Logement à préciser"} |{" "}
                    {formatDate(item.desired_date)}
                  </p>
                </div>
              <div className={styles.badges}>
                  <RequestStatusBadge
                    workflowStatus={item.workflow_status}
                    serviceRequestStatus={item.status}
                    recipientStatus={item.recipient_status}
                    quoteStatus={item.quote_status}
                    missionStatus={item.mission_status}
                    hasMission={Boolean(item.mission_id)}
                  />
                  {item.urgency ? <span className={styles.urgentBadge}>Urgent</span> : null}
                </div>
              </div>

              {item.description ? <p className={styles.description}>{item.description}</p> : null}

              <div className={styles.requestBrief} aria-label="Resume professionnel">
                <div>
                  <span>Logement</span>
                  <strong>{item.property_name || "A preciser"}</strong>
                </div>
                <div>
                  <span>Services</span>
                  <strong>{item.requested_services.length || "A qualifier"}</strong>
                </div>
                <div>
                  <span>Decision</span>
                  <strong>{getNextStepLabel(item)}</strong>
                </div>
              </div>

              <div className={styles.nextStepBox}>
                <strong>
                  <NextStepIcon size={16} aria-hidden="true" />
                  {getNextStepLabel(item)}
                </strong>
                <span>{getNextStepDescription(item)}</span>
              </div>

              {item.recipient_status === "selected" || item.mission_id ? (
                <div className={styles.partnershipStart}>
                  <BadgeCheck size={18} aria-hidden="true" />
                  <div>
                    <strong>Partenariat actif</strong>
                    <span>Le proprietaire vous a retenue : les informations logement, la conversation et la planification deviennent le centre de travail.</span>
                  </div>
                </div>
              ) : null}

              <div className={styles.metaGrid}>
                <span>
                  <CircleDollarSign size={15} aria-hidden="true" />
                  {formatAmount(item.budget_max, item.currency)}
                </span>
                <span>
                  <Home size={15} aria-hidden="true" />
                  {item.property_name || "Logement non renseigné"}
                </span>
                <span>
                  <MapPinned size={15} aria-hidden="true" />
                  {item.postal_code || item.city || "Zone à préciser"}
                </span>
                <span>
                  <Clock size={15} aria-hidden="true" />
                  {getWorkflow(item)}
                </span>
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
            );
          })}

          {!loading && !error && filteredItems.length === 0 ? (
            <p className={styles.emptyState}>Aucune demande dans cette étape pour le moment.</p>
          ) : null}
        </div>
      </div>
    </ConciergeWorkspacePage>
  );
}

export default function ConciergeDemandesPage() {
  return (
    <Suspense fallback={null}>
      <ConciergeDemandesContent />
    </Suspense>
  );
}

