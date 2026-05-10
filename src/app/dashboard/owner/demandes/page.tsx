"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  CircleDollarSign,
  Eye,
  FileText,
  MapPin,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import pageStyles from "./OwnerRequestsPage.module.scss";
import {
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Input,
  SearchBar,
  Select,
  Textarea,
} from "@/components/ui";
import ServiceCatalogSelector from "@/app/components/ui/ServiceCatalogSelector/ServiceCatalogSelector";
import { EmptyState } from "@/features/shared/components/EmptyState/EmptyState";
import { OwnerRequestSummaryCard } from "@/features/owner-dashboard";
import { loadOwnerConciergeSearchAlerts, type OwnerConciergeSearchAlert } from "../searchAlerts";

// --- Types ---
type OwnerHousingRow = {
  id: number | string;
  nom_logement?: string | null;
  ville?: string | null;
};

type OwnerServiceRequestRecipient = {
  id: string;
  status: string;
  concierge_name?: string | null;
  responded_at?: string | null;
  viewed_at?: string | null;
};

type OwnerServiceRequestRow = {
  id: string;
  title: string;
  description?: string | null;
  request_type: "ponctuel" | "renfort" | "durable";
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
  urgency?: boolean;
  created_at?: string | null;
  recipients: OwnerServiceRequestRecipient[];
};

type OwnerQuoteRow = {
  id: string;
  status: string | null;
  metadata?: Record<string, unknown> | null;
};

type CatalogServiceItem = {
  id: number;
  category: string;
  service: string;
  description?: string | null;
};

type OwnerRequestsPayload = {
  items?: OwnerServiceRequestRow[];
  error?: string;
};

type RequestFormState = {
  propertyKey: string;
  propertyName: string;
  requestType: "ponctuel" | "renfort" | "durable";
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

type RequestQuoteSummary = {
  total: number;
  pending: number;
  accepted: number;
  closed: number;
};
type RequestRecipientMetrics = {
  total: number;
  viewed: number;
  interested: number;
  quoted: number;
  selected: number;
  declined: number;
  replied: number;
};

// --- État initial ---
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

// --- Utilitaires ---
const currencyOptions = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "$" },
  { value: "GBP", label: "GBP" },
  { value: "CHF", label: "CHF" },
] as const;

