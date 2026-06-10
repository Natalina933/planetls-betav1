"use client";

import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Handshake,
  Home,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ButtonLink, Input, Select } from "@/components/ui";
import styles from "./OwnerAcceptedPartnersPage.module.scss";

type OwnerQuoteRow = {
  id: string;
  quote_number?: string | null;
  status: string | null;
  concierge_profile_id?: string | null;
  service_request_id?: string | null;
  service_request_recipient_id?: string | null;
  currency?: string | null;
  total_amount?: number | null;
  valid_until?: string | null;
  accepted_at?: string | null;
  created_at?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
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

type OwnerServiceRequestRow = {
  id: string;
  title: string;
  property_name?: string | null;
  city?: string | null;
  requested_services?: string[] | null;
};

type RequestsPayload = {
  items?: OwnerServiceRequestRow[];
  error?: string;
};

type SortMode = "recent" | "amount_desc" | "amount_asc" | "validity";

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getMetadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function getQuoteRequestId(quote: OwnerQuoteRow) {
  return quote.service_request_id || getMetadataString(quote.metadata, "service_request_id") || null;
}

function getConciergeName(quote: OwnerQuoteRow) {
  return (
    quote.concierge?.company_name ||
    [quote.concierge?.first_name, quote.concierge?.last_name].filter(Boolean).join(" ").trim() ||
    "Conciergerie"
  );
}

function getInitials(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "C";
}

function formatAmount(value: number | null | undefined, currency = "EUR") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Sur devis";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
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

function getRequestForQuote(quote: OwnerQuoteRow, requests: OwnerServiceRequestRow[]) {
  const requestId = getQuoteRequestId(quote);
  return requestId ? requests.find((request) => request.id === requestId) : undefined;
}

function getPropertyLabel(quote: OwnerQuoteRow, request?: OwnerServiceRequestRow) {
  return (
    request?.property_name ||
    request?.city ||
    getMetadataString(quote.metadata, "property_name") ||
    getMetadataString(quote.metadata, "city") ||
    "Logement à préciser"
  );
}

function getServices(quote: OwnerQuoteRow, request?: OwnerServiceRequestRow) {
  const requestServices = request?.requested_services ?? [];
  if (requestServices.length > 0) return requestServices;
  return (quote.quote_items ?? []).map((item) => item.label?.trim()).filter((item): item is string => Boolean(item));
}

export default function OwnerAcceptedPartnersPage() {
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [quotesResponse, requestsResponse] = await Promise.all([
        fetch("/api/quotes?limit=100", { cache: "no-store" }),
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
      ]);

      const quotesPayload = await quotesResponse.json();
      const requestsPayload = (await requestsResponse.json()) as RequestsPayload;

      if (!quotesResponse.ok) throw new Error(quotesPayload?.error || "Impossible de charger les devis.");
      if (!requestsResponse.ok) throw new Error(requestsPayload?.error || "Impossible de charger les demandes liées.");

      setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
      setRequests(Array.isArray(requestsPayload.items) ? requestsPayload.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les partenaires acceptés.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const acceptedQuotes = useMemo(
    () => quotes.filter((quote) => normalizeStatus(quote.status) === "accepted"),
    [quotes],
  );

  const rows = useMemo(
    () =>
      acceptedQuotes.map((quote) => {
        const request = getRequestForQuote(quote, requests);
        return {
          quote,
          request,
          conciergeName: getConciergeName(quote),
          propertyLabel: getPropertyLabel(quote, request),
          services: getServices(quote, request),
        };
      }),
    [acceptedQuotes, requests],
  );

  const propertyOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.propertyLabel).filter(Boolean))).sort((left, right) => left.localeCompare(right, "fr")),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const next = rows.filter((row) => {
      if (propertyFilter !== "all" && row.propertyLabel !== propertyFilter) return false;
      if (!normalizedSearch) return true;
      const haystack = [
        row.conciergeName,
        row.propertyLabel,
        row.quote.quote_number,
        row.quote.package?.name,
        row.quote.notes,
        ...row.services,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    return [...next].sort((left, right) => {
      if (sortMode === "amount_desc") return (right.quote.total_amount ?? 0) - (left.quote.total_amount ?? 0);
      if (sortMode === "amount_asc") return (left.quote.total_amount ?? 0) - (right.quote.total_amount ?? 0);
      if (sortMode === "validity") {
        return new Date(left.quote.valid_until ?? 0).getTime() - new Date(right.quote.valid_until ?? 0).getTime();
      }
      return new Date(right.quote.accepted_at ?? right.quote.created_at ?? 0).getTime() - new Date(left.quote.accepted_at ?? left.quote.created_at ?? 0).getTime();
    });
  }, [propertyFilter, rows, searchTerm, sortMode]);

  const totalAcceptedAmount = acceptedQuotes.reduce((sum, quote) => sum + (quote.total_amount ?? 0), 0);
  const conciergeCount = new Set(acceptedQuotes.map((quote) => quote.concierge_profile_id || getConciergeName(quote))).size;
  const acceptedPropertiesCount = new Set(rows.map((row) => row.propertyLabel)).size;
  const nextValidUntil = acceptedQuotes
    .map((quote) => quote.valid_until)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Partenaires acceptés</p>
          <h1>Devis acceptés</h1>
          <p>
            Retrouvez uniquement les conciergeries dont le devis a été accepté, avec les informations utiles pour piloter
            la collaboration sans mélanger les demandes encore en cours.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink href="/dashboard/owner/devis" variant="secondary">
              <FileText size={16} aria-hidden="true" /> Voir tous les devis
            </ButtonLink>
            <ButtonLink href="/dashboard/owner/demandes" variant="secondary">
              <ArrowRight size={16} aria-hidden="true" /> Demandes
            </ButtonLink>
          </div>
        </div>
        <div className={styles.heroSnapshot}>
          <span><Handshake size={16} /> Collaborations validées</span>
          <strong>{loading ? "..." : acceptedQuotes.length}</strong>
          <p>devis acceptés</p>
          <div className={styles.heroProgress}>
            <span style={{ width: `${Math.min(100, Math.max(14, acceptedQuotes.length * 24))}%` }} />
          </div>
        </div>
      </header>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <section className={styles.statsGrid} aria-label="Indicateurs partenaires acceptés">
        <StatCard icon={<CheckCircle2 size={18} />} label="Devis acceptés" value={loading ? "..." : String(acceptedQuotes.length)} />
        <StatCard icon={<Handshake size={18} />} label="Conciergeries" value={loading ? "..." : String(conciergeCount)} />
        <StatCard icon={<Home size={18} />} label="Logements concernés" value={loading ? "..." : String(acceptedPropertiesCount)} />
        <StatCard icon={<Sparkles size={18} />} label="Montant validé" value={loading ? "..." : formatAmount(totalAcceptedAmount)} />
        <StatCard icon={<CalendarClock size={18} />} label="Prochaine validité" value={loading ? "..." : formatDate(nextValidUntil)} />
      </section>

      <section className={styles.filtersPanel} aria-label="Filtres partenaires">
        <label className={styles.searchField}>
          <Search size={17} aria-hidden="true" />
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher une conciergerie, un logement, un devis..." />
        </label>
        <Select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)} aria-label="Filtrer par logement">
          <option value="all">Tous les logements</option>
          {propertyOptions.map((property) => (
            <option key={property} value={property}>{property}</option>
          ))}
        </Select>
        <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Trier">
          <option value="recent">Acceptés récemment</option>
          <option value="amount_desc">Montant décroissant</option>
          <option value="amount_asc">Montant croissant</option>
          <option value="validity">Validité proche</option>
        </Select>
      </section>

      <section className={styles.sectionPanel}>
        <SectionHeader
          eyebrow="Collaborations validées"
          title="Conciergeries liées à un devis accepté"
          description="Chaque carte correspond à un devis accepté. Les demandes sans devis accepté ne sont pas affichées ici."
        />
        {loading ? <SkeletonList /> : null}
        {!loading && filteredRows.length === 0 ? (
          <EmptyPanel title="Aucun devis accepté" text="Acceptez un devis depuis la page Devis pour voir la conciergerie apparaître ici." />
        ) : null}
        <div className={styles.partnerGrid}>
          {filteredRows.map((row) => (
            <AcceptedPartnerCard key={row.quote.id} row={row} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AcceptedPartnerCard({
  row,
}: {
  row: {
    quote: OwnerQuoteRow;
    request?: OwnerServiceRequestRow;
    conciergeName: string;
    propertyLabel: string;
    services: string[];
  };
}) {
  return (
    <article className={styles.partnerCard}>
      <div className={styles.cardTop}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{getInitials(row.conciergeName)}</div>
          <div>
            <p className={styles.eyebrow}>Devis accepté</p>
            <h3>{row.conciergeName}</h3>
            <span>{row.propertyLabel}</span>
          </div>
        </div>
        <span className={styles.statusBubble}><ShieldCheck size={14} /> Accepté</span>
      </div>
      <div className={styles.factGrid}>
        <Metric label="Montant" value={formatAmount(row.quote.total_amount, row.quote.currency ?? "EUR")} />
        <Metric label="Devis" value={row.quote.quote_number || row.quote.id.slice(0, 8)} />
        <Metric label="Pack" value={row.quote.package?.name || "Sur mesure"} />
        <Metric label="Accepté le" value={formatDate(row.quote.accepted_at || row.quote.created_at)} />
      </div>
      <div className={styles.chipRow}>
        {row.services.slice(0, 5).map((service) => <span key={service} className={styles.serviceChip}>{service}</span>)}
        {row.services.length === 0 ? <span className={styles.serviceChip}>Services à préciser</span> : null}
      </div>
      {row.quote.notes ? <p className={styles.quoteNote}>{row.quote.notes}</p> : null}
      <div className={styles.cardFooter}>
        <span className={styles.trustBadge}><ShieldCheck size={14} /> Collaboration validée par devis</span>
        <Link href={`/dashboard/owner/devis?quote=${encodeURIComponent(row.quote.id)}`} className={styles.textLink}>
          Voir le devis <ArrowRight size={14} />
        </Link>
      </div>
    </article>
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className={styles.statCard}>
      <span className={styles.statIcon}>{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
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
      <FileText size={22} aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
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
