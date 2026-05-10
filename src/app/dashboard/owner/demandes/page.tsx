"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Handshake,
  Home,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { Button, ButtonLink, Checkbox, Input, Select, Textarea } from "@/components/ui";
import styles from "./OwnerRequestsPage.module.scss";

type RequestKind = "ponctuel" | "renfort" | "durable";
type RelationStatus = "draft" | "sent" | "viewed" | "discussion" | "accepted" | "declined" | "expired";
type SortMode = "recent" | "oldest" | "responses" | "quotes";

type OwnerHousingRow = {
  id: number | string;
  nom_logement?: string | null;
  ville?: string | null;
};

type OwnerServiceRequestRecipient = {
  id: string;
  status: string;
  concierge_profile_id?: string | null;
  concierge_name?: string | null;
  responded_at?: string | null;
  viewed_at?: string | null;
};

type OwnerServiceRequestRow = {
  id: string;
  title: string;
  description?: string | null;
  request_type: RequestKind;
  property_id?: string | null;
  property_name?: string | null;
  city?: string | null;
  postal_code?: string | null;
  desired_date?: string | null;
  requested_services?: string[] | null;
  budget_max?: number | null;
  currency?: string | null;
  status: string;
  workflow_status?: string | null;
  mission_id?: string | null;
  selected_concierge_profile_id?: string | null;
  selected_concierge_name?: string | null;
  urgency?: boolean;
  created_at?: string | null;
  recipients: OwnerServiceRequestRecipient[];
};

type OwnerQuoteRow = {
  id: string;
  quote_number?: string | null;
  status: string | null;
  concierge_profile_id?: string | null;
  mission_id?: string | null;
  currency?: string | null;
  total_amount?: number | null;
  valid_until?: string | null;
  accepted_at?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  concierge?: {
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
  } | null;
  package?: {
    name?: string | null;
    description?: string | null;
    category?: string | null;
  } | null;
  quote_items?: Array<{
    id: string;
    label: string | null;
    description?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    line_total?: number | null;
  }> | null;
};

type OwnerMissionRow = {
  id: string;
  title: string | null;
  description?: string | null;
  status: string | null;
  priority: string | null;
  property_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  metadata?: Record<string, unknown> | null;
};

type AcceptedPartnerRow = {
  key: string;
  conciergeId?: string | null;
  conciergeName: string;
  request?: OwnerServiceRequestRow;
  quote: OwnerQuoteRow;
  propertyName: string;
  services: string[];
};

type RequestsPayload = {
  items?: OwnerServiceRequestRow[];
  error?: string;
};

type RequestFormState = {
  propertyKey: string;
  propertyName: string;
  requestType: RequestKind;
  title: string;
  desiredDate: string;
  city: string;
  postalCode: string;
  requestedServices: string;
  budgetMax: string;
  currency: string;
  description: string;
  urgency: boolean;
};

const initialForm: RequestFormState = {
  propertyKey: "",
  propertyName: "",
  requestType: "ponctuel",
  title: "",
  desiredDate: "",
  city: "",
  postalCode: "",
  requestedServices: "",
  budgetMax: "",
  currency: "EUR",
  description: "",
  urgency: false,
};

const statusMeta: Record<RelationStatus, { label: string; className: string; detail: string }> = {
  draft: { label: "Brouillon", className: styles.statusDraft, detail: "La demande reste à compléter." },
  sent: { label: "En attente", className: styles.statusSent, detail: "Les conciergeries ont été contactées." },
  viewed: { label: "Consultée", className: styles.statusViewed, detail: "Au moins une conciergerie a ouvert la demande." },
  discussion: { label: "En discussion", className: styles.statusDiscussion, detail: "Des réponses ou devis sont en cours." },
  accepted: { label: "Acceptée", className: styles.statusAccepted, detail: "La collaboration est validée." },
  declined: { label: "Refusée", className: styles.statusDeclined, detail: "La demande n'a pas abouti." },
  expired: { label: "Expirée", className: styles.statusExpired, detail: "La demande doit être relancée." },
};

const requestTypeLabels: Record<RequestKind, string> = {
  ponctuel: "Besoin ponctuel",
  renfort: "Renfort / remplacement",
  durable: "Collaboration durable",
};

const currencyOptions = ["EUR", "USD", "GBP", "CHF"];

const travelerActionLabels: Record<string, string> = {
  checkin: "Check-in",
  checkout: "Check-out",
  cleaning: "Ménage",
  linen: "Linge",
  quality_check: "Contrôle",
  maintenance: "Maintenance",
  welcome: "Accueil spécifique",
};

