"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Eye,
  FileText,
  Handshake,
  ListChecks,
  MapPin,
  Plus,
  Route,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button, ButtonLink, Input, Select, ServiceCatalogPicker, Textarea } from "@/components/ui";
import { normalizeServiceValues, type ServiceCatalogItem } from "@/app/lib/serviceCatalog";
import { OwnerJourneyRail } from "@/features/owner-dashboard";
import { ServiceRequestCard } from "@/features/service-requests";
import { ownerApiError } from "../ownerFeedback";
import { focusFirstModalElement, trapFocusInModal } from "../modalAccessibility";
import styles from "./OwnerRequestsPage.module.scss";

type RequestKind = "ponctuel" | "renfort" | "durable";
type RelationStatus = "draft" | "sent" | "viewed" | "discussion" | "accepted" | "declined" | "expired";
type SortMode = "recent" | "oldest" | "responses" | "quotes";
type TimelineStepState = "done" | "active" | "todo";

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
  property_housing_id?: string | null;
  property_name?: string | null;
  region?: string | null;
  city?: string | null;
  postal_code?: string | null;
  radius_km?: number | null;
  desired_date?: string | null;
  requested_services?: string[] | null;
  budget_max?: number | null;
  currency?: string | null;
  status: string;
  workflow_status?: string | null;
  request_workflow_status?: string | null;
  quote_workflow_status?: string | null;
  mission_workflow_status?: string | null;
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
  service_request_id?: string | null;
  service_request_recipient_id?: string | null;
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

type RequestsPayload = {
  items?: OwnerServiceRequestRow[];
  error?: string;
};


type RequestFormState = {
  propertyKey: string;
  propertyName: string;
  requestType: RequestKind;
  collaborationType: string;
  collaborationFrequency: string;
  estimatedDuration: string;
  responsibilityLevel: string;
  desiredDate: string;
  propertyConstraints: string;
  title: string;
  region: string;
  city: string;
  postalCode: string;
  radiusKm: string;
  requestedServices: string;
  budgetMax: string;
  currency: string;
  description: string;
};

const initialForm: RequestFormState = {
  propertyKey: "",
  propertyName: "",
  requestType: "ponctuel",
  collaborationType: "one_off",
  collaborationFrequency: "once",
  estimatedDuration: "",
  responsibilityLevel: "low",
  desiredDate: "",
  propertyConstraints: "",
  title: "",
  region: "",
  city: "",
  postalCode: "",
  radiusKm: "",
  requestedServices: "",
  budgetMax: "",
  currency: "EUR",
  description: "",
};

const statusMeta: Record<RelationStatus, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: styles.statusDraft },
  sent: { label: "En attente", className: styles.statusSent },
  viewed: { label: "Consultée", className: styles.statusViewed },
  discussion: { label: "En discussion", className: styles.statusDiscussion },
  accepted: { label: "Acceptée", className: styles.statusAccepted },
  declined: { label: "Refusée", className: styles.statusDeclined },
  expired: { label: "Expirée", className: styles.statusExpired },
};

const requestTypeLabels: Record<RequestKind, string> = {
  ponctuel: "Besoin ponctuel",
  renfort: "Renfort / remplacement",
  durable: "Collaboration durable",
};

function getCollaborationDefaults(requestType: RequestKind) {
  if (requestType === "durable") {
    return { collaborationType: "regular", collaborationFrequency: "year_round", responsibilityLevel: "shared" };
  }
  if (requestType === "renfort") {
    return { collaborationType: "temporary_replacement", collaborationFrequency: "seasonal", responsibilityLevel: "shared" };
  }
  return { collaborationType: "one_off", collaborationFrequency: "once", responsibilityLevel: "low" };
}

const currencyOptions = ["EUR", "USD", "GBP", "CHF"];



function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

const normalizeServices = normalizeServiceValues;

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


