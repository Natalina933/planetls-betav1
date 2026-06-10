"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Handshake,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import { Button, ButtonLink, Checkbox, Input, Select, Textarea } from "@/components/ui";
import styles from "./OwnerConciergeriesPage.module.scss";

type SectionKey = "recherche" | "demandes" | "devis" | "partenaires";
type RequestType = "ponctuel" | "renfort" | "durable";
type RelationStatus = "draft" | "sent" | "viewed" | "discussion" | "accepted" | "declined" | "expired";

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
  request_type: RequestType;
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
  quote_number?: string | null;
  status: string | null;
  service_request_id?: string | null;
  service_request_recipient_id?: string | null;
  concierge_profile_id?: string | null;
  owner_profile_id?: string | null;
  mission_id?: string | null;
  package_id?: string | null;
  currency?: string | null;
  subtotal?: number | null;
  discount_amount?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total_amount?: number | null;
  valid_until?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  concierge?: {
    id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
  } | null;
  package?: {
    id?: string | null;
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
  requestType: RequestType;
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

const sections: Array<{ key: SectionKey; label: string; hint: string }> = [
  { key: "recherche", label: "Recherche", hint: "Créer une mise en relation" },
  { key: "demandes", label: "Demandes", hint: "Suivre les réponses" },
  { key: "devis", label: "Devis reçus", hint: "Comparer et décider" },
  { key: "partenaires", label: "Partenaires", hint: "Collaborations actives" },
];

const statusMeta: Record<RelationStatus, { label: string; className: string; summary: string }> = {
  draft: { label: "En brouillon", className: styles.statusDraft, summary: "La demande n'est pas encore diffusée." },
  sent: { label: "En attente", className: styles.statusSent, summary: "Les conciergeries ont été contactées." },
  viewed: { label: "Consultée", className: styles.statusViewed, summary: "Au moins une conciergerie a ouvert la demande." },
  discussion: { label: "En discussion", className: styles.statusDiscussion, summary: "Des échanges ou propositions sont en cours." },
  accepted: { label: "Acceptée", className: styles.statusAccepted, summary: "Une collaboration est validée." },
  declined: { label: "Refusée", className: styles.statusDeclined, summary: "La demande n'a pas abouti." },
  expired: { label: "Expirée", className: styles.statusExpired, summary: "La demande doit être relancée." },
};

const requestTypeLabels: Record<RequestType, string> = {
  ponctuel: "Besoin ponctuel",
  renfort: "Renfort / remplacement",
  durable: "Collaboration durable",
};

const currencyOptions = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "CHF", label: "CHF" },
];

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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

function formatDate(value: string | null | undefined) {
  if (!value) return "Non défini";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function getQuoteRequestId(quote: OwnerQuoteRow) {
  if (quote.service_request_id) return quote.service_request_id;
  const metadata = quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
    ? quote.metadata
    : null;
  return metadata && typeof metadata.service_request_id === "string" ? metadata.service_request_id : null;
}

function getConciergeNameFromQuote(quote: OwnerQuoteRow) {
  const concierge = quote.concierge;
  return (
    concierge?.company_name ||
    [concierge?.first_name, concierge?.last_name].filter(Boolean).join(" ").trim() ||
    "Conciergerie"
  );
}

function getRequestConciergeNames(request: OwnerServiceRequestRow) {
  const names = request.recipients
    .map((recipient) => recipient.concierge_name?.trim())
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(names));
}

