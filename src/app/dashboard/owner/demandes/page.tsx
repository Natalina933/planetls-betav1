"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  X,
} from "lucide-react";
import { Button, ButtonLink, Input, Select, Textarea } from "@/components/ui";
import { OwnerJourneyRail } from "@/features/owner-dashboard";
import { ServiceRequestCard } from "@/features/service-requests";
import { ownerApiError } from "../ownerFeedback";
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



type RequestsPayload = {
  items?: OwnerServiceRequestRow[];
  error?: string;
};


type RequestFormState = {
  propertyKey: string;
  propertyName: string;
  requestType: RequestKind;
  title: string;
  city: string;
  postalCode: string;
  requestedServices: string;
  budgetMax: string;
  currency: string;
  description: string;
};

const initialForm: RequestFormState = {
  propertyKey: "",
  propertyName: "",
  requestType: "ponctuel",
  title: "",
  city: "",
  postalCode: "",
  requestedServices: "",
  budgetMax: "",
  currency: "EUR",
  description: "",
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


function getQuoteRequestId(quote: OwnerQuoteRow) {
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

function getRequestGuidance(status: RelationStatus, quoteCount: number) {
  if (status === "draft") return "Complétez le besoin commercial, puis contactez une ou plusieurs conciergeries.";
  if (status === "sent" || status === "viewed") return "Attendez les retours ou élargissez la recherche si besoin.";
  if (status === "discussion") return quoteCount > 0 ? "Comparez les devis reçus avant de choisir votre partenaire." : "Échangez avec les conciergeries intéressées pour obtenir un devis clair.";
  if (status === "accepted") return "Le partenaire est choisi. Créez ensuite la mission voyageur dans l’espace Missions.";
  if (status === "expired") return "Reprenez cette base et relancez une recherche plus ciblée.";
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
    { label: "Demande", detail: status === "draft" ? "Demande à continuer" : "Demande envoyée", done: status !== "draft" },
    { label: "Devis reçus", detail: quoteCount > 0 ? `${quoteCount} devis reçu${quoteCount > 1 ? "s" : ""}` : "En attente de devis", done: quoteCount > 0 },
    { label: "Devis accepté", detail: hasAccepted ? "Devis validé" : "Choix à confirmer", done: hasAccepted },
    { label: "Mission", detail: hasMission ? "Mission conclue" : "Mission à lancer", done: hasMission },
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
    facts.push({ label: "Mission", value: "Mission conclue", hint: "Suivi disponible", Icon: Handshake });
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

function getRequestTitleSuggestion(form: RequestFormState) {
  const service = normalizeServices(form.requestedServices)[0] || "gestion conciergerie";
  const property = form.propertyName || "logement";
  return form.city ? `${service} - ${property} - ${form.city}` : `${service} - ${property}`;
}




export default function OwnerRequestsPage() {
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [housing, setHousing] = useState<OwnerHousingRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [requestsResponse, housingResponse, quotesResponse] = await Promise.all([
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/quotes?limit=100", { cache: "no-store" }),
      ]);

      const requestsPayload = (await requestsResponse.json()) as RequestsPayload;
      const housingPayload = await housingResponse.json();
      const quotesPayload = await quotesResponse.json();

      if (!requestsResponse.ok) throw new Error(ownerApiError("Impossible de charger les demandes.", requestsPayload?.error));
      if (!housingResponse.ok) throw new Error(ownerApiError("Impossible de charger les logements.", housingPayload?.error));
      if (!quotesResponse.ok) throw new Error(ownerApiError("Impossible de charger les devis.", quotesPayload?.error));

      setRequests(Array.isArray(requestsPayload.items) ? requestsPayload.items : []);
      setHousing(Array.isArray(housingPayload) ? housingPayload : []);
      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setEditingRequestId(null);
      setForm(initialForm);
      setSuccess(null);
      setIsRequestModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRequestModalOpen]);

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
  const titleSuggestion = getRequestTitleSuggestion(form);
  const normalizedServices = normalizeServices(form.requestedServices);

  function handleHousingChange(value: string) {
    const selected = housingOptions.find((item) => item.key === value);
    setForm((current) => ({
      ...current,
      propertyKey: value,
      propertyName: selected?.label || "",
      city: current.city || selected?.city || "",
    }));
  }

  function handleEditRequest(request: OwnerServiceRequestRow) {
    setEditingRequestId(request.id);
    setForm({
      propertyKey: request.property_id ? String(request.property_id) : "",
      propertyName: request.property_name ?? "",
      requestType: request.request_type,
      title: request.title ?? "",
      city: request.city ?? "",
      postalCode: request.postal_code ?? "",
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
    setEditingRequestId(null);
    setForm(initialForm);
    setSuccess(null);
    setIsRequestModalOpen(false);
  }

  function openNewRequestModal() {
    setEditingRequestId(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setIsRequestModalOpen(true);
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
        method: editingRequestId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRequestId,
          request_type: form.requestType,
          title: form.title.trim(),
          description: form.description.trim() || null,
          property_name: form.propertyName.trim() || null,
          requested_services: services,
          city: form.city.trim() || null,
          postal_code: form.postalCode.trim() || null,
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
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de créer la demande."));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Centre de relation conciergeries</p>
          <h1>Demandes de mise en relation</h1>
          <p>Recherchez une conciergerie, comparez les retours, puis transformez le bon devis en mission.</p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryLink} onClick={openNewRequestModal}>
            <Plus size={16} aria-hidden="true" /> Lancer une recherche
            </button>
            <ButtonLink href="/dashboard/owner/concierges" variant="secondary">
              <Search size={16} aria-hidden="true" /> Explorer les conciergeries
            </ButtonLink>
          </div>
        </div>
      </header>

      <OwnerJourneyRail activeStep="request" />

      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {loading ? <p className={styles.loadingHint}>Chargement des demandes...</p> : null}

      <section className={styles.searchWorkspace} aria-label="Recherche concierge">
        <div className={styles.searchWorkspaceHeader}>
          <div>
            <p className={styles.eyebrow}>Recherche concierge</p>
            <h2>Demandes et retours</h2>
          </div>
          <button type="button" className={styles.primaryLink} onClick={openNewRequestModal}>
            <Plus size={16} aria-hidden="true" /> Lancer une recherche
          </button>
        </div>
        <div className={styles.filtersPanel}>
          <label className={styles.searchField}>
            <Search size={17} aria-hidden="true" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Concierge, ville, logement ou service..." />
          </label>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrer par statut">
            <option value="all">Tous statuts</option>
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
          <section className={styles.requestModal} role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>{editingRequestId ? "Modifier la recherche" : "Recherche concierge"}</p>
                <h2 id="request-modal-title">{editingRequestId ? "Reprendre la recherche" : "Lancer une recherche concierge"}</h2>
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
          <label className={styles.field}>
            <span>Type de recherche</span>
            <Select value={form.requestType} onChange={(event) => setForm((current) => ({ ...current, requestType: event.target.value as RequestKind }))}>
              <option value="ponctuel">Besoin ponctuel</option>
              <option value="renfort">Renfort / remplacement</option>
              <option value="durable">Collaboration durable</option>
            </Select>
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
            <Input value={form.requestedServices} onChange={(event) => setForm((current) => ({ ...current, requestedServices: event.target.value }))} placeholder="ménage, linge, relation voyageurs, maintenance..." />
            {normalizedServices.length > 0 ? (
              <div className={styles.chipRow}>
                {normalizedServices.map((service) => <span key={service} className={styles.serviceChip}>{service}</span>)}
              </div>
            ) : null}
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>Détails utiles</span>
            <Textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Contexte du logement, services attendus, contraintes de collaboration..." />
          </label>
          <div className={`${styles.formActions} ${styles.fullField}`}>
            <Button type="submit" disabled={submitting}>
              {editingRequestId ? <Send size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />} {submitting ? "Enregistrement..." : editingRequestId ? "Enregistrer et continuer" : "Enregistrer la recherche"}
            </Button>
            {editingRequestId ? (
              <Button type="button" variant="secondary" onClick={cancelEditRequest}>
                Annuler
              </Button>
            ) : null}
            <ButtonLink href="/dashboard/owner/concierges" variant="secondary">
              <Search size={16} aria-hidden="true" /> Explorer les conciergeries
            </ButtonLink>
          </div>
        </form>
          </section>
        </div>
      ) : null}

      <RequestSection
        id="demandes-en-cours"
        eyebrow="Demandes en cours"
        title="Suivre les conciergeries contactées"
        description="Chaque carte montre l'état de la relation, les retours reçus et la progression vers un devis."
        emptyTitle="Aucune demande en cours"
        emptyText="Les demandes envoyées ou en discussion apparaîtront ici."
        requests={currentRequests}
        quotesByRequestId={quotesByRequestId}
        onEditRequest={handleEditRequest}
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
        onEditRequest={handleEditRequest}
      />
<RequestSection
        id="demandes-refusees"
        eyebrow="Demandes refusées"
        title="Demandes clôturées ou expirées"
        description="Gardez une trace des recherches non abouties pour comprendre vos zones ou services moins couverts."
        emptyTitle="Aucune demande refusée"
        emptyText="Les refus et expirations apparaîtront ici."
        requests={declinedRequests}
        quotesByRequestId={quotesByRequestId}
        onEditRequest={handleEditRequest}
      />
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
  onEditRequest,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyText: string;
  requests: OwnerServiceRequestRow[];
  quotesByRequestId: Map<string, OwnerQuoteRow[]>;
  onEditRequest: (request: OwnerServiceRequestRow) => void;
}) {
  return (
    <section className={styles.sectionPanel} id={id}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      {requests.length === 0 ? <EmptyPanel title={emptyTitle} text={emptyText} /> : null}
      <div className={styles.requestGrid}>
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} quotes={quotesByRequestId.get(request.id) ?? []} onEditRequest={onEditRequest} />
        ))}
      </div>
    </section>
  );
}

