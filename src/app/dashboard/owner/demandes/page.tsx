"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
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
  { value: "EUR", label: "€" },
  { value: "USD", label: "$" },
  { value: "GBP", label: "£" },
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
    case "quoted": return "Devis envoyé";
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

function getRecipientResponseSummary(request: OwnerServiceRequestRow): string[] {
  if (!Array.isArray(request.recipients) || request.recipients.length === 0) {
    return ["Aucun concierge proposé pour le moment"];
  }
  const repliedRecipients = request.recipients.filter((recipient) =>
    ["interested", "quoted", "selected", "not_selected", "declined"].includes(recipient.status),
  );
  if (repliedRecipients.length === 0) {
    const viewedRecipients = request.recipients.filter((recipient) => recipient.status === "viewed");
    if (viewedRecipients.length > 0) {
      return viewedRecipients.slice(0, 3).map((recipient) => {
        const name = recipient.concierge_name?.trim() || "Concierge";
        return `${name} a consulté votre demande`;
      });
    }
    return ["Aucune réponse reçue pour le moment"];
  }
  return repliedRecipients.slice(0, 3).map((recipient) => {
    const name = recipient.concierge_name?.trim() || "Concierge";
    const respondedAt = recipient.responded_at ? ` le ${formatDateTime(recipient.responded_at)}` : "";
    return `${name} a répondu : ${formatRecipientStatus(recipient.status)}${respondedAt}`;
  });
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
          ? "Voir les réponses"
          : "Relancer la demande",
  };
}

// --- Composant Principal ---
export default function OwnerRequestsPage() {
  // --- États ---
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [housing, setHousing] = useState<OwnerHousingRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<RequestFormState>(initialForm);

  // --- Validation du formulaire ---
  const validateForm = useCallback((form: RequestFormState): string | null => {
    if (!form.propertyKey) return "Veuillez sélectionner un logement.";
    if (!form.title.trim()) return "Le titre est requis.";
    if (form.desiredDate && isNaN(new Date(form.desiredDate).getTime())) {
      return "La date doit être valide.";
    }
    if (form.budgetMax && isNaN(Number(form.budgetMax))) {
      return "Le budget doit être un nombre valide.";
    }
    if (form.budgetMax && Number(form.budgetMax) <= 0) {
      return "Le budget doit être supérieur à 0.";
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

  // --- Données dérivées ---
  const housingOptions = useMemo(() => housing.map((item) => ({
    key: String(item.id),
    label: item.nom_logement?.trim() || (item.ville ? `Logement à ${item.ville}` : "") || "Logement",
    city: item.ville?.trim() || "",
  })), [housing]);

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

  // --- Gestionnaires d'événements ---
  const handleHousingChange = useCallback((value: string) => {
    const selected = housingOptions.find((h) => h.key === value);
    setForm((prev) => ({
      ...prev,
      propertyKey: value,
      propertyName: selected?.label || "",
      city: selected?.city || prev.city,
    }));
  }, [housingOptions]);

  const toggleQuickService = useCallback((serviceName: string) => {
    setForm((prev) => {
      const current = normalizeServices(prev.requestedServices);
      const next = current.includes(serviceName)
        ? current.filter((s) => s !== serviceName)
        : [...current, serviceName];
      return { ...prev, requestedServices: next.join(", ") };
    });
  }, []);

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

  // --- Rendu ---
  return (
    <div className="dashboard-grid">
      <OwnerWorkspacePage
        eyebrow="Demandes"
        title="Demandes de mission"
        description={loading ? "Chargement..." : "Gérez vos demandes de services."}
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

        <div className={pageStyles.layout}>
          {/* Formulaire de création */}
          <Card className={pageStyles.formPanel} tone="soft">
            <CardHeader>
              <h2 className={pageStyles.title}>Nouvelle demande</h2>
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

                {/* Sélecteur de services */}
                <div className={pageStyles.field}>
                  <label htmlFor="services">Services demandés</label>
                  <ServiceCatalogSelector
                    selected={normalizedServices}
                    onChange={(s) => setForm({ ...form, requestedServices: s.join(", ") })}
                    recentServices={recentRequestedServices}
                  />
                </div>

                {/* Suggestions de services rapides */}
                <div className={pageStyles.quickServices}>
                  {quickServiceSuggestions.map((s) => (
                    <Button
                      key={s.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleQuickService.bind(null, s.service)}
                    >
                      {s.service}
                    </Button>
                  ))}
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
                  {submitting ? "..." : "Créer"}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Liste des demandes */}
          <Card className={pageStyles.listPanel} tone="soft">
            <CardHeader>
              <h2 className={pageStyles.title}>Suivi des demandes</h2>
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
                <option value="all">Tous</option>
                <option value="NEW">Nouveau</option>
                <option value="IN_DISCUSSION">En discussion</option>
                <option value="QUOTE_SENT">Devis envoyé</option>
                <option value="ACCEPTED">Accepté</option>
              </Select>
            </div>

            {!loading && filteredRequests.length === 0 ? (
              <EmptyState title="Aucune demande" description="Commencez par en créer une." />
            ) : (
              <div className={pageStyles.rows}>
                {filteredRequests.map((request) => {
                  const quoteSummary = summarizeQuotesByRequest(quotesByRequestId.get(request.id) ?? []);
                  const actions = getRequestActions(request);

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
                        { label: "Logement", value: request.property_name || "-" },
                        { label: "Début", value: formatDateTime(request.desired_date) },
                        { label: "Budget", value: formatAmount(request.budget_max, request.currency ?? "EUR") },
                      ]}
                      secondaryFacts={[
                        { label: "Devis", value: quoteSummary.total },
                      ]}
                      services={request.requested_services ?? []}
                      helperTexts={getRecipientResponseSummary(request)}
                    />
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