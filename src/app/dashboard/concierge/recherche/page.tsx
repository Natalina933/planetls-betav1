"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import styles from "./RecherchePage.module.scss";

type ListingSource = "property" | "housing";

interface ActiveService {
  id: string;
  label: string;
}

interface OwnerListing {
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

interface SearchResponse {
  profile: {
    location?: string | null;
    city: string | null;
    postal_code: string | null;
    country?: string | null;
    service_area: string | null;
    service_radius_km: number | null;
  };
  active_services: ActiveService[];
  applied_filters: {
    city: string | null;
    postal_code: string | null;
    radius_km: number | null;
    services: string[];
    country_wide?: boolean;
  };
  meta: {
    total_found: number;
    distance_mode: string;
    note: string;
  };
  listings: OwnerListing[];
}

const radiusOptions = [10, 20, 30, 50, 80, 120];

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getResponseError = async (res: Response, fallback: string): Promise<string> => {
  try {
    const body = await res.json();
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
    return fallback;
  } catch {
    return fallback;
  }
};

export default function ConciergeRecherchePage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [activeServices, setActiveServices] = useState<ActiveService[]>([]);
  const [distanceNote, setDistanceNote] = useState("");
  const [contactingListingId, setContactingListingId] = useState<string | null>(null);

  const [cityFilter, setCityFilter] = useState("");
  const [postalCodeFilter, setPostalCodeFilter] = useState("");
  const [radiusFilter, setRadiusFilter] = useState(30);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [allFranceMode, setAllFranceMode] = useState(false);