function RequestCard({
  request,
  quotes,
  onEditRequest,
}: {
  request: OwnerServiceRequestRow;
  quotes: OwnerQuoteRow[];
  onEditRequest: (request: OwnerServiceRequestRow) => void;
}) {
  const relationStatus = getRelationStatus(request);
  const meta = statusMeta[relationStatus];
  const names = getConciergeNames(request);
  const displayName = names[0] || "Conciergeries contactées";
  const milestones = getRequestMilestones(request, quotes);
  const usefulFacts = getRequestUsefulFacts(request, quotes, relationStatus);
  const headerImage = getRequestHeaderImage(request);
  const currentStep = milestones.find((step) => step.state === "active") ?? milestones[milestones.length - 1];
  const hasQuotes = quotes.length > 0;
  const hasMission = Boolean(request.mission_id);
  const isDraft = relationStatus === "draft";
  const isClosed = relationStatus === "declined" || relationStatus === "expired";

  return (
    <ServiceRequestCard
      title={request.title}
      actorName={displayName}
      actorDetail={`${displayName}${names.length > 1 ? ` +${names.length - 1}` : ""}`}
      statusLabel={meta.label}
      statusTone={relationStatus}
      typeLabel={requestTypeLabels[request.request_type]}
      urgent={request.urgency}
      summary={meta.detail}
      currentStepDetail={currentStep.detail}
      guidance={getRequestGuidance(relationStatus, quotes.length)}
      headerImage={headerImage}
      facts={usefulFacts}
      milestones={milestones}
      chips={
        <>
          <span className={styles.serviceChip}>{requestTypeLabels[request.request_type]}</span>
          {request.urgency ? <span className={styles.warningChip}>Urgent</span> : null}
          {quotes.length > 0 ? <span className={styles.serviceChip}>{quotes.length} devis</span> : null}
        </>
      }
      actions={
        <>
          {isDraft ? (
            <button type="button" className={styles.inlineAction} onClick={() => onEditRequest(request)}>
              <FilePenLine size={15} /> Continuer le brouillon
            </button>
          ) : hasMission ? (
            <ButtonLink href={`/dashboard/owner/missions/${encodeURIComponent(request.mission_id ?? "")}`} variant="secondary" size="sm">
              <Route size={15} /> Voir la mission
            </ButtonLink>
          ) : relationStatus === "accepted" ? (
            <ButtonLink href="/dashboard/owner/missions/voyageurs" variant="secondary" size="sm">
              <Plus size={15} /> Créer une mission voyageur
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
