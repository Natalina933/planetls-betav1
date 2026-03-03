"use client";

import Link from "next/link";
import { FiMapPin, FiRefreshCw, FiSearch, FiSliders, FiTarget, FiUsers } from "react-icons/fi";
import styles from "./RecherchePage.module.scss";

type ListingSource = "property" | "housing";

export interface ActiveService {
  id: string;
  label: string;
}

export interface OwnerListing {
  id: string;
  source: ListingSource;
  title: string;
  city: string;
  postal_code: string | null;
  property_type: string | null;
  surface_m2: number | null;
  owner_profile_id: string | null;
  owner_name: string;
  status: string | null;
  services_wanted: string[];
  services_wanted_ids: number[];
  matched_services: string[];
  compatibility_ratio: string;
  compatibility_score: number;
  distance_km: number | null;
  budget_note: string | null;
}

interface SearchHeaderProps {
  searching: boolean;
  onRefresh: () => void;
}

interface SearchStatsStripProps {
  listingsCount: number;
  totalMatched: number;
  activeServicesCount: number;
}

interface SearchFiltersCardProps {
  distanceNote: string;
  allFranceMode: boolean;
  cityFilter: string;
  postalCodeFilter: string;
  radiusFilter: number;
  radiusOptions: number[];
  availableServiceOptions: string[];
  selectedServices: string[];
  searching: boolean;
  onAllFranceToggle: (enabled: boolean) => void;
  onCityChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onToggleService: (label: string) => void;
  onRunSearch: () => void;
  onResetFilters: () => void;
}

interface SearchServiceFilterProps {
  availableServiceOptions: string[];
  selectedServices: string[];
  onToggleService: (label: string) => void;
}

interface SearchResultsSectionProps {
  listings: OwnerListing[];
  contactingListingId: string | null;
  onContactOwner: (listing: OwnerListing) => void;
}

interface SearchResultCardProps {
  listing: OwnerListing;
  contacting: boolean;
  onContactOwner: (listing: OwnerListing) => void;
}

export function SearchHeader({ searching, onRefresh }: SearchHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerMain}>
        <p className={styles.kicker}>Prospection concierge</p>
        <h1>Recherche d&apos;annonces</h1>
        <p>
          Filtrez par zone et services pour identifier rapidement les demandes qui
          correspondent a votre profil missions.
        </p>
      </div>
      <button type="button" className={styles.refreshBtn} onClick={onRefresh} disabled={searching}>
        <FiRefreshCw size={14} />
        Actualiser
      </button>
    </header>
  );
}

export function SearchStatsStrip({
  listingsCount,
  totalMatched,
  activeServicesCount,
}: SearchStatsStripProps) {
  return (
    <section className={styles.statsStrip}>
      <article className={styles.statCard}>
        <span>Total annonces</span>
        <strong>{listingsCount}</strong>
      </article>
      <article className={styles.statCard}>
        <span>Compatibilite forte (60%+)</span>
        <strong>{totalMatched}</strong>
      </article>
      <article className={styles.statCard}>
        <span>Services actifs concierge</span>
        <strong>{activeServicesCount}</strong>
      </article>
    </section>
  );
}

export function SearchFiltersCard({
  distanceNote,
  allFranceMode,
  cityFilter,
  postalCodeFilter,
  radiusFilter,
  radiusOptions,
  availableServiceOptions,
  selectedServices,
  searching,
  onAllFranceToggle,
  onCityChange,
  onPostalCodeChange,
  onRadiusChange,
  onToggleService,
  onRunSearch,
  onResetFilters,
}: SearchFiltersCardProps) {
  return (
    <section className={styles.filtersCard}>
      <div className={styles.filtersHeader}>
        <h2>
          <FiSliders size={15} />
          Filtres de recherche
        </h2>
        <p>{distanceNote}</p>
      </div>

      <div className={styles.toggleRow}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={allFranceMode}
            onChange={(event) => onAllFranceToggle(event.target.checked)}
          />
          <span>Toute la France</span>
        </label>
        {allFranceMode && (
          <p className={styles.toggleHint}>
            Recherche nationale active : ville, code postal et rayon sont ignores.
          </p>
        )}
      </div>

      <div className={styles.filtersGrid}>
        <label className={styles.field}>
          <span>Ville / zone</span>
          <input
            value={cityFilter}
            onChange={(event) => onCityChange(event.target.value)}
            placeholder="Paris, Lyon, Bordeaux..."
            disabled={allFranceMode}
          />
        </label>

        <label className={styles.field}>
          <span>Code postal</span>
          <input
            value={postalCodeFilter}
            onChange={(event) => onPostalCodeChange(event.target.value)}
            placeholder="75001"
            disabled={allFranceMode}
          />
        </label>

        <label className={styles.field}>
          <span>Rayon (km)</span>
          <select
            value={radiusFilter}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            disabled={allFranceMode}
          >
            {radiusOptions.map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </select>
        </label>
      </div>

      <SearchServiceFilter
        availableServiceOptions={availableServiceOptions}
        selectedServices={selectedServices}
        onToggleService={onToggleService}
      />

      <div className={styles.filterActions}>
        <button type="button" className={styles.primaryBtn} onClick={onRunSearch} disabled={searching}>
          <FiSearch size={14} />
          {searching ? "Recherche..." : "Rechercher"}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onResetFilters} disabled={searching}>
          Reinitialiser services
        </button>
      </div>
    </section>
  );
}

