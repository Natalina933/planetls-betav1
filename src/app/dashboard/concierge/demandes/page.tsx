"use client";

import type { ReactNode } from "react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CalendarPlus,
  CircleDollarSign,
  ClipboardList,
  Clock,
  FileText,
  Home,
  MapPinned,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { deriveRequestWorkflowStatus } from "@/app/lib/requestStatus";
import {
  buildServiceRequestBrief,
  readServiceRequestBriefMetadata,
  type ServiceRequestBrief,
} from "@/app/lib/serviceRequestBrief";

import {
  ServiceRequestCard,
  type ServiceRequestCardTone,
  type ServiceRequestFact,
  type ServiceRequestMilestone,
} from "@/features/service-requests";

import { RequestStatusBadge } from "@/components/ui/RequestStatusBadge";
import {
  StatsCard,
  TableFilters,
} from "@/components/ui";
import { MetricGroup } from "@/components/ui/StatsCard/MetricGroup";

import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { PendingCollaborations } from "@/features/housing-collaborations/PendingCollaborations";
import { conciergeApiError } from "../conciergeFeedback";
import styles from "./DemandesPage.module.scss";

type RecipientStatus =
  | "sent"
  | "viewed"
  | "declined"
  | "selected"
  | "interested"
  | "information_requested"
  | "date_proposed"
  | "quoted"
  | "not_selected";

type ResponseStatus =
  | "viewed"
  | "declined"
  | "selected"
  | "interested"
  | "information_requested"
  | "date_proposed"
  | "quoted"
  | "not_selected";

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
  recipient_status: RecipientStatus;
  response_message: string | null;
  proposed_date?: string | null;
  owner_name: string;
  conversation_id?: string | null;
  quote_id?: string | null;
  quote_number?: string | null;
  quote_status?: string | null;
  workflow_status?: string | null;
  mission_status?: string | null;
  mission_id?: string | null;
  metadata?: Record<string, unknown> | null;
  brief?: ServiceRequestBrief | null;
  request_summary?: string | null;
};

type RequestFilter =
  | "all"
  | "new"
  | "action"
  | "quote"
  | "selected"
  | "closed";

type FilterDefinition = {
  key: RequestFilter;
  label: string;
  icon: LucideIcon;
};

const FILTERS: FilterDefinition[] = [
  {
    key: "all",
    label: "Toutes",
    icon: ClipboardList,
  },
  {
    key: "new",
    label: "Nouvelles",
    icon: ClipboardList,
  },
  {
    key: "action",
    label: "À traiter",
    icon: BadgeCheck,
  },
  {
    key: "quote",
    label: "Devis",
    icon: FileText,
  },
  {
    key: "selected",
    label: "Acceptées",
    icon: BadgeCheck,
  },
  {
    key: "closed",
    label: "Clôturées",
    icon: XCircle,
  },
];

const FILTER_TITLES: Record<RequestFilter, string> = {
  all: "Toutes les demandes",
  new: "Nouvelles demandes",
  action: "Demandes à traiter",
  quote: "Demandes avec devis",
  selected: "Demandes acceptées",
  closed: "Demandes clôturées",
};

const RECIPIENT_STATUS = {
  SENT: "sent",
  VIEWED: "viewed",
  INTERESTED: "interested",
  INFORMATION_REQUESTED: "information_requested",
  DATE_PROPOSED: "date_proposed",
  QUOTED: "quoted",
  SELECTED: "selected",
  DECLINED: "declined",
  NOT_SELECTED: "not_selected",
} as const;

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Calendrier à préciser après devis";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(
  value: number | null | undefined,
  currency: string | null | undefined,
) {
  if (typeof value !== "number") {
    return "Budget indicatif non renseigné";
  }

  return `Budget indicatif du propriétaire : ${value.toFixed(0)} ${
    currency || "EUR"
  }`;
}

function formatType(
  value: ConciergeRequestRow["request_type"],
) {
  if (value === "durable") {
    return "Besoin durable";
  }

  if (value === "renfort") {
    return "Renfort / remplacement";
  }

  return "Besoin ponctuel";
}

function getRequestLocation(item: ConciergeRequestRow) {
  const location = [item.city, item.postal_code]
    .filter(Boolean)
    .join(" ");

  if (item.property_name && location) {
    return `${item.property_name} · ${location}`;
  }

  return (
    item.property_name ||
    location ||
    "Localisation à préciser"
  );
}