function getRequestRelationStatus(request: OwnerServiceRequestRow): RelationStatus {
  const status = normalizeStatus(request.workflow_status ?? request.status);
  const recipients = Array.isArray(request.recipients) ? request.recipients : [];
  const recipientStatuses = recipients.map((recipient) => normalizeStatus(recipient.status));

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
  if (status === "in_review" || recipientStatuses.includes("viewed")) return "viewed";
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

function buildTitleSuggestion(form: RequestFormState) {
  const firstService = normalizeServices(form.requestedServices)[0] || "gestion";
  const property = form.propertyName.trim() || "logement";
  return form.city.trim() ? `${firstService} - ${property} - ${form.city.trim()}` : `${firstService} - ${property}`;
}

function getTimelineState(request: OwnerServiceRequestRow, quotesByRequestId: Map<string, OwnerQuoteRow[]>) {
  const status = getRequestRelationStatus(request);
  const quotes = quotesByRequestId.get(request.id) ?? [];
  return [
    { label: "Demande envoyée", done: status !== "draft" },
    { label: "Consultation", done: getViewedCount(request) > 0 || ["viewed", "discussion", "accepted"].includes(status) },
    { label: "Réponse", done: getResponseCount(request) > 0 || ["discussion", "accepted"].includes(status) },
    { label: "Échanges", done: status === "discussion" || status === "accepted" },
    { label: "Devis reçu", done: quotes.length > 0 || status === "accepted" },
    { label: "Validation", done: status === "accepted" },
  ];
}

export default function OwnerConciergeriesPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("partenaires");
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [housing, setHousing] = useState<OwnerHousingRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("accepted");
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

      const requestsPayload = (await requestsResponse.json()) as RequestsPayload;
      const housingPayload = await housingResponse.json();
      const quotesPayload = await quotesResponse.json();

      if (!requestsResponse.ok) throw new Error(requestsPayload?.error || "Impossible de charger les demandes.");
      if (!housingResponse.ok) throw new Error(housingPayload?.error || "Impossible de charger les logements.");
      if (!quotesResponse.ok) throw new Error(quotesPayload?.error || "Impossible de charger les devis.");

      setRequests(Array.isArray(requestsPayload.items) ? requestsPayload.items : []);
      setHousing(Array.isArray(housingPayload) ? housingPayload : []);
      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger l'espace Conciergeries.");
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

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const relationStatus = getRequestRelationStatus(request);
      if (statusFilter !== "all" && relationStatus !== statusFilter) return false;
      if (!normalizedSearch) return true;
      const haystack = [
        request.title,
        request.property_name,
        request.city,
        request.description,
        ...getRequestConciergeNames(request),
        ...(request.requested_services ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [requests, searchTerm, statusFilter]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => ["sent", "viewed"].includes(getRequestRelationStatus(request))),
    [requests],
  );

  const discussionRequests = useMemo(
    () => requests.filter((request) => getRequestRelationStatus(request) === "discussion"),
    [requests],
  );

  const acceptedRequests = useMemo(
    () => requests.filter((request) => getRequestRelationStatus(request) === "accepted"),
    [requests],
  );

  const actionableQuotes = useMemo(
    () => quotes.filter((quote) => !["accepted", "rejected", "expired", "canceled"].includes(normalizeStatus(quote.status))),
    [quotes],
  );

  const acceptedQuotes = useMemo(
    () => quotes.filter((quote) => normalizeStatus(quote.status) === "accepted"),
    [quotes],
  );

  const partners = useMemo(() => {
    return acceptedQuotes.map((quote) => {
      const requestId = getQuoteRequestId(quote);
      const request = requestId ? requests.find((item) => item.id === requestId) : undefined;
      return {
        key: quote.id,
        conciergeName: getConciergeNameFromQuote(quote),
        request,
        quote,
        missionCount: quote.mission_id ? 1 : 0,
        propertyName: request?.property_name || request?.city || "Logement à préciser",
        services: request?.requested_services ?? quote.quote_items?.map((item) => item.label || "").filter(Boolean) ?? [],
      };
    });
  }, [acceptedQuotes, requests]);

  const metrics = [
    { label: "Demandes acceptées", value: loading ? "..." : String(acceptedRequests.length) },
    { label: "En attente", value: loading ? "..." : String(pendingRequests.length) },
    { label: "Devis reçus", value: loading ? "..." : String(quotes.length) },
    { label: "Devis acceptés", value: loading ? "..." : String(partners.length) },
  ];

  const titleSuggestion = buildTitleSuggestion(form);
  const normalizedServices = normalizeServices(form.requestedServices);

  function handleHousingChange(value: string) {
    const selectedHousing = housingOptions.find((item) => item.key === value) ?? null;
    setForm((current) => ({
      ...current,
      propertyKey: value,
      propertyName: selectedHousing?.label ?? "",
      city: current.city || selectedHousing?.city || "",
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
      setError("Ajoutez au moins un service demandé.");
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
      setSuccess("Demande créée. Elle apparaît maintenant dans le suivi relationnel.");
      setForm(initialForm);
      setActiveSection("demandes");
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
      if (status === "accepted") setActiveSection("partenaires");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le devis.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  return (
    <div className={styles.page}>
      <OwnerWorkspacePage
        eyebrow="Conciergeries"
        title="Gestion des partenaires conciergerie"
        description={
          loading
            ? "Chargement des relations..."
            : "Recherchez, suivez les échanges, comparez les devis puis pilotez vos partenaires validés."
        }
        metrics={metrics}
        actions={[{ label: "Trouver une conciergerie", href: "/dashboard/owner/concierges", variant: "primary" }]}
        cards={[]}
      />

      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <nav className={styles.sectionNav} aria-label="Sections conciergeries">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            className={activeSection === section.key ? styles.sectionTabActive : styles.sectionTab}
            onClick={() => setActiveSection(section.key)}
          >
            <span>{section.label}</span>
            <small>{section.hint}</small>
          </button>
        ))}
      </nav>

      <section className={styles.overviewGrid} aria-label="Vue relationnelle">
        <InsightCard icon={<Search size={18} />} label="Je cherche" value={`${pendingRequests.length} demande(s)`} hint="Demandes envoyées ou consultées" />
        <InsightCard icon={<MessageSquareText size={18} />} label="Je discute" value={`${discussionRequests.length} échange(s)`} hint="Réponses, questions, propositions" />
        <InsightCard icon={<FileText size={18} />} label="Je compare" value={`${actionableQuotes.length} devis actif(s)`} hint="À accepter ou refuser" />
        <InsightCard icon={<Handshake size={18} />} label="Je travaille" value={`${partners.length} partenaire(s)`} hint="Collaborations validées" />
      </section>

      {activeSection === "recherche" ? (
        <section className={styles.searchLayout}>
          <form className={styles.searchPanel} onSubmit={handleSubmit}>
            <SectionHeader eyebrow="Recherche" title="Nouvelle demande de mise en relation" description="Décrivez le besoin, le logement et les services attendus. Cette étape reste commerciale et relationnelle." />
            <div className={styles.formGrid}>
              <label className={styles.field}>
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
              <label className={styles.field}>
                <span>Type de besoin</span>
                <Select
                  value={form.requestType}
                  onChange={(event) => setForm((current) => ({ ...current, requestType: event.target.value as RequestType }))}
                >
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
                  <Input type="number" min="0" inputMode="numeric" value={form.budgetMax} onChange={(event) => setForm((current) => ({ ...current, budgetMax: event.target.value }))} placeholder="Sur devis" />
                  <Select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}>
                    {currencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </div>
              </label>
              <label className={`${styles.field} ${styles.fullField}`}>
                <span>Titre</span>
                <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex : check-in et ménage de lancement" />
                <button type="button" className={styles.suggestionButton} onClick={() => setForm((current) => ({ ...current, title: titleSuggestion }))}>
                  Utiliser : {titleSuggestion}
                </button>
              </label>
              <label className={`${styles.field} ${styles.fullField}`}>
                <span>Services demandés</span>
                <Input value={form.requestedServices} onChange={(event) => setForm((current) => ({ ...current, requestedServices: event.target.value }))} placeholder="check-in, ménage, linge, maintenance..." />
                {normalizedServices.length > 0 ? (
                  <div className={styles.chipRow}>
                    {normalizedServices.map((service) => <span key={service} className={styles.serviceChip}>{service}</span>)}
                  </div>
                ) : null}
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
                <span>Détails utiles</span>
                <Textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Contexte, contraintes d'accès, attentes, ton souhaité avec les voyageurs..." />
              </label>
              <div className={styles.fullField}>
                <Checkbox checked={form.urgency} onChange={(event) => setForm((current) => ({ ...current, urgency: event.target.checked }))} label="Demande urgente" />
              </div>
            </div>
            <div className={styles.formActions}>
              <Button type="submit" disabled={submitting}>
                <Send size={16} aria-hidden="true" /> {submitting ? "Création..." : "Créer la demande"}
              </Button>
              <ButtonLink href="/dashboard/owner/concierges" variant="secondary">
                <Search size={16} aria-hidden="true" /> Rechercher des profils
              </ButtonLink>
            </div>
          </form>
          <aside className={styles.guidancePanel}>
            <SectionHeader eyebrow="Repère" title="Une demande n'est pas une mission" description="Ici, vous cherchez un partenaire. Les missions opérationnelles viennent après validation d'une collaboration." />
            <div className={styles.emotionStack}>
              <EmotionStep icon={<Search size={18} />} title="Demandes" text="Je cherche un partenaire." />
              <EmotionStep icon={<FileText size={18} />} title="Devis" text="Je compare des propositions." />
              <EmotionStep icon={<Handshake size={18} />} title="Partenaires" text="Je travaille avec une équipe de confiance." />
            </div>
          </aside>
        </section>
      ) : null}

      {activeSection === "demandes" ? (
        <section className={styles.sectionPanel}>
          <SectionHeader eyebrow="Demandes" title="Suivi relationnel des conciergeries contactées" description="Chaque carte montre la progression commerciale : diffusion, consultation, réponse, devis, validation." />
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={16} aria-hidden="true" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher une demande, une ville, un service..." />
            </label>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">En attente</option>
              <option value="viewed">Consultée</option>
              <option value="discussion">En discussion</option>
              <option value="accepted">Acceptée</option>
              <option value="declined">Refusée</option>
              <option value="expired">Expirée</option>
            </Select>
          </div>
          {loading ? <p className={styles.emptyText}>Chargement des demandes...</p> : null}
          {!loading && filteredRequests.length === 0 ? <EmptyPanel title="Aucune demande trouvée" text="Créez une demande ou modifiez vos filtres." /> : null}
          <div className={styles.requestGrid}>
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} quotesByRequestId={quotesByRequestId} />
            ))}
          </div>
        </section>
      ) : null}

      {activeSection === "devis" ? (
        <section className={styles.sectionPanel}>
          <SectionHeader eyebrow="Devis reçus" title="Comparer les propositions avant de valider" description="Prix, services inclus, pack, disponibilité et actions sont séparés des demandes pour une décision plus simple." />
          {!loading && quotes.length === 0 ? <EmptyPanel title="Aucun devis reçu" text="Les devis apparaîtront ici dès qu'une conciergerie répond avec une proposition." /> : null}
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
      ) : null}

      {activeSection === "partenaires" ? (
        <section className={styles.sectionPanel}>
          <SectionHeader eyebrow="Partenaires acceptés" title="Devis acceptés" description="Seules les conciergeries avec un devis accepté apparaissent ici." />
          {!loading && partners.length === 0 ? <EmptyPanel title="Aucun devis accepté" text="Acceptez un devis pour voir la conciergerie et les informations du devis ici." /> : null}
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
                  <Metric label="Montant accepté" value={formatAmount(partner.quote?.total_amount, partner.quote?.currency ?? "EUR")} />
                  <Metric label="Devis" value={partner.quote?.quote_number || partner.quote?.id.slice(0, 8) || "Accepté"} />
                  <Metric label="Pack" value={partner.quote?.package?.name || "Sur mesure"} />
                  <Metric label="Services" value={"services" in partner ? partner.services.slice(0, 2).join(", ") || "À préciser" : "À préciser"} />
                </div>
                <div className={styles.partnerFooter}>
                  <span className={styles.trustBadge}><ShieldCheck size={14} /> Devis accepté</span>
                  {partner.quote ? (
                    <Link href={`/dashboard/owner/devis?quote=${encodeURIComponent(partner.quote.id)}`} className={styles.textLink}>
                      Voir le devis <ArrowRight size={14} />
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
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

function InsightCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <article className={styles.insightCard}>
      <span className={styles.insightIcon}>{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{hint}</p>
      </div>
    </article>
  );
}

function EmotionStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className={styles.emotionStep}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function RequestCard({ request, quotesByRequestId }: { request: OwnerServiceRequestRow; quotesByRequestId: Map<string, OwnerQuoteRow[]> }) {
  const relationStatus = getRequestRelationStatus(request);
  const meta = statusMeta[relationStatus];
  const conciergeNames = getRequestConciergeNames(request);
  const displayName = conciergeNames[0] || "Conciergeries contactées";
  const timeline = getTimelineState(request, quotesByRequestId);
  const quotes = quotesByRequestId.get(request.id) ?? [];

  return (
    <article className={styles.requestCard}>
      <div className={styles.requestTop}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{getInitials(displayName)}</div>
          <div>
            <h3>{request.title}</h3>
            <p>{displayName}{conciergeNames.length > 1 ? ` +${conciergeNames.length - 1}` : ""}</p>
          </div>
        </div>
        <span className={`${styles.statusBubble} ${meta.className}`}>{meta.label}</span>
      </div>
      <p className={styles.requestSummary}>{meta.summary}</p>
      <div className={styles.factGrid}>
        <Metric label="Logement" value={request.property_name || "À préciser"} />
        <Metric label="Zone" value={[request.city, request.postal_code].filter(Boolean).join(" ") || "À préciser"} />
        <Metric label="Envoyée" value={formatDate(request.created_at)} />
        <Metric label="Réponses" value={`${getResponseCount(request)}/${request.recipients.length}`} />
      </div>
      <div className={styles.chipRow}>
        <span className={styles.serviceChip}>{requestTypeLabels[request.request_type]}</span>
        {(request.requested_services ?? []).slice(0, 4).map((service) => <span key={service} className={styles.serviceChip}>{service}</span>)}
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
        <span><MessageSquareText size={14} /> Dernier échange : {getLastExchangeLabel(request)}</span>
        <Link href={`/dashboard/owner/devis?request=${encodeURIComponent(request.id)}`} className={styles.textLink}>
          {quotes.length > 0 ? `${quotes.length} devis` : "Voir le suivi"} <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function getLastExchangeLabel(request: OwnerServiceRequestRow) {
  const lastRecipient = [...request.recipients]
    .filter((recipient) => recipient.responded_at || recipient.viewed_at)
    .sort((left, right) => String(right.responded_at ?? right.viewed_at).localeCompare(String(left.responded_at ?? left.viewed_at)))[0];
  if (!lastRecipient) return "aucun retour";
  return `${lastRecipient.concierge_name || "Conciergerie"} - ${formatDateTime(lastRecipient.responded_at || lastRecipient.viewed_at)}`;
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
  const services = quote.quote_items ?? [];
  const canDecide = !["accepted", "rejected", "expired", "canceled"].includes(status);

  return (
    <article className={styles.quoteCard}>
      <div className={styles.quoteHeader}>
        <div>
          <p className={styles.eyebrow}>{quote.quote_number || "Devis"}</p>
          <h3>{getConciergeNameFromQuote(quote)}</h3>
          <span>{request?.property_name || request?.city || "Demande associée"}</span>
        </div>
        <strong>{formatAmount(quote.total_amount, quote.currency ?? "EUR")}</strong>
      </div>
      <div className={styles.quoteHighlights}>
        <Metric label="Pack" value={quote.package?.name || "Sur mesure"} />
        <Metric label="Validité" value={formatDate(quote.valid_until)} />
        <Metric label="Statut" value={getQuoteStatusLabel(status)} />
      </div>
      <div className={styles.includedList}>
        {services.length > 0 ? services.slice(0, 5).map((item) => (
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
      <SectionHeader eyebrow="Comparateur" title="Différences principales" description="Un tableau rapide pour scanner les écarts de prix, services et packs." />
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
      return "À étudier";
  }
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
