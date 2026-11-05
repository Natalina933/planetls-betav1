"use client";

import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
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
  XCircle,
} from "lucide-react";
import { ButtonLink, Input, Select } from "@/components/ui";
import styles from "./OwnerAcceptedPartnersPage.module.scss";
import type { PendingHousingCollaboration } from "@/features/housing-collaborations/types";

/**
 * Type pour les collaborations avec des informations enrichies pour l'affichage
 */
type HousingCollaborationDisplay = {
  id: string;
  status: PendingHousingCollaboration["status"];
  owner: { id: string; name: string };
  concierge: { id: string; name: string };
  housing: { id: number; name: string };
  quote: { id: string; number: string | null } & QuoteDetails;
  request: { id: string; title: string; requested_services?: string[] | null } | null;
  end_date?: string | null;
  contractId?: string | null;
  missionId: string | null;
  termination?: Record<string, unknown> | null;
};

/**
 * Type pour la réponse de l'API housing-collaborations
 */
type HousingCollaborationsPayload = {
  items?: HousingCollaborationDisplay[];
  error?: string;
};

/**
 * Type pour les informations supplémentaires des devis (montant, date d'acceptation, etc.)
 */
type QuoteDetails = {
  id: string;
  total_amount?: number | null;
  currency?: string | null;
  accepted_at?: string | null;
  valid_until?: string | null;
  quote_number?: string | null;
  package?: { name?: string | null } | null;
  notes?: string | null;
};

/**
 * Type pour les options de tri
 */
type SortMode = "recent" | "name_asc" | "name_desc" | "housing";

/**
 * Extrait les initiales d'un nom
 */
function getInitials(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "C";
}

/**
 * Formate un montant en euros
 */
function formatAmount(value: number | null | undefined, currency = "EUR") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Sur devis";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formate une date en français
 */
