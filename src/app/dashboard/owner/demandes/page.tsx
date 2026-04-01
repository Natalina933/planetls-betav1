"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  urgency?: boolean;
  created_at?: string | null;
  recipients: OwnerServiceRequestRecipient[];
};

type OwnerQuoteRow = {
  id: string;
  status: string | null;
  metadata?: Record<string, unknown> | null;
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

function getRecipientSummary(request: OwnerServiceRequestRow) {
  const count = request.recipients?.length ?? 0;
  if (count === 0) return "Aucun concierge ciblé";
  return `${count} concierge${count > 1 ? "s" : ""} ciblé${count > 1 ? "s" : ""}`;
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

export default function OwnerRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [housing, setHousing] = useState<OwnerHousingRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
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

      const [requestsResponse, housingResponse, quotesResponse] = await Promise.all([
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/quotes?limit=100", { cache: "no-store" }),
      ]);

      const requestsPayload = (await requestsResponse.json()) as OwnerRequestsPayload;
      const housingPayload = await housingResponse.json();
      const quotesPayload = await quotesResponse.json();

      if (!requestsResponse.ok) {
        throw new Error(requestsPayload?.error || "Impossible de charger les demandes.");
      }
      if (!housingResponse.ok) {
        throw new Error(housingPayload?.error || "Impossible de charger les logements.");
      }
      if (!quotesResponse.ok) {
        throw new Error(quotesPayload?.error || "Impossible de charger les devis.");
      }

      setRequests(Array.isArray(requestsPayload?.items) ? requestsPayload.items : []);
      setHousing(Array.isArray(housingPayload) ? housingPayload : []);
      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
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
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
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
    () => requests.filter((request) => request.status === "draft").length,
    [requests],
  );

  const sentCount = useMemo(
    () =>
      requests.filter((request) => request.status === "sent" || request.status === "in_review").length,
    [requests],
  );

  const quotedCount = useMemo(
    () => requests.filter((request) => request.status === "quoted").length,
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
        actions={[
          { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
          { label: "Voir mes devis", href: "/dashboard/owner/devis" },
        ]}
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

                <label className={pageStyles.fullField}>
                  <span>Titre</span>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex : check-in et ménage de lancement"
                  />
                </label>

                <label className={pageStyles.fullField}>
                  <span>Services demandés</span>
                  <div className={pageStyles.chipsInputWrap}>
                    <Input
                      value={form.requestedServices}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, requestedServices: event.target.value }))
                      }
                      placeholder="Ex : check-in, ménage, blanchisserie"
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

                <label className={pageStyles.fullField}>
                  <span>Contexte</span>
                  <Textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Précisez le contexte, l’urgence éventuelle et ce que vous attendez."
                  />
                </label>

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
                <option value="draft">Brouillons</option>
                <option value="sent">Envoyées</option>
                <option value="in_review">En cours d'examen</option>
                <option value="quoted">Avec devis</option>
                <option value="selected">Concierge retenu</option>
                <option value="closed">Clôturées</option>
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

                  return (
                    <OwnerRequestSummaryCard
                      key={request.id}
                      className={pageStyles.requestRow}
                      title={request.title}
                      subtitle={getRequestTypeLabel(request.request_type)}
                      status={request.status || "-"}
                      urgency={request.urgency}
                      interactive
                      onOpen={() => router.push(buildRequestQuotesHref(request.id))}
                      actions={
                        <>
                          <ButtonLink
                            href={buildConciergeSearchHref(request)}
                            variant="secondary"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {request.status === "draft" ? "Lancer la recherche" : "Relancer la recherche"}
                          </ButtonLink>
                          <ButtonLink
                            href={buildRequestQuotesHref(request.id)}
                            variant="secondary"
                            onClick={(event) => event.stopPropagation()}
                          >
                            Voir les devis
                          </ButtonLink>
                        </>
                      }
                      primaryFacts={[
                        { label: "Logement", value: request.property_name || "À préciser" },
                        { label: "Début", value: formatDateTime(request.desired_date) },
                        { label: "Budget", value: formatAmount(request.budget_max, request.currency ?? "EUR") },
                      ]}
                      secondaryFacts={[
                        { label: "Devis", value: quoteSummary.total },
                        { label: "À valider", value: quoteSummary.pending },
                        { label: "Retenus", value: quoteSummary.accepted },
                      ]}
                      services={request.requested_services ?? []}
                      emptyServicesLabel="Services à préciser"
                      helperTexts={[
                        `${getRecipientSummary(request)} · créée le ${formatDateTime(request.created_at)}`,
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