function getQuoteRequestId(quote: OwnerQuoteRow) {
  if (quote.service_request_id) return quote.service_request_id;
  const metadata = quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
    ? quote.metadata
    : null;
  return metadata && typeof metadata.service_request_id === "string" ? metadata.service_request_id : null;
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

function getSelectedConciergeName(request: OwnerServiceRequestRow) {
  const selectedRecipient = request.recipients.find((recipient) => normalizeStatus(recipient.status) === "selected");
  return (
    request.selected_concierge_name?.trim() ||
    selectedRecipient?.concierge_name?.trim() ||
    getConciergeNames(request)[0] ||
    "Conciergerie retenue"
  );
}

function getRelationStatus(request: OwnerServiceRequestRow): RelationStatus {
  const workflowStatus = normalizeStatus(request.request_workflow_status ?? request.workflow_status);
  if (workflowStatus === "new") return "draft";
  if (workflowStatus === "sent") return "sent";
  if (workflowStatus === "viewed") return "viewed";
  if (workflowStatus === "in_discussion" || workflowStatus === "quote_sent") return "discussion";
  if (workflowStatus === "accepted" || workflowStatus === "archived") return "accepted";
  if (workflowStatus === "declined") return "declined";
  if (workflowStatus === "expired") return "expired";

  const status = normalizeStatus(request.status);
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

function getLastExchange(request: OwnerServiceRequestRow) {
  const lastRecipient = [...request.recipients]
    .filter((recipient) => recipient.responded_at || recipient.viewed_at)
    .sort((left, right) =>
      String(right.responded_at ?? right.viewed_at).localeCompare(String(left.responded_at ?? left.viewed_at)),
    )[0];

  if (!lastRecipient) return "Aucun échange récent";
  return formatDateTime(lastRecipient.responded_at || lastRecipient.viewed_at);
}

function buildRequestSearchHref(request: OwnerServiceRequestRow) {
  const params = new URLSearchParams();
  if (request.city?.trim()) params.set("city", request.city.trim());
  if (request.postal_code?.trim()) params.set("postalCode", request.postal_code.trim());
  if ((request.requested_services ?? []).length > 0) params.set("services", (request.requested_services ?? []).join(","));
  const query = params.toString();
  return query ? `/dashboard/owner/concierges?${query}` : "/dashboard/owner/concierges";
}

function buildNewRequestSearchHref(form: RequestFormState, services: string[], requestId?: string | null) {
  const params = new URLSearchParams();
  const city = form.city.trim();
  const region = form.region.trim();
  const postalCode = form.postalCode.trim();
  const title = form.title.trim();
  const description = form.description.trim();
  const budgetMax = form.budgetMax.trim();
  const radiusKm = form.radiusKm.trim();

  if (region) params.set("region", region);
  if (city) params.set("city", city);
  if (postalCode) params.set("postalCode", postalCode);
  if (services.length > 0) params.set("services", services.join(","));
  if (budgetMax) params.set("budgetMax", budgetMax);
  if (radiusKm) params.set("radiusKm", radiusKm);
  if (form.propertyKey) params.set("housingId", form.propertyKey);
  if (form.propertyName.trim()) params.set("propertyName", form.propertyName.trim());
  if (form.requestType) params.set("requestType", form.requestType);
  if (title) params.set("requestTitle", title);
  if (description) params.set("requestDescription", description);
  if (form.currency) params.set("requestCurrency", form.currency);
  if (requestId) params.set("requestId", requestId);

  const query = params.toString();
  return query ? `/dashboard/owner/concierges?${query}` : "/dashboard/owner/concierges";
}

function getRequestGuidance(status: RelationStatus, quoteCount: number) {
  if (status === "draft") return "Complétez le besoin, puis contactez les conciergeries.";
  if (status === "sent" || status === "viewed") return "Surveillez les retours ou élargissez la recherche.";
  if (status === "discussion") return quoteCount > 0 ? "Comparez les devis reçus." : "Demandez un devis clair aux conciergeries intéressées.";
  if (status === "accepted") return "Partenaire choisi. Vous pouvez préparer les séjours voyageurs.";
  if (status === "expired") return "Reprenez cette base et relancez la recherche.";
  return "Ajustez votre demande ou relancez une recherche avec d'autres critères.";
}

const milestoneIcons = [FilePenLine, FileText, CheckCircle2, Handshake] as const;

function getRequestMilestones(request: OwnerServiceRequestRow, quotes: OwnerQuoteRow[]) {
  const status = getRelationStatus(request);
  const quoteCount = quotes.length;
  const hasMission = Boolean(request.mission_id);
  const hasAcceptedQuote = quotes.some((quote) => normalizeStatus(quote.status) === "accepted" || Boolean(quote.accepted_at));
  const hasAccepted = status === "accepted" || hasAcceptedQuote || hasMission;
  const steps = [
    { label: "Demande", detail: status === "draft" ? "À compléter" : "Envoyée", done: status !== "draft" },
    { label: "Devis reçus", detail: quoteCount > 0 ? `${quoteCount} devis reçu${quoteCount > 1 ? "s" : ""}` : "En attente", done: quoteCount > 0 },
    { label: "Devis accepté", detail: hasAccepted ? "Validé" : "À choisir", done: hasAccepted },
    { label: "Mission", detail: hasMission ? "Créée" : "Après validation", done: hasMission },
  ];
  const firstTodoIndex = steps.findIndex((step) => !step.done);

  return steps.map((step, index) => ({
    ...step,
    Icon: milestoneIcons[index],
    state: (step.done ? "done" : index === firstTodoIndex ? "active" : "todo") as TimelineStepState,
  }));
}

function getAcceptedQuote(quotes: OwnerQuoteRow[]) {
  return quotes.find((quote) => normalizeStatus(quote.status) === "accepted" || Boolean(quote.accepted_at));
}

function getRequestUsefulFacts(request: OwnerServiceRequestRow, quotes: OwnerQuoteRow[], status: RelationStatus) {
  const facts: Array<{ label: string; value: string; hint?: string; Icon: typeof MapPin }> = [];
  const location = [request.city, request.postal_code].filter(Boolean).join(" ");
  const services = (request.requested_services ?? []).filter(Boolean).slice(0, 3).join(", ");
  const lastExchange = getLastExchange(request);
  const acceptedQuote = getAcceptedQuote(quotes);

  if (status === "draft") {
    if (request.property_name) facts.push({ label: "Logement", value: request.property_name, Icon: ListChecks });
    if (location) facts.push({ label: "Localisation", value: location, Icon: MapPin });
    if (services) facts.push({ label: "Services", value: services, Icon: Sparkles });
    facts.push({ label: "Brouillon", value: formatDate(request.created_at), hint: "Dernière base enregistrée", Icon: FilePenLine });
    return facts.slice(0, 4);
  }

  if (quotes.length > 0) {
    facts.push({
      label: "Devis reçus",
      value: `${quotes.length} proposition${quotes.length > 1 ? "s" : ""}`,
      hint: "À comparer avant validation",
      Icon: FileText,
    });
  }

  if (acceptedQuote) {
    facts.push({
      label: "Devis accepté",
      value: acceptedQuote.quote_number || formatDate(acceptedQuote.accepted_at ?? acceptedQuote.created_at),
      hint: acceptedQuote.accepted_at ? formatDate(acceptedQuote.accepted_at) : undefined,
      Icon: CheckCircle2,
    });
  }

  if (request.mission_id) {
    facts.push({ label: "Mission commerciale", value: "Dossier créé", hint: "Séjours voyageurs à transmettre", Icon: Handshake });
  }

  if (status === "accepted") {
    facts.push({ label: "Partenaire", value: getSelectedConciergeName(request), hint: requestTypeLabels[request.request_type], Icon: Handshake });
  }

  if (location && facts.length < 4) facts.push({ label: "Localisation", value: location, Icon: MapPin });
  if (services && facts.length < 4) facts.push({ label: "Services", value: services, Icon: Sparkles });
  if (lastExchange !== "Aucun échange récent" && facts.length < 4) {
    facts.push({ label: "Dernier échange", value: lastExchange, Icon: CalendarDays });
  }
  if (facts.length < 3) facts.push({ label: "Envoyée", value: formatDate(request.created_at), Icon: Send });

  return facts.slice(0, 4);
}

function getRequestHeaderImage(request: OwnerServiceRequestRow) {
  const services = (request.requested_services ?? []).join(" ").toLowerCase();
  const content = `${services} ${request.title ?? ""} ${request.description ?? ""}`.toLowerCase();

  if (content.includes("accueil") || content.includes("check-in") || content.includes("voyageur")) {
    return "/images/carousel/planetls-card-header-accueil.png";
  }

  if (content.includes("linge") || content.includes("blanch")) {
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

  if (content.includes("jardin") || content.includes("piscin") || content.includes("extérieur") || content.includes("exterieur")) {
    return "/images/carousel/planetls-card-header-exterieur.png";
  }

  if (content.includes("photo") || content.includes("staging") || content.includes("déco") || content.includes("deco")) {
    return "/images/carousel/planetls-card-header-photo.png";
  }

  return "/images/carousel/planetls-card-header-menage.png";
}

function needsMissionDate(request: OwnerServiceRequestRow) {
  const missionWorkflowStatus = normalizeStatus(request.mission_workflow_status);
  return missionWorkflowStatus === "to_schedule" || missionWorkflowStatus === "date_requested" || missionWorkflowStatus === "date_proposed";
}

function getRequestTitleSuggestion(form: RequestFormState) {
  const service = normalizeServices(form.requestedServices)[0] || "gestion conciergerie";
  const property = form.propertyName || "logement";
  return form.city ? `${service} - ${property} - ${form.city}` : `${service} - ${property}`;
}

function getRequestActionRank(request: OwnerServiceRequestRow, quotes: OwnerQuoteRow[]) {
  const status = getRelationStatus(request);
  if (status === "draft") return 0;
  if (quotes.length > 0 && status !== "accepted") return 1;
  if (status === "discussion") return 2;
  if (status === "sent" || status === "viewed") return 3;
  if (status === "accepted" && needsMissionDate(request)) return 4;
  if (status === "accepted") return 5;
  return 6;
}




export default function OwnerRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [housing, setHousing] = useState<OwnerHousingRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [form, setForm] = useState<RequestFormState>(initialForm);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const requestModalRef = useRef<HTMLElement | null>(null);
  const requestReturnFocusRef = useRef<HTMLElement | null>(null);

  const closeRequestModal = useCallback(() => {
    setEditingRequestId(null);
    setForm(initialForm);
    setSuccess(null);
    setIsRequestModalOpen(false);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [requestsResponse, housingResponse, quotesResponse, catalogResponse] = await Promise.all([
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/quotes?limit=100", { cache: "no-store" }),
        fetch("/api/services/services-catalog", { cache: "no-store" }),
      ]);

      const requestsPayload = (await requestsResponse.json()) as RequestsPayload;
      const housingPayload = await housingResponse.json();
      const quotesPayload = await quotesResponse.json();
      const catalogPayload = await catalogResponse.json().catch(() => []);

      if (!requestsResponse.ok) throw new Error(ownerApiError("Impossible de charger les demandes.", requestsPayload?.error));
      if (!housingResponse.ok) throw new Error(ownerApiError("Impossible de charger les logements.", housingPayload?.error));
      if (!quotesResponse.ok) throw new Error(ownerApiError("Impossible de charger les devis.", quotesPayload?.error));

      setRequests(Array.isArray(requestsPayload.items) ? requestsPayload.items : []);
      setHousing(Array.isArray(housingPayload) ? housingPayload : []);
      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
      setServiceCatalog(catalogResponse.ok && Array.isArray(catalogPayload) ? catalogPayload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de charger les demandes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isRequestModalOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => focusFirstModalElement(requestModalRef.current));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRequestModal();
        return;
      }
      trapFocusInModal(event, requestModalRef.current);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      window.requestAnimationFrame(() => requestReturnFocusRef.current?.focus());
    };
  }, [closeRequestModal, isRequestModalOpen]);

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
  const normalizedServices = normalizeServices(form.requestedServices);
  const titleSuggestion = getRequestTitleSuggestion({
    ...form,
    requestedServices: normalizedServices.join(", "),
  });
  const visibleSelectedServices = normalizedServices.slice(0, 8);
  const hiddenSelectedServiceCount = Math.max(normalizedServices.length - visibleSelectedServices.length, 0);
  const existingRequestForSelectedHousing = useMemo(() => {
    if (editingRequestId || !form.propertyKey || form.requestType === "renfort") return null;
    return (
      requests.find(
        (request) => request.request_type !== "renfort" && String(request.property_housing_id ?? "") === form.propertyKey,
      ) ?? null
    );
  }, [editingRequestId, form.propertyKey, form.requestType, requests]);
  const totalRequestCount = requests.length;
  const activeRequestCount = requests.filter((request) => ["draft", "sent", "viewed", "discussion"].includes(getRelationStatus(request))).length;
  const waitingRequestCount = requests.filter((request) => ["sent", "viewed"].includes(getRelationStatus(request))).length;
  const requestsWithQuotesCount = requests.filter((request) => (quotesByRequestId.get(request.id)?.length ?? 0) > 0).length;
  const acceptedRequestCount = requests.filter((request) => getRelationStatus(request) === "accepted").length;
  const nextActionRequest = useMemo(() => {
    return [...requests]
      .filter((request) => !["declined", "expired"].includes(getRelationStatus(request)))
      .sort((left, right) => {
        const leftQuotes = quotesByRequestId.get(left.id) ?? [];
        const rightQuotes = quotesByRequestId.get(right.id) ?? [];
        const rankDiff = getRequestActionRank(left, leftQuotes) - getRequestActionRank(right, rightQuotes);
        if (rankDiff !== 0) return rankDiff;
        return new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime();
      })[0] ?? null;
  }, [quotesByRequestId, requests]);
  const nextActionQuotes = nextActionRequest ? quotesByRequestId.get(nextActionRequest.id) ?? [] : [];
  const nextActionStatus = nextActionRequest ? getRelationStatus(nextActionRequest) : null;
  const nextActionMilestones = nextActionRequest ? getRequestMilestones(nextActionRequest, nextActionQuotes) : [];
  const nextActionStep = nextActionMilestones.find((step) => step.state === "active") ?? nextActionMilestones.at(-1);
  const ratio = (value: number) => (totalRequestCount > 0 ? Math.round((value / totalRequestCount) * 100) : 0);
  const overviewCards = [
    {
      label: "En cours",
      value: activeRequestCount,
      detail: "Demandes à suivre",
      Icon: Clock3,
      percent: ratio(activeRequestCount),
    },
    {
      label: "En attente",
      value: waitingRequestCount,
      detail: "Retours concierge",
      Icon: Send,
      percent: ratio(waitingRequestCount),
    },
    {
      label: "Avec devis",
      value: requestsWithQuotesCount,
      detail: `${quotes.length} devis au total`,
      Icon: FileText,
      percent: ratio(requestsWithQuotesCount),
    },
    {
      label: "Validées",
      value: acceptedRequestCount,
      detail: "Partenaires choisis",
      Icon: CheckCircle2,
      percent: ratio(acceptedRequestCount),
    },
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

  function handleRequestTypeChange(requestType: RequestKind) {
    const defaults = getCollaborationDefaults(requestType);
    setForm((current) => ({
      ...current,
      requestType,
      collaborationType: defaults.collaborationType,
      collaborationFrequency: defaults.collaborationFrequency,
      responsibilityLevel: defaults.responsibilityLevel,
    }));
  }

  function handleEditRequest(request: OwnerServiceRequestRow) {
    requestReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditingRequestId(request.id);
    setForm({
      propertyKey: request.property_housing_id ? String(request.property_housing_id) : "",
      propertyName: request.property_name ?? "",
      requestType: request.request_type,
      ...getCollaborationDefaults(request.request_type),
      estimatedDuration: "",
      responsibilityLevel: getCollaborationDefaults(request.request_type).responsibilityLevel,
      desiredDate: request.desired_date ? request.desired_date.slice(0, 10) : "",
      propertyConstraints: "",
      title: request.title ?? "",
      region: request.region ?? "",
      city: request.city ?? "",
      postalCode: request.postal_code ?? "",
      radiusKm: typeof request.radius_km === "number" ? String(request.radius_km) : "",
      requestedServices: (request.requested_services ?? []).join(", "),
      budgetMax: typeof request.budget_max === "number" ? String(request.budget_max) : "",
      currency: request.currency ?? "EUR",
      description: request.description ?? "",
    });
    setSuccess(null);
    setError(null);
    setIsRequestModalOpen(true);
  }

  function cancelEditRequest() {
    closeRequestModal();
  }

  function openNewRequestModal() {
    requestReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditingRequestId(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setIsRequestModalOpen(true);
  }

  function handleUseExistingRequest(request: OwnerServiceRequestRow) {
    const status = getRelationStatus(request);
    if (status === "draft") {
      handleEditRequest(request);
      return;
    }

    setSearchTerm(request.property_name || request.title);
    setStatusFilter(status);
    closeRequestModal();
    setSuccess("Ce logement a déjà une demande. Le suivi existant est affiché ci-dessous.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const services = normalizeServices(form.requestedServices);
    if (existingRequestForSelectedHousing) {
      handleUseExistingRequest(existingRequestForSelectedHousing);
      return;
    }
    if (!form.title.trim()) {
      setError("Ajoutez un titre clair à votre demande.");
      return;
    }
    if (services.length === 0) {
      setError("Ajoutez au moins un service recherché.");
      return;
    }

    if (!editingRequestId) {
      router.push(buildNewRequestSearchHref(form, services));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const response = await fetch("/api/service-requests", {
        method: editingRequestId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRequestId,
          housing_id: form.propertyKey || null,
          request_type: form.requestType,
          owner_goal:
            form.requestType === "durable"
              ? "regular_support"
              : form.requestType === "renfort"
                ? "replace_current"
                : "one_off_quote",
          collaboration_type: form.collaborationType,
          collaboration_frequency: form.collaborationFrequency,
          estimated_duration: form.estimatedDuration.trim() || null,
          responsibility_level: form.responsibilityLevel,
          desired_date: form.desiredDate || null,
          property_constraints: form.propertyConstraints.trim() || null,
          title: form.title.trim(),
          description: form.description.trim() || null,
          property_name: form.propertyName.trim() || null,
          requested_services: services,
          region: form.region.trim() || null,
          city: form.city.trim() || null,
          postal_code: form.postalCode.trim() || null,
          radius_km: form.radiusKm ? Number(form.radiusKm) : null,
          urgency: false,
          budget_max: form.budgetMax ? Number(form.budgetMax) : null,
          currency: form.currency,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          ownerApiError(
            editingRequestId ? "Impossible de modifier la demande." : "Impossible de créer la demande.",
            payload?.error,
          ),
        );
      }
      setSuccess(editingRequestId ? "Demande mise à jour. Vous pouvez continuer le suivi." : "Demande créée. Vous pouvez maintenant contacter des conciergeries et suivre les retours.");
      setEditingRequestId(null);
      setForm(initialForm);
      setIsRequestModalOpen(false);
      router.push(buildNewRequestSearchHref(form, services, editingRequestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de créer la demande."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRequest(request: OwnerServiceRequestRow) {
    if (request.recipients.length > 0) {
      setError("Cette demande ne peut plus être supprimée : une conciergerie a déjà été contactée.");
      return;
    }

    const confirmed = window.confirm("Supprimer cette demande ? Cette action est définitive.");
    if (!confirmed) return;

    try {
      setDeletingRequestId(request.id);
      setError(null);
      setSuccess(null);
      const response = await fetch(`/api/service-requests?id=${encodeURIComponent(request.id)}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(ownerApiError("Impossible de supprimer la demande.", payload?.error));
      }
      setSuccess("Demande supprimée.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de supprimer la demande."));
    } finally {
      setDeletingRequestId(null);
    }
  }
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Demandes</p>
          <h1>Suivi des recherches concierge</h1>
          <p>Retrouvez l&apos;état de chaque demande, les devis reçus et la prochaine action à faire.</p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryLink} onClick={openNewRequestModal}>
              <Plus size={16} aria-hidden="true" /> Nouvelle demande
            </button>
            <ButtonLink href="/dashboard/owner/concierges" variant="secondary">
              <Search size={16} aria-hidden="true" /> Conciergeries
            </ButtonLink>
          </div>
        </div>
      </header>

      <OwnerJourneyRail activeStep="request" />

      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {loading ? <p className={styles.loadingHint}>Chargement des demandes...</p> : null}

      <section className={styles.overviewGrid} aria-label="État des demandes">
        {overviewCards.map((card) => {
          const Icon = card.Icon;
          const chartStyle = { "--progress": `${card.percent * 3.6}deg` } as CSSProperties;

          return (
            <article key={card.label} className={styles.overviewCard}>
              <span className={styles.progressChart} style={chartStyle} aria-label={`${card.percent}%`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
                <p>{card.detail}</p>
              </div>
            </article>
          );
        })}
        <article className={styles.nextActionCard}>
          <div className={styles.nextActionTop}>
            <span className={styles.eyebrow}>Prochaine action</span>
            {nextActionStatus ? <span className={`${styles.statusPill} ${statusMeta[nextActionStatus].className}`}>{statusMeta[nextActionStatus].label}</span> : null}
          </div>
          {nextActionRequest && nextActionStep ? (
            <>
              <h2>{nextActionRequest.title}</h2>
              <p>{nextActionStep.detail}</p>
              <div className={styles.nextActionMeta}>
                {nextActionRequest.property_name ? <span>{nextActionRequest.property_name}</span> : null}
                {nextActionRequest.city ? <span>{nextActionRequest.city}</span> : null}
                {nextActionQuotes.length > 0 ? <span>{nextActionQuotes.length} devis</span> : null}
              </div>
            </>
          ) : (
            <>
              <h2>Aucune action en attente</h2>
              <p>Les nouvelles demandes apparaîtront ici.</p>
            </>
          )}
        </article>
      </section>

      <section className={styles.searchWorkspace} aria-label="Filtres des demandes">
        <div className={styles.filtersPanel}>
          <label className={styles.searchField}>
            <Search size={17} aria-hidden="true" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Concierge, ville, logement ou service..." />
          </label>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrer par statut">
            <option value="all">Tous statuts</option>
            <option value="draft">Brouillon</option>
            <option value="sent">En attente</option>
            <option value="viewed">Consultée</option>
            <option value="discussion">Discussion</option>
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
            <option value="responses">Réponses</option>
            <option value="quotes">Devis</option>
            <option value="oldest">Plus ancien</option>
          </Select>
        </div>
      </section>

      {isRequestModalOpen ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) cancelEditRequest();
        }}>
          <section
            ref={requestModalRef}
            className={styles.requestModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-modal-title"
            tabIndex={-1}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>{editingRequestId ? "Modifier la recherche" : "Recherche concierge"}</p>
                <h2 id="request-modal-title">{editingRequestId ? "Reprendre la recherche" : "Préparer la recherche concierge"}</h2>
              </div>
              <button type="button" className={styles.iconButton} onClick={cancelEditRequest} aria-label="Fermer">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
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
          {existingRequestForSelectedHousing ? (
            <div className={`${styles.existingRequestNotice} ${styles.fullField}`} role="status">
              <div>
                <strong>Une demande existe déjà pour ce logement</strong>
                <span>
                  {statusMeta[getRelationStatus(existingRequestForSelectedHousing)].label} · {existingRequestForSelectedHousing.title}
                </span>
              </div>
              <button
                type="button"
                className={styles.inlineAction}
                onClick={() => handleUseExistingRequest(existingRequestForSelectedHousing)}
              >
                <FilePenLine size={15} /> {getRelationStatus(existingRequestForSelectedHousing) === "draft" ? "Compléter" : "Voir le suivi"}
              </button>
            </div>
          ) : null}
          <label className={styles.field}>
            <span>Type de recherche</span>
            <Select value={form.requestType} onChange={(event) => handleRequestTypeChange(event.target.value as RequestKind)}>
              <option value="ponctuel">Besoin ponctuel</option>
              <option value="renfort">Renfort / remplacement</option>
              <option value="durable">Collaboration durable</option>
            </Select>
          </label>
          <label className={styles.field}>
            <span>Mode de collaboration</span>
            <Select value={form.collaborationType} onChange={(event) => setForm((current) => ({ ...current, collaborationType: event.target.value }))}>
              <option value="one_off">Mission ponctuelle</option>
              <option value="regular">Collaboration régulière</option>
              <option value="partial_management">Gestion partielle</option>
              <option value="full_management">Gestion complète</option>
              <option value="temporary_replacement">Remplacement temporaire</option>
              <option value="trial">Test avant engagement</option>
              <option value="onboarding">Accompagnement au démarrage</option>
            </Select>
          </label>
          <label className={styles.field}>
            <span>Rythme prévu</span>
            <Select value={form.collaborationFrequency} onChange={(event) => setForm((current) => ({ ...current, collaborationFrequency: event.target.value }))}>
              <option value="once">Une seule fois</option>
              <option value="weekly">Chaque semaine</option>
              <option value="monthly">Chaque mois</option>
              <option value="seasonal">Selon la saison</option>
              <option value="year_round">Toute l'année</option>
              <option value="unknown">À définir ensemble</option>
            </Select>
          </label>
          <label className={styles.field}>
            <span>Responsabilité attendue</span>
            <Select value={form.responsibilityLevel} onChange={(event) => setForm((current) => ({ ...current, responsibilityLevel: event.target.value }))}>
              <option value="low">Exécution de tâches précises</option>
              <option value="shared">Pilotage partagé</option>
              <option value="full">Pilotage opérationnel complet</option>
              <option value="unknown">À cadrer ensemble</option>
            </Select>
          </label>
          <label className={styles.field}>
            <span>Date de démarrage souhaitée</span>
            <Input type="date" value={form.desiredDate} onChange={(event) => setForm((current) => ({ ...current, desiredDate: event.target.value }))} />
          </label>
          <label className={styles.field}>
            <span>Durée ou période estimée</span>
            <Input value={form.estimatedDuration} onChange={(event) => setForm((current) => ({ ...current, estimatedDuration: event.target.value }))} placeholder="Ex : saison été, 6 mois, toute l'année" />
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
            <span>Région</span>
            <Input value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} placeholder="Île-de-France, Occitanie..." />
          </label>
          <label className={styles.field}>
            <span>Ville</span>
            <Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Paris" />
          </label>
          <label className={styles.field}>
            <span>Code postal</span>
            <Input value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} inputMode="numeric" />
          </label>
          <label className={styles.field}>
            <span>Rayon de recherche</span>
            <div className={styles.amountRow}>
              <Input type="number" min="0" max="100" step="5" value={form.radiusKm} onChange={(event) => setForm((current) => ({ ...current, radiusKm: event.target.value }))} placeholder="Libre" inputMode="numeric" />
              <span className={styles.unitBox}>km</span>
            </div>
          </label>
          <div className={`${styles.field} ${styles.fullField}`}>
            <span>Services recherchés</span>
            {serviceCatalog.length > 0 ? (
              <ServiceCatalogPicker
                items={serviceCatalog}
                selected={normalizedServices}
                onChange={(selected) => setForm((current) => ({ ...current, requestedServices: selected.join(", ") }))}
                mode="request"
              />
            ) : null}
            {serviceCatalog.length === 0 ? (
              <Input value={form.requestedServices} onChange={(event) => setForm((current) => ({ ...current, requestedServices: event.target.value }))} placeholder="Ajouter un service libre, séparé par une virgule..." />
            ) : null}
            {normalizedServices.length > 0 ? (
              <div className={styles.selectedServicesSummary}>
                <span>{normalizedServices.length} service{normalizedServices.length > 1 ? "s" : ""} sélectionné{normalizedServices.length > 1 ? "s" : ""}</span>
                <div className={styles.chipRow}>
                  {visibleSelectedServices.map((service) => <span key={service} className={styles.serviceChip}>{service}</span>)}
                  {hiddenSelectedServiceCount > 0 ? <span className={styles.serviceChip}>+{hiddenSelectedServiceCount}</span> : null}
                </div>
              </div>
            ) : null}
          </div>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>Détails utiles</span>
            <Textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Contexte du logement, services attendus, contraintes de collaboration..." />
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>Contraintes à transmettre à la conciergerie</span>
            <Textarea rows={3} value={form.propertyConstraints} onChange={(event) => setForm((current) => ({ ...current, propertyConstraints: event.target.value }))} placeholder="Accès, clés, horaires, linge, équipement fragile, règles du logement..." />
          </label>
          <div className={`${styles.formActions} ${styles.fullField}`}>
            <Button type="submit" disabled={submitting}>
              <Search size={16} aria-hidden="true" /> {submitting ? "Enregistrement..." : editingRequestId ? "Enregistrer et rechercher" : "Continuer vers les conciergeries"}
            </Button>
            {editingRequestId ? (
              <Button type="button" variant="secondary" onClick={cancelEditRequest}>
                Annuler
              </Button>
            ) : null}
          </div>
        </form>
          </section>
        </div>
      ) : null}

      <RequestSection
        id="demandes-en-cours"
        title="À suivre"
        emptyTitle="Aucune demande en cours"
        emptyText="Créez une demande pour rechercher une conciergerie."
        requests={currentRequests}
        quotesByRequestId={quotesByRequestId}
        onEditRequest={handleEditRequest}
        onDeleteRequest={handleDeleteRequest}
        deletingRequestId={deletingRequestId}
      />

      <RequestSection
        id="demandes-acceptees"
        title="Validées"
        emptyTitle="Aucune demande acceptée"
        emptyText="Les validations apparaîtront ici."
        requests={acceptedRequests}
        quotesByRequestId={quotesByRequestId}
        onEditRequest={handleEditRequest}
        onDeleteRequest={handleDeleteRequest}
        deletingRequestId={deletingRequestId}
        hideWhenEmpty
      />
      <RequestSection
        id="demandes-refusees"
        title="Clôturées"
        emptyTitle="Aucune demande clôturée"
        emptyText="Les refus et expirations apparaîtront ici."
        requests={declinedRequests}
        quotesByRequestId={quotesByRequestId}
        onEditRequest={handleEditRequest}
        onDeleteRequest={handleDeleteRequest}
        deletingRequestId={deletingRequestId}
        hideWhenEmpty
      />
    </div>
  );
}

function RequestSection({
  id,
  title,
  emptyTitle,
  emptyText,
  requests,
  quotesByRequestId,
  onEditRequest,
  onDeleteRequest,
  deletingRequestId,
  hideWhenEmpty = false,
}: {
  id: string;
  title: string;
  emptyTitle: string;
  emptyText: string;
  requests: OwnerServiceRequestRow[];
  quotesByRequestId: Map<string, OwnerQuoteRow[]>;
  onEditRequest: (request: OwnerServiceRequestRow) => void;
  onDeleteRequest: (request: OwnerServiceRequestRow) => void;
  deletingRequestId: string | null;
  hideWhenEmpty?: boolean;
}) {
  if (hideWhenEmpty && requests.length === 0) return null;

  return (
    <section className={styles.sectionPanel} id={id}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <span className={styles.sectionCount}>{requests.length}</span>
      </div>
      {requests.length === 0 ? <EmptyPanel title={emptyTitle} text={emptyText} /> : null}
      <div className={styles.requestGrid}>
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            quotes={quotesByRequestId.get(request.id) ?? []}
            onEditRequest={onEditRequest}
            onDeleteRequest={onDeleteRequest}
            deleting={deletingRequestId === request.id}
          />
        ))}
      </div>
    </section>
  );
}

function RequestCard({
  request,
  quotes,
  onEditRequest,
  onDeleteRequest,
  deleting,
}: {
  request: OwnerServiceRequestRow;
  quotes: OwnerQuoteRow[];
  onEditRequest: (request: OwnerServiceRequestRow) => void;
  onDeleteRequest: (request: OwnerServiceRequestRow) => void;
  deleting: boolean;
}) {
  const relationStatus = getRelationStatus(request);
  const meta = statusMeta[relationStatus];
  const names = getConciergeNames(request);
  const displayName = relationStatus === "accepted" ? getSelectedConciergeName(request) : names[0] || "Conciergeries";
  const actorDetail = names.length > 0
    ? `${names.length} conciergerie${names.length > 1 ? "s" : ""} contactée${names.length > 1 ? "s" : ""}`
    : "Aucune conciergerie contactée";
  const milestones = getRequestMilestones(request, quotes);
  const usefulFacts = getRequestUsefulFacts(request, quotes, relationStatus);
  const headerImage = getRequestHeaderImage(request);
  const currentStep = milestones.find((step) => step.state === "active") ?? milestones[milestones.length - 1];
  const hasQuotes = quotes.length > 0;
  const hasMission = Boolean(request.mission_id);
  const shouldChooseDate = hasMission && needsMissionDate(request);
  const isDraft = relationStatus === "draft";
  const isClosed = relationStatus === "declined" || relationStatus === "expired";
  const canDelete = request.recipients.length === 0;

  return (
    <ServiceRequestCard
      title={request.title}
      actorName={displayName}
      actorDetail={actorDetail}
      statusLabel={meta.label}
      statusTone={relationStatus}
      typeLabel={requestTypeLabels[request.request_type]}
      urgent={request.urgency}
      currentStepLabel="Prochaine étape"
      currentStepDetail={currentStep.detail}
      guidance={getRequestGuidance(relationStatus, quotes.length)}
      headerImage={headerImage}
      facts={usefulFacts}
      milestones={milestones}
      chips={
        <>
          <span className={styles.serviceChip}>{requestTypeLabels[request.request_type]}</span>
          {quotes.length > 0 ? <span className={styles.serviceChip}>{quotes.length} devis</span> : null}
        </>
      }
      actions={
        <>
          {isDraft ? (
            <button type="button" className={styles.inlineAction} onClick={() => onEditRequest(request)}>
              <FilePenLine size={15} /> Compléter la demande
            </button>
          ) : shouldChooseDate ? (
            <ButtonLink href={`/dashboard/owner/missions/${encodeURIComponent(request.mission_id ?? "")}`} variant="secondary" size="sm">
              <CalendarDays size={15} /> Choisir une date
            </ButtonLink>
          ) : hasMission ? (
            <ButtonLink href={`/dashboard/owner/missions/${encodeURIComponent(request.mission_id ?? "")}`} variant="secondary" size="sm">
              <Route size={15} /> Voir la mission commerciale
            </ButtonLink>
          ) : relationStatus === "accepted" ? (
            <ButtonLink
              href={`/dashboard/owner/missions/voyageurs?request=${encodeURIComponent(request.id)}`}
              variant="secondary"
              size="sm"
            >
              <Plus size={15} /> Ajouter un séjour
            </ButtonLink>
          ) : hasQuotes ? (
            <ButtonLink href={`/dashboard/owner/devis?request=${encodeURIComponent(request.id)}`} variant="secondary" size="sm">
              <Eye size={15} /> Comparer les devis
            </ButtonLink>
          ) : isClosed ? (
            <button type="button" className={styles.inlineAction} onClick={() => onEditRequest(request)}>
              <FilePenLine size={15} /> Reprendre la base
            </button>
          ) : (
            <ButtonLink href={buildRequestSearchHref(request)} variant="secondary" size="sm">
              <Search size={15} /> Trouver des conciergeries
            </ButtonLink>
          )}
          {canDelete ? (
            <button
              type="button"
              className={`${styles.inlineAction} ${styles.dangerAction}`}
              onClick={() => onDeleteRequest(request)}
              disabled={deleting}
            >
              <Trash2 size={15} /> {deleting ? "Suppression..." : "Supprimer"}
            </button>
          ) : null}
        </>
      }
    />
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
