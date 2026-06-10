"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, FileText, Route, XCircle } from "lucide-react";
import { SearchBar, StatsCard, Tag } from "@/components/ui";
import { EmptyState } from "@/features/shared/components/EmptyState/EmptyState";
import type { WorkflowTimelineStep } from "@/features/service-requests";
import {
  OwnerJourneyRail,
  OwnerQuoteResponseCard,
  OwnerQuotesComparisonTable,
  OwnerRequestSummaryCard,
} from "@/features/owner-dashboard";
import { ownerApiError } from "../ownerFeedback";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import styles from "../OwnerDashboardPages.module.scss";

type QuotePerson = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
};

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  workflow_status?: string | null;
  mission_id?: string | null;
  service_request_id?: string | null;
  service_request_recipient_id?: string | null;
  total_amount: number | null;
  valid_until: string | null;
  created_at: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  concierge?: QuotePerson | null;
  package?: {
    id: string;
    name: string | null;
    description?: string | null;
    category?: string | null;
  } | null;
  quote_items?: Array<{
    id: string;
    label: string;
    description?: string | null;
    quantity: number;
    line_total: number;
  }>;
};

type OwnerServiceRequestRecipient = {
  id: string;
  status: string;
  concierge_profile_id?: string | null;
  concierge_name?: string;
  quote_id?: string | null;
  quote_number?: string | null;
  quote_status?: string | null;
};

type OwnerServiceRequestRow = {
  id: string;
  title: string;
  description?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  request_type?: "ponctuel" | "renfort" | "durable";
  city?: string | null;
  postal_code?: string | null;
  desired_date?: string | null;
  budget_max?: number | null;
  currency?: string | null;
  requested_services?: string[] | null;
  status?: string | null;
  workflow_status?: string | null;
  mission_id?: string | null;
  recipients?: OwnerServiceRequestRecipient[];
};

type ServiceRequestsPayload = {
  items?: OwnerServiceRequestRow[];
  error?: string;
};

type QuoteGroup = {
  key: string;
  request: OwnerServiceRequestRow | null;
  quotes: OwnerQuoteRow[];
};

type PropertyGroup = {
  key: string;
  label: string;
  groups: QuoteGroup[];
};