function SearchServiceFilter({
  availableServiceOptions,
  selectedServices,
  onToggleService,
}: SearchServiceFilterProps) {
  return (
    <div className={styles.servicesFilter}>
      <p>Services a matcher</p>
      <div className={styles.servicePills}>
        {availableServiceOptions.length === 0 && (
          <span className={styles.emptyHint}>
            Aucun service detecte. Activez des services dans l&apos;onglet Missions.
          </span>
        )}
        {availableServiceOptions.map((service) => {
          const selected = selectedServices.includes(service);
          return (
            <button
              key={service}
              type="button"
              onClick={() => onToggleService(service)}
              className={`${styles.servicePill} ${selected ? styles.servicePillActive : ""}`}
            >
              {service}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SearchResultsSection({
  listings,
  contactingListingId,
  onContactOwner,
}: SearchResultsSectionProps) {
  return (
    <section className={styles.resultsSection}>
      <div className={styles.resultsHeader}>
        <h2>
          <FiTarget size={15} />
          Resultats
        </h2>
        <span>{listings.length} opportunites</span>
      </div>

      {listings.length === 0 && (
        <div className={styles.emptyState}>
          <h3>Aucune annonce compatible pour ces filtres.</h3>
          <p>
            Elargissez la zone ou retirez quelques filtres services pour afficher plus de
            profils propriétaires.
          </p>
        </div>
      )}

      <div className={styles.cardsGrid}>
        {listings.map((listing) => (
          <SearchResultCard
            key={listing.id}
            listing={listing}
            contacting={contactingListingId === listing.id}
            onContactOwner={onContactOwner}
          />
        ))}
      </div>
    </section>
  );
}

function SearchResultCard({
  listing,
  contacting,
  onContactOwner,
}: SearchResultCardProps) {
  const housingId = listing.source === "housing" ? listing.id.replace("housing-", "") : null;
  const detailHref = housingId ? `/dashboard/concierge/logements/${housingId}` : null;

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <h3>{listing.title}</h3>
          <p>
            <FiMapPin size={13} />
            {listing.city}
            {listing.postal_code ? ` (${listing.postal_code})` : ""}
          </p>
        </div>
        <span className={styles.sourceBadge}>
          {listing.source === "housing" ? "Logement" : "Propriete"}
        </span>
      </header>

      <div className={styles.ownerLine}>
        <FiUsers size={13} />
        <span>{listing.owner_name}</span>
      </div>

      <div className={styles.metaGrid}>
        <p>
          <strong>Type :</strong> {listing.property_type ?? "Non renseigne"}
        </p>
        <p>
          <strong>Surface :</strong>{" "}
          {typeof listing.surface_m2 === "number" ? `${listing.surface_m2} m2` : "Non renseignée"}
        </p>
        <p>
          <strong>Statut :</strong> {listing.status ?? "Non renseigne"}
        </p>
      </div>

      {typeof listing.distance_km === "number" && (
        <p className={styles.distanceLine}>Distance estimee : {listing.distance_km.toFixed(1)} km</p>
      )}

      <div className={styles.compatibilityBox}>
        <div className={styles.compatibilityHead}>
          <strong>Compatibilite</strong>
          <span>
            {listing.compatibility_score}% ({listing.compatibility_ratio})
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(Math.max(listing.compatibility_score, 0), 100)}%` }}
          />
        </div>
      </div>

      <div className={styles.tagsBlock}>
        <p>Services recherches</p>
        <div className={styles.tags}>
          {listing.services_wanted.length === 0 && (
            <span className={styles.tagMuted}>Non renseignes</span>
          )}
          {listing.services_wanted.slice(0, 6).map((service) => (
            <span key={`${listing.id}-${service}`} className={styles.tag}>
              {service}
            </span>
          ))}
        </div>
      </div>

      {listing.budget_note && <p className={styles.budgetNote}>{listing.budget_note}</p>}

      <footer className={styles.cardFooter}>
        {detailHref ? (
          <Link href={detailHref} className={styles.cardBtn}>
            Voir le detail
          </Link>
        ) : (
          <button type="button" className={styles.cardBtnGhost}>
            Detail a brancher
          </button>
        )}

        <button
          type="button"
          className={styles.cardBtnGhost}
          onClick={() => onContactOwner(listing)}
          disabled={contacting}
        >
          {contacting ? "Ouverture..." : "Contacter"}
        </button>
      </footer>
    </article>
  );
}