function getRequestBrief(
  item: ConciergeRequestRow,
): ServiceRequestBrief {
  if (item.brief) {
    return item.brief;
  }

  const metadata = readServiceRequestBriefMetadata(
    item.metadata,
  );

  const metadataString = (key: string) => {
    const value = metadata[key];
    return typeof value === "string" ? value : null;
  };

  return buildServiceRequestBrief({
    ownerGoal: metadataString("owner_goal"),
    collaborationType: metadataString(
      "collaboration_type",
    ),
    frequency: metadataString(
      "collaboration_frequency",
    ),
    estimatedDuration: metadataString(
      "estimated_duration",
    ),
    responsibilityLevel: metadataString(
      "responsibility_level",
    ),
    city: item.city,
    propertyName: item.property_name,
    requestedServices: item.requested_services,
    desiredDate: item.desired_date,
    urgency: item.urgency,
    description: item.description,
  });
}

function getWorkflowInput(item: ConciergeRequestRow) {
  return {
    workflowStatus: item.workflow_status,
    serviceRequestStatus: item.status,
    recipientStatus: item.recipient_status,
    quoteStatus: item.quote_status,
    missionStatus: item.mission_status,
    hasMission: Boolean(item.mission_id),
  };
}

function getWorkflow(item: ConciergeRequestRow) {
  return deriveRequestWorkflowStatus(
    getWorkflowInput(item),
  );
}

function getRequestFilter(
  item: ConciergeRequestRow,
): RequestFilter {
  if (
    item.recipient_status ===
      RECIPIENT_STATUS.DECLINED ||
    item.recipient_status ===
      RECIPIENT_STATUS.NOT_SELECTED
  ) {
    return "closed";
  }

  if (
    item.recipient_status ===
      RECIPIENT_STATUS.SELECTED ||
    item.mission_id
  ) {
    return "selected";
  }

  if (item.quote_status === "draft") {
    return "quote";
  }

  if (
    item.quote_id ||
    item.recipient_status === RECIPIENT_STATUS.QUOTED
  ) {
    return "quote";
  }

  if (
    item.recipient_status ===
      RECIPIENT_STATUS.INTERESTED ||
    item.recipient_status ===
      RECIPIENT_STATUS.INFORMATION_REQUESTED ||
    item.recipient_status ===
      RECIPIENT_STATUS.DATE_PROPOSED
  ) {
    return "action";
  }

  return "new";
}

function getNextStepLabel(item: ConciergeRequestRow) {
  if (item.quote_status === "not_selected" || item.recipient_status === RECIPIENT_STATUS.NOT_SELECTED) return "Non retenu";
  if (
    item.recipient_status ===
      RECIPIENT_STATUS.SELECTED ||
    item.mission_id
  ) {
    return "Accord accepté";
  }

  if (item.quote_status === "draft") {
    return "Finaliser le devis";
  }

  if (
    item.recipient_status === RECIPIENT_STATUS.QUOTED ||
    item.quote_id
  ) {
    return "En attente de décision";
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.INTERESTED
  ) {
    return "Préparer le devis";
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.INFORMATION_REQUESTED
  ) {
    return "En attente d'informations";
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.DATE_PROPOSED
  ) {
    return "Suivre la proposition";
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.DECLINED
  ) {
    return "Refusée";
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.NOT_SELECTED
  ) {
    return "Non retenue";
  }

  return item.recipient_status === RECIPIENT_STATUS.SENT
    ? "Examiner la demande"
    : "Qualifier la demande";
}

function getNextStepDescription(
  item: ConciergeRequestRow,
) {
  if (item.quote_status === "not_selected" || item.recipient_status === RECIPIENT_STATUS.NOT_SELECTED) {
    return "Un autre devis a été retenu. Votre proposition reste dans l’historique.";
  }
  if (
    item.recipient_status ===
      RECIPIENT_STATUS.SELECTED ||
    item.mission_id
  ) {
    return "L'accord commercial est accepté. La suite dépend du type de prestation convenu.";
  }

  if (item.quote_status === "draft") {
    return "Le brouillon existe déjà. Vérifiez-le avant de l'envoyer au propriétaire.";
  }

  if (
    item.recipient_status === RECIPIENT_STATUS.QUOTED
  ) {
    return "Le devis est prêt côté concierge. La décision du propriétaire est attendue.";
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.INFORMATION_REQUESTED
  ) {
    return "Une précision a été demandée au propriétaire.";
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.DATE_PROPOSED
  ) {
    return "Une date alternative a été proposée au propriétaire.";
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.INTERESTED
  ) {
    return "Vous avez confirmé votre intérêt. Finalisez maintenant le devis.";
  }

  return "Commencez par qualifier la demande ou préparez directement un devis.";
}