type AcceptedWorkflowPayload = {
  accepted_workflow?: {
    mission_id?: string | null;
    invoice_id?: string | null;
  } | null;
  completed_action?: {
    next_action?: string | null;
    next_href?: string | null;
  } | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date à confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(value: number | null | undefined, currency = "EUR") {
  return typeof value === "number" ? `${value.toFixed(2)} ${currency}` : "-";
}

function getPersonName(person?: QuotePerson | null) {
  if (!person) return "Concierge";
  return (
    `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() ||
    person.company_name ||
    "Concierge"
  );
}

function getRequestTypeLabel(value?: OwnerServiceRequestRow["request_type"]) {
  if (value === "durable") return "Besoin durable";
  if (value === "renfort") return "Renfort";
  return "Ponctuel";
}

function getRequestIdFromQuote(quote: OwnerQuoteRow) {
  if (quote.service_request_id) return quote.service_request_id;
  const metadata =
    quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
      ? quote.metadata
      : null;
  return metadata && typeof metadata.service_request_id === "string"
    ? metadata.service_request_id
    : null;
}

function getRequestRecipientIdFromQuote(quote: OwnerQuoteRow) {
  if (quote.service_request_recipient_id) return quote.service_request_recipient_id;
  const metadata =
    quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
      ? quote.metadata
      : null;
  return metadata && typeof metadata.service_request_recipient_id === "string"
    ? metadata.service_request_recipient_id
    : null;
}

function getQuoteLineCountLabel(quote: OwnerQuoteRow) {
  const count = quote.quote_items?.length ?? 0;
  return `${count} prestation${count > 1 ? "s" : ""}`;
}

function getResponseSpeedLabel(quote: OwnerQuoteRow) {
  return quote.created_at ? formatDateTime(quote.created_at) : "Date à confirmer";
}

function formatPackageName(value?: string | null) {
  return (value ?? "").replace(/\(\s*seed\s*\)/gi, "(Initial)").trim() || "Pack";
}

function getPropertyLabel(request: OwnerServiceRequestRow | null) {
  if (!request) return "Demandes sans logement attribué";
  return request.property_name || request.title || "Logement";
}

function getAcceptedWorkflowMessage(payload: AcceptedWorkflowPayload) {
  const nextAction =
    payload.completed_action?.next_action && payload.completed_action.next_action.trim()
      ? ` Prochaine étape : ${payload.completed_action.next_action.trim()}`
      : "";
  const missionReady = Boolean(payload.accepted_workflow?.mission_id);
  const invoiceReady = Boolean(payload.accepted_workflow?.invoice_id);

  if (missionReady && invoiceReady) {
    return `Accepté : la conciergerie devient partenaire. La mission commerciale est créée et une facture brouillon est disponible dans les finances.${nextAction || " Vous pouvez ensuite transmettre les séjours voyageurs."}`;
  }
  if (missionReady) {
    return `Accepté : la conciergerie devient partenaire. La mission commerciale est créée.${nextAction || " Vous pouvez ensuite transmettre les séjours voyageurs depuis l’espace dédié."}`;
  }
  return `Accepté : la collaboration est validée et les onglets partenaires, demandes et finances sont synchronisés.${nextAction}`;
}

function getQuoteWorkflowSteps(quote: OwnerQuoteRow): WorkflowTimelineStep[] {
  const status = (quote.status ?? "draft").toLowerCase();
  const sent = ["sent", "accepted", "rejected", "expired", "canceled"].includes(status);
  const decided = ["accepted", "rejected", "expired", "canceled"].includes(status);
  const accepted = status === "accepted";

  return [
    {
      label: "Devis préparé",
      detail: quote.quote_number ?? "Brouillon",
      state: "done",
      Icon: FileText,
    },
    {
      label: "Consultation",
      detail: sent ? "Envoyé au propriétaire" : "À envoyer",
      state: sent ? "done" : "active",
      Icon: Eye,
    },
    {
      label: accepted ? "Accepté" : status === "rejected" ? "Refusé" : "Décision",
      detail: decided ? "Décision enregistrée" : "À arbitrer",
      state: decided ? "done" : sent ? "active" : "todo",
      Icon: status === "rejected" ? XCircle : CheckCircle2,
    },
    {
      label: "Mission",
      detail: quote.mission_id ? "Mission créée" : "Après acceptation",
      state: quote.mission_id ? "done" : accepted ? "active" : "todo",
      Icon: Route,
    },
  ];
}

export default function OwnerQuotesPage() {
  return (
    <Suspense
      fallback={
        <section className="dashboard-grid">
          <p>Chargement des devis...</p>
        </section>
      }
    >
      <OwnerQuotesContent />
    </Suspense>
  );
}

function OwnerQuotesContent() {
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [compareSelection, setCompareSelection] = useState<Record<string, string[]>>({});
  const [selectingRequestId, setSelectingRequestId] = useState<string | null>(null);
  const [busyQuoteAction, setBusyQuoteAction] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const targetQuoteId = searchParams.get("quote");
  const targetRequestId = searchParams.get("request");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [quotesResponse, requestsResponse] = await Promise.all([
        fetch("/api/quotes?limit=30", { cache: "no-store" }),
        fetch("/api/service-requests?limit=30", { cache: "no-store" }),
      ]);

      const quotesPayload = await quotesResponse.json();
      const requestsPayload = (await requestsResponse.json()) as ServiceRequestsPayload;

      if (!quotesResponse.ok) {
        throw new Error(ownerApiError("Impossible de charger vos devis.", quotesPayload?.error));
      }

      if (!requestsResponse.ok) {
        throw new Error(ownerApiError("Impossible de charger le contexte des demandes.", requestsPayload?.error));
      }

      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
      setRequests(Array.isArray(requestsPayload?.items) ? requestsPayload.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de charger vos devis."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const requestById = useMemo(
    () => new Map(requests.map((request) => [request.id, request])),
    [requests],
  );

  const pendingQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === "draft" || quote.status === "sent"),
    [quotes],
  );

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return quotes.filter((quote) => {
      if (targetQuoteId && quote.id !== targetQuoteId) return false;
      if (targetRequestId && getRequestIdFromQuote(quote) !== targetRequestId) return false;

      const request = requestById.get(getRequestIdFromQuote(quote) ?? "");
      const matchesStatus =
        statusFilter === "all" ||
        quote.workflow_status === statusFilter ||
        request?.workflow_status === statusFilter ||
        (quote.status ?? "draft") === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        quote.quote_number,
        quote.status,
        quote.package?.name,
        getPersonName(quote.concierge),
        request?.title,
        request?.city,
        ...(request?.requested_services ?? []),
        ...(quote.quote_items ?? []).map((item) => item.label),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [quotes, searchTerm, statusFilter, targetQuoteId, targetRequestId, requestById]);

  const groupedQuotes = useMemo(() => {
    const groups = new Map<string, QuoteGroup>();

    filteredQuotes.forEach((quote) => {
      const requestId = getRequestIdFromQuote(quote);
      const request = requestId ? requestById.get(requestId) ?? null : null;
      const key = requestId ?? `standalone:${quote.id}`;
      const current = groups.get(key);

      if (current) {
        current.quotes.push(quote);
        return;
      }

      groups.set(key, {
        key,
        request,
        quotes: [quote],
      });
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aTime = a.request?.desired_date
        ? new Date(a.request.desired_date).getTime()
        : new Date(a.quotes[0]?.created_at ?? 0).getTime();
      const bTime = b.request?.desired_date
        ? new Date(b.request.desired_date).getTime()
        : new Date(b.quotes[0]?.created_at ?? 0).getTime();
      return bTime - aTime;
    });
  }, [filteredQuotes, requestById]);

  const propertyGroups = useMemo(() => {
    const groups = new Map<string, PropertyGroup>();

    groupedQuotes.forEach((group) => {
      const propertyId = group.request?.property_id ?? null;
      const key = propertyId ?? `unassigned:${group.key}`;
      const current = groups.get(key);

      if (current) {
        current.groups.push(group);
        return;
      }

      groups.set(key, {
        key,
        label: getPropertyLabel(group.request),
        groups: [group],
      });
    });

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [groupedQuotes]);

  const totalAmount = useMemo(
    () => filteredQuotes.reduce((sum, quote) => sum + (quote.total_amount ?? 0), 0),
    [filteredQuotes],
  );

  const propertyCountWithQuotes = useMemo(() => propertyGroups.length, [propertyGroups]);
  const decisionCounts = useMemo(
    () => ({
      toCompare: filteredQuotes.filter((quote) => ["draft", "sent", null].includes(quote.status)).length,
      accepted: filteredQuotes.filter((quote) => quote.status === "accepted").length,
      rejected: filteredQuotes.filter((quote) => quote.status === "rejected").length,
      expired: filteredQuotes.filter((quote) => quote.status === "expired").length,
    }),
    [filteredQuotes],
  );

  function exportQuotesCsv() {
    const rows = [
      ["Numero", "Statut", "Concierge", "Pack", "Total", "Demande", "Date mission"],
      ...filteredQuotes.map((quote) => {
        const request = requestById.get(getRequestIdFromQuote(quote) ?? "");
        return [
          quote.quote_number ?? "",
          quote.status ?? "",
          getPersonName(quote.concierge),
          quote.package?.name ?? "",
          quote.total_amount?.toString() ?? "",
          request?.title ?? "",
          request?.desired_date ?? "",
        ];
      }),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "owner-devis.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function toggleCompare(groupKey: string, quoteId: string) {
    setCompareSelection((current) => {
      const currentSelection = current[groupKey] ?? [];
      const exists = currentSelection.includes(quoteId);

      if (exists) {
        return {
          ...current,
          [groupKey]: currentSelection.filter((id) => id !== quoteId),
        };
      }

      if (currentSelection.length >= 3) {
        return {
          ...current,
          [groupKey]: [...currentSelection.slice(1), quoteId],
        };
      }

      return {
        ...current,
        [groupKey]: [...currentSelection, quoteId],
      };
    });
  }

  async function handleSelectConcierge(requestId: string, recipientId: string) {
    try {
      setSelectingRequestId(requestId);
      setSuccess(null);
      setError(null);

      const response = await fetch(`/api/service-requests/${requestId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: recipientId }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(ownerApiError("Impossible de retenir ce concierge.", payload?.error));

      await loadData();
      setSuccess(getAcceptedWorkflowMessage(payload as AcceptedWorkflowPayload));
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de retenir ce concierge."));
    } finally {
      setSelectingRequestId(null);
    }
  }

  async function handleUpdateQuoteStatus(quoteId: string, status: "accepted" | "rejected") {
    try {
      setBusyQuoteAction(`${quoteId}:${status}`);
      setSuccess(null);
      setError(null);

      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reason: status === "rejected" ? rejectReasons[quoteId]?.trim() || undefined : undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(ownerApiError("Impossible de mettre à jour ce devis.", payload?.error));

      await loadData();
      setSuccess(
        status === "accepted"
          ? getAcceptedWorkflowMessage(payload as AcceptedWorkflowPayload)
          : "Refus enregistré : le devis est sorti de la comparaison active et la conciergerie est notifiée.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de mettre à jour ce devis."));
    } finally {
      setBusyQuoteAction(null);
    }
  }

  function handleViewQuote(quoteId: string) {
    void fetch(`/api/quotes/${quoteId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <div className="dashboard-grid">
      <OwnerWorkspacePage
        eyebrow="Conciergeries"
        title="Propositions reçues"
        description={
          loading
            ? "Chargement des devis..."
            : error ||
              (targetRequestId
                ? "Retrouvez ici uniquement les propositions liées à cette demande pour ce logement."
                : "Comparez les propositions des conciergeries et retenez le partenaire le plus adapté.")
        }
        chips={undefined}
        metrics={[
          { label: "Propositions", value: loading ? "..." : String(filteredQuotes.length) },
          { label: "Logements suivis", value: loading ? "..." : String(propertyCountWithQuotes) },
          { label: "À arbitrer", value: loading ? "..." : String(pendingQuotes.length) },
        ]}
        actions={[
          { label: "Voir les demandes", href: "/dashboard/owner/demandes" },
          { label: "Rechercher", href: "/dashboard/owner/concierges" },
        ]}
        cards={[]}
      />

      <section className={styles.conciergeDashboardFlow}>
        <OwnerJourneyRail activeStep="quotes" />

        <div className={styles.toolbar}>
          <SearchBar
            defaultValue={searchTerm}
            onSearch={setSearchTerm}
            placeholder="Rechercher une demande, un concierge ou un devis"
            className={styles.field}
            buttonLabel="Filtrer"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={styles.select}
            aria-label="Filtrer les devis par statut"
          >
            <option value="all">Tous statuts</option>
            <option value="NEW">Nouveau</option>
            <option value="IN_DISCUSSION">En discussion</option>
            <option value="QUOTE_SENT">Proposition reçue</option>
            <option value="ACCEPTED">Acceptée</option>
            <option value="DECLINED">Refusée</option>
            <option value="EXPIRED">Expirée</option>
          </select>
          <button
            type="button"
            onClick={exportQuotesCsv}
            disabled={filteredQuotes.length === 0}
            className={styles.buttonSecondary}
          >
            Export CSV
          </button>
        </div>

        {!loading && !error ? (
          <div className={styles.decisionRail} aria-label="Synthèse de décision des devis">
            <button type="button" onClick={() => setStatusFilter("all")}>
              <span>À comparer</span>
              <strong>{decisionCounts.toCompare}</strong>
            </button>
            <button type="button" onClick={() => setStatusFilter("accepted")}>
              <span>Acceptés</span>
              <strong>{decisionCounts.accepted}</strong>
            </button>
            <button type="button" onClick={() => setStatusFilter("rejected")}>
              <span>Refusés</span>
              <strong>{decisionCounts.rejected}</strong>
            </button>
            <button type="button" onClick={() => setStatusFilter("expired")}>
              <span>Expirés</span>
              <strong>{decisionCounts.expired}</strong>
            </button>
          </div>
        ) : null}

        {!loading && !error && groupedQuotes.length > 0 ? (
          <div className={styles.conciergeKpiGrid}>
            <StatsCard
              label="Montant visible"
              value={formatAmount(totalAmount)}
              hint="Sur la sélection affichée."
              tone="soft"
            />
            <StatsCard
              label="Demandes avec réponses"
              value={String(groupedQuotes.length)}
              hint="Chaque bloc regroupe une demande d’origine."
              tone="soft"
            />
            <StatsCard
              label="Comparaison active"
              value={String(Math.max(...groupedQuotes.map((group) => group.quotes.length)))}
              hint="Nombre max de réponses pour une même demande."
              tone="soft"
            />
          </div>
        ) : null}

        {loading ? <p>Chargement des devis...</p> : null}
        {!loading && error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
        {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}

        {!loading && !error && groupedQuotes.length === 0 ? (
          <EmptyState
            title="Aucun devis disponible."
            description="Les devis envoyés par les concierges apparaîtront ici."
            className={styles.conciergeEmptyState}
          />
        ) : null}

        {!loading && !error && groupedQuotes.length > 0 ? (
          <div className={styles.conciergeTimeline}>
            {propertyGroups.map((propertyGroup) => (
              <section key={propertyGroup.key} className={styles.conciergeTimelinePanel}>
                <div className={styles.conciergeSectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Suivi par logement</p>
                    <h2 className={styles.conciergeSectionTitle}>{propertyGroup.label}</h2>
                  </div>
                  <span className={`${styles.conciergeStatusPill} ${styles.statusInfo}`}>
                    {propertyGroup.groups.length} demande(s)
                  </span>
                </div>

                <p className={styles.conciergeNextStep}>
                  Chaque demande et chaque devis affichés ci-dessous concernent ce logement.
                </p>

                {propertyGroup.groups.map((group) => {
              const cheapestQuoteId = group.quotes.reduce<string | null>((bestId, current) => {
                if (bestId === null) return current.id;
                const bestQuote = group.quotes.find((quote) => quote.id === bestId);
                const bestAmount = bestQuote?.total_amount ?? Number.POSITIVE_INFINITY;
                const currentAmount = current.total_amount ?? Number.POSITIVE_INFINITY;
                return currentAmount < bestAmount ? current.id : bestId;
              }, null);

              const mostDetailedQuoteId = group.quotes.reduce<string | null>((bestId, current) => {
                if (bestId === null) return current.id;
                const bestQuote = group.quotes.find((quote) => quote.id === bestId);
                const bestCount = bestQuote?.quote_items?.length ?? 0;
                const currentCount = current.quote_items?.length ?? 0;
                return currentCount > bestCount ? current.id : bestId;
              }, null);

              const fastestQuoteId = group.quotes.reduce<string | null>((bestId, current) => {
                if (bestId === null) return current.id;
                const bestQuote = group.quotes.find((quote) => quote.id === bestId);
                const bestTime = bestQuote?.created_at
                  ? new Date(bestQuote.created_at).getTime()
                  : Number.POSITIVE_INFINITY;
                const currentTime = current.created_at
                  ? new Date(current.created_at).getTime()
                  : Number.POSITIVE_INFINITY;
                return currentTime < bestTime ? current.id : bestId;
              }, null);

              const selectedCompareIds = compareSelection[group.key] ?? [];
              const comparedQuotes = group.quotes.filter((quote) => selectedCompareIds.includes(quote.id));

              const comparisonColumns = comparedQuotes.map((quote) => {
                const recipientId =
                  getRequestRecipientIdFromQuote(quote) ??
                  group.request?.recipients?.find((recipient) => recipient.quote_id === quote.id)?.id ??
                  null;

                return {
                  quote,
                  recipientId,
                  isCheapest: cheapestQuoteId === quote.id,
                  isMostDetailed: mostDetailedQuoteId === quote.id,
                  isFastest: fastestQuoteId === quote.id,
                };
              });

              return (
                <article key={group.key} className={styles.conciergeRequestCard}>
                  {group.request ? (
                    <OwnerRequestSummaryCard
                      className={styles.conciergeSpotlightCard}
                      eyebrow="Demande d’origine"
                      title={group.request.title}
                      subtitle={getRequestTypeLabel(group.request.request_type)}
                      status={group.request.status || null}
                      workflowStatus={group.request.workflow_status}
                      hasMission={Boolean(group.request.mission_id)}
                      primaryFacts={[
                        {
                          label: "Lieu",
                          value: `${group.request.city || "Ville à confirmer"}${
                            group.request.postal_code ? ` ${group.request.postal_code}` : ""
                          }`,
                        },
                        {
                          label: "Début collaboration",
                          value: group.request.desired_date
                            ? formatDateTime(group.request.desired_date)
                            : "À préciser après devis",
                        },
                        {
                          label: "Budget",
                          value: formatAmount(group.request.budget_max, group.request.currency ?? "EUR"),
                        },
                        {
                          label: "Logement",
                          value: group.request.property_name || "Logement à préciser",
                        },
                      ]}
                      services={group.request.requested_services ?? []}
                      emptyServicesLabel="Services à préciser"
                      description={group.request.description}
                    />
                  ) : null}

                  <div className={styles.conciergeSectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Réponses des concierges</p>
                      <h2 className={styles.conciergeSectionTitle}>
                        {group.quotes.length} proposition(s) à comparer
                      </h2>
                    </div>
                    <p className={styles.conciergeNextStep}>
                      Sélectionnez jusqu&apos;à 3 devis pour activer le comparatif visuel.
                    </p>
                  </div>

                  <OwnerQuotesComparisonTable
                    columns={comparisonColumns.map(({ quote, recipientId, isCheapest, isMostDetailed, isFastest }) => ({
                      id: quote.id,
                      conciergeName: getPersonName(quote.concierge),
                      status: quote.status || "-",
                      badges: (
                        <>
                          {isCheapest ? (
                            <Tag tone="gold" className={styles.conciergeRecipientChip}>Meilleur prix</Tag>
                          ) : null}
                          {isMostDetailed ? (
                            <Tag tone="gold" className={styles.conciergeRecipientChip}>Meilleur détail</Tag>
                          ) : null}
                          {isFastest ? (
                            <Tag tone="gold" className={styles.conciergeRecipientChip}>Réponse la plus rapide</Tag>
                          ) : null}
                        </>
                      ),
                      total: formatAmount(quote.total_amount),
                      pack: quote.package?.name ? formatPackageName(quote.package.name) : "Sans pack",
                      services: getQuoteLineCountLabel(quote),
                      validity: formatDate(quote.valid_until),
                      responseAt: getResponseSpeedLabel(quote),
                      actions: (
                        <>
                          <a
                            href={`/api/quotes/${quote.id}/document`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.linkButton}
                            onClick={() => handleViewQuote(quote.id)}
                          >
                            Voir le PDF
                          </a>
                          {group.request?.id && recipientId ? (
                            <button
                              type="button"
                              className={styles.buttonPrimary}
                              disabled={
                                selectingRequestId === group.request.id ||
                                quote.status === "accepted" ||
                                quote.status === "rejected"
                              }
                              onClick={() => void handleSelectConcierge(group.request!.id, recipientId)}
                            >
                              {quote.status === "accepted"
                                ? "Accepté"
                                : selectingRequestId === group.request.id
                                ? "Sélection..."
                                : "Retenir ce concierge"}
                            </button>
                          ) : null}
                          {quote.status !== "accepted" && quote.status !== "rejected" ? (
                            <button
                              type="button"
                              className={styles.buttonSecondary}
                              disabled={busyQuoteAction === `${quote.id}:rejected`}
                              onClick={() => void handleUpdateQuoteStatus(quote.id, "rejected")}
                            >
                              {busyQuoteAction === `${quote.id}:rejected` ? "Refus..." : "Refuser"}
                            </button>
                          ) : null}
                        </>
                      ),
                    }))}
                  />

                  <div
                    className={styles.conciergeRecipientList}
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
                  >
                    {group.quotes.map((quote) => {
                      const isCheapest = cheapestQuoteId === quote.id;
                      const isMostDetailed = mostDetailedQuoteId === quote.id;
                      const isFastest = fastestQuoteId === quote.id;
                      const isCompared = selectedCompareIds.includes(quote.id);
                      const recipientId =
                        getRequestRecipientIdFromQuote(quote) ??
                        group.request?.recipients?.find((recipient) => recipient.quote_id === quote.id)?.id ??
                        null;

                      return (
                        <OwnerQuoteResponseCard
                          key={quote.id}
                          className={styles.conciergeRecipientCard}
                          style={
                            isCompared
                              ? {
                                  borderColor: "rgba(184, 92, 72, 0.32)",
                                  boxShadow: "0 0 0 2px rgba(184, 92, 72, 0.12)",
                                }
                              : undefined
                          }
                          conciergeName={getPersonName(quote.concierge)}
                          status={quote.status || "-"}
                          workflowStatus={quote.workflow_status}
                          hasMission={Boolean(quote.mission_id)}
                          workflowSteps={getQuoteWorkflowSteps(quote)}
                          badges={
                            <>
                              {isCheapest ? (
                                <Tag tone="gold" className={styles.conciergeRecipientChip}>Meilleur prix</Tag>
                              ) : null}
                              {isMostDetailed ? (
                                <Tag tone="gold" className={styles.conciergeRecipientChip}>Meilleur détail</Tag>
                              ) : null}
                              {isFastest ? (
                                <Tag tone="gold" className={styles.conciergeRecipientChip}>Réponse la plus rapide</Tag>
                              ) : null}
                              {quote.package?.name ? (
                                <Tag tone="status" className={styles.conciergeRecipientChip}>
                                  {formatPackageName(quote.package.name)}
                                </Tag>
                              ) : null}
                            </>
                          }
                          facts={[
                            { label: "Total", value: formatAmount(quote.total_amount) },
                            { label: "Validité", value: formatDate(quote.valid_until) },
                            { label: "Prestations", value: getQuoteLineCountLabel(quote) },
                          ]}
                          items={(quote.quote_items ?? []).map((item) => ({
                            id: item.id,
                            label: item.label,
                            meta: `${item.quantity} x ${formatAmount(item.line_total)}`,
                            description: item.description,
                          }))}
                          notes={quote.notes}
                          actions={
                            <>
                              <button
                                type="button"
                                className={isCompared ? styles.buttonPrimary : styles.buttonSecondary}
                                onClick={() => toggleCompare(group.key, quote.id)}
                              >
                                {isCompared ? "Retirer du comparatif" : "Comparer"}
                              </button>
                              <a
                                href={`/api/quotes/${quote.id}/document`}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.linkButton}
                                onClick={() => handleViewQuote(quote.id)}
                              >
                                Ouvrir le devis PDF
                              </a>
                              {group.request?.id && recipientId ? (
                                <button
                                  type="button"
                                  className={styles.buttonPrimary}
                                  disabled={
                                    selectingRequestId === group.request.id ||
                                    quote.status === "accepted" ||
                                    quote.status === "rejected"
                                  }
                                  onClick={() => void handleSelectConcierge(group.request!.id, recipientId)}
                                >
                                  {quote.status === "accepted"
                                    ? "Accepté"
                                    : selectingRequestId === group.request.id
                                    ? "Sélection..."
                                    : "Retenir ce concierge"}
                                </button>
                              ) : null}
                              {!group.request?.id && quote.status !== "accepted" && quote.status !== "rejected" ? (
                                <button
                                  type="button"
                                  className={styles.buttonPrimary}
                                  disabled={busyQuoteAction === `${quote.id}:accepted`}
                                  onClick={() => void handleUpdateQuoteStatus(quote.id, "accepted")}
                                >
                                  {busyQuoteAction === `${quote.id}:accepted` ? "Acceptation..." : "Accepter le devis"}
                                </button>
                              ) : null}
                              {quote.status !== "accepted" && quote.status !== "rejected" ? (
                                <>
                                  <input
                                    type="text"
                                    className={styles.field}
                                    value={rejectReasons[quote.id] ?? ""}
                                    onChange={(event) =>
                                      setRejectReasons((current) => ({
                                        ...current,
                                        [quote.id]: event.target.value,
                                      }))
                                    }
                                    placeholder="Motif de refus optionnel"
                                    aria-label="Motif de refus du devis"
                                  />
                                <button
                                  type="button"
                                  className={styles.buttonSecondary}
                                  disabled={busyQuoteAction === `${quote.id}:rejected`}
                                  onClick={() => void handleUpdateQuoteStatus(quote.id, "rejected")}
                                >
                                  {busyQuoteAction === `${quote.id}:rejected` ? "Refus..." : "Refuser le devis"}
                                </button>
                                </>
                              ) : null}
                              {quote.status === "accepted" ? (
                                <Link
                                  href={`/dashboard/owner/missions/voyageurs?quote=${encodeURIComponent(quote.id)}`}
                                  className={styles.buttonPrimary}
                                >
                                  Transmettre un séjour voyageur
                                </Link>
                              ) : null}
                            </>
                          }
                        />
                      );
                    })}
                  </div>
                </article>
              );
                })}
              </section>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
