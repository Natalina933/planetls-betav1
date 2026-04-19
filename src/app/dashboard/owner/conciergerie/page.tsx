"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import pageStyles from "../demandes/OwnerRequestsPage.module.scss";
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

const currencyOptions = [
  { value: "EUR", label: "€" },
  { value: "USD", label: "$" },
  { value: "GBP", label: "£" },
  { value: "CHF", label: "CHF" },
] as const;

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
  if (typeof value !== "number") return "Sur devis";
  return `${value.toFixed(0)} ${currency}`;
}

function getRequestTypeLabel(value: OwnerServiceRequestRow["request_type"]) {
  if (value === "durable") return "Besoin durable";
  if (value === "renfort") return "Renfort / remplacement";
  return "Besoin ponctuel";
}

function formatRecipientStatus(status: string) {
  switch (status) {
    case "sent":
      return "Demande envoyée";
    case "viewed":
      return "Vue";
    case "interested":
      return "Intéressé";
    case "quoted":
      return "Devis envoyé";
    case "selected":
      return "Retenu";
    case "not_selected":
      return "Non retenu";
    case "declined":
      return "Refusé";
    default:
      return status || "En cours";
  }
}

function getRecipientResponseSummary(request: OwnerServiceRequestRow) {
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

function buildRequestTitleSuggestion(form: RequestFormState) {
  const firstService = normalizeServices(form.requestedServices)[0];
  const serviceLabel = firstService || "gestion";
  const propertyLabel = form.propertyName.trim() || "appartement";
  const cityLabel = form.city.trim();
  const base = `${serviceLabel} - ${propertyLabel}`;
  return cityLabel ? `${base} - ${cityLabel}` : base;
}

function normalizeSuggestionKey(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesService(service: CatalogServiceItem, terms: string[]) {
  const haystack = normalizeSuggestionKey(
    `${service.service} ${service.category} ${service.description ?? ""}`,
  );
  return terms.some((term) => haystack.includes(normalizeSuggestionKey(term)));
}

function normalizeServices(rawValue: string) {
  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function buildConciergeSearchHref(request: OwnerServiceRequestRow) {
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

function getRequestIdFromQuote(quote: OwnerQuoteRow) {
  const metadata =
    quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
      ? quote.metadata
      : null;
  return metadata && typeof metadata.service_request_id === "string"
    ? metadata.service_request_id
    : null;
}

function buildRequestQuotesHref(requestId: string) {
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

function getUnifiedRequestStatus(request: OwnerServiceRequestRow) {
  return request.workflow_status ?? request.status ?? "NEW";
}

/**
 * Logique d'actions dynamiques basée sur les réponses reçues
 */
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

export default function OwnerRequestsPage() {
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

      const requestsPayload = (await requestsResponse.json()) as OwnerRequestsPayload;
      const housingPayload = await housingResponse.json();
      const quotesPayload = await quotesResponse.json();
      const servicesPayload = await servicesResponse.json();

      if (!requestsResponse.ok) {
        throw new Error(requestsPayload?.error || "Impossible de charger les demandes.");
      }
      if (!housingResponse.ok) {
        throw new Error(housingPayload?.error || "Impossible de charger les logements.");
      }
      if (!quotesResponse.ok) {
        throw new Error(quotesPayload?.error || "Impossible de charger les devis.");
      }
      if (!servicesResponse.ok) {
        throw new Error(servicesPayload?.error || "Impossible de charger les services.");
      }

      setRequests(Array.isArray(requestsPayload?.items) ? requestsPayload.items : []);
      setHousing(Array.isArray(housingPayload) ? housingPayload : []);
      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
      setCatalogServices(Array.isArray(servicesPayload) ? servicesPayload : []);
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
      const matchesStatus =
        statusFilter === "all" ||
        workflowStatus === statusFilter ||
        request.status === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        request.title,
        request.property_name,
        request.city,
        request.status,
        ...(request.requested_services ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [requests, searchTerm, statusFilter]);

  const draftCount = useMemo(
    () => requests.filter((request) => getUnifiedRequestStatus(request) === "NEW").length,
    [requests],
  );

  const sentCount = useMemo(
    () => requests.filter((request) => getUnifiedRequestStatus(request) === "IN_DISCUSSION").length,
    [requests],
  );

  const quotedCount = useMemo(
    () => requests.filter((request) => getUnifiedRequestStatus(request) === "QUOTE_SENT").length,
    [requests],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Ajoutez un titre clair à votre demande.");
      return;
    }

    const normalizedServices = normalizeServices(form.requestedServices);
    if (normalizedServices.length === 0) {
      setError("Ajoutez au moins un service demandé.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        request_type: form.requestType,
        title: form.title.trim(),
        description: form.description.trim() || null,
        property_name: form.propertyName.trim() || null,
        requested_services: normalizedServices,
        city: form.city.trim() || null,
        postal_code: form.postalCode.trim() || null,
        desired_date: form.desiredDate ? new Date(form.desiredDate).toISOString() : null,
        urgency: form.urgency,
        budget_max: form.budgetMax ? Number(form.budgetMax) : null,
        currency: form.currency,
      };

      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json();
      if (!response.ok) {
        throw new Error(responsePayload?.error || "Impossible de créer la demande.");
      }

      setSuccess("Demande créée. Vous pouvez maintenant suivre les devis associés juste à droite.");
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la demande.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleHousingChange(value: string) {
    const selectedHousing = housingOptions.find((item) => item.key === value) ?? null;
    setForm((current) => ({
      ...current,
      propertyKey: value,
      propertyName: selectedHousing?.label ?? "",
      city: current.city || selectedHousing?.city || "",
    }));
  }

  const normalizedServices = normalizeServices(form.requestedServices);
  const titleSuggestion = buildRequestTitleSuggestion(form);
  const normalizedCity = normalizeSuggestionKey(form.city);
  const normalizedProperty = normalizeSuggestionKey(form.propertyName);

  const quickServiceSuggestions = useMemo(() => {
    if (catalogServices.length === 0) return [];
    const historyCounts = requests.reduce<Map<string, number>>((accumulator, request) => {
      (request.requested_services ?? []).forEach((serviceName) => {
        const key = normalizeSuggestionKey(serviceName);
        accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
      });
      return accumulator;
    }, new Map<string, number>());

    const typeTermsByNeed: Record<RequestFormState["requestType"], string[]> = {
      ponctuel: [
        "check-in",
        "check out",
        "menage entre voyageurs",
        "changement de linge",
        "petites reparations",
      ],
      renfort: [
        "communication voyageurs",
        "gestion reservations",
        "menage standard",
        "blanchisserie",
        "assistance voyageurs",
      ],
      durable: [
        "conciergerie 24/7",
        "gestion reservations",
        "communication voyageurs",
        "reporting mensuel",
        "calendrier dynamique",
      ],
    };

    const cityTerms =
      normalizedCity.includes("paris") ||
        normalizedCity.includes("nice") ||
        normalizedCity.includes("cannes") ||
        normalizedCity.includes("marseille") ||
        normalizedCity.includes("lyon") ||
        normalizedCity.includes("bordeaux")
        ? ["check-in", "kit de bienvenue", "communication voyageurs"]
        : normalizedCity.includes("chamonix") ||
          normalizedCity.includes("megeve") ||
          normalizedCity.includes("meribel")
          ? ["deneigement", "intervention d'urgence", "check-in"]
          : [];

    const propertyTerms = [
      ...(normalizedProperty.includes("villa") || normalizedProperty.includes("maison")
        ? ["jardinage", "nettoyage terrasses", "entretien voirie"]
        : []),
      ...(normalizedProperty.includes("piscine") ? ["nettoyage piscine"] : []),
      ...(normalizedProperty.includes("studio") || normalizedProperty.includes("appartement")
        ? ["menage entre voyageurs", "check-in", "changement de linge"]
        : []),
    ];

    const selectedKeys = new Set(normalizedServices.map((service) => normalizeSuggestionKey(service)));

    const scored = catalogServices.map((service) => {
      const key = normalizeSuggestionKey(service.service);
      let score = historyCounts.get(key) ?? 0;

      if (matchesService(service, typeTermsByNeed[form.requestType])) score += 6;
      if (matchesService(service, propertyTerms)) score += 4;
      if (matchesService(service, cityTerms)) score += 3;
      if (selectedKeys.has(key)) score += 2;
      if (service.category === "Accueil" || service.category === "Ménage") score += 1;

      return { service, score };
    });

    return scored
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.service.service.localeCompare(right.service.service, "fr");
      })
      .slice(0, 8)
      .map((entry) => entry.service);
  }, [catalogServices, requests, form.requestType, normalizedCity, normalizedProperty, normalizedServices]);

  const recentRequestedServices = useMemo(() => {
    const counts = requests.reduce<Map<string, number>>((accumulator, request) => {
      (request.requested_services ?? []).forEach((serviceName) => {
        accumulator.set(serviceName, (accumulator.get(serviceName) ?? 0) + 1);
      });
      return accumulator;
    }, new Map<string, number>());

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "fr"))
      .slice(0, 8)
      .map(([serviceName]) => serviceName);
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

  return (
    <div className="dashboard-grid">
      <OwnerWorkspacePage
        eyebrow="Demandes"
        title="Demandes de mission"
        description={
          loading
            ? "Chargement des demandes..."
            : error || "Créez une demande puis comparez les devis reçus pour le bon logement."
        }
        metrics={[
          { label: "Demandes", value: loading ? "..." : String(requests.length) },
          { label: "Brouillons", value: loading ? "..." : String(draftCount) },
          { label: "Envoyées", value: loading ? "..." : String(sentCount) },
          { label: "Avec devis", value: loading ? "..." : String(quotedCount) },
        ]}
        actions={[]}
        cards={[]}
      />

      <section className={pageStyles.page}>
        {success ? <p className={`${pageStyles.message} ${pageStyles.success}`}>{success}</p> : null}
        {error ? <p className={`${pageStyles.message} ${pageStyles.error}`}>{error}</p> : null}

        <div className={pageStyles.layout}>
          <Card className={pageStyles.formPanel} tone="soft" variant="large">
            <CardHeader className={pageStyles.sectionHeader}>
              <div>
                <p className={pageStyles.eyebrow}>Nouvelle demande</p>
                <h2 className={pageStyles.title}>Créer une mission claire et rapide</h2>
              </div>
            </CardHeader>

            <CardBody className={pageStyles.formGrid}>
              <p className={pageStyles.intro}>Renseignez l’essentiel. Les détails pourront être affinés ensuite.</p>

              <form className={pageStyles.formGrid} onSubmit={handleSubmit}>
                <div className={pageStyles.formSectionCard}>
                  <div className={pageStyles.fieldGrid}>
                    <label className={pageStyles.field}>
                      <span>Logement</span>
                      <Select value={form.propertyKey} onChange={(event) => handleHousingChange(event.target.value)}>
                        <option value="">Choisir un logement</option>
                        {housingOptions.map((item) => (
                          <option key={item.key} value={item.key}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                    </label>

                    <label className={pageStyles.field}>
                      <span>Type de besoin</span>
                      <Select
                        value={form.requestType}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            requestType: event.target.value as RequestFormState["requestType"],
                          }))
                        }
                      >
                        <option value="ponctuel">Besoin ponctuel</option>
                        <option value="renfort">Remplacement / renfort</option>
                        <option value="durable">Besoin durable</option>
                      </Select>
                    </label>
                  </div>
                </div>

                <div className={pageStyles.formSectionCard}>
                  <div className={pageStyles.fieldGrid}>
                    <label className={pageStyles.field}>
                      <span>Date de début</span>
                      <Input
                        type="datetime-local"
                        value={form.desiredDate}
                        onChange={(event) => setForm((current) => ({ ...current, desiredDate: event.target.value }))}
                      />
                    </label>

                    <label className={pageStyles.field}>
                      <span>Budget indicatif du propriétaire</span>
                      <div className={pageStyles.budgetRow}>
                        <Input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={form.budgetMax}
                          onChange={(event) => setForm((current) => ({ ...current, budgetMax: event.target.value }))}
                          placeholder="Sur devis"
                        />
                        <Select
                          value={form.currency}
                          onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                        >
                          {currencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <small className={pageStyles.fieldHint}>Indicatif, sans engagement sur le tarif final.</small>
                    </label>
                  </div>
                </div>

                <div className={pageStyles.formSectionCard}>
                  <div className={pageStyles.fieldGrid}>
                    <label className={pageStyles.field}>
                      <span>Ville</span>
                      <Input
                        value={form.city}
                        onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                        placeholder="Paris"
                      />
                    </label>

                    <label className={pageStyles.field}>
                      <span>Code postal</span>
                      <Input
                        value={form.postalCode}
                        onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))}
                        placeholder="75015"
                        inputMode="numeric"
                      />
                    </label>
                  </div>
                </div>

                <div className={pageStyles.formSectionCard}>
                  <label className={pageStyles.fullField}>
                    <span>Titre</span>
                    <Input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Ex : check-in et ménage de lancement"
                    />
                    <div className={pageStyles.titleSuggestionCard}>
                      <div className={pageStyles.titleSuggestionCopy}>
                        <strong>Titre conseillé</strong>
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
                  </label>
                </div>

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
                          Basées sur le type de besoin, le logement, la ville et les demandes déjà fréquentes.
                        </p>
                        <div className={pageStyles.quickServicesList}>
                          {quickServiceSuggestions.map((service) => {
                            const isSelected = normalizedServices.includes(service.service);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                className={`${pageStyles.quickServiceChip} ${isSelected ? pageStyles.quickServiceChipSelected : ""
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
                      <Input
                        value={form.requestedServices}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, requestedServices: event.target.value }))
                        }
                        placeholder="Ajouter un besoin spécifique : ex. état des lieux, coordination artisan"
                      />
                      {normalizedServices.length > 0 ? (
                        <div className={pageStyles.serviceChips}>
                          {normalizedServices.map((service) => (
                            <span key={service} className={pageStyles.serviceChip}>
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                </div>

                <div className={pageStyles.formSectionCard}>
                  <label className={pageStyles.fullField}>
                    <span>Contexte</span>
                    <Textarea
                      rows={4}
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Précisez le contexte, l’urgence éventuelle et ce que vous attendez."
                    />
                  </label>
                </div>

                <div className={pageStyles.formSectionCard}>
                  <Checkbox
                    checked={form.urgency}
                    onChange={(event) => setForm((current) => ({ ...current, urgency: event.target.checked }))}
                    label="Mission urgente"
                  />

                  <div className={pageStyles.actions}>
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? "Enregistrement..." : "Créer ma demande"}
                    </Button>
                    <ButtonLink href="/dashboard/owner/concierges" variant="secondary">
                      Rechercher une conciergerie
                    </ButtonLink>
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card className={pageStyles.listPanel} tone="soft" variant="large">
            <CardHeader className={pageStyles.sectionHeader}>
              <div>
                <p className={pageStyles.eyebrow}>Suivi</p>
                <h2 className={pageStyles.title}>Demandes et devis associés</h2>
              </div>
            </CardHeader>

            <div className={pageStyles.toolbar}>
              <SearchBar
                defaultValue={searchTerm}
                onSearch={setSearchTerm}
                placeholder="Rechercher un logement, une mission ou un service"
                className={pageStyles.searchField}
                buttonLabel="Filtrer"
              />
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tous statuts</option>
                <option value="NEW">Nouvelles</option>
                <option value="IN_DISCUSSION">En discussion</option>
                <option value="QUOTE_SENT">Devis envoyés</option>
                <option value="ACCEPTED">Acceptées</option>
                <option value="MISSION_CREATED">Mission créée</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="COMPLETED">Terminées</option>
              </Select>
            </div>

            {loading ? <p className={pageStyles.helperText}>Chargement des demandes...</p> : null}

            {!loading && filteredRequests.length === 0 ? (
              <EmptyState
                title="Aucune demande à afficher"
                description="Créez votre première demande pour commencer à suivre les devis."
                className={pageStyles.emptyState}
                primaryAction={<ButtonLink href="/dashboard/owner/concierges">Trouver un concierge</ButtonLink>}
              />
            ) : null}

            {!loading && filteredRequests.length > 0 ? (
              <div className={pageStyles.rows}>
                {filteredRequests.map((request) => {
                  const quoteSummary = summarizeQuotesByRequest(quotesByRequestId.get(request.id) ?? []);
                  const requestActions = getRequestActions(request);

                  return (
                    <OwnerRequestSummaryCard
                      key={request.id}
                      className={pageStyles.requestRow}
                      title={request.title}
                      subtitle={getRequestTypeLabel(request.request_type)}
                      status={request.status || "-"}
                      workflowStatus={request.workflow_status}
                      hasMission={Boolean(request.mission_id)}
                      urgency={request.urgency}
                      actions={
                        <div className={pageStyles.compactActions}>
                          {requestActions.showRelaunch && (
                            <ButtonLink
                              href={buildConciergeSearchHref(request)}
                              variant="ghost"
                              size="sm"
                              className={pageStyles.iconAction}
                              aria-label="Relancer la demande"
                              title="Relancer la demande"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Search size={16} aria-hidden="true" />
                            </ButtonLink>
                          )}
                          {requestActions.showQuotes && (
                            <ButtonLink
                              href={buildRequestQuotesHref(request.id)}
                              variant="secondary"
                              size="sm"
                              className={pageStyles.iconActionPrimary}
                              aria-label={requestActions.primaryLabel}
                              title={requestActions.primaryLabel}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Eye size={16} aria-hidden="true" />
                              <span className={pageStyles.actionLabel}>{requestActions.primaryLabel}</span>
                            </ButtonLink>
                          )}
                        </div>
                      }
                      primaryFacts={[
                        { label: "Appartement", value: request.property_name || "À préciser" },
                        {
                          label: "Localisation",
                          value:
                            [request.city, request.postal_code].filter(Boolean).join(" ") || "À préciser",
                        },
                        { label: "Début", value: formatDateTime(request.desired_date) },
                        { label: "Budget", value: formatAmount(request.budget_max, request.currency ?? "EUR") },
                      ]}
                      secondaryFacts={[
                        { label: "Concierges proposés", value: request.recipients.length },
                        {
                          label: "Réponses",
                          value: request.recipients.filter((recipient) =>
                            ["interested", "quoted", "selected", "not_selected", "declined"].includes(
                              recipient.status,
                            ),
                          ).length,
                        },
                        { label: "Devis", value: quoteSummary.total },
                      ]}
                      services={request.requested_services ?? []}
                      emptyServicesLabel="Services à préciser"
                      helperTexts={[
                        `Créée le ${formatDateTime(request.created_at)}`,
                        ...getRecipientResponseSummary(request),
                      ]}
                    />
                  );
                })}
              </div>
            ) : null}
          </Card>
        </div>
      </section>
    </div>
  );
}
