"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ActiveService,
  OwnerListing,
  SearchFiltersCard,
  SearchHeader,
  SearchResultsSection,
  SearchStatsStrip,
} from "./searchPageSections";
import {
  SearchResponse,
  buildAvailableServiceOptions,
  createSearchConversation,
  fetchOwnerListings,
} from "./searchClient";
import {
  buildInitialSearchFilters,
  buildResetFiltersState,
  buildSearchRequestOptions,
  toggleSelectedService,
} from "./searchState";
import styles from "./RecherchePage.module.scss";

const radiusOptions = [10, 20, 30, 50, 80, 120];

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
        const data = (await fetchOwnerListings(options)) as SearchResponse;
        setListings(Array.isArray(data.listings) ? data.listings : []);
        setActiveServices(Array.isArray(data.active_services) ? data.active_services : []);
        setDistanceNote(data.meta?.note ?? "");

        if (!initializedFiltersRef.current) {
          const initialFilters = buildInitialSearchFilters(data);
          setCityFilter(initialFilters.cityFilter);
          setPostalCodeFilter(initialFilters.postalCodeFilter);
          setRadiusFilter(initialFilters.radiusFilter);
          setSelectedServices(initialFilters.selectedServices);
          setAllFranceMode(initialFilters.allFranceMode);
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
    [],
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchListings({ initialLoad: true });
  }, [status, fetchListings]);

  const availableServiceOptions = useMemo(() => {
    return buildAvailableServiceOptions(activeServices, listings);
  }, [activeServices, listings]);

  const totalMatched = useMemo(
    () => listings.filter((listing) => listing.compatibility_score >= 60).length,
    [listings],
  );

  const runSearch = () => {
    fetchListings(
      buildSearchRequestOptions({
        cityFilter,
        postalCodeFilter,
        radiusFilter,
        selectedServices,
        allFranceMode,
      }),
    );
  };

  const resetFilters = () => {
    const nextFilters = buildResetFiltersState({
      cityFilter,
      postalCodeFilter,
      radiusFilter,
      selectedServices,
      allFranceMode,
    });
    setSelectedServices(nextFilters.selectedServices);
    setPostalCodeFilter(nextFilters.postalCodeFilter);
    fetchListings(buildSearchRequestOptions(nextFilters));
  };

  const handleAllFranceToggle = (enabled: boolean) => {
    setAllFranceMode(enabled);
    fetchListings(
      buildSearchRequestOptions({
        cityFilter,
        postalCodeFilter,
        radiusFilter,
        selectedServices,
        allFranceMode: enabled,
      }),
    );
  };

  const toggleService = (label: string) => {
    setSelectedServices((prev) => toggleSelectedService(prev, label));
  };

  const contactOwner = async (listing: OwnerListing) => {
    if (!listing.owner_profile_id) {
      setErrorMsg(
        "Ce propriétaire ne possède pas encore d'identifiant de contact. Ouvrez le détail pour compléter la fiche.",
      );
      return;
    }

    try {
      setContactingListingId(listing.id);
      setErrorMsg(null);
      const conversation = await createSearchConversation(listing);
      if (!conversation?.id) {
        throw new Error("Conversation créée mais identifiant manquant");
      }

      router.push(`/dashboard/concierge/messages?conversation=${conversation.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur création conversation");
    } finally {
      setContactingListingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Chargement de la recherche propriétaires...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SearchHeader searching={searching} onRefresh={runSearch} />

      {errorMsg && <p className={styles.errorBox}>{errorMsg}</p>}

      <SearchStatsStrip
        listingsCount={listings.length}
        totalMatched={totalMatched}
        activeServicesCount={activeServices.length}
      />
      <SearchFiltersCard
        distanceNote={distanceNote}
        allFranceMode={allFranceMode}
        cityFilter={cityFilter}
        postalCodeFilter={postalCodeFilter}
        radiusFilter={radiusFilter}
        radiusOptions={radiusOptions}
        availableServiceOptions={availableServiceOptions}
        selectedServices={selectedServices}
        searching={searching}
        onAllFranceToggle={handleAllFranceToggle}
        onCityChange={setCityFilter}
        onPostalCodeChange={setPostalCodeFilter}
        onRadiusChange={setRadiusFilter}
        onToggleService={toggleService}
        onRunSearch={runSearch}
        onResetFilters={resetFilters}
      />
      <SearchResultsSection
        listings={listings}
        contactingListingId={contactingListingId}
        onContactOwner={contactOwner}
      />
    </div>
  );
}