const missionStatusLabels: Record<string, string> = {
  draft: "À préparer",
  assigned: "Assignée",
  accepted: "Acceptée",
  in_progress: "En cours",
  completed: "Terminée",
  canceled: "Annulée",
};

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeServices(value: string | null | undefined) {
  if (!value) return [];
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "À confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "À confirmer";
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
  if (typeof value !== "number" || !Number.isFinite(value)) return "Sur devis";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getQuoteRequestId(quote: OwnerQuoteRow) {
  const metadata = quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
    ? quote.metadata
    : null;
  return metadata && typeof metadata.service_request_id === "string" ? metadata.service_request_id : null;
}

function getMetadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function getMetadataStringArray(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function getMissionHousingId(mission: OwnerMissionRow) {
  const metadataHousingId = getMetadataString(mission.metadata, "housing_id");
  return mission.property_id || metadataHousingId || null;
}

function getMissionConciergeId(mission: OwnerMissionRow) {
  return getMetadataString(mission.metadata, "concierge_profile_id") || null;
}

function getMissionPropertyLabel(mission: OwnerMissionRow, housing: OwnerHousingRow[]) {
  const housingId = getMissionHousingId(mission);
  const property = housing.find((item) => String(item.id) === String(housingId ?? ""));
  return property?.nom_logement || property?.ville || "Logement à préciser";
}

function getTravelerName(mission: OwnerMissionRow) {
  return (
    [
      getMetadataString(mission.metadata, "guest_first_name"),
      getMetadataString(mission.metadata, "guest_last_name"),
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    mission.title ||
    "Voyageur"
  );
}

function getGuestCount(mission: OwnerMissionRow) {
  const adults = Number(mission.metadata?.guest_adults ?? 0);
  const children = Number(mission.metadata?.guest_children ?? 0);
  const baby = mission.metadata?.guest_baby === true ? 1 : 0;
  const total = adults + children + baby;
  return total > 0 ? `${total} voyageur${total > 1 ? "s" : ""}` : "Voyageurs à préciser";
}

function getMissionStatusLabel(status: string | null) {
  return missionStatusLabels[normalizeStatus(status) || "draft"] || "À suivre";
}

function getMissionDateRange(mission: OwnerMissionRow) {
  const arrival = getMetadataString(mission.metadata, "arrival_date") || mission.scheduled_start;
  const departure = getMetadataString(mission.metadata, "departure_date") || mission.scheduled_end;
  if (!arrival && !departure) return "Dates à confirmer";
  return `${formatDate(arrival)} → ${formatDate(departure)}`;
}

function getMissionChecklist(mission: OwnerMissionRow) {
  const actions = getMetadataStringArray(mission.metadata, "requested_actions");
  return actions.map((action) => travelerActionLabels[action] || action).slice(0, 4);
}

function getMissionPartnerName(mission: OwnerMissionRow, partners: AcceptedPartnerRow[]) {
  const conciergeId = getMissionConciergeId(mission);
  const housingId = getMissionHousingId(mission);
  const partner = partners.find((item) => {
    const sameConcierge = conciergeId && (item.conciergeId === conciergeId || item.quote.concierge_profile_id === conciergeId);
    const sameHousing = housingId && item.request && String(item.request.property_id ?? "") === String(housingId);
    return Boolean(sameConcierge || sameHousing);
  });
  return partner?.conciergeName || "Partenaire à confirmer";
}

function getConciergeNameFromQuote(quote: OwnerQuoteRow) {
  return (
    quote.concierge?.company_name ||
    [quote.concierge?.first_name, quote.concierge?.last_name].filter(Boolean).join(" ").trim() ||
    "Conciergerie"
  );
}

function getConciergeNames(request: OwnerServiceRequestRow) {
  return Array.from(
    new Set(
      request.recipients
        .map((recipient) => recipient.concierge_name?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function getAcceptedConciergeId(request: OwnerServiceRequestRow) {
  return (
    request.selected_concierge_profile_id ||
    request.recipients.find((recipient) => normalizeStatus(recipient.status) === "selected")?.concierge_profile_id ||
    null
  );
}

function getAcceptedConciergeName(request: OwnerServiceRequestRow) {
  const selectedRecipient = request.recipients.find((recipient) => normalizeStatus(recipient.status) === "selected");
  return (
    request.selected_concierge_name?.trim() ||
    selectedRecipient?.concierge_name?.trim() ||
    getConciergeNames(request)[0] ||
    "Conciergerie acceptée"
  );
}

function getRelationStatus(request: OwnerServiceRequestRow): RelationStatus {
  const status = normalizeStatus(request.workflow_status ?? request.status);
  const recipientStatuses = request.recipients.map((recipient) => normalizeStatus(recipient.status));

  if (request.mission_id || status === "accepted" || status === "mission_created" || recipientStatuses.includes("selected")) {
    return "accepted";
  }
  if (status === "expired" || status === "cancelled" || status === "canceled") return "expired";
  if (status === "declined" || (recipientStatuses.length > 0 && recipientStatuses.every((item) => item === "declined" || item === "not_selected"))) {
    return "declined";
  }
  if (status === "quoted" || status === "quote_sent" || recipientStatuses.some((item) => item === "quoted" || item === "interested")) {
    return "discussion";
  }
  if (status === "in_review" || recipientStatuses.includes("viewed") || request.recipients.some((recipient) => Boolean(recipient.viewed_at))) {
    return "viewed";
  }
  if (status === "draft" || status === "new") return "draft";
  return "sent";
}

function getResponseCount(request: OwnerServiceRequestRow) {
  return request.recipients.filter((recipient) =>
    ["interested", "quoted", "selected", "not_selected", "declined"].includes(normalizeStatus(recipient.status)),
  ).length;
}

function getViewedCount(request: OwnerServiceRequestRow) {
  return request.recipients.filter((recipient) => Boolean(recipient.viewed_at) || normalizeStatus(recipient.status) === "viewed").length;
}

function getInitials(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "C";
}

function getLastExchange(request: OwnerServiceRequestRow) {
  const lastRecipient = [...request.recipients]
    .filter((recipient) => recipient.responded_at || recipient.viewed_at)
    .sort((left, right) =>
      String(right.responded_at ?? right.viewed_at).localeCompare(String(left.responded_at ?? left.viewed_at)),
    )[0];

  if (!lastRecipient) return "Aucun échange récent";
  return `${lastRecipient.concierge_name || "Conciergerie"} · ${formatDateTime(lastRecipient.responded_at || lastRecipient.viewed_at)}`;
}

function getTimeline(request: OwnerServiceRequestRow, quoteCount: number) {
  const status = getRelationStatus(request);
  return [
    { label: "Envoyée", done: status !== "draft" },
    { label: "Consultée", done: getViewedCount(request) > 0 || ["viewed", "discussion", "accepted"].includes(status) },
    { label: "Discussion", done: getResponseCount(request) > 0 || ["discussion", "accepted"].includes(status) },
    { label: "Devis reçu", done: quoteCount > 0 || status === "accepted" },
    { label: "Acceptation", done: status === "accepted" },
  ];
}

function buildRequestSearchHref(request: OwnerServiceRequestRow) {
  const params = new URLSearchParams();
  if (request.city?.trim()) params.set("city", request.city.trim());
  if (request.postal_code?.trim()) params.set("postalCode", request.postal_code.trim());
  if ((request.requested_services ?? []).length > 0) params.set("services", (request.requested_services ?? []).join(","));
  const query = params.toString();
  return query ? `/dashboard/owner/concierges?${query}` : "/dashboard/owner/concierges";
}

function getRequestTitleSuggestion(form: RequestFormState) {
  const service = normalizeServices(form.requestedServices)[0] || "gestion conciergerie";
  const property = form.propertyName || "logement";
  return form.city ? `${service} - ${property} - ${form.city}` : `${service} - ${property}`;
}

function getQuoteStatusLabel(status: string) {
  switch (status) {
    case "accepted":
      return "Accepté";
    case "rejected":
      return "Refusé";
    case "expired":
      return "Expiré";
    case "canceled":
      return "Annulé";
    case "sent":
      return "Envoyé";
    case "draft":
      return "Brouillon";
    default:
      return "À comparer";
  }
}

function isQuoteActionable(quote: OwnerQuoteRow) {
  return !["accepted", "rejected", "expired", "canceled"].includes(normalizeStatus(quote.status));
}

export default function OwnerRequestsPage() {
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [housing, setHousing] = useState<OwnerHousingRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [form, setForm] = useState<RequestFormState>(initialForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [requestsResponse, housingResponse, quotesResponse, missionsResponse] = await Promise.all([
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/quotes?limit=100", { cache: "no-store" }),
        fetch("/api/missions?scope=owner&limit=100", { cache: "no-store" }),
      ]);

      const requestsPayload = (await requestsResponse.json()) as RequestsPayload;
      const housingPayload = await housingResponse.json();
      const quotesPayload = await quotesResponse.json();
      const missionsPayload = await missionsResponse.json();

      if (!requestsResponse.ok) throw new Error(requestsPayload?.error || "Impossible de charger les demandes.");
      if (!housingResponse.ok) throw new Error(housingPayload?.error || "Impossible de charger les logements.");
      if (!quotesResponse.ok) throw new Error(quotesPayload?.error || "Impossible de charger les devis.");
      if (!missionsResponse.ok) {
        console.warn("[owner/demandes] Missions voyageurs indisponibles", missionsPayload?.error);
      }

      setRequests(Array.isArray(requestsPayload.items) ? requestsPayload.items : []);
      setHousing(Array.isArray(housingPayload) ? housingPayload : []);
      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
      setMissions(missionsResponse.ok && Array.isArray(missionsPayload) ? missionsPayload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const housingOptions = useMemo(
    () =>
      housing.map((item) => ({
        key: String(item.id),
        label: item.nom_logement?.trim() || (item.ville ? `Logement à ${item.ville}` : "") || "Logement",
        city: item.ville?.trim() || "",
      })),
    [housing],
  );

  const quotesByRequestId = useMemo(() => {
    const next = new Map<string, OwnerQuoteRow[]>();
    quotes.forEach((quote) => {
      const requestId = getQuoteRequestId(quote);
      if (!requestId) return;
      const current = next.get(requestId) ?? [];
      current.push(quote);
      next.set(requestId, current);
    });
    return next;
  }, [quotes]);

  const cityOptions = useMemo(
    () => Array.from(new Set(requests.map((request) => request.city?.trim()).filter((value): value is string => Boolean(value)))).sort(),
    [requests],
  );

  const serviceOptions = useMemo(
    () => Array.from(new Set(requests.flatMap((request) => request.requested_services ?? []))).sort((left, right) => left.localeCompare(right, "fr")),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = requests.filter((request) => {
      const relationStatus = getRelationStatus(request);
      if (statusFilter !== "all" && relationStatus !== statusFilter) return false;
      if (cityFilter !== "all" && request.city !== cityFilter) return false;
      if (serviceFilter !== "all" && !(request.requested_services ?? []).includes(serviceFilter)) return false;
      if (!normalizedSearch) return true;
      const haystack = [
        request.title,
        request.description,
        request.property_name,
        request.city,
        ...getConciergeNames(request),
        ...(request.requested_services ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    return [...filtered].sort((left, right) => {
      if (sortMode === "oldest") {
        return new Date(left.created_at ?? 0).getTime() - new Date(right.created_at ?? 0).getTime();
      }
      if (sortMode === "responses") return getResponseCount(right) - getResponseCount(left);
      if (sortMode === "quotes") return (quotesByRequestId.get(right.id)?.length ?? 0) - (quotesByRequestId.get(left.id)?.length ?? 0);
      return new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime();
    });
  }, [cityFilter, quotesByRequestId, requests, searchTerm, serviceFilter, sortMode, statusFilter]);

  const currentRequests = filteredRequests.filter((request) => ["draft", "sent", "viewed", "discussion"].includes(getRelationStatus(request)));
  const acceptedRequests = filteredRequests.filter((request) => getRelationStatus(request) === "accepted");
  const declinedRequests = filteredRequests.filter((request) => ["declined", "expired"].includes(getRelationStatus(request)));
  const allAcceptedRequests = requests.filter((request) => getRelationStatus(request) === "accepted");
  const allDeclinedRequests = requests.filter((request) => ["declined", "expired"].includes(getRelationStatus(request)));
  const actionableQuotes = quotes.filter(isQuoteActionable);
  const acceptedQuotes = quotes.filter((quote) => normalizeStatus(quote.status) === "accepted");
  const travelerMissions = useMemo(
    () => missions.filter((mission) => mission.metadata?.mission_kind === "traveler_stay"),
    [missions],
  );
  const activeTravelerMissions = travelerMissions.filter(
    (mission) => !["completed", "canceled"].includes(normalizeStatus(mission.status)),
  );
  const urgentTravelerMissions = travelerMissions.filter(
    (mission) => mission.priority === "urgent" || mission.metadata?.issue_flag === "urgent",
  );

  const partners = useMemo<AcceptedPartnerRow[]>(() => {
    return acceptedQuotes.map((quote) => {
      const requestId = getQuoteRequestId(quote);
      const request = requestId ? requests.find((item) => item.id === requestId) : undefined;
      const services = request?.requested_services ?? quote.quote_items?.map((item) => item.label || "").filter(Boolean) ?? [];

      return {
        key: quote.id,
        conciergeId: quote.concierge_profile_id ?? (request ? getAcceptedConciergeId(request) : null),
        conciergeName: request ? getAcceptedConciergeName(request) : getConciergeNameFromQuote(quote),
        request,
        quote,
        propertyName: request?.property_name || request?.city || getMetadataString(quote.metadata, "property_name") || getMetadataString(quote.metadata, "city") || "Logement à préciser",
        services,
      };
    });
  }, [acceptedQuotes, requests]);

  const titleSuggestion = getRequestTitleSuggestion(form);
  const normalizedServices = normalizeServices(form.requestedServices);

  const stats = [
    { label: "Demandes envoyées", value: String(requests.length), icon: <Send size={18} /> },
    { label: "En attente", value: String(requests.filter((request) => ["sent", "viewed"].includes(getRelationStatus(request))).length), icon: <Clock3 size={18} /> },
    { label: "Acceptées", value: String(allAcceptedRequests.length), icon: <CheckCircle2 size={18} /> },
    { label: "Refusées", value: String(allDeclinedRequests.length), icon: <XCircle size={18} /> },
    { label: "Devis reçus", value: String(quotes.length), icon: <FileText size={18} /> },
    { label: "Devis acceptés", value: String(partners.length), icon: <Handshake size={18} /> },
    { label: "Séjours voyageurs", value: String(activeTravelerMissions.length), icon: <Users size={18} /> },
  ];

  function handleHousingChange(value: string) {
    const selected = housingOptions.find((item) => item.key === value);
    setForm((current) => ({
      ...current,
      propertyKey: value,
      propertyName: selected?.label || "",
      city: current.city || selected?.city || "",
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const services = normalizeServices(form.requestedServices);
    if (!form.title.trim()) {
      setError("Ajoutez un titre clair à votre demande.");
      return;
    }
    if (services.length === 0) {
      setError("Ajoutez au moins un service recherché.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: form.requestType,
          title: form.title.trim(),
          description: form.description.trim() || null,
          property_name: form.propertyName.trim() || null,
          requested_services: services,
          city: form.city.trim() || null,
          postal_code: form.postalCode.trim() || null,
          desired_date: form.desiredDate ? new Date(form.desiredDate).toISOString() : null,
          urgency: form.urgency,
          budget_max: form.budgetMax ? Number(form.budgetMax) : null,
          currency: form.currency,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible de créer la demande.");
      setSuccess("Demande créée. Vous pouvez maintenant contacter des conciergeries et suivre les retours.");
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la demande.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateQuoteStatus(quoteId: string, status: "accepted" | "rejected") {
    try {
      setBusyQuoteId(quoteId);
      setError(null);
      setSuccess(null);
      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible de mettre à jour le devis.");
      setSuccess(status === "accepted" ? "Devis accepté. La conciergerie est maintenant partenaire." : "Devis refusé.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le devis.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Centre de relation conciergeries</p>
          <h1>Demandes de mise en relation</h1>
          <p>
            Pilotez la phase commerciale avant collaboration : demandes envoyées, retours conciergeries,
            devis reçus et partenaires validés.
          </p>
          <div className={styles.heroActions}>
            <a href="#nouvelle-demande" className={styles.primaryLink}>
              <Send size={16} aria-hidden="true" /> Nouvelle demande
            </a>
            <ButtonLink href="/dashboard/owner/concierges" variant="secondary">
              <Search size={16} aria-hidden="true" /> Rechercher une conciergerie
            </ButtonLink>
            <ButtonLink href="/dashboard/owner/missions/voyageurs" variant="secondary">
              <Users size={16} aria-hidden="true" /> Missions voyageurs
            </ButtonLink>
          </div>
        </div>
        <div className={styles.heroSnapshot}>
          <span><Bell size={16} /> Suivi relationnel</span>
          <strong>{actionableQuotes.length}</strong>
          <p>devis à comparer</p>
          <div className={styles.heroProgress}>
            <span style={{ width: `${Math.min(100, Math.max(12, partners.length * 24))}%` }} />
          </div>
        </div>
      </header>

      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <section className={styles.statsGrid} aria-label="Statistiques rapides">
        {loading ? Array.from({ length: 7 }).map((_, index) => <SkeletonStat key={index} />) : stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <div>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.filtersPanel} aria-label="Filtres et recherche">
        <label className={styles.searchField}>
          <Search size={17} aria-hidden="true" />
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher par concierge, ville, logement, service..." />
        </label>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrer par statut">
          <option value="all">Tous les statuts</option>
          <option value="sent">En attente</option>
          <option value="viewed">Consultée</option>
          <option value="discussion">En discussion</option>
          <option value="accepted">Acceptée</option>
          <option value="declined">Refusée</option>
          <option value="expired">Expirée</option>
        </Select>
        <Select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} aria-label="Filtrer par ville">
          <option value="all">Toutes villes</option>
          {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
        </Select>
        <Select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} aria-label="Filtrer par service">
          <option value="all">Tous services</option>
          {serviceOptions.map((service) => <option key={service} value={service}>{service}</option>)}
        </Select>
        <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Trier">
          <option value="recent">Plus récent</option>
          <option value="oldest">Plus ancien</option>
          <option value="responses">Plus de réponses</option>
          <option value="quotes">Plus de devis</option>
        </Select>
      </section>

      <section id="nouvelle-demande" className={styles.creationPanel}>
        <SectionHeader
          eyebrow="Recherche"
          title="Créer une nouvelle demande"
          description="Cette page concerne uniquement la recherche et la mise en relation avec des conciergeries."
        />
        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Logement</span>
            <Select value={form.propertyKey} onChange={(event) => handleHousingChange(event.target.value)}>
              <option value="">Choisir un logement</option>
              {housingOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </Select>
          </label>
          <label className={styles.field}>
            <span>Type de recherche</span>
            <Select value={form.requestType} onChange={(event) => setForm((current) => ({ ...current, requestType: event.target.value as RequestKind }))}>
              <option value="ponctuel">Besoin ponctuel</option>
              <option value="renfort">Renfort / remplacement</option>
              <option value="durable">Collaboration durable</option>
            </Select>
          </label>
          <label className={styles.field}>
            <span>Date souhaitée</span>
            <Input type="datetime-local" value={form.desiredDate} onChange={(event) => setForm((current) => ({ ...current, desiredDate: event.target.value }))} />
          </label>
          <label className={styles.field}>
            <span>Budget indicatif</span>
            <div className={styles.amountRow}>
              <Input type="number" min="0" value={form.budgetMax} onChange={(event) => setForm((current) => ({ ...current, budgetMax: event.target.value }))} placeholder="Sur devis" />
              <Select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}>
                {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </Select>
            </div>
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>Titre</span>
            <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex : gestion complète appartement centre-ville" />
            <button type="button" className={styles.suggestionButton} onClick={() => setForm((current) => ({ ...current, title: titleSuggestion }))}>
              Utiliser : {titleSuggestion}
            </button>
          </label>
          <label className={styles.field}>
            <span>Ville</span>
            <Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Paris" />
          </label>
          <label className={styles.field}>
            <span>Code postal</span>
            <Input value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} inputMode="numeric" />
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>Services recherchés</span>
            <Input value={form.requestedServices} onChange={(event) => setForm((current) => ({ ...current, requestedServices: event.target.value }))} placeholder="check-in, ménage, linge, relation voyageurs..." />
            {normalizedServices.length > 0 ? (
              <div className={styles.chipRow}>
                {normalizedServices.map((service) => <span key={service} className={styles.serviceChip}>{service}</span>)}
              </div>
            ) : null}
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>Détails de la recherche</span>
            <Textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Contexte, attentes, contraintes, type de collaboration souhaitée..." />
          </label>
          <div className={styles.fullField}>
            <Checkbox checked={form.urgency} onChange={(event) => setForm((current) => ({ ...current, urgency: event.target.checked }))} label="Recherche urgente" />
          </div>
          <div className={`${styles.formActions} ${styles.fullField}`}>
            <Button type="submit" disabled={submitting}>
              <Send size={16} aria-hidden="true" /> {submitting ? "Création..." : "Créer la demande"}
            </Button>
            <ButtonLink href="/dashboard/owner/concierges" variant="secondary">
              <Search size={16} aria-hidden="true" /> Explorer les conciergeries
            </ButtonLink>
          </div>
        </form>
      </section>

      <RequestSection
        id="demandes-en-cours"
        eyebrow="Demandes en cours"
        title="Suivre les conciergeries contactées"
        description="Chaque carte montre l'état de la relation, les retours reçus et la progression vers un devis."
        emptyTitle="Aucune demande en cours"
        emptyText="Les demandes envoyées ou en discussion apparaîtront ici."
        requests={currentRequests}
        quotesByRequestId={quotesByRequestId}
      />

      <RequestSection
        id="demandes-acceptees"
        eyebrow="Demandes acceptées"
        title="Collaborations validées"
        description="Ces demandes ont abouti à une validation ou un devis accepté."
        emptyTitle="Aucune demande acceptée"
        emptyText="Une demande passera ici après validation d'une collaboration."
        requests={acceptedRequests}
        quotesByRequestId={quotesByRequestId}
      />

      <section className={styles.sectionPanel} id="missions-voyageurs">
        <SectionHeader
          eyebrow="Missions voyageurs"
          title="Séjours transmis aux partenaires"
          description="Cette vue relie la relation commerciale aux séjours voyageurs déjà confiés aux conciergeries partenaires."
        />
        <div className={styles.travelerSummaryGrid}>
          <Metric label="Séjours actifs" value={String(activeTravelerMissions.length)} />
          <Metric label="Points sensibles" value={String(urgentTravelerMissions.length)} />
          <Metric label="Partenaires mobilisés" value={String(partners.length)} />
          <Metric label="Module dédié" value="Missions voyageurs" />
        </div>
        {loading ? <SkeletonList /> : null}
        {!loading && travelerMissions.length === 0 ? (
          <EmptyPanel
            title="Aucune mission voyageur liée"
            text="Les séjours créés depuis l'espace missions voyageurs apparaîtront ici pour donner du contexte à la relation conciergerie."
          />
        ) : null}
        <div className={styles.travelerMissionGrid}>
          {travelerMissions.slice(0, 6).map((mission) => (
            <TravelerMissionCard
              key={mission.id}
              mission={mission}
              housing={housing}
              partnerName={getMissionPartnerName(mission, partners)}
            />
          ))}
        </div>
        <div className={styles.sectionActions}>
          <ButtonLink href="/dashboard/owner/missions/voyageurs" variant="secondary">
            <CalendarClock size={16} /> Créer ou gérer un séjour
          </ButtonLink>
          <ButtonLink href="/dashboard/owner/planning" variant="ghost">
            <ArrowRight size={16} /> Voir le planning
          </ButtonLink>
        </div>
      </section>

      <RequestSection
        id="demandes-refusees"
        eyebrow="Demandes refusées"
        title="Demandes clôturées ou expirées"
        description="Gardez une trace des recherches non abouties pour comprendre vos zones ou services moins couverts."
        emptyTitle="Aucune demande refusée"
        emptyText="Les refus et expirations apparaîtront ici."
        requests={declinedRequests}
        quotesByRequestId={quotesByRequestId}
      />

      <section className={styles.sectionPanel} id="devis-recus">
        <SectionHeader
          eyebrow="Devis reçus"
          title="Comparer les propositions"
          description="Prix, pack, services inclus et décision sont séparés du suivi des demandes."
        />
        {loading ? <SkeletonList /> : null}
        {!loading && quotes.length === 0 ? <EmptyPanel title="Aucun devis reçu" text="Les devis reçus par vos demandes apparaîtront ici." /> : null}
        <div className={styles.quoteGrid}>
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              request={requests.find((request) => request.id === getQuoteRequestId(quote))}
              busy={busyQuoteId === quote.id}
              onAccept={() => updateQuoteStatus(quote.id, "accepted")}
              onReject={() => updateQuoteStatus(quote.id, "rejected")}
            />
          ))}
        </div>
        {quotes.length > 1 ? <QuoteComparison quotes={quotes.slice(0, 4)} /> : null}
      </section>

      <section className={styles.sectionPanel} id="partenaires">
        <SectionHeader
          eyebrow="Partenaires acceptés"
          title="Devis acceptés"
          description="Cette section affiche uniquement les conciergeries dont un devis a été accepté."
        />
        {!loading && partners.length === 0 ? <EmptyPanel title="Aucun devis accepté" text="Les devis acceptés apparaîtront ici avec la conciergerie associée." /> : null}
        <div className={styles.partnerGrid}>
          {partners.map((partner) => (
            <article key={partner.key} className={styles.partnerCard}>
              <div className={styles.partnerTop}>
                <div className={styles.avatar}>{getInitials(partner.conciergeName)}</div>
                <div>
                  <p className={styles.eyebrow}>Devis accepté</p>
                  <h3>{partner.conciergeName}</h3>
                  <span>{partner.propertyName}</span>
                </div>
              </div>
              <div className={styles.partnerMetrics}>
                <Metric label="Montant accepté" value={formatAmount(partner.quote.total_amount, partner.quote.currency ?? "EUR")} />
                <Metric label="Devis" value={partner.quote.quote_number || partner.quote.id.slice(0, 8)} />
                <Metric label="Pack" value={partner.quote.package?.name || "Sur mesure"} />
                <Metric label="Services" value={partner.services.slice(0, 2).join(", ") || "À préciser"} />
              </div>
              <div className={styles.partnerFooter}>
                <span className={styles.trustBadge}><ShieldCheck size={14} /> Accepté le {formatDate(partner.quote.accepted_at || partner.quote.created_at)}</span>
                <Link href={`/dashboard/owner/devis?quote=${encodeURIComponent(partner.quote.id)}`} className={styles.textLink}>
                  Voir le devis <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}

function RequestSection({
  id,
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyText,
  requests,
  quotesByRequestId,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyText: string;
  requests: OwnerServiceRequestRow[];
  quotesByRequestId: Map<string, OwnerQuoteRow[]>;
}) {
  return (
    <section className={styles.sectionPanel} id={id}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      {requests.length === 0 ? <EmptyPanel title={emptyTitle} text={emptyText} /> : null}
      <div className={styles.requestGrid}>
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} quotes={quotesByRequestId.get(request.id) ?? []} />
        ))}
      </div>
    </section>
  );
}

function RequestCard({ request, quotes }: { request: OwnerServiceRequestRow; quotes: OwnerQuoteRow[] }) {
  const relationStatus = getRelationStatus(request);
  const meta = statusMeta[relationStatus];
  const names = getConciergeNames(request);
  const displayName = names[0] || "Conciergeries contactées";
  const timeline = getTimeline(request, quotes.length);

  return (
    <article className={styles.requestCard}>
      <div className={styles.cardTop}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{getInitials(displayName)}</div>
          <div>
            <h3>{request.title}</h3>
            <p>{displayName}{names.length > 1 ? ` +${names.length - 1}` : ""}</p>
          </div>
        </div>
        <span className={`${styles.statusBubble} ${meta.className}`}>{meta.label}</span>
      </div>
      <p className={styles.cardSummary}>{meta.detail}</p>
      <div className={styles.factGrid}>
        <Metric label="Localisation" value={[request.city, request.postal_code].filter(Boolean).join(" ") || "À préciser"} />
        <Metric label="Services" value={(request.requested_services ?? []).slice(0, 2).join(", ") || "À préciser"} />
        <Metric label="Envoyée" value={formatDate(request.created_at)} />
        <Metric label="Dernier échange" value={getLastExchange(request)} />
      </div>
      <div className={styles.timeline}>
        {timeline.map((step) => (
          <div key={step.label} className={step.done ? styles.timelineStepDone : styles.timelineStep}>
            <span />
            <small>{step.label}</small>
          </div>
        ))}
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.chipRow}>
          <span className={styles.serviceChip}>{requestTypeLabels[request.request_type]}</span>
          {request.urgency ? <span className={styles.warningChip}>Urgent</span> : null}
          {quotes.length > 0 ? <span className={styles.serviceChip}>{quotes.length} devis</span> : null}
        </div>
        <div className={styles.cardActions}>
          <ButtonLink href={buildRequestSearchHref(request)} variant="ghost" size="sm">
            <Search size={15} /> Relancer
          </ButtonLink>
          <ButtonLink href={`/dashboard/owner/devis?request=${encodeURIComponent(request.id)}`} variant="secondary" size="sm">
            <Eye size={15} /> Voir les devis
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

function TravelerMissionCard({
  mission,
  housing,
  partnerName,
}: {
  mission: OwnerMissionRow;
  housing: OwnerHousingRow[];
  partnerName: string;
}) {
  const checklist = getMissionChecklist(mission);
  const status = normalizeStatus(mission.status) || "draft";
  const bookingPlatform = getMetadataString(mission.metadata, "booking_platform");
  const bookingCode = getMetadataString(mission.metadata, "booking_code");
  const isUrgent = mission.priority === "urgent" || mission.metadata?.issue_flag === "urgent";

  return (
    <article className={styles.travelerMissionCard}>
      <div className={styles.cardTop}>
        <div className={styles.identity}>
          <div className={styles.avatar}><Users size={18} /></div>
          <div>
            <h3>{getTravelerName(mission)}</h3>
            <p>{partnerName}</p>
          </div>
        </div>
        <span className={`${styles.statusBubble} ${status === "completed" ? styles.statusAccepted : styles.statusViewed}`}>
          {getMissionStatusLabel(mission.status)}
        </span>
      </div>
      <div className={styles.travelerRoute}>
        <span><Home size={15} /> {getMissionPropertyLabel(mission, housing)}</span>
        <span><CalendarClock size={15} /> {getMissionDateRange(mission)}</span>
      </div>
      <div className={styles.factGrid}>
        <Metric label="Voyageurs" value={getGuestCount(mission)} />
        <Metric label="Réservation" value={[bookingPlatform, bookingCode].filter(Boolean).join(" · ") || "À préciser"} />
      </div>
      <div className={styles.chipRow}>
        {checklist.length > 0 ? checklist.map((action) => (
          <span key={action} className={styles.serviceChip}>{action}</span>
        )) : <span className={styles.serviceChip}>Checklist à préciser</span>}
        {isUrgent ? <span className={styles.warningChip}>Attention requise</span> : null}
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.trustBadge}><ShieldCheck size={14} /> Reliée au suivi partenaire</span>
        <Link href={`/dashboard/owner/missions/${encodeURIComponent(mission.id)}`} className={styles.textLink}>
          Ouvrir <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function QuoteCard({
  quote,
  request,
  busy,
  onAccept,
  onReject,
}: {
  quote: OwnerQuoteRow;
  request?: OwnerServiceRequestRow;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const status = normalizeStatus(quote.status);
  const canDecide = isQuoteActionable(quote);
  const items = quote.quote_items ?? [];

  return (
    <article className={styles.quoteCard}>
      <div className={styles.quoteHeader}>
        <div>
          <p className={styles.eyebrow}>{quote.quote_number || "Devis reçu"}</p>
          <h3>{getConciergeNameFromQuote(quote)}</h3>
          <span>{request?.title || request?.property_name || "Demande associée"}</span>
        </div>
        <strong>{formatAmount(quote.total_amount, quote.currency ?? "EUR")}</strong>
      </div>
      <div className={styles.quoteFacts}>
        <Metric label="Pack" value={quote.package?.name || "Sur mesure"} />
        <Metric label="Validité" value={formatDate(quote.valid_until)} />
        <Metric label="Statut" value={getQuoteStatusLabel(status)} />
      </div>
      <div className={styles.includedList}>
        {items.length > 0 ? items.slice(0, 5).map((item) => (
          <span key={item.id}><CheckCircle2 size={14} /> {item.label || "Prestation"}</span>
        )) : <span><Sparkles size={14} /> Prestations détaillées dans le devis</span>}
      </div>
      {quote.notes ? <p className={styles.quoteNote}>{quote.notes}</p> : null}
      <div className={styles.quoteActions}>
        {canDecide ? (
          <>
            <Button type="button" disabled={busy} onClick={onAccept}>
              <CheckCircle2 size={16} /> Accepter
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={onReject}>
              <XCircle size={16} /> Refuser
            </Button>
          </>
        ) : (
          <span className={styles.trustBadge}>{getQuoteStatusLabel(status)}</span>
        )}
        <Link href={`/dashboard/owner/devis?quote=${encodeURIComponent(quote.id)}`} className={styles.textLink}>
          Détails <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function QuoteComparison({ quotes }: { quotes: OwnerQuoteRow[] }) {
  return (
    <div className={styles.comparisonPanel}>
      <SectionHeader eyebrow="Comparateur" title="Vue comparative rapide" description="Comparez les écarts de prix, packs et services inclus sans quitter la page." />
      <div className={styles.comparisonGrid} style={{ gridTemplateColumns: `minmax(130px, 0.55fr) repeat(${quotes.length}, minmax(180px, 1fr))` }}>
        <strong>Critère</strong>
        {quotes.map((quote) => <strong key={quote.id}>{getConciergeNameFromQuote(quote)}</strong>)}
        <span>Prix</span>
        {quotes.map((quote) => <span key={`${quote.id}-price`}>{formatAmount(quote.total_amount, quote.currency ?? "EUR")}</span>)}
        <span>Pack</span>
        {quotes.map((quote) => <span key={`${quote.id}-pack`}>{quote.package?.name || "Sur mesure"}</span>)}
        <span>Services</span>
        {quotes.map((quote) => <span key={`${quote.id}-items`}>{quote.quote_items?.length || 0} ligne(s)</span>)}
        <span>Statut</span>
        {quotes.map((quote) => <span key={`${quote.id}-status`}>{getQuoteStatusLabel(normalizeStatus(quote.status))}</span>)}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.emptyPanel}>
      <Clock3 size={22} aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <article className={`${styles.statCard} ${styles.skeleton}`}>
      <span />
      <div>
        <strong />
        <p />
      </div>
    </article>
  );
}

function SkeletonList() {
  return (
    <div className={styles.skeletonList}>
      <span />
      <span />
      <span />
    </div>
  );
}
