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
import { deriveRequestWorkflowStatus } from "@/app/lib/requestStatus";
import { ServiceRequestCard, type ServiceRequestCardTone, type ServiceRequestFact, type ServiceRequestMilestone } from "@/features/service-requests";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { conciergeApiError } from "../conciergeFeedback";
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

type RequestFilter = "new" | "compatible" | "urgent" | "premium" | "quote_draft" | "quote_sent" | "selected" | "closed";

const FILTER_ICONS: Record<RequestFilter, LucideIcon> = {
  new: ClipboardList,
  compatible: BadgeCheck,
  urgent: Clock,
  premium: Sparkles,
  quote_draft: FileText,
  quote_sent: Send,
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
  if (item.quote_status === "draft") return "quote_draft";
  if (item.quote_id || item.recipient_status === "quoted") return "quote_sent";
  if (item.urgency) return "urgent";
  if (item.budget_max && item.budget_max >= 500) return "premium";
  if (item.recipient_status === "viewed" || item.recipient_status === "interested") return "compatible";
  return "new";
}

function getNextStepLabel(item: ConciergeRequestRow) {
  if (item.recipient_status === "selected" || item.mission_id) return "Collaboration acceptée";
  if (item.recipient_status === "quoted") return "Devis à suivre";
  if (item.recipient_status === "interested") return "Préparer le devis";
  if (item.recipient_status === "declined") return "Refusée";
  if (item.recipient_status === "not_selected") return "Non retenue";
  return "Qualifier la demande";
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

function getRequestHeaderImage(item: ConciergeRequestRow) {
  const services = (item.requested_services ?? []).join(" ").toLowerCase();
  const content = `${services} ${item.title ?? ""} ${item.description ?? ""}`.toLowerCase();

  if (content.includes("accueil") || content.includes("check-in") || content.includes("voyageur")) {
    return "/images/carousel/planetls-card-header-accueil.png";
  }
  if (content.includes("linge") || content.includes("blanch")) {
    return "/images/carousel/planetls-card-header-linge.png";
  }
  if (content.includes("maintenance") || content.includes("répar") || content.includes("repar") || content.includes("dépann") || content.includes("depann")) {
    return "/images/carousel/planetls-card-header-maintenance.png";
  }
  if (content.includes("jardin") || content.includes("piscin") || content.includes("extérieur") || content.includes("exterieur")) {
    return "/images/carousel/planetls-card-header-exterieur.png";
  }
  if (content.includes("photo") || content.includes("staging") || content.includes("déco") || content.includes("deco")) {
    return "/images/carousel/planetls-card-header-photo.png";
  }
  return "/images/carousel/planetls-card-header-menage.png";
}

function getCardTone(item: ConciergeRequestRow): ServiceRequestCardTone {
  if (item.recipient_status === "declined" || item.recipient_status === "not_selected") return "declined";
  if (item.recipient_status === "selected" || item.mission_id) return "accepted";
  if (item.quote_id || item.recipient_status === "quoted" || item.recipient_status === "interested") return "discussion";
  if (item.recipient_status === "viewed") return "viewed";
  return "sent";
}

function getConciergeMilestones(item: ConciergeRequestRow): ServiceRequestMilestone[] {
  const status = item.recipient_status;
  const hasQualified = ["viewed", "interested", "quoted", "selected", "declined", "not_selected"].includes(status);
  const hasQuote = Boolean(item.quote_id) || status === "quoted" || status === "selected" || Boolean(item.mission_id);
  const hasMission = status === "selected" || Boolean(item.mission_id);
  const steps = [
    { label: "Demande", detail: "Demande reçue", done: true, Icon: ClipboardList },
    { label: "Qualification", detail: hasQualified ? "Demande qualifiée" : "À qualifier", done: hasQualified, Icon: BadgeCheck },
    { label: "Devis", detail: hasQuote ? "Devis préparé" : "Devis à préparer", done: hasQuote, Icon: FileText },
    { label: "Mission", detail: hasMission ? "Mission conclue" : "Mission à confirmer", done: hasMission, Icon: CalendarPlus },
  ];
  const firstTodoIndex = steps.findIndex((step) => !step.done);

  return steps.map((step, index) => ({
    ...step,
    state: (step.done ? "done" : index === firstTodoIndex ? "active" : "todo") as ServiceRequestMilestone["state"],
  }));
}

function getConciergeFacts(item: ConciergeRequestRow): ServiceRequestFact[] {
  const facts: ServiceRequestFact[] = [];
  const location = [item.city, item.postal_code].filter(Boolean).join(" ");
  const services = item.requested_services.filter(Boolean).slice(0, 3).join(", ");

  facts.push({ label: "Propriétaire", value: item.owner_name, Icon: Home });
  if (location) facts.push({ label: "Localisation", value: location, Icon: MapPinned });
  if (typeof item.budget_max === "number") {
    facts.push({ label: "Budget", value: formatAmount(item.budget_max, item.currency).replace("Budget indicatif du propriétaire : ", ""), Icon: CircleDollarSign });
  }
  if (services) facts.push({ label: "Services", value: services, Icon: Sparkles });
  if (item.quote_number) facts.push({ label: "Devis", value: item.quote_number, hint: getWorkflow(item), Icon: FileText });
  if (item.mission_id) facts.push({ label: "Mission", value: "Mission conclue", hint: "Planification disponible", Icon: CalendarPlus });

  return facts.slice(0, 4);
}

function ConciergeDemandesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusedRecipientId = searchParams.get("recipient");
  const [items, setItems] = useState<ConciergeRequestRow[]>([]);
  const [filter, setFilter] = useState<RequestFilter>("new");
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
        throw new Error(conciergeApiError("Impossible de charger les demandes.", payload?.error));
      }
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      const hydratedItems = await markRequestsAsViewed(nextItems);
      setItems(hydratedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : conciergeApiError("Impossible de charger les demandes."));
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
      new: items.filter((item) => getRequestFilter(item) === "new").length,
      compatible: items.filter((item) => getRequestFilter(item) === "compatible").length,
      urgent: items.filter((item) => getRequestFilter(item) === "urgent").length,
      premium: items.filter((item) => getRequestFilter(item) === "premium").length,
      quote_draft: items.filter((item) => getRequestFilter(item) === "quote_draft").length,
      quote_sent: items.filter((item) => getRequestFilter(item) === "quote_sent").length,
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
          throw new Error(conciergeApiError("Impossible de mettre à jour la demande.", payload?.error));
      }

      setActionMessage(
        status === "interested"
          ? "Demande marquée comme intéressante."
          : "Demande refusée.",
      );
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : conciergeApiError("Impossible de mettre à jour la demande."));
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
          throw new Error(conciergeApiError("Impossible de préparer le devis.", payload?.error));
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
      setError(err instanceof Error ? err.message : conciergeApiError("Impossible de préparer le devis."));
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

  async function retryRequests() {
    setActionMessage(null);
    await loadRequests();
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
      <div className={styles.page} aria-busy={loading || Boolean(busyRecipientId)}>
        {actionMessage ? <div className={styles.successBox} role="status">{actionMessage}</div> : null}
        {error ? (
          <div className={styles.errorBox} role="alert">
            <span>{error}</span>
            <button type="button" className={styles.secondaryBtn} onClick={() => void retryRequests()}>
              Réessayer
            </button>
          </div>
        ) : null}

        {loading ? <p className={styles.feedbackBox} role="status">Chargement des demandes...</p> : null}

        <div className={styles.workflowBar} aria-label="Parcours de conversion">
          <span>1. Demande reçue</span>
          <span>2. Devis préparé</span>
          <span>3. Propriétaire accepte</span>
          <span>4. Collaboration active</span>
        </div>

        <div className={styles.filterBar} role="tablist" aria-label="Filtrer les demandes">
          {[
            ["new", "Nouvelles", filterCounts.new],
            ["compatible", "Compatibles", filterCounts.compatible],
            ["urgent", "Urgentes", filterCounts.urgent],
            ["premium", "Premium", filterCounts.premium],
            ["quote_draft", "Devis brouillon", filterCounts.quote_draft],
            ["quote_sent", "Devis envoyes", filterCounts.quote_sent],
            ["selected", "Acceptees", filterCounts.selected],
            ["closed", "Cloturees", filterCounts.closed],
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
          {filteredItems.map((item) => (
            <ServiceRequestCard
              key={item.recipient_id}
              id={`request-${item.recipient_id}`}
              title={item.title}
              eyebrow={item.owner_name}
              actorName={item.owner_name}
              actorDetail={`${item.property_name || item.city || "Logement ? pr?ciser"} ? ${formatDate(item.desired_date)}`}
              statusLabel={getNextStepLabel(item)}
              statusTone={getCardTone(item)}
              typeLabel={formatType(item.request_type)}
              urgent={item.urgency}
              summary={item.description || getNextStepDescription(item)}
              currentStepDetail={getNextStepLabel(item)}
              guidance={getNextStepDescription(item)}
              headerImage={getRequestHeaderImage(item)}
              facts={getConciergeFacts(item)}
              milestones={getConciergeMilestones(item)}
              focused={focusedRecipientId === item.recipient_id}
              chips={
                <>
                  {item.requested_services.slice(0, 3).map((service) => (
                    <span key={`${item.recipient_id}-${service}`} className={styles.tag}>
                      {service}
                    </span>
                  ))}
                  {item.quote_number ? <span className={styles.tag}>{item.quote_number}</span> : null}
                  {item.recipient_status === "selected" || item.mission_id ? <span className={styles.trustBadge}>Partenariat actif</span> : null}
                </>
              }
              actions={renderActions(item)}
            />
          ))}

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