function getRequestHeaderImage(
  item: ConciergeRequestRow,
) {
  const services = (
    item.requested_services ?? []
  )
    .join(" ")
    .toLowerCase();

  const content = `${services} ${
    item.title ?? ""
  } ${item.description ?? ""}`.toLowerCase();

  if (
    content.includes("accueil") ||
    content.includes("check-in") ||
    content.includes("voyageur")
  ) {
    return "/images/carousel/planetls-card-header-accueil.png";
  }

  if (
    content.includes("linge") ||
    content.includes("blanch")
  ) {
    return "/images/carousel/planetls-card-header-linge.png";
  }

  if (
    content.includes("maintenance") ||
    content.includes("répar") ||
    content.includes("repar") ||
    content.includes("dépann") ||
    content.includes("depann")
  ) {
    return "/images/carousel/planetls-card-header-maintenance.png";
  }

  if (
    content.includes("jardin") ||
    content.includes("piscin") ||
    content.includes("extérieur") ||
    content.includes("exterieur")
  ) {
    return "/images/carousel/planetls-card-header-exterieur.png";
  }

  if (
    content.includes("photo") ||
    content.includes("staging") ||
    content.includes("déco") ||
    content.includes("deco")
  ) {
    return "/images/carousel/planetls-card-header-photo.png";
  }

  return "/images/carousel/planetls-card-header-menage.png";
}

function getCardTone(
  item: ConciergeRequestRow,
): ServiceRequestCardTone {
  if (
    item.recipient_status ===
      RECIPIENT_STATUS.DECLINED ||
    item.recipient_status ===
      RECIPIENT_STATUS.NOT_SELECTED
  ) {
    return "declined";
  }

  if (
    item.recipient_status ===
      RECIPIENT_STATUS.SELECTED ||
    item.mission_id
  ) {
    return "accepted";
  }

  if (
    item.quote_id ||
    item.recipient_status ===
      RECIPIENT_STATUS.QUOTED ||
    item.recipient_status ===
      RECIPIENT_STATUS.INTERESTED ||
    item.recipient_status ===
      RECIPIENT_STATUS.INFORMATION_REQUESTED ||
    item.recipient_status ===
      RECIPIENT_STATUS.DATE_PROPOSED
  ) {
    return "discussion";
  }

  if (
    item.recipient_status === RECIPIENT_STATUS.VIEWED
  ) {
    return "viewed";
  }

  return "sent";
}

function isQualifiedStatus(
  status: RecipientStatus,
) {
  return (
    status !== RECIPIENT_STATUS.SENT &&
    status !== RECIPIENT_STATUS.VIEWED
  );
}

function getConciergeMilestones(
  item: ConciergeRequestRow,
): ServiceRequestMilestone[] {
  const status = item.recipient_status;

  const hasQualified = isQualifiedStatus(status);

  const hasQuote =
    Boolean(item.quote_id) ||
    status === RECIPIENT_STATUS.QUOTED ||
    status === RECIPIENT_STATUS.SELECTED ||
    Boolean(item.mission_id);

  const hasDecision =
    status === RECIPIENT_STATUS.SELECTED ||
    Boolean(item.mission_id);

  const nextPath =
    item.request_type === "ponctuel"
      ? "Mission"
      : item.request_type === "durable"
        ? "Collaboration → Contrat"
        : "Suite du parcours";

  const steps = [
    {
      label: "Demande",
      detail: "Demande reçue",
      state: "done" as const,
      Icon: ClipboardList,
    },
    {
      label: "Qualification",
      detail: hasQualified
        ? "Demande qualifiée"
        : "À qualifier",
      state: hasQualified ? "done" : "active",
      Icon: BadgeCheck,
    },
    {
      label: "Devis",
      detail: hasQuote
        ? "Devis préparé"
        : "Devis à préparer",
      state: hasQuote ? "done" : "todo",
      Icon: FileText,
    },
    {
      label: "Décision",
      detail: hasDecision
        ? "Accord accepté"
        : "Décision attendue",
      state: hasDecision ? "done" : "todo",
      Icon: BadgeCheck,
    },
    {
      label: "Suite",
      detail: hasDecision ? nextPath : "Après décision",
      state: "todo" as const,
      Icon: CalendarPlus,
    },
  ];

  const firstTodoIndex = steps.findIndex(
    (step) => step.state !== "done",
  );

  return steps.map((step, index) => ({
    ...step,
    state:
      step.state === "done"
        ? "done"
        : index === firstTodoIndex
          ? "active"
          : "todo",
  }));
}