function formatDateTime(value: string | null | undefined): string {
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

function formatAmount(value: number | null | undefined, currency = "EUR"): string {
  if (typeof value !== "number") return "Sur devis";
  return `${value.toFixed(0)} ${currency}`;
}

function getRequestTypeLabel(value: OwnerServiceRequestRow["request_type"]): string {
  if (value === "durable") return "Besoin durable";
  if (value === "renfort") return "Renfort / remplacement";
  return "Besoin ponctuel";
}

function formatRecipientStatus(status: string): string {
  switch (status) {
    case "sent": return "Demande envoyée";
    case "viewed": return "Vue";
    case "interested": return "Intéressé";
    case "quote_sent": return "Devis envoyé";
    case "selected": return "Retenu";
    case "not_selected": return "Non retenu";
    case "declined": return "Refusé";
    default: return status || "En cours";
  }
}

function normalizeSuggestionKey(value: string | null | undefined): string {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function matchesService(service: CatalogServiceItem, terms: string[]): boolean {
  const haystack = normalizeSuggestionKey(`${service.service} ${service.category} ${service.description ?? ""}`);
  return terms.some((term) => haystack.includes(normalizeSuggestionKey(term)));
}

function normalizeServices(rawValue: string | null | undefined): string[] {
  if (!rawValue) return [];
  return Array.from(new Set(rawValue.split(",").map((item) => item.trim()).filter(Boolean)));
}

function buildRequestTitleSuggestion(form: RequestFormState): string {
  const firstService = normalizeServices(form.requestedServices)[0] || "gestion";
  const propertyLabel = (form.propertyName || "").trim() || "appartement";
  const cityLabel = (form.city || "").trim();
  const base = `${firstService} - ${propertyLabel}`;
  return cityLabel ? `${base} - ${cityLabel}` : base;
}


function buildConciergeSearchHref(request: OwnerServiceRequestRow): string {
  const params = new URLSearchParams();
  if (request.city?.trim()) params.set("city", request.city.trim());
  if (request.postal_code?.trim()) params.set("postalCode", request.postal_code.trim());
  if ((request.requested_services ?? []).length > 0) {
    params.set("services", (request.requested_services ?? []).join(","));
  }
  if (typeof request.budget_max === "number" && Number.isFinite(request.budget_max)) {
    params.set("budgetMax", String(Math.round(request.budget_max)));
  }
  const query = params.toString();
  return query ? `/dashboard/owner/concierges?${query}` : "/dashboard/owner/concierges";
}

function getRequestIdFromQuote(quote: OwnerQuoteRow): string | null {
  const metadata = quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata) ? quote.metadata : null;
  return metadata && typeof metadata.service_request_id === "string" ? metadata.service_request_id : null;
}

function buildRequestQuotesHref(requestId: string): string {
  return `/dashboard/owner/devis?request=${encodeURIComponent(requestId)}`;
}

function summarizeQuotesByRequest(quotes: OwnerQuoteRow[]): RequestQuoteSummary {
  return quotes.reduce<RequestQuoteSummary>(
    (accumulator, quote) => {
      accumulator.total += 1;
      if (quote.status === "accepted") {
        accumulator.accepted += 1;
        return accumulator;
      }
      if (["rejected", "expired", "canceled"].includes(quote.status ?? "")) {
        accumulator.closed += 1;
        return accumulator;
      }
      accumulator.pending += 1;
      return accumulator;
    },
    { total: 0, pending: 0, accepted: 0, closed: 0 },
  );
}

function getUnifiedRequestStatus(request: OwnerServiceRequestRow): string {
  return request.workflow_status ?? request.status ?? "NEW";
}

function getRequestActions(request: OwnerServiceRequestRow) {
  const recipients = Array.isArray(request.recipients) ? request.recipients : [];

  const hasResponse = recipients.some((recipient) =>
    ["interested", "quoted", "selected", "not_selected", "declined"].includes(recipient.status),
  );

  const hasQuote = recipients.some((recipient) =>
    ["quoted", "selected"].includes(recipient.status),
  );

  const isAccepted = request.status === "ACCEPTED" || request.workflow_status === "ACCEPTED" || !!request.mission_id;

  return {
    showRelaunch: !hasResponse && !isAccepted,
    showQuotes: hasResponse || request.status === "QUOTE_SENT" || request.workflow_status === "QUOTE_SENT" || isAccepted,
    primaryLabel: isAccepted
      ? "Ouvrir le devis"
      : hasQuote
        ? "Voir les propositions"
        : hasResponse
          ? "Voir les reponses"
          : "Relancer la demande",
  };
}

function normalizeLocationToken(value: string | null | undefined) {
  return normalizeSuggestionKey(value).replace(/\s+/g, "");
}

function hasSearchAlertForRequest(alerts: OwnerConciergeSearchAlert[], request: OwnerServiceRequestRow) {
  if (alerts.length === 0) return false;

  const requestCity = normalizeLocationToken(request.city);
  const requestPostalCode = normalizeLocationToken(request.postal_code);

  return alerts.some((alert) => {
    const alertCity = normalizeLocationToken(alert.city);
    const alertPostalCode = normalizeLocationToken(alert.postalCode);
    const cityMatches = Boolean(requestCity && alertCity && requestCity === alertCity);
    const postalMatches = Boolean(requestPostalCode && alertPostalCode && requestPostalCode === alertPostalCode);
    return cityMatches || postalMatches;
  });
}

function getRecipientMetrics(request: OwnerServiceRequestRow): RequestRecipientMetrics {
  const recipients = Array.isArray(request.recipients) ? request.recipients : [];
  const viewed = recipients.filter((recipient) => recipient.status === "viewed").length;
  const interested = recipients.filter((recipient) => recipient.status === "interested").length;
  const quoted = recipients.filter((recipient) => recipient.status === "quoted").length;
  const selected = recipients.filter((recipient) => recipient.status === "selected").length;
  const declined = recipients.filter((recipient) => ["declined", "not_selected"].includes(recipient.status)).length;
  const replied = recipients.filter((recipient) =>
    ["interested", "quoted", "selected", "not_selected", "declined"].includes(recipient.status),
  ).length;

  return {
    total: recipients.length,
    viewed,
    interested,
    quoted,
    selected,
    declined,
    replied,
  };
}

function getRecipientResponseHighlights(request: OwnerServiceRequestRow): string[] {
  const recipients = Array.isArray(request.recipients) ? request.recipients : [];
  const metrics = getRecipientMetrics(request);

  if (recipients.length === 0) {
    return ["Ajoutez ou relancez des concierges pour recevoir des retours."];
  }

  const repliedRecipients = recipients.filter((recipient) =>
    ["interested", "quoted", "selected", "not_selected", "declined"].includes(recipient.status),
  );

  if (repliedRecipients.length === 0) {
    if (metrics.viewed > 0) {
      return recipients
        .filter((recipient) => recipient.status === "viewed")
        .slice(0, 2)
        .map((recipient) => `${recipient.concierge_name?.trim() || "Concierge"} a consulte la demande.`);
    }

    return ["En attente des premiers retours concierges."];
  }

  return repliedRecipients.slice(0, 3).map((recipient) => {
    const name = recipient.concierge_name?.trim() || "Concierge";
    const respondedAt = recipient.responded_at ? ` - ${formatDateTime(recipient.responded_at)}` : "";
    return `${name} - ${formatRecipientStatus(recipient.status)}${respondedAt}`;
  });
}

function getWorkflowLabel(status: string | null | undefined): string {
  switch (status) {
    case "NEW":
      return "Nouvelle demande";
    case "IN_DISCUSSION":
      return "En discussion";
    case "QUOTE_SENT":
      return "Propositions recues";
    case "ACCEPTED":
      return "Collaboration acceptee";
    case "MISSION_CREATED":
      return "Demande archivee";
    case "DECLINED":
      return "Refusee";
    case "EXPIRED":
      return "Expiree";
    case "ARCHIVED":
      return "Archivee";
    default:
      return "Suivi en cours";
  }
}

function renderFactLabel(icon: React.ReactNode, text: string) {
  return (
    <span className={pageStyles.factLabel}>
      {icon}
      {text}
    </span>
  );
}

export default function OwnerRequestsPage() {
  // --- États ---
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [housing, setHousing] = useState<OwnerHousingRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogServiceItem[]>([]);
  const [searchAlerts, setSearchAlerts] = useState<OwnerConciergeSearchAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<RequestFormState>(initialForm);
  const [serviceDraft, setServiceDraft] = useState("");

  // --- Validation du formulaire ---
  const validateForm = useCallback((form: RequestFormState): string | null => {
    if (!form.propertyKey) return "Veuillez sélectionner un logement.";
    if (!form.title.trim()) return "Veuillez renseigner un titre.";
    if (form.desiredDate && isNaN(new Date(form.desiredDate).getTime())) {
      return "La date doit être valide.";
    }
    if (form.budgetMax && isNaN(Number(form.budgetMax))) {
      return "Le budget doit être un nombre valide.";
    }
    if (form.budgetMax && Number(form.budgetMax) <= 0) {
      return "Le budget doit être un nombre valide.";
    }
    return null;
  }, []);

  // --- Chargement des données ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [requestsResponse, housingResponse, quotesResponse, servicesResponse] = await Promise.all([
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/quotes?limit=100", { cache: "no-store" }),
        fetch("/api/services/services-catalog", { cache: "no-store" }),
      ]);

      if (!requestsResponse.ok) {
        const errorData = await requestsResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${requestsResponse.status}: Impossible de charger les demandes.`);
      }
      if (!housingResponse.ok) {
        const errorData = await housingResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${housingResponse.status}: Impossible de charger les logements.`);
      }
      if (!quotesResponse.ok) {
        const errorData = await quotesResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${quotesResponse.status}: Impossible de charger les devis.`);
      }
      if (!servicesResponse.ok) {
        const errorData = await servicesResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${servicesResponse.status}: Impossible de charger les services.`);
      }

      const requestsPayload = (await requestsResponse.json()) as OwnerRequestsPayload;
      const housingPayload = await housingResponse.json();
      const quotesPayload = await quotesResponse.json();
      const servicesPayload = await servicesResponse.json();

      setRequests(Array.isArray(requestsPayload?.items) ? requestsPayload.items : []);
      setHousing(Array.isArray(housingPayload) ? housingPayload : []);
      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
      setCatalogServices(Array.isArray(servicesPayload) ? servicesPayload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSearchAlerts(loadOwnerConciergeSearchAlerts());
  }, []);

  const housingOptions = useMemo(
    () =>
      housing.map((item) => ({
        key: String(item.id),
        label:
          item.nom_logement?.trim() || (item.ville ? `Logement à ${item.ville}` : "") || "Logement",
        city: item.ville?.trim() || "",
      })),
    [housing],
  );

  const quotesByRequestId = useMemo(() => {
    const nextMap = new Map<string, OwnerQuoteRow[]>();
    quotes.forEach((quote) => {
      const requestId = getRequestIdFromQuote(quote);
      if (!requestId) return;
      const current = nextMap.get(requestId) ?? [];
      current.push(quote);
      nextMap.set(requestId, current);
    });
    return nextMap;
  }, [quotes]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const workflowStatus = getUnifiedRequestStatus(request);
      const matchesStatus = statusFilter === "all" || workflowStatus === statusFilter || request.status === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;
      const haystack = [request.title, request.property_name, request.city].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [requests, searchTerm, statusFilter]);

  const draftCount = useMemo(() => requests.filter(r => getUnifiedRequestStatus(r) === "NEW").length, [requests]);
  const sentCount = useMemo(() => requests.filter(r => getUnifiedRequestStatus(r) === "IN_DISCUSSION").length, [requests]);
  const quotedCount = useMemo(() => requests.filter(r => getUnifiedRequestStatus(r) === "QUOTE_SENT").length, [requests]);
  const acceptedCount = useMemo(
    () => requests.filter((request) => ["ACCEPTED", "ARCHIVED", "MISSION_CREATED"].includes(getUnifiedRequestStatus(request)) || Boolean(request.mission_id)).length,
    [requests],
  );

  // --- Gestionnaires d\'événements ---
  const handleHousingChange = useCallback((value: string) => {
    const selected = housingOptions.find((h) => h.key === value);
    setForm((prev) => ({
      ...prev,
      propertyKey: value,
      propertyName: selected?.label || "",
      city: selected?.city || prev.city,
    }));
  }, [housingOptions]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        ...form,
        requested_services: normalizeServices(form.requestedServices),
      };
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: Impossible de créer la demande.`);
      }

      setSuccess("Demande créée avec succès.");
      setForm(initialForm);
      setServiceDraft("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Suggestions de services ---
  const normalizedServices = normalizeServices(form.requestedServices);
  const titleSuggestion = buildRequestTitleSuggestion(form);
  const normalizedCurrentTitle = normalizeSuggestionKey(form.title);
  const normalizedSuggestedTitle = normalizeSuggestionKey(titleSuggestion);
  const showTitleSuggestion =
    normalizedSuggestedTitle.length > 0 && normalizedCurrentTitle !== normalizedSuggestedTitle;
  const quickServiceSuggestions = useMemo(() => {
    if (catalogServices.length === 0) return [];
    const typeTerms: Record<string, string[]> = {
      ponctuel: ["check-in", "ménage"],
      renfort: ["communication"],
      durable: ["conciergerie"],
    };
    return catalogServices
      .filter((s) => matchesService(s, typeTerms[form.requestType] || []))
      .slice(0, 8);
  }, [catalogServices, form.requestType]);

  const recentRequestedServices = useMemo(() => {
    const counts = new Map<string, number>();
    requests.forEach((r) => (r.requested_services || []).forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)));
    return Array.from(counts.keys()).slice(0, 8);
  }, [requests]);

  function toggleQuickService(serviceName: string) {
    const nextSelection = normalizedServices.includes(serviceName)
      ? normalizedServices.filter((item) => item !== serviceName)
      : [...normalizedServices, serviceName];

    setForm((current) => ({
      ...current,
      requestedServices: nextSelection.join(", "),
    }));
  }

  function addCustomService() {
    const candidate = serviceDraft.trim();
    if (!candidate) return;
    const candidateKey = normalizeSuggestionKey(candidate);
    if (normalizedServices.some((service) => normalizeSuggestionKey(service) === candidateKey)) {
      setServiceDraft("");
      return;
    }

    setForm((current) => ({
      ...current,
      requestedServices: [...normalizeServices(current.requestedServices), candidate].join(", "),
    }));
    setServiceDraft("");
  }

  function removeSelectedService(serviceName: string) {
    setForm((current) => ({
      ...current,
      requestedServices: normalizeServices(current.requestedServices)
        .filter((service) => service !== serviceName)
        .join(", "),
    }));
  }

  return (
    <div className="dashboard-grid">
      <OwnerWorkspacePage
        eyebrow="Recherche concierge"
        title="Demandes envoyées aux conciergeries"
        description={loading ? "Chargement..." : "Qualifiez votre besoin, diffusez-le aux conciergeries, puis transformez le devis accepté en mission opérationnelle."}
        metrics={[
          { label: "Demandes", value: String(requests.length) },
          { label: "Brouillons", value: String(draftCount) },
          { label: "Envoyées", value: String(sentCount) },
          { label: "Avec devis", value: String(quotedCount) },
        ]}
        actions={[]}
        cards={[]}
      />

      <section className={pageStyles.page}>
        {success && (
          <p className={pageStyles.success} aria-live="polite" role="alert">
            {success}
          </p>
        )}
        {error && (
          <p className={pageStyles.error} aria-live="assertive" role="alert">
            {error}
          </p>
        )}

        <div className={pageStyles.partnershipFlow} aria-label="Parcours de partenariat">
          {[
            {
              label: "Besoin",
              value: requests.length,
              text: "Une demande claire par logement, avec services et contexte.",
            },
            {
              label: "Diffusion",
              value: sentCount,
              text: "Envoi cible a plusieurs conciergeries pour obtenir des retours rapides.",
            },
            {
              label: "Selection",
              value: quotedCount,
              text: "Comparaison des reponses, devis et disponibilites avant validation.",
            },
            {
              label: "Partenariat",
              value: acceptedCount,
              text: "Devis accepte, relation active et vraie mission operationnelle a piloter.",
            },
          ].map((step, index) => (
            <div key={step.label} className={pageStyles.partnershipStep}>
              <span className={pageStyles.partnershipIndex}>{index + 1}</span>
              <strong>{step.label}</strong>
              <em>{step.value}</em>
              <p>{step.text}</p>
            </div>
          ))}
        </div>

        <div className={pageStyles.layout}>
          {/* Formulaire de création */}
          <Card className={pageStyles.formPanel} tone="soft">
            <CardHeader>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <p className={pageStyles.eyebrow}>Demarrage guide</p>
                  <h2 className={pageStyles.title}>Nouvelle demande</h2>
                  <p className={pageStyles.intro}>Renseignez l&apos;essentiel maintenant, puis choisissez les conciergeries a contacter.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className={pageStyles.formGrid}>
                {/* Logement */}
                <div className={pageStyles.field}>
                  <label htmlFor="property">Logement</label>
                  <Select
                    id="property"
                    value={form.propertyKey}
                    onChange={(e) => handleHousingChange(e.target.value)}
                    autoFocus
                  >
                    <option value="">Logement...</option>
                    {housingOptions.map((h) => (
                      <option key={h.key} value={h.key}>
                        {h.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Type de demande */}
                <div className={pageStyles.field}>
                  <label htmlFor="requestType">Type de demande</label>
                  <Select
                    id="requestType"
                    value={form.requestType}
                    onChange={(e) => setForm({ ...form, requestType: e.target.value as RequestFormState["requestType"] })}
                  >
                    <option value="ponctuel">Ponctuel</option>
                    <option value="renfort">Renfort</option>
                    <option value="durable">Durable</option>
                  </Select>
                </div>

                {/* Date souhaitée */}
                <div className={pageStyles.field}>
                  <label htmlFor="desiredDate">Date souhaitée</label>
                  <Input
                    id="desiredDate"
                    type="datetime-local"
                    value={form.desiredDate}
                    onChange={(e) => setForm({ ...form, desiredDate: e.target.value })}
                  />
                </div>

                {/* Budget */}
                <div className={pageStyles.budgetRow}>
                  <div className={pageStyles.field}>
                    <label htmlFor="budgetMax">Budget</label>
                    <Input
                      id="budgetMax"
                      type="number"
                      placeholder="Budget"
                      value={form.budgetMax}
                      onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                    />
                  </div>
                  <div className={pageStyles.field}>
                    <label htmlFor="currency">Devise</label>
                    <Select
                      id="currency"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    >
                      {currencyOptions.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Ville */}
                <div className={pageStyles.field}>
                  <label htmlFor="city">Ville</label>
                  <Input
                    id="city"
                    placeholder="Ville"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                {/* Code Postal */}
                <div className={pageStyles.field}>
                  <label htmlFor="postalCode">Code Postal</label>
                  <Input
                    id="postalCode"
                    placeholder="Code Postal"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  />
                </div>

                {/* Titre */}
                <div className={pageStyles.titleSuggestion}>
                  <div className={pageStyles.field}>
                    <label htmlFor="title">Titre</label>
                    <Input
                      id="title"
                      placeholder="Titre"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, title: titleSuggestion })}>
                    Suggérer
                  </button>
                </div>

                {showTitleSuggestion ? (
                  <div className={pageStyles.titleSuggestionCard}>
                    <div className={pageStyles.titleSuggestionCopy}>
                    <strong>Services à préciser</strong>
                      <p>Format utile pour retrouver vite la demande : service - logement - ville.</p>
                      <code>{titleSuggestion}</code>
                    </div>
                    <button
                      type="button"
                      className={pageStyles.inlineHintAction}
                      onClick={() => setForm((current) => ({ ...current, title: titleSuggestion }))}
                    >
                      {form.title.trim() ? "Remplacer par cette suggestion" : "Utiliser cette suggestion"}
                    </button>
                  </div>
                ) : null}

                <div className={`${pageStyles.formSectionCard} ${pageStyles.formSectionFeature}`}>
                  <label className={pageStyles.fullField}>
                  <span>Services demandés</span>
                  <small className={pageStyles.fieldHint}>
                        Sélectionne d&apos;abord les services du catalogue, puis ajoute un besoin libre si nécessaire.
                  </small>
                  {quickServiceSuggestions.length > 0 ? (
                    <div className={pageStyles.quickServicesBlock}>
                      <p className={pageStyles.quickServicesTitle}>Suggestions rapides intelligentes</p>
                      <p className={pageStyles.quickServicesHint}>
              Diffusion ciblée auprès de concierges locales et suivi des réponses fréquentes.
                      </p>
                      <div className={pageStyles.quickServicesList}>
                        {quickServiceSuggestions.map((service) => {
                          const isSelected = normalizedServices.includes(service.service);
                          return (
                            <button
                              key={service.id}
                              type="button"
                              className={`${pageStyles.quickServiceChip} ${
                                isSelected ? pageStyles.quickServiceChipSelected : ""
                              }`}
                              onClick={() => toggleQuickService(service.service)}
                            >
                              {service.service}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <div className={pageStyles.catalogSelectorWrap}>
                    <ServiceCatalogSelector
                      selected={normalizedServices}
                      onChange={(selected) =>
                        setForm((current) => ({ ...current, requestedServices: selected.join(", ") }))
                      }
                      introText=""
                      searchPlaceholder="Rechercher un service pour cette demande"
                      priorityCategories={["Accueil", "Ménage", "Linge", "Maintenance", "Administratif"]}
                      initialCategoryCount={5}
                      recentServices={recentRequestedServices}
                    />
                  </div>
                  <div className={pageStyles.chipsInputWrap}>
                    <div className={pageStyles.serviceDraftRow}>
                      <Input
                        value={serviceDraft}
                        onChange={(event) => setServiceDraft(event.target.value)}
                        placeholder="Ajouter un besoin libre : ex. état des lieux, coordination artisan"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addCustomService();
                          }
                        }}
                      />
                      <Button type="button" variant="secondary" onClick={addCustomService} disabled={!serviceDraft.trim()}>
                        Ajouter
                      </Button>
                    </div>
                    {normalizedServices.length > 0 ? (
                      <div className={pageStyles.serviceChips}>
                        {normalizedServices.map((service) => (
                          <button
                            key={service}
                            type="button"
                            className={pageStyles.serviceChip}
                            onClick={() => removeSelectedService(service)}
                            title={`Retirer ${service}`}
                          >
                            {service} x
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </label>
                </div>

                {/* Description */}
                <div className={pageStyles.field}>
                  <label htmlFor="description">Description</label>
                  <Textarea
                    id="description"
                    placeholder="Description..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {/* Urgent */}
                <div className={pageStyles.field}>
                  <Checkbox
                    id="urgency"
                    label="Urgent"
                    checked={form.urgency}
                    onChange={(e) => setForm({ ...form, urgency: e.target.checked })}
                  />
                </div>

                {/* Bouton de soumission */}
                <Button type="submit" disabled={submitting}>
                  {submitting ? "..." : "Créer la demande"}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Liste des demandes */}
          <Card className={pageStyles.listPanel} tone="soft">
            <CardHeader>
              <div className={pageStyles.sectionHeader}>
                <div>
                  <p className={pageStyles.eyebrow}>Avant mission</p>
                  <h2 className={pageStyles.title}>Suivi des demandes</h2>
                  <p className={pageStyles.intro}>Une demande sert a choisir une conciergerie. La mission commence seulement apres acceptation d&apos;une proposition.</p>
                </div>
              </div>
            </CardHeader>
            <div className={pageStyles.toolbar}>
              <SearchBar
                defaultValue={searchTerm}
                onSearch={setSearchTerm}
                placeholder="Filtrer..."
                aria-label="Rechercher une demande"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrer par statut"
              >
                <option value="all">Toutes</option>
                <option value="NEW">Nouveau</option>
                <option value="IN_DISCUSSION">En discussion</option>
                <option value="SENT">Envoyées</option>
                <option value="VIEWED">Consultées</option>
                <option value="QUOTE_SENT">Propositions reçues</option>
                <option value="ACCEPTED">Acceptées</option>
                <option value="DECLINED">Refusées</option>
                <option value="EXPIRED">Expirées</option>
              </Select>
            </div>

            {!loading && filteredRequests.length === 0 ? (
              <EmptyState title="Aucune demande" description="Commencez par en créer une." />
            ) : (
              <div className={pageStyles.rows}>
                {filteredRequests.map((request) => {
                  const quoteSummary = summarizeQuotesByRequest(quotesByRequestId.get(request.id) ?? []);
                  const recipientMetrics = getRecipientMetrics(request);
                  const hasActiveSearchAlert = hasSearchAlertForRequest(searchAlerts, request);
                  const actions = getRequestActions(request);
                  const workflowStatus = getUnifiedRequestStatus(request);
                  const responseHighlights = getRecipientResponseHighlights(request);
                  const responseStateLabel =
                    quoteSummary.total > 0
                      ? `${quoteSummary.total} devis`
                      : recipientMetrics.replied > 0
                        ? `${recipientMetrics.replied} retour${recipientMetrics.replied > 1 ? "s" : ""}`
                        : "En attente";
                  const missionStateLabel = request.mission_id ? "Mission ouverte" : "Pas encore de mission";
                  const requestDescription = request.city
                    ? `${getWorkflowLabel(workflowStatus)} pour ${request.city}${request.postal_code ? ` (${request.postal_code})` : ""}.`
                    : getWorkflowLabel(workflowStatus);

                  return (
                    <OwnerRequestSummaryCard
                      key={request.id}
                      title={request.title}
                      subtitle={getRequestTypeLabel(request.request_type)}
                      status={request.status}
                      urgency={request.urgency}
                      actions={
                        <div className={pageStyles.compactActions}>
                          {actions.showRelaunch && (
                            <ButtonLink href={buildConciergeSearchHref(request)} variant="ghost" size="sm">
                              <Search size={16} /> Relancer
                            </ButtonLink>
                          )}
                          {actions.showQuotes && (
                            <ButtonLink href={buildRequestQuotesHref(request.id)} variant="secondary" size="sm">
                              <Eye size={16} /> {actions.primaryLabel}
                            </ButtonLink>
                          )}
                        </div>
                      }
                      primaryFacts={[
                        { label: renderFactLabel(<FileText size={14} aria-hidden="true" />, "Logement"), value: request.property_name || "-" },
                        {
                          label: renderFactLabel(<MapPin size={14} aria-hidden="true" />, "Zone"),
                          value: [request.city, request.postal_code].filter(Boolean).join(" - ") || "Zone à préciser",
                        },
                        {
                          label: renderFactLabel(<CalendarClock size={14} aria-hidden="true" />, "Intervention"),
                          value: formatDateTime(request.desired_date),
                        },
                        {
                          label: renderFactLabel(<CircleDollarSign size={14} aria-hidden="true" />, "Budget"),
                          value: formatAmount(request.budget_max, request.currency ?? "EUR"),
                        },
                      ]}
                      secondaryFacts={[
                        {
                          label: renderFactLabel(<Send size={14} aria-hidden="true" />, "Diffusion"),
                          value: recipientMetrics.total,
                        },
                        {
                          label: renderFactLabel(<Users size={14} aria-hidden="true" />, "Réponses"),
                          value: recipientMetrics.replied,
                        },
                        {
                          label: renderFactLabel(<MessageSquareText size={14} aria-hidden="true" />, "Devis"),
                          value: quoteSummary.total,
                        },
                        {
                          label: renderFactLabel(<Bell size={14} aria-hidden="true" />, "Alerte"),
                          value: hasActiveSearchAlert ? (
                            <span className={pageStyles.alertFactActive}>
                              <Bell size={14} aria-hidden="true" /> Active
                            </span>
                          ) : (
                            "-"
                          ),
                        },
                      ]}
                      services={request.requested_services ?? []}
                      emptyServicesLabel="Services à préciser"
                      description={request.description?.trim() ? request.description : requestDescription}
                      helperTexts={[
                        `Créée le ${formatDateTime(request.created_at)} - ${recipientMetrics.total} contact${recipientMetrics.total > 1 ? "s" : ""} - ${recipientMetrics.replied} reponse${recipientMetrics.replied > 1 ? "s" : ""}`,
                        ...responseHighlights,
                      ]}
                    >
                      <div className={pageStyles.requestOverview}>
                        <div className={pageStyles.overviewPills}>
                          <span className={pageStyles.overviewPill}>
                            <Sparkles size={14} aria-hidden="true" />
                            {getWorkflowLabel(workflowStatus)}
                          </span>
                          <span className={pageStyles.overviewPill}>
                            <Eye size={14} aria-hidden="true" />
                            {responseStateLabel}
                          </span>
                          <span className={pageStyles.overviewPill}>
                            <FileText size={14} aria-hidden="true" />
                            {missionStateLabel}
                          </span>
                        </div>
                        {hasActiveSearchAlert ? (
                          <div className={pageStyles.inlineAlert}>
                            <Bell size={15} aria-hidden="true" />
                            Alerte active sur cette zone pour voir les nouveaux profils plus vite.
                          </div>
                        ) : null}
                      </div>
                    </OwnerRequestSummaryCard>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}