  const initializedFiltersRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchListings = useCallback(
    async (options?: {
      city?: string;
      postalCode?: string;
      radiusKm?: number;
      services?: string[];
      countryWide?: boolean;
      initialLoad?: boolean;
    }) => {
      const isInitial = options?.initialLoad === true;
      try {
        if (isInitial) {
          setLoading(true);
        } else {
          setSearching(true);
        }
        setErrorMsg(null);

        const params = new URLSearchParams();
        if (options?.city) params.set("city", options.city);
        if (options?.postalCode) params.set("postalCode", options.postalCode);
        if (options?.countryWide) params.set("countryWide", "1");
        if (typeof options?.radiusKm === "number" && options.radiusKm > 0) {
          params.set("radiusKm", String(options.radiusKm));
        }
        if (options?.services && options.services.length > 0) {
          params.set("services", options.services.join(","));
        }
        params.set("limit", options?.countryWide ? "200" : "80");

        const res = await fetch(`/api/search/owner-listings?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(
            await getResponseError(res, "Impossible de charger les annonces proprietaires"),
          );
        }

        const data = (await res.json()) as SearchResponse;
        setListings(Array.isArray(data.listings) ? data.listings : []);
        setActiveServices(Array.isArray(data.active_services) ? data.active_services : []);
        setDistanceNote(data.meta?.note ?? "");

        if (!initializedFiltersRef.current) {
          const defaultCity =
            data.profile?.location ??
            data.profile?.city ??
            data.profile?.service_area ??
            data.applied_filters?.city ??
            "";
          const defaultPostal = "";
          const defaultRadius =
            Number(data.profile?.service_radius_km ?? data.applied_filters?.radius_km ?? 30) || 30;
          setCityFilter(defaultCity);
          setPostalCodeFilter(defaultPostal);
          setRadiusFilter(defaultRadius);
          setSelectedServices([]);
          setAllFranceMode(Boolean(data.applied_filters?.country_wide));
          initializedFiltersRef.current = true;
        }
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Erreur de chargement de la recherche",
        );
      } finally {
        if (isInitial) {
          setLoading(false);
        } else {
          setSearching(false);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchListings({ initialLoad: true });
  }, [status, fetchListings]);

  const availableServiceOptions = useMemo(() => {
    const byLabel = new Map<string, string>();

    activeServices.forEach((service) => {
      byLabel.set(normalize(service.label), service.label);
    });

    listings.forEach((listing) => {
      listing.services_wanted.forEach((service) => {
        const key = normalize(service);
        if (!byLabel.has(key)) byLabel.set(key, service);
      });
    });

    return Array.from(byLabel.values()).sort((a, b) => a.localeCompare(b));
  }, [activeServices, listings]);

  const totalMatched = useMemo(
    () => listings.filter((listing) => listing.compatibility_score >= 60).length,
    [listings],
  );

  const runSearch = () => {
    fetchListings({
      city: allFranceMode ? "" : cityFilter.trim(),
      postalCode: allFranceMode ? "" : postalCodeFilter.trim(),
      radiusKm: allFranceMode ? 0 : radiusFilter,
      services: selectedServices,
      countryWide: allFranceMode,
      initialLoad: false,
    });
  };

  const resetFilters = () => {
    setSelectedServices([]);
    setPostalCodeFilter("");
    fetchListings({
      city: allFranceMode ? "" : cityFilter.trim(),
      postalCode: "",
      radiusKm: allFranceMode ? 0 : radiusFilter,
      services: [],
      countryWide: allFranceMode,
      initialLoad: false,
    });
  };

  const handleAllFranceToggle = (enabled: boolean) => {
    setAllFranceMode(enabled);
    fetchListings({
      city: enabled ? "" : cityFilter.trim(),
      postalCode: enabled ? "" : postalCodeFilter.trim(),
      radiusKm: enabled ? 0 : radiusFilter,
      services: selectedServices,
      countryWide: enabled,
      initialLoad: false,
    });
  };

  const toggleService = (label: string) => {
    setSelectedServices((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const contactOwner = async (listing: OwnerListing) => {
    if (!listing.owner_profile_id) {
      setErrorMsg(
        "Ce proprietaire ne possede pas encore d'identifiant de contact. Ouvrez le detail pour completer la fiche.",
      );
      return;
    }

    try {
      setContactingListingId(listing.id);
      setErrorMsg(null);

      const prefillMessage = `Bonjour ${listing.owner_name}, je vous contacte suite a votre annonce "${listing.title}" (${listing.city}). Je peux vous proposer une gestion adaptee a vos besoins.`;

      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_profile_id: listing.owner_profile_id,
          source: "search",
          source_reference: listing.id,
          subject: `Prospection concierge - ${listing.title}`,
          prefill_message: prefillMessage,
          metadata: {
            listing_id: listing.id,
            listing_city: listing.city,
            compatibility_score: listing.compatibility_score,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(await getResponseError(res, "Impossible de creer la conversation"));
      }

      const conversation: { id: string } = await res.json();
      if (!conversation?.id) {
        throw new Error("Conversation creee mais identifiant manquant");
      }

      router.push(`/dashboard/concierge/messages?conversation=${conversation.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur creation conversation");
    } finally {
      setContactingListingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Chargement de la recherche proprietaires...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <p className={styles.kicker}>Prospection Concierge</p>
          <h1>Recherche de proprietaires compatibles</h1>
          <p>
            Filtrez par zone et services pour identifier rapidement les demandes qui
            correspondent a votre profil missions.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={runSearch}
          disabled={searching}
        >
          <FiRefreshCw size={14} />
          Actualiser
        </button>
      </header>

      {errorMsg && <p className={styles.errorBox}>{errorMsg}</p>}

      <section className={styles.statsStrip}>
        <article className={styles.statCard}>
          <span>Total annonces</span>
          <strong>{listings.length}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Compatibilite forte (60%+)</span>
          <strong>{totalMatched}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Services actifs concierge</span>
          <strong>{activeServices.length}</strong>
        </article>
      </section>

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
              onChange={(event) => handleAllFranceToggle(event.target.checked)}
            />
            <span>Toute la France</span>
          </label>
          {allFranceMode && (
            <p className={styles.toggleHint}>
              Recherche nationale active: ville, code postal et rayon sont ignores.
            </p>
          )}
        </div>

        <div className={styles.filtersGrid}>
          <label className={styles.field}>
            <span>Ville / zone</span>
            <input
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              placeholder="Paris, Lyon, Bordeaux..."
              disabled={allFranceMode}
            />
          </label>

          <label className={styles.field}>
            <span>Code postal</span>
            <input
              value={postalCodeFilter}
              onChange={(event) => setPostalCodeFilter(event.target.value)}
              placeholder="75001"
              disabled={allFranceMode}
            />
          </label>

          <label className={styles.field}>
            <span>Rayon (km)</span>
            <select
              value={radiusFilter}
              onChange={(event) => setRadiusFilter(Number(event.target.value))}
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
                  onClick={() => toggleService(service)}
                  className={`${styles.servicePill} ${selected ? styles.servicePillActive : ""}`}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.filterActions}>
          <button type="button" className={styles.primaryBtn} onClick={runSearch} disabled={searching}>
            <FiSearch size={14} />
            {searching ? "Recherche..." : "Rechercher"}
          </button>
          <button type="button" className={styles.ghostBtn} onClick={resetFilters} disabled={searching}>
            Reinitialiser services
          </button>
        </div>
      </section>

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
              Elargissez la zone ou retirez quelques filtres services pour afficher plus de profils proprietaires.
            </p>
          </div>
        )}

        <div className={styles.cardsGrid}>
          {listings.map((listing) => {
            const housingId =
              listing.source === "housing" ? listing.id.replace("housing-", "") : null;
            const detailHref = housingId
              ? `/dashboard/concierge/logements/${housingId}`
              : null;

            return (
              <article key={listing.id} className={styles.card}>
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
                    <strong>Type:</strong> {listing.property_type ?? "Non renseigne"}
                  </p>
                  <p>
                    <strong>Surface:</strong>{" "}
                    {typeof listing.surface_m2 === "number"
                      ? `${listing.surface_m2} m2`
                      : "Non renseignee"}
                  </p>
                  <p>
                    <strong>Statut:</strong> {listing.status ?? "Non renseigne"}
                  </p>
                </div>

                {typeof listing.distance_km === "number" && (
                  <p className={styles.distanceLine}>
                    Distance estimee: {listing.distance_km.toFixed(1)} km
                  </p>
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

                {listing.budget_note && (
                  <p className={styles.budgetNote}>{listing.budget_note}</p>
                )}

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
                    onClick={() => contactOwner(listing)}
                    disabled={contactingListingId === listing.id}
                  >
                    {contactingListingId === listing.id ? "Ouverture..." : "Contacter"}
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