function getConciergeFacts(
  item: ConciergeRequestRow,
): ServiceRequestFact[] {
  const facts: ServiceRequestFact[] = [];

  const location = [
    item.city,
    item.postal_code,
  ]
    .filter(Boolean)
    .join(" ");

  const services = item.requested_services
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  facts.push({
    label: "Propriétaire",
    value: item.owner_name,
    Icon: Home,
  });

  if (location) {
    facts.push({
      label: "Localisation",
      value: location,
      Icon: MapPinned,
    });
  }

  if (typeof item.budget_max === "number") {
    facts.push({
      label: "Budget",
      value: formatAmount(
        item.budget_max,
        item.currency,
      ).replace(
        "Budget indicatif du propriétaire : ",
        "",
      ),
      Icon: CircleDollarSign,
    });
  }

  if (services) {
    facts.push({
      label: "Services",
      value: services,
      Icon: Sparkles,
    });
  }

  if (item.quote_number) {
    facts.push({
      label: "Devis",
      value: item.quote_number,
      hint: getWorkflow(item),
      Icon: FileText,
    });
  }

  if (item.proposed_date) {
    facts.push({
      label: "Date proposée",
      value: formatDate(item.proposed_date),
      Icon: CalendarPlus,
    });
  }

  if (item.mission_id) {
    facts.push({
      label: "Suite",
      value: "Mission liée",
      hint: "Accès opérationnel disponible",
      Icon: CalendarPlus,
    });
  }

  return facts.slice(0, 4);
}

function getConciergeBriefFacts(
  item: ConciergeRequestRow,
): ServiceRequestFact[] {
  const brief = getRequestBrief(item);

  return [
    {
      label: "Objectif",
      value: brief.owner_goal_label,
      Icon: ClipboardList,
    },
    {
      label: "Collaboration",
      value: brief.collaboration_type_label,
      hint: brief.pricing_expectation,
      Icon: BadgeCheck,
    },
    {
      label: "Fréquence",
      value: brief.frequency_label,
      hint: brief.responsibility_level_label,
      Icon: Clock,
    },
  ];
}

function getRequestChips(
  item: ConciergeRequestRow,
): ReactNode {
  const brief = getRequestBrief(item);

  const chips = [
    ...item.requested_services
      .filter(Boolean)
      .slice(0, 3),
    brief.owner_goal_label,
    brief.collaboration_type_label,
    brief.frequency_label,
  ].filter(Boolean);

  return (
    <>
      {chips.map((chip, index) => (
        <span
          key={`${chip}-${index}`}
          className={styles.chip}
        >
          {chip}
        </span>
      ))}
    </>
  );
}

type RequestActionsProps = {
  item: ConciergeRequestRow;
  busy: boolean;
  onRespond: (status: ResponseStatus) => void;
  onPrepareQuote: (force?: boolean) => void;
  onRequestInformation: () => void;
  onProposeDate: () => void;
};

function getConversationHref(
  item: ConciergeRequestRow,
) {
  if (item.conversation_id) {
    return `/dashboard/concierge/messages?conversation=${encodeURIComponent(
      item.conversation_id,
    )}`;
  }

  return "/dashboard/concierge/messages";
}