function formatDate(value: string | null | undefined) {
  if (!value) return "À confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Retourne le label du statut de collaboration
 */
function getCollaborationStatusLabel(status: PendingHousingCollaboration["status"] | string) {
  switch (status) {
    case "active":
      return "Active";
    case "pending_handover":
      return "En attente";
    case "scheduled":
      return "Planifiée";
    case "paused":
      return "En pause";
    case "ended":
      return "Terminée";
    case "cancelled":
      return "Annulée";
    default:
      return "Inconnue";
  }
}

/**
 * Retourne la classe CSS pour le badge de statut
 */
function getStatusBadgeClass(status: PendingHousingCollaboration["status"] | string) {
  switch (status) {
    case "active":
      return styles.statusActive;
    case "pending_handover":
      return styles.statusPending;
    case "scheduled":
      return styles.statusScheduled;
    case "paused":
      return styles.statusPaused;
    case "ended":
      return styles.statusEnded;
    case "cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusUnknown;
  }
}

/**
 * Retourne la date de fin de collaboration si disponible
 */
function getCollaborationEndDate(collaboration: HousingCollaborationDisplay) {
  const termination = collaboration.termination;
  if (termination && typeof termination === "object" && termination !== null) {
    const endsOn = termination as Record<string, unknown>;
    if (typeof endsOn.ends_on === "string") {
      return endsOn.ends_on;
    }
    if (typeof endsOn.effective_date === "string") {
      return endsOn.effective_date;
    }
  }
  return collaboration.end_date ?? null;
}

/**
 * Composant principal de la page des partenaires
 */
export default function OwnerAcceptedPartnersPage() {
  const [collaborations, setCollaborations] = useState<HousingCollaborationDisplay[]>([]);
  const [quoteDetails, setQuoteDetails] = useState<Map<string, QuoteDetails>>(new Map());
  const [requestServices, setRequestServices] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [collaborationFilter, setCollaborationFilter] = useState<PendingHousingCollaboration["status"] | "all">("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  /**
   * Charge les données : collaborations, détails des devis et services des demandes
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les collaborations pour tous les statuts pertinents
      const [
        pendingHandoverResponse,
        activeResponse,
        scheduledResponse,
        pausedResponse,
        endedResponse,
        cancelledResponse,
      ] = await Promise.all([
        fetch("/api/housing-collaborations?status=pending_handover&details=1", { cache: "no-store" }),
        fetch("/api/housing-collaborations?status=active&details=1", { cache: "no-store" }),
        fetch("/api/housing-collaborations?status=scheduled&details=1", { cache: "no-store" }),
        fetch("/api/housing-collaborations?status=paused&details=1", { cache: "no-store" }),
        fetch("/api/housing-collaborations?status=ended&details=1", { cache: "no-store" }),
        fetch("/api/housing-collaborations?status=cancelled&details=1", { cache: "no-store" }),
      ]);

      const pendingHandoverPayload = (await pendingHandoverResponse.json()) as HousingCollaborationsPayload;
      const activePayload = (await activeResponse.json()) as HousingCollaborationsPayload;
      const scheduledPayload = (await scheduledResponse.json()) as HousingCollaborationsPayload;
      const pausedPayload = (await pausedResponse.json()) as HousingCollaborationsPayload;
      const endedPayload = (await endedResponse.json()) as HousingCollaborationsPayload;
      const cancelledPayload = (await cancelledResponse.json()) as HousingCollaborationsPayload;

      // Vérifier les réponses critiques - les collaborations
      if (!pendingHandoverResponse.ok) {
        throw new Error(pendingHandoverPayload?.error || "Impossible de charger les collaborations en attente.");
      }
      if (!activeResponse.ok) {
        throw new Error(activePayload?.error || "Impossible de charger les collaborations actives.");
      }
      if (!scheduledResponse.ok) {
        throw new Error(scheduledPayload?.error || "Impossible de charger les collaborations planifiées.");
      }
      if (!pausedResponse.ok) {
        throw new Error(pausedPayload?.error || "Impossible de charger les collaborations en pause.");
      }
      if (!endedResponse.ok) {
        throw new Error(endedPayload?.error || "Impossible de charger les collaborations terminées.");
      }
      if (!cancelledResponse.ok) {
        throw new Error(cancelledPayload?.error || "Impossible de charger les collaborations annulées.");
      }
      // Combiner toutes les collaborations sans doublons (basé sur l'ID unique)
      const allCollaborationsMap = new Map<string, HousingCollaborationDisplay>();
      const payloads = [
        pendingHandoverPayload,
        activePayload,
        scheduledPayload,
        pausedPayload,
        endedPayload,
        cancelledPayload,
      ];
      
      for (const payload of payloads) {
        if (Array.isArray(payload.items)) {
          for (const collab of payload.items) {
            // Conserver la première occurrence pour éviter les doublons
            if (!allCollaborationsMap.has(collab.id)) {
              allCollaborationsMap.set(collab.id, collab);
            }
          }
        }
      }

      const allCollaborations: HousingCollaborationDisplay[] = Array.from(allCollaborationsMap.values());

      setCollaborations(allCollaborations);

      // Extraire les détails des devis pour les collaborations
      setQuoteDetails(new Map(allCollaborations.filter(c => c.quote.id).map(c => [c.quote.id, { ...c.quote, quote_number: c.quote.number }])));
      setRequestServices(new Map(allCollaborations.flatMap(c => c.request ? [[c.request.id, c.request.requested_services ?? []] as [string, string[]]] : [])));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les partenaires.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void loadData(); }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  /**
   * Filtre les collaborations selon les critères sélectionnés
   */
  const filteredCollaborations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    let result = collaborations;

    // Filtre par statut de collaboration
    if (collaborationFilter !== "all") {
      result = result.filter(c => c.status === collaborationFilter);
    }

    // Filtre par logement
    if (propertyFilter !== "all") {
      result = result.filter(c => c.housing.name === propertyFilter);
    }

    // Filtre par recherche
    if (normalizedSearch) {
      result = result.filter(c => {
        const haystack = [
          c.concierge.name,
          c.housing.name,
          c.quote.number,
          c.request?.title,
          ...(requestServices.get(c.request?.id ?? "") ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    // Tri
    return [...result].sort((left, right) => {
      if (sortMode === "name_asc") {
        return left.concierge.name.localeCompare(right.concierge.name, "fr");
      }
      if (sortMode === "name_desc") {
        return right.concierge.name.localeCompare(left.concierge.name, "fr");
      }
      if (sortMode === "housing") {
        return left.housing.name.localeCompare(right.housing.name, "fr");
      }
      // Tri par défaut : les actives en premier, puis par date de création (plus récentes d'abord)
      // Comme on n'a pas la date de création, on utilise l'ordre du tableau
      return 0;
    });
  }, [collaborations, collaborationFilter, propertyFilter, requestServices, searchTerm, sortMode]);

  /**
   * Calcule les statistiques pour l'affichage
   */
  const stats = useMemo(() => {
    const activeCount = collaborations.filter(c => c.status === "active").length;
    const endedCount = collaborations.filter(c => c.status === "ended").length;
    const scheduledCount = collaborations.filter(c => c.status === "scheduled").length;
    const pausedCount = collaborations.filter(c => c.status === "paused").length;
    const pendingCount = collaborations.filter(c => c.status === "pending_handover").length;
    const cancelledCount = collaborations.filter(c => c.status === "cancelled").length;
    
    const quotes = Array.from(quoteDetails.values());
    const currencies = new Set(quotes.map(quote => quote.currency ?? "EUR"));
    const totalAmount = quotes.every(quote => typeof quote.total_amount === "number" && Number.isFinite(quote.total_amount))
      ? quotes.reduce((sum, quote) => sum + (quote.total_amount ?? 0), 0) : null;
    const totalCurrency = currencies.values().next().value ?? "EUR";
    const multipleCurrencies = currencies.size > 1;
    
    const conciergeNames = new Set(collaborations.map(c => c.concierge.name));
    const housingNames = new Set(collaborations.map(c => c.housing.name));
    
    // Prochaine date de fin parmi les collaborations actives avec date de fin
    const endDates = collaborations
      .filter(c => c.status === "active")
      .map(c => getCollaborationEndDate(c))
      .filter((date): date is string => Boolean(date))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return {
      total: collaborations.length,
      activeCount,
      endedCount,
      scheduledCount,
      pausedCount,
      pendingCount,
      cancelledCount,
      totalAmount,
      totalCurrency,
      multipleCurrencies,
      conciergeCount: conciergeNames.size,
      housingCount: housingNames.size,
      nextEndDate: endDates[0] ?? null,
    };
  }, [collaborations, quoteDetails]);

  /**
   * Options de filtre par logement
   */
  const propertyOptions = useMemo(() => {
    return Array.from(
      new Set(collaborations.map(c => c.housing.name).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "fr"));
  }, [collaborations]);

  /**
   * Options de filtre par statut
   */
  const collaborationStatusOptions: Array<{
    value: PendingHousingCollaboration["status"] | "all";
    label: string;
  }> = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "Actives" },
    { value: "pending_handover", label: "En attente" },
    { value: "scheduled", label: "Planifiées" },
    { value: "paused", label: "En pause" },
    { value: "ended", label: "Terminées" },
    { value: "cancelled", label: "Annulées" },
  ];

  /**
   * Options de tri
   */
  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: "recent", label: "Ajout récent" },
    { value: "name_asc", label: "Nom A-Z" },
    { value: "name_desc", label: "Nom Z-A" },
    { value: "housing", label: "Par logement" },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Partenaires conciergeries</p>
          <h1>Mes collaborations</h1>
          <p>
            Retrouvez toutes vos conciergeries partenaires avec qui vous avez une collaboration
            active ou terminée. Les informations de devis, logement et statut sont affichées
            pour faciliter le pilotage.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink href="/dashboard/owner/concierges" variant="primary">
              <Search size={16} aria-hidden="true" /> Trouver une conciergerie
            </ButtonLink>
            <ButtonLink href="/dashboard/owner/demandes" variant="secondary">
              <FileText size={16} aria-hidden="true" /> Voir les demandes
            </ButtonLink>
          </div>
        </div>
        <div className={styles.heroSnapshot}>
          <span><Handshake size={16} /> Collaborations</span>
          <strong>{loading ? "..." : stats.total}</strong>
          <p>
            {loading ? "..." : `${stats.activeCount} active${stats.activeCount !== 1 ? "s" : ""}, ${stats.endedCount} terminée${stats.endedCount !== 1 ? "s" : ""}`}
          </p>
          <div className={styles.heroProgress}>
            <span style={{ width: `${Math.min(100, Math.max(14, stats.total * 12))}%` }} />
          </div>
        </div>
      </header>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      
      {/* Message d'information pour les collaborations en attente de finalisation */}
      {!loading && !error && stats.pendingCount > 0 ? (
        <section className={styles.infoPanel} aria-label="Collaborations en attente de finalisation">
          <div className={styles.infoContent}>
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <strong>Action requise</strong>
              <p>
                Vous avez <strong>{stats.pendingCount} collaboration(s)</strong> en attente de finalisation du contrat.
                <ButtonLink href="/dashboard/owner/devis#collaborations-en-attente" variant="secondary" size="compact">
                  Finaliser maintenant
                </ButtonLink>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.statsGrid} aria-label="Indicateurs collaborations">
        <StatCard icon={<CheckCircle2 size={18} />} label="Collaborations actives" value={loading ? "..." : String(stats.activeCount)} />
        <StatCard icon={<Handshake size={18} />} label="Conciergeries" value={loading ? "..." : String(stats.conciergeCount)} />
        <StatCard icon={<Home size={18} />} label="Logements couverts" value={loading ? "..." : String(stats.housingCount)} />
        <StatCard icon={<Sparkles size={18} />} label="Montant total" value={loading ? "..." : stats.multipleCurrencies ? "Devises multiples" : formatAmount(stats.totalAmount, stats.totalCurrency)} />
        <StatCard icon={<CalendarClock size={18} />} label="Prochaine fin" value={loading ? "..." : (stats.nextEndDate ? formatDate(stats.nextEndDate) : "Aucune")} />
      </section>

      <section className={styles.filtersPanel} aria-label="Filtres collaborations">
        <label className={styles.searchField}>
          <Search size={17} aria-hidden="true" />
          <Input 
            value={searchTerm} 
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)} 
            placeholder="Rechercher une conciergerie, un logement..." 
          />
        </label>
        <Select value={collaborationFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setCollaborationFilter(event.target.value as PendingHousingCollaboration["status"] | "all")} aria-label="Filtrer par statut">
          {collaborationStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Select value={propertyFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setPropertyFilter(event.target.value)} aria-label="Filtrer par logement">
          <option value="all">Tous les logements</option>
          {propertyOptions.map((property) => (
            <option key={property} value={property}>{property}</option>
          ))}
        </Select>
        <Select value={sortMode} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSortMode(event.target.value as SortMode)} aria-label="Trier">
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      </section>

      <section className={styles.sectionPanel}>
        <SectionHeader
          eyebrow="Collaborations validées"
          title="Partenaires conciergeries"
          description="Chaque carte correspond à une collaboration avec une conciergerie. Cliquez sur une carte pour accéder aux détails et aux opérations disponibles."
        />
        {loading ? <SkeletonList /> : null}
        {!loading && !error && filteredCollaborations.length === 0 ? (
          <EmptyPanel 
            title="Aucune collaboration trouvée" 
            text="Créez une demande, acceptez un devis ou modifiez vos filtres pour voir vos partenaires." 
          />
        ) : null}
        <div className={styles.partnerGrid}>
          {filteredCollaborations.map((collaboration) => {
            const quote = quoteDetails.get(collaboration.quote.id);
            const services = requestServices.get(collaboration.request?.id ?? "") ?? [];
            
            return (
              <CollaborationCard
                key={collaboration.id}
                collaboration={collaboration}
                quote={quote}
                services={services}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

/**
 * Carte d'affichage d'une collaboration
 */
function CollaborationCard({
  collaboration,
  quote,
  services,
}: {
  collaboration: HousingCollaborationDisplay;
  quote: QuoteDetails | undefined;
  services: string[];
}) {
  const conciergeName = collaboration.concierge.name;
  const housingName = collaboration.housing.name;
  const status = collaboration.status;
  const statusLabel = getCollaborationStatusLabel(status);
  const statusClass = getStatusBadgeClass(status);
  const endDate = getCollaborationEndDate(collaboration);

  return (
    <article className={styles.partnerCard}>
      <div className={styles.cardTop}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{getInitials(conciergeName)}</div>
          <div>
            <p className={styles.eyebrow}>Conciergerie partenaire</p>
            <h3>{conciergeName}</h3>
            <span>{housingName}</span>
          </div>
        </div>
        <span className={`${styles.statusBubble} ${statusClass}`}>
          {status === "active" ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />}
          {statusLabel}
        </span>
      </div>
      
      <div className={styles.factGrid}>
        <Metric label="Collaboration" value={collaboration.id.slice(0, 8)} />
        {quote ? (
          <>
            <Metric label="Devis" value={quote.quote_number || quote.id.slice(0, 8)} />
            <Metric label="Montant" value={formatAmount(quote.total_amount, quote.currency ?? "EUR")} />
            <Metric label="Accepté le" value={formatDate(quote.accepted_at)} />
          </>
        ) : (
          <>
            <Metric label="Devis" value="Non disponible" />
            <Metric label="Montant" value="-" />
            <Metric label="Date" value="-" />
          </>
        )}
      </div>

      {endDate ? (
        <div className={styles.factGrid}>
          <Metric label="Fin prévue" value={formatDate(endDate)} />
        </div>
      ) : null}

      {services.length > 0 ? (
        <div className={styles.chipRow}>
          {services.slice(0, 5).map((service) => (
            <span key={service} className={styles.serviceChip}>{service}</span>
          ))}
          {services.length > 5 ? (
            <span className={styles.serviceChip}>+{services.length - 5} autres</span>
          ) : null}
        </div>
      ) : null}

      {collaboration.request ? (
        <p className={styles.requestTitle}>{collaboration.request.title}</p>
      ) : null}

      {quote?.notes ? (
        <p className={styles.quoteNote}>{quote.notes}</p>
      ) : null}

      <div className={styles.cardFooter}>
        {status === "active" ? (
          <span className={styles.trustBadge}>
            <ShieldCheck size={14} /> Collaboration active
          </span>
        ) : (
          <span className={styles.trustBadge}>
            <XCircle size={14} /> Collaboration {statusLabel.toLowerCase()}
          </span>
        )}
        
        <Link href={`/dashboard/owner/conciergerie/partenaires/${collaboration.id}`} className={styles.textLink}>
          Voir le détail <ArrowRight size={14} />
        </Link>
        
        {collaboration.missionId ? (
          <Link href={`/dashboard/owner/missions/${collaboration.missionId}`} className={styles.textLink}>
            Voir la mission <ArrowRight size={14} />
          </Link>
        ) : quote ? (
          <Link href={`/dashboard/owner/devis?quote=${encodeURIComponent(quote.id)}`} className={styles.textLink}>
            Voir le devis <ArrowRight size={14} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

/**
 * En-tête de section
 */
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

/**
 * Carte de statistiques
 */
function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

/**
 * Métrique d'affichage
 */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/**
 * Panneau vide
 */
function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.emptyPanel}>
      <Handshake size={22} aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

/**
 * Liste de squelettes de chargement
 */
function SkeletonList() {
  return (
    <div className={styles.skeletonList}>
      <span />
      <span />
      <span />
    </div>
  );
}