function RequestActions({
  item,
  busy,
  onRespond,
  onPrepareQuote,
  onRequestInformation,
  onProposeDate,
}: RequestActionsProps) {
  const conversationHref = getConversationHref(item);

  const quoteHref = item.quote_id
    ? `/dashboard/concierge/billing?quote=${encodeURIComponent(
        item.quote_id,
      )}&source=request`
    : "/dashboard/concierge/billing?source=request";

  if (
    item.quote_status === "draft" &&
    item.recipient_status !== RECIPIENT_STATUS.SELECTED &&
    !item.mission_id
  ) {
    return (
      <div className={styles.actionGroup}>
        <Link
          href={conversationHref}
          className={styles.secondaryAction}
        >
          Ouvrir la conversation
        </Link>

        <Link
          href={quoteHref}
          className={styles.primaryAction}
        >
          Finaliser le devis
        </Link>
      </div>
    );
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.QUOTED
  ) {
    return (
      <div className={styles.actionGroup}>
        <Link
          href={conversationHref}
          className={styles.secondaryAction}
        >
          Ouvrir la conversation
        </Link>

        <Link
          href={quoteHref}
          className={styles.primaryAction}
        >
          Voir le devis
        </Link>

        <button
          type="button"
          className={styles.ghostAction}
          onClick={() => onPrepareQuote(true)}
          disabled={busy}
        >
          {busy
            ? "Mise à jour..."
            : "Finaliser le devis"}
        </button>
      </div>
    );
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.SELECTED
  ) {
    return (
      <div className={styles.actionGroup}>
        <Link
          href={conversationHref}
          className={styles.secondaryAction}
        >
          Ouvrir la conversation
        </Link>

        <Link
          href={quoteHref}
          className={styles.primaryAction}
        >
          Voir le devis
        </Link>

        {item.mission_id ? (
          <Link
            href="/dashboard/concierge/missions"
            className={styles.ghostAction}
          >
            Voir la mission
          </Link>
        ) : null}
      </div>
    );
  }

  if (
    item.recipient_status ===
      RECIPIENT_STATUS.DECLINED ||
    item.recipient_status ===
      RECIPIENT_STATUS.NOT_SELECTED
  ) {
    return (
      <div className={styles.actionGroup}>
        <Link
          href={conversationHref}
          className={styles.secondaryAction}
        >
          Ouvrir la conversation
        </Link>
      </div>
    );
  }

  if (
    item.recipient_status ===
    RECIPIENT_STATUS.INTERESTED
  ) {
    return (
      <div className={styles.actionGroup}>
        <Link
          href={conversationHref}
          className={styles.secondaryAction}
        >
          Ouvrir la conversation
        </Link>

        <button
          type="button"
          className={styles.primaryAction}
          onClick={() => onPrepareQuote()}
          disabled={busy}
        >
          {busy
            ? "Préparation..."
            : "Préparer le devis"}
        </button>

        <button
          type="button"
          className={styles.dangerAction}
          onClick={() => onRespond("declined")}
          disabled={busy}
        >
          Refuser
        </button>
      </div>
    );
  }

  return (
    <div className={styles.actionGroup}>
      <button
        type="button"
        className={styles.primaryAction}
        onClick={() => onRespond("interested")}
        disabled={busy}
      >
        {busy
          ? "Mise à jour..."
          : "Je suis intéressée"}
      </button>

      <Link
        href={conversationHref}
        className={styles.secondaryAction}
      >
        Ouvrir la conversation
      </Link>

      <button
        type="button"
        className={styles.ghostAction}
        onClick={() => onPrepareQuote()}
        disabled={busy}
      >
        {busy
          ? "Préparation..."
          : "Préparer un devis"}
      </button>

      <button
        type="button"
        className={styles.dangerAction}
        onClick={() => onRespond("declined")}
        disabled={busy}
      >
        Refuser
      </button>

      <button
        type="button"
        className={styles.ghostAction}
        onClick={onRequestInformation}
        disabled={busy}
      >
        Demander une précision
      </button>

      <button
        type="button"
        className={styles.ghostAction}
        onClick={onProposeDate}
        disabled={busy}
      >
        Proposer une date
      </button>
    </div>
  );
}

function ConciergeDemandesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const focusedRecipientId =
    searchParams.get("recipient");

  const [items, setItems] = useState<
    ConciergeRequestRow[]
  >([]);

  const [filter, setFilter] =
    useState<RequestFilter>("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const [busyRecipientId, setBusyRecipientId] =
    useState<string | null>(null);

  const markRequestsAsViewed = useCallback(
    async (rows: ConciergeRequestRow[]) => {
      const pendingRows = rows.filter(
        (item) =>
          item.recipient_status ===
          RECIPIENT_STATUS.SENT,
      );

      if (pendingRows.length === 0) {
        return rows;
      }

      const results = await Promise.allSettled(
        pendingRows.map((item) =>
          fetch(
            `/api/service-request-recipients/${item.recipient_id}/respond`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: RECIPIENT_STATUS.VIEWED,
              }),
            },
          ),
        ),
      );

      const viewedRecipientIds = new Set<string>();

      results.forEach((result, index) => {
        if (
          result.status === "fulfilled" &&
          result.value.ok
        ) {
          viewedRecipientIds.add(
            pendingRows[index].recipient_id,
          );
        }
      });

      if (viewedRecipientIds.size === 0) {
        return rows;
      }

      return rows.map((item) =>
        viewedRecipientIds.has(item.recipient_id)
          ? {
              ...item,
              recipient_status:
                RECIPIENT_STATUS.VIEWED,
            }
          : item,
      );
    },
    [],
  );

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/service-requests?view=concierge&limit=30",
        {
          cache: "no-store",
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          conciergeApiError(
            "Impossible de charger les demandes.",
            payload?.error,
          ),
        );
      }

      const nextItems: ConciergeRequestRow[] =
        Array.isArray(payload?.items)
          ? payload.items
          : [];

      const hydratedItems =
        await markRequestsAsViewed(nextItems);

      setItems(hydratedItems);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : conciergeApiError(
              "Impossible de charger les demandes.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [markRequestsAsViewed]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const metricCounts = useMemo(
    () => ({
      new: items.filter(
        (item) => getRequestFilter(item) === "new",
      ).length,
      qualification: items.filter(
        (item) => getRequestFilter(item) === "action",
      ).length,
      quote: items.filter(
        (item) => getRequestFilter(item) === "quote",
      ).length,
      selected: items.filter(
        (item) => getRequestFilter(item) === "selected",
      ).length,
    }),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (
          focusedRecipientId &&
          item.recipient_id === focusedRecipientId
        ) {
          return true;
        }

        return (
          filter === "all" ||
          getRequestFilter(item) === filter
        );
      }),
    [filter, focusedRecipientId, items],
  );

  const filterCounts = useMemo(() => {
    const counts: Record<RequestFilter, number> = {
      all: items.length,
      new: 0,
      action: 0,
      quote: 0,
      selected: 0,
      closed: 0,
    };

    items.forEach((item) => {
      counts[getRequestFilter(item)] += 1;
    });

    return counts;
  }, [items]);

  async function respond(
    recipientId: string,
    status: ResponseStatus,
    options?: {
      responseMessage?: string | null;
      proposedDate?: string | null;
    },
  ) {
    try {
      setBusyRecipientId(recipientId);
      setActionMessage(null);
      setError(null);

      const response = await fetch(
        `/api/service-request-recipients/${recipientId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            response_message:
              options?.responseMessage ??
              undefined,
            proposed_date:
              options?.proposedDate ?? undefined,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          conciergeApiError(
            "Impossible de mettre à jour la demande.",
            payload?.error,
          ),
        );
      }

      const messages: Record<ResponseStatus, string> =
        {
          viewed: "Demande consultée.",
          interested:
            "Demande marquée comme intéressante.",
          information_requested:
            "Demande de précision envoyée.",
          date_proposed:
            "Date alternative proposée.",
          declined: "Demande refusée.",
          selected: "Demande sélectionnée.",
          quoted: "Devis envoyé.",
          not_selected: "Demande non retenue.",
        };

      setActionMessage(messages[status]);

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : conciergeApiError(
              "Impossible de mettre à jour la demande.",
            ),
      );
    } finally {
      setBusyRecipientId(null);
    }
  }

  async function prepareQuote(
    item: ConciergeRequestRow,
    options?: { force?: boolean },
  ) {
    try {
      setBusyRecipientId(item.recipient_id);
      setActionMessage(null);
      setError(null);

      const response = await fetch(
        `/api/service-request-recipients/${item.recipient_id}/prepare-quote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            options?.force
              ? { force: true }
              : {},
          ),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          conciergeApiError(
            "Impossible de préparer le devis.",
            payload?.error,
          ),
        );
      }

      const quoteId =
        payload?.quote &&
        typeof payload.quote.id === "string"
          ? payload.quote.id
          : item.quote_id;

      const nextAction =
        payload?.completed_action &&
        typeof payload.completed_action
          .next_action === "string"
          ? ` Prochaine étape : ${payload.completed_action.next_action}`
          : " Prochaine étape : vérifiez le brouillon puis envoyez le devis au propriétaire.";

      const packageMessage =
        payload?.summary?.matchedPackageName
          ? ` Pack suggéré : ${payload.summary.matchedPackageName}.`
          : "";

      const pricingMessage =
        typeof payload?.summary
          ?.matchedPricingCount === "number" &&
        payload.summary.matchedPricingCount > 0
          ? ` ${payload.summary.matchedPricingCount} tarif(s) ont été préremplis.`
          : "";

      const message = payload?.reused
        ? `Votre brouillon de devis est déjà prêt. Vous pouvez l'ouvrir et le finaliser.${nextAction}`
        : payload?.refreshed
          ? `Votre brouillon de devis a été mis à jour à partir de cette demande.${packageMessage}${pricingMessage}${nextAction}`
          : `Votre brouillon de devis est prêt.${packageMessage}${pricingMessage}${nextAction}`;

      setActionMessage(message);

      await loadRequests();

      router.push(
        quoteId
          ? `/dashboard/concierge/billing?quote=${encodeURIComponent(
              quoteId,
            )}&source=request`
          : "/dashboard/concierge/billing?source=request",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : conciergeApiError(
              "Impossible de préparer le devis.",
            ),
      );
    } finally {
      setBusyRecipientId(null);
    }
  }

  function requestInformation(
    item: ConciergeRequestRow,
  ) {
    const message = window.prompt(
      "Précision demandée au propriétaire",
      item.response_message ?? "",
    );

    if (message === null) {
      return;
    }

    void respond(
      item.recipient_id,
      RECIPIENT_STATUS.INFORMATION_REQUESTED,
      {
        responseMessage:
          message.trim() ||
          "Pouvez-vous préciser votre besoin avant devis ?",
      },
    );
  }

  function proposeDate(item: ConciergeRequestRow) {
    const proposedDate = window.prompt(
      "Date proposée (AAAA-MM-JJ ou ISO)",
      item.desired_date?.slice(0, 10) ?? "",
    );

    if (!proposedDate || !proposedDate.trim()) {
      return;
    }

    void respond(
      item.recipient_id,
      RECIPIENT_STATUS.DATE_PROPOSED,
      {
        proposedDate: proposedDate.trim(),
        responseMessage: `Date proposée : ${proposedDate.trim()}`,
      },
    );
  }

  async function retryRequests() {
    setActionMessage(null);
    await loadRequests();
  }

  return (
    <ConciergeWorkspacePage
      eyebrow="Espace concierge"
      title="Demandes"
      description="Gérez les demandes jusqu'à l'accord avec le propriétaire."
      cards={[]}
    >
      <main className={styles.page}>
        <PendingCollaborations refreshKey={items} />
        <MetricGroup
          className={styles.metrics}
          aria-label="Indicateurs des demandes"
        >
          <StatsCard
            label="Nouvelles"
            value={String(metricCounts.new)}
            hint="Demandes reçues à examiner"
          />
          <StatsCard
            label="À qualifier"
            value={String(metricCounts.qualification)}
            hint="Qualification commerciale en cours"
          />
          <StatsCard
            label="Devis en attente"
            value={String(metricCounts.quote)}
            hint="Brouillons et décisions attendues"
          />
          <StatsCard
            label="Acceptées"
            value={String(metricCounts.selected)}
            hint="Accords commerciaux acceptés"
          />
        </MetricGroup>

        {actionMessage ? (
          <div
            className={styles.successMessage}
            role="status"
          >
            {actionMessage}
          </div>
        ) : null}

        {error ? (
          <div
            className={styles.errorMessage}
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              className={styles.retryButton}
              onClick={retryRequests}
            >
              Réessayer
            </button>
          </div>
        ) : null}

        <section
          className={styles.process}
          aria-label="Étapes d'une demande"
        >
          {[
            "Demande",
            "Qualification",
            "Devis",
            "Décision",
            "Suite",
          ].map((step, index) => (
            <div className={styles.processStep} key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
          <p className={styles.processHint}>
            Ponctuel → Mission · Régulier → Collaboration → Contrat
          </p>
        </section>

        <TableFilters
          className={styles.filterPanel}
          layout="toolbar"
          showMeta={false}
        >
          <nav
            className={styles.filters}
            aria-label="Filtrer les demandes"
          >
            {FILTERS.map(
              ({ key, label, icon: Icon }) => {
                const isActive = filter === key;

                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.filterButton} ${
                      isActive
                        ? styles.filterButtonActive
                        : ""
                    }`}
                    onClick={() => setFilter(key)}
                    aria-pressed={isActive}
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                    <strong>{filterCounts[key]}</strong>
                  </button>
                );
              },
            )}
          </nav>
        </TableFilters>

        {loading ? (
          <div
            className={styles.loadingState}
            role="status"
          >
            <div className={styles.loadingSpinner} />
            <p>Chargement des demandes...</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <section className={styles.results}>
            <div className={styles.resultsHeader}>
              <div>
                <p className={styles.eyebrow}>
                  Suivi commercial
                </p>

                <h2>{FILTER_TITLES[filter]}</h2>
              </div>

              <span className={styles.currentFilter}>
                {filteredItems.length} demande
                {filteredItems.length > 1 ? "s" : ""}
              </span>
            </div>

            {filteredItems.length > 0 ? (
              <div className={styles.cards}>
                {filteredItems.map((item) => {
                  const isBusy =
                    busyRecipientId ===
                    item.recipient_id;

                  const facts = [
                    ...getConciergeFacts(item),
                    ...getConciergeBriefFacts(item),
                  ].slice(0, 4);

                  return (
                    <ServiceRequestCard
                      compact
                      compactStatus={<RequestStatusBadge {...getWorkflowInput(item)} />}
                      compactFacts={[
                        ...(item.desired_date ? [{ label: "Date souhaitée", value: formatDate(item.desired_date), Icon: CalendarPlus }] : []),
                        ...(item.proposed_date ? [{ label: "Date proposée", value: formatDate(item.proposed_date), Icon: Clock }] : []),
                      ]}
                      compactDetails={[
                        ...item.requested_services
                          .filter(Boolean)
                          .slice(0, 3),
                        `Prochaine action : ${getNextStepLabel(item)}`,
                      ]}
                      key={item.recipient_id}
                      id={`request-${item.recipient_id}`}
                      title={item.title}
                      eyebrow={formatType(
                        item.request_type,
                      )}
                      actorName={item.owner_name}
                      actorDetail={getRequestLocation(
                        item,
                      )}
                      statusLabel={getNextStepLabel(
                        item,
                      )}
                      statusTone={getCardTone(item)}
                      typeLabel={formatType(
                        item.request_type,
                      )}
                      urgent={item.urgency}
                      summary={
                        item.description ||
                        item.request_summary ||
                        "Aucune description fournie."
                      }
                      currentStepLabel="Prochaine action"
                      currentStepDetail={getNextStepLabel(
                        item,
                      )}
                      guidance={getNextStepDescription(
                        item,
                      )}
                      headerImage={getRequestHeaderImage(
                        item,
                      )}
                      facts={facts}
                      milestones={getConciergeMilestones(
                        item,
                      )}
                      chips={getRequestChips(item)}
                      focused={
                        focusedRecipientId ===
                        item.recipient_id
                      }
                      actions={
                        <RequestActions
                          item={item}
                          busy={isBusy}
                          onRespond={(status) => {
                            void respond(
                              item.recipient_id,
                              status,
                            );
                          }}
                          onPrepareQuote={(force) => {
                            void prepareQuote(
                              item,
                              force
                                ? { force: true }
                                : undefined,
                            );
                          }}
                          onRequestInformation={() => {
                            requestInformation(item);
                          }}
                          onProposeDate={() => {
                            proposeDate(item);
                          }}
                        />
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <ClipboardList
                  size={30}
                  aria-hidden="true"
                />

                <h3>
                  Aucune demande dans cette étape
                </h3>

                <p>
                  Les demandes correspondant à ce
                  filtre apparaîtront ici.
                </p>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </ConciergeWorkspacePage>
  );
}

export default function ConciergeDemandesPage() {
  return (
    <Suspense
      fallback={
        <div
          className={styles.loadingState}
          role="status"
        >
          <div className={styles.loadingSpinner} />
          <p>Chargement des demandes...</p>
        </div>
      }
    >
      <ConciergeDemandesContent />
    </Suspense>
  );
}
