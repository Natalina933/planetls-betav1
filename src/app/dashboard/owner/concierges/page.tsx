"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FilterSliders from "@/app/components/ui/FilterSliders";
import styles from "./OwnerConciergesPage.module.scss";
import { ConciergeAvatar } from "./ConciergeAvatar";
import { ConciergeCard } from "./card/ConciergeCard";
import type { ServiceCatalogItem, SortMode, ViewMode } from "./conciergeSearchTypes";
import { OwnerLocationAutocomplete } from "./OwnerLocationAutocomplete";
import {
  createConciergeComparator,
  getActiveSearchSummary,
  mergeSortedOptions,
} from "./conciergeSearchUtils";
import { useOwnerConciergeSearch } from "./useOwnerConciergeSearch";
import {
  buildOwnerConciergeFilterOptions,
  hasOwnerConciergeSearchCriteria,
  toggleOwnerConciergeValue,
  type OwnerConciergeSearchFilters,
} from "./searchHelpers";
import { getOwnerCitySuggestions, getOwnerRegionSuggestions } from "./locationSuggestions";
import { createOwnerConciergeSearchAlert } from "../searchAlerts";

type RequestType = "ponctuel" | "renfort" | "durable";

type RequestFormState = {
  requestType: RequestType;
  title: string;
  description: string;
  region: string;
  city: string;
  postalCode: string;
  desiredDate: string;
  budgetMax: string;
  urgency: boolean;
};

const initialFilters: OwnerConciergeSearchFilters = {
  region: "",
  city: "",
  selectedCategories: [],
  selectedServices: [],
  propertyType: "",
  budgetMax: "",
  radiusKm: "",
  proOnly: false,
};

const initialRequestForm: RequestFormState = {
  requestType: "ponctuel",
  title: "",
  description: "",
  region: "",
  city: "",
  postalCode: "",
  desiredDate: "",
  budgetMax: "",
  urgency: false,
};

function parseSliderValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function OwnerConciergesPage() {
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<OwnerConciergeSearchFilters>(initialFilters);
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("available");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedConciergeIds, setSelectedConciergeIds] = useState<string[]>([]);
  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [openServiceSections, setOpenServiceSections] = useState<Record<string, boolean>>({});
  const { items, loading, error, serverOptions, search, clear, setError } = useOwnerConciergeSearch();
  const hydratedFromUrlRef = useRef(false);

  const selectedIdSet = useMemo(() => new Set(selectedConciergeIds), [selectedConciergeIds]);
  const stats = useMemo(
    () =>
      items.reduce(
        (accumulator, item) => ({
          totalPro: accumulator.totalPro + Number(item.is_pro),
          totalAvailable: accumulator.totalAvailable + Number(item.is_available_now === true),
        }),
        { totalPro: 0, totalAvailable: 0 },
      ),
    [items],
  );
  const clientOptions = useMemo(() => buildOwnerConciergeFilterOptions(items), [items]);

  const selectedConcierges = useMemo(
    () => items.filter((item) => selectedIdSet.has(item.id)),
    [items, selectedIdSet],
  );

  const sortedItems = useMemo(() => {
    const ranked = [...items];
    ranked.sort(createConciergeComparator(sortMode));
    return ranked;
  }, [items, sortMode]);

  const serviceOptions = useMemo(
    () => mergeSortedOptions(serverOptions.services, clientOptions.services),
    [clientOptions.services, serverOptions.services],
  );
  const categoriesByService = useMemo(() => {
    const nextMap = new Map<string, string>();
    serviceCatalog.forEach((item) => {
      nextMap.set(item.service, item.category);
    });
    return nextMap;
  }, [serviceCatalog]);
  const categoryOptions = useMemo(() => {
    const serviceDerived = serviceOptions
      .map((service) => categoriesByService.get(service))
      .filter((value): value is string => Boolean(value));
    return mergeSortedOptions(serverOptions.categories, serviceDerived);
  }, [categoriesByService, serverOptions.categories, serviceOptions]);
  const visibleServiceOptions = useMemo(() => {
    if (filters.selectedCategories.length === 0) return [];
    const allowedServices = new Set(serviceOptions);
    return serviceCatalog
      .filter(
        (item) =>
          filters.selectedCategories.includes(item.category) && allowedServices.has(item.service),
      )
      .map((item) => item.service)
      .sort((left, right) => left.localeCompare(right));
  }, [filters.selectedCategories, serviceCatalog, serviceOptions]);
  const visibleServicesByCategory = useMemo(() => {
    return filters.selectedCategories
      .map((category) => ({
        category,
        services: visibleServiceOptions.filter((service) => categoriesByService.get(service) === category),
      }))
      .filter((group) => group.services.length > 0);
  }, [categoriesByService, filters.selectedCategories, visibleServiceOptions]);

  const propertyTypeOptions = useMemo(
    () => mergeSortedOptions(serverOptions.propertyTypes, clientOptions.propertyTypes),
    [clientOptions.propertyTypes, serverOptions.propertyTypes],
  );

  const activeSearchSummary = useMemo(() => getActiveSearchSummary(filters), [filters]);
  const hasSearchCriteria = useMemo(() => hasOwnerConciergeSearchCriteria(filters), [filters]);

  function updateFilters<Key extends keyof OwnerConciergeSearchFilters>(
    key: Key,
    value: OwnerConciergeSearchFilters[Key],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function updateRequestForm<Key extends keyof RequestFormState>(
    key: Key,
    value: RequestFormState[Key],
  ) {
    setRequestForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadServiceCatalog() {
      try {
        const response = await fetch("/api/services/services-catalog", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as ServiceCatalogItem[];
        if (!cancelled) {
          setServiceCatalog(Array.isArray(payload) ? payload : []);
          if (Array.isArray(payload)) {
            setOpenServiceSections(
              payload.reduce<Record<string, boolean>>((acc, item) => {
                acc[item.category] = true;
                return acc;
              }, {}),
            );
          }
        }
      } catch {
        if (!cancelled) {
          setServiceCatalog([]);
        }
      }
    }

    void loadServiceCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setRequestForm((prev) => ({
      ...prev,
      region: filters.region,
      city: filters.city,
    }));
  }, [filters.city, filters.region]);

  useEffect(() => {
    if (hydratedFromUrlRef.current) return;

    const nextFilters: OwnerConciergeSearchFilters = {
      region: searchParams.get("region") ?? "",
      city: searchParams.get("city") ?? "",
      selectedCategories: (searchParams.get("categories") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      selectedServices: (searchParams.get("services") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      propertyType: searchParams.get("propertyType") ?? "",
      budgetMax: searchParams.get("budgetMax") ?? "",
      radiusKm: searchParams.get("radiusKm") ?? "",
      proOnly: searchParams.get("proOnly") === "1",
    };

    const hasUrlFilters = hasOwnerConciergeSearchCriteria(nextFilters);
    if (!hasUrlFilters) {
      hydratedFromUrlRef.current = true;
      return;
    }

    hydratedFromUrlRef.current = true;
    setFilters(nextFilters);
    setHasSubmittedSearch(true);
    void search(nextFilters);
  }, [search, searchParams]);

  function clearResults() {
    clear();
    setSelectedConciergeIds([]);
  }

  function toggleCategory(categoryLabel: string) {
    setFilters((prev) => {
      const nextCategories = toggleOwnerConciergeValue(prev.selectedCategories, categoryLabel);
      const nextServices = prev.selectedServices.filter((service) => {
        const serviceCategory = categoriesByService.get(service);
        return !serviceCategory || nextCategories.includes(serviceCategory);
      });

      return {
        ...prev,
        selectedCategories: nextCategories,
        selectedServices: nextServices,
      };
    });
  }

  function toggleService(serviceLabel: string) {
    updateFilters("selectedServices", toggleOwnerConciergeValue(filters.selectedServices, serviceLabel));
  }

  function toggleServiceSection(category: string) {
    setOpenServiceSections((prev) => ({
      ...prev,
      [category]: !(prev[category] ?? true),
    }));
  }

  function resetFilters() {
    setFilters(initialFilters);
    setHasSubmittedSearch(false);
    setFeedback(null);
    setError(null);
    setMobileFiltersOpen(false);
    setRequestForm(initialRequestForm);
    clearResults();
  }

  function handleCreateAlert() {
    createOwnerConciergeSearchAlert({
      city: filters.city,
      region: filters.region,
      budgetMax: filters.budgetMax,
      radiusKm: filters.radiusKm,
    });
    setFeedback("Alerte créée. Vous la retrouverez dans vos alertes propriétaire.");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setHasSubmittedSearch(true);
    setMobileFiltersOpen(false);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    void search(filters).then((nextItems) => {
      setSelectedConciergeIds((prev) => prev.filter((id) => nextItems.some((item) => item.id === id)));
    });
  }

  function toggleConciergeSelection(itemId: string) {
    setSelectedConciergeIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
    setFeedback(null);
    setError(null);
  }

  async function handleSendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedConciergeIds.length === 0) {
      setError("Selectionnez au moins un concierge avant d'envoyer une demande.");
      return;
    }

    if (!requestForm.title.trim()) {
      setError("Ajoutez un titre a votre demande.");
      return;
    }

    try {
      setSubmittingRequest(true);
      setError(null);
      setFeedback(null);

      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_type: requestForm.requestType,
            title: requestForm.title.trim(),
            description: requestForm.description.trim(),
            requested_services:
              filters.selectedServices.length > 0 ? filters.selectedServices : filters.selectedCategories,
            city: requestForm.city.trim(),
            region: requestForm.region.trim(),
            postal_code: requestForm.postalCode.trim(),
            desired_date: requestForm.desiredDate ? new Date(requestForm.desiredDate).toISOString() : null,
          urgency: requestForm.urgency,
          budget_max: requestForm.budgetMax ? Number(requestForm.budgetMax) : null,
          currency: "EUR",
          recipient_ids: selectedConciergeIds,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer votre demande.");
      }

      setFeedback(
        `Demande envoyée à ${selectedConciergeIds.length} concierge(s). Vous pouvez maintenant suivre les retours.`,
      );
      setSelectedConciergeIds([]);
      setMobileFiltersOpen(false);
      setRequestForm({
        ...initialRequestForm,
        region: filters.region,
        city: filters.city,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer votre demande.");
    } finally {
      setSubmittingRequest(false);
    }
  }

  const filterControls = (
    <>
      <div className={styles.searchBar}>
        <label className={`${styles.field} ${styles.searchField}`}>
          <span>Région</span>
          <OwnerLocationAutocomplete
            ariaLabel="Region"
            value={filters.region}
            onChange={(value) => updateFilters("region", value)}
            placeholder="Ile-de-France, PACA, Bretagne..."
            getSuggestions={getOwnerRegionSuggestions}
          />
        </label>

        <label className={`${styles.field} ${styles.searchField}`}>
          <span>Ville</span>
          <OwnerLocationAutocomplete
            ariaLabel="Ville"
            value={filters.city}
            onChange={(value) => updateFilters("city", value)}
            placeholder="Paris, Annecy, Bordeaux..."
            getSuggestions={getOwnerCitySuggestions}
          />
        </label>

        <label className={styles.field}>
          <span>Type de bien</span>
          <select
            aria-label="Type de bien"
            value={filters.propertyType}
            onChange={(event) => updateFilters("propertyType", event.target.value)}
          >
            <option value="">Tous les biens</option>
            {propertyTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.sliderFilters}>
          <FilterSliders
            title="Budget et rayon"
            budget={{
              label: "Budget max par heure",
              value: parseSliderValue(filters.budgetMax),
              min: 0,
              max: 300,
              step: 10,
              helperText: "0 = sans limite",
              formatValue: (value) => (value === 0 ? "Sans limite" : `${value} EUR/h`),
              onChange: (value) => updateFilters("budgetMax", value === 0 ? "" : String(value)),
            }}
            radius={{
              label: "Rayon max",
              value: parseSliderValue(filters.radiusKm),
              min: 0,
              max: 100,
              step: 5,
              unit: "km",
              helperText: "0 = sans limite",
              formatValue: (value) => (value === 0 ? "Sans limite" : `${value} km`),
              onChange: (value) => updateFilters("radiusKm", value === 0 ? "" : String(value)),
            }}
          />
        </div>

        <div className={styles.searchActions}>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? "Recherche..." : "Rechercher"}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={resetFilters}
            disabled={loading}
          >
            Réinitialiser
          </button>
        </div>
      </div>

        <div className={styles.searchMeta}>
          <div className={styles.servicesBlock}>
            <span className={styles.blockLabel}>Services Recherchées</span>
            <div className={styles.serviceChips}>
              {categoryOptions.length === 0 ? (
                <span className={styles.tagMuted}>
                  Les catégories apparaîtront après le premier chargement.
                </span>
              ) : (
                categoryOptions.map((categoryLabel) => {
                  const isSelected = filters.selectedCategories.includes(categoryLabel);
                  return (
                    <button
                      key={categoryLabel}
                      type="button"
                      aria-pressed={isSelected}
                      className={isSelected ? styles.serviceChipActive : styles.serviceChip}
                      onClick={() => toggleCategory(categoryLabel)}
                    >
                      {categoryLabel}
                    </button>
                  );
                })
              )}
            </div>
            <p className={styles.filterHint}>
              Choisissez d&apos;abord une grande catégorie, puis affinez avec le détail si besoin.
            </p>
          </div>

          <div className={styles.servicesBlock}>
            <span className={styles.blockLabel}>Details du service</span>
            {filters.selectedCategories.length === 0 ? (
              <span className={styles.tagMuted}>Sélectionnez une catégorie pour voir les détails.</span>
            ) : visibleServicesByCategory.length === 0 ? (
              <span className={styles.tagMuted}>Aucun détail disponible pour la sélection actuelle.</span>
            ) : (
              <div className={styles.serviceSections}>
                {visibleServicesByCategory.map((group) => {
                  const isOpen = openServiceSections[group.category] ?? true;
                  const selectedCount = group.services.filter((service) =>
                    filters.selectedServices.includes(service),
                  ).length;

                  return (
                    <section key={group.category} className={styles.serviceSection}>
                      <button
                        type="button"
                        className={styles.serviceSectionHeader}
                        onClick={() => toggleServiceSection(group.category)}
                        aria-expanded={isOpen}
                      >
                        <span>{group.category}</span>
                        <span className={styles.serviceSectionMeta}>
                          {selectedCount}/{group.services.length} {isOpen ? "-" : "+"}
                        </span>
                      </button>

                      {isOpen ? (
                        <div className={styles.serviceSectionBody}>
                          {group.services.map((serviceLabel) => {
                            const isSelected = filters.selectedServices.includes(serviceLabel);
                            return (
                              <button
                                key={serviceLabel}
                                type="button"
                                aria-pressed={isSelected}
                                className={isSelected ? styles.serviceChipActive : styles.serviceChip}
                                onClick={() => toggleService(serviceLabel)}
                              >
                                {serviceLabel}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          <label className={styles.checkboxRow}>
          <input
            aria-label="Afficher uniquement les concierges PRO"
            type="checkbox"
            checked={filters.proOnly}
            onChange={(event) => updateFilters("proOnly", event.target.checked)}
          />
          <span>Afficher uniquement les concierges PRO</span>
        </label>
      </div>
    </>
  );

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Mise en relation</span>
            <h1 className={styles.title}>Trouvez un concierge disponible dans votre région</h1>
            <p className={styles.description}>
              Recherchez par zone, comparez les profils les plus utiles puis envoyez un brief clair
              aux concierges que vous retenez.
            </p>
          </div>

          <div className={styles.mobileHeroActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setMobileFiltersOpen(true)}
            >
              Ouvrir les filtres
            </button>
            <div className={styles.viewToggle} aria-label="Mode d'affichage">
              <button
                type="button"
                className={viewMode === "cards" ? styles.viewToggleActive : styles.viewToggleBtn}
                onClick={() => setViewMode("cards")}
              >
                Cartes
              </button>
              <button
                type="button"
                className={viewMode === "list" ? styles.viewToggleActive : styles.viewToggleBtn}
                onClick={() => setViewMode("list")}
              >
                Liste
              </button>
            </div>
          </div>

          <form className={styles.searchShell} onSubmit={handleSubmit}>
            {filterControls}
          </form>

          <div className={styles.statsRow}>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Concierges trouvés</span>
              <strong>{items.length}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Disponibles maintenant</span>
              <strong>{stats.totalAvailable}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Profils PRO</span>
              <strong>{stats.totalPro}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Votre sélection</span>
              <strong>{selectedConciergeIds.length}</strong>
            </article>
          </div>
        </header>

        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {feedback ? <p className={styles.successBox}>{feedback}</p> : null}

        <div className={styles.contentLayout}>
          <div className={styles.resultsColumn} ref={resultsRef}>
            <div className={styles.resultsHeader}>
              <div>
                <p className={styles.eyebrow}>Résultats</p>
                <h2 className={styles.sectionTitle}>
                  {loading
                    ? "Recherche en cours..."
                    : hasSubmittedSearch
                      ? `${items.length} concierge(s) disponible(s)`
                      : "Aucun concierge affiché pour le moment"}
                </h2>
              </div>
              <div className={styles.resultsTools}>
                <p className={styles.resultsNote}>
                  Disponibles d&apos;abord, puis profils les mieux notes et les plus fiables.
                </p>
                <div className={styles.sortTabs} aria-label="Tri des concierges">
                  <button
                    type="button"
                    className={sortMode === "available" ? styles.sortTabActive : styles.sortTab}
                    onClick={() => setSortMode("available")}
                  >
                    Disponibles
                  </button>
                  <button
                    type="button"
                    className={sortMode === "rating" ? styles.sortTabActive : styles.sortTab}
                    onClick={() => setSortMode("rating")}
                  >
                    Mieux notés
                  </button>
                  <button
                    type="button"
                    className={sortMode === "pro" ? styles.sortTabActive : styles.sortTab}
                    onClick={() => setSortMode("pro")}
                  >
                    PRO
                  </button>
                </div>
                <div className={styles.viewToggleDesktop} aria-label="Mode d'affichage">
                  <button
                    type="button"
                    className={viewMode === "cards" ? styles.viewToggleActive : styles.viewToggleBtn}
                    onClick={() => setViewMode("cards")}
                  >
                    Cartes
                  </button>
                  <button
                    type="button"
                    className={viewMode === "list" ? styles.viewToggleActive : styles.viewToggleBtn}
                    onClick={() => setViewMode("list")}
                  >
                    Liste
                  </button>
                </div>
              </div>
            </div>

            {!loading && !error && items.length === 0 && hasSubmittedSearch ? (
              <div className={styles.emptyState}>
                <h2>
                  {filters.region.trim() || filters.city.trim()
                    ? `Aucun concierge disponible pour ${[filters.city.trim(), filters.region.trim()].filter(Boolean).join(", ")}.`
                    : "Aucun concierge disponible pour cette recherche."}
                </h2>
                <p>
                  Aucun profil actif n&apos;a été trouvé avec les filtres actuels. Essayez une région
                  voisine, augmentez le rayon ou retirez quelques filtres.
                </p>
                {(filters.region.trim() || filters.city.trim()) && (
                  <div className={styles.emptyStateActions}>
                    <button type="button" className={styles.primaryBtn} onClick={handleCreateAlert}>
                      Creer une alerte pour cette zone
                    </button>
                    <Link href="/dashboard/owner/alertes" className={styles.secondaryBtn}>
                      Voir mes alertes
                    </Link>
                  </div>
                )}
              </div>
            ) : null}

            {!loading && !error && items.length === 0 && !hasSubmittedSearch ? (
              <div className={styles.emptyState}>
                <h2>Lancez une recherche pour voir les concierges disponibles.</h2>
                <p>
                  {hasSearchCriteria
                    ? "Vos filtres sont prêts. Cliquez sur Rechercher pour afficher les concierges disponibles."
                    : "Saisissez une région, puis ajoutez une ville si besoin pour affiner."}
                </p>
              </div>
            ) : null}

            <div className={viewMode === "list" ? `${styles.grid} ${styles.gridList}` : styles.grid}>
              {loading
                ? Array.from({ length: viewMode === "list" ? 3 : 6 }).map((_, index) => (
                  <article
                    key={`skeleton-${index}`}
                    className={`${styles.card} ${styles.skeletonCard}`}
                    style={{ ["--card-index" as string]: String(index) }}
                    aria-hidden="true"
                  >
                    <div className={styles.cardHead}>
                      <div className={styles.cardIdentityWrap}>
                        <div className={`${styles.avatarBadge} ${styles.skeletonBlock}`} />
                        <div className={styles.cardIdentity}>
                          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
                          <div className={styles.skeletonLine} />
                        </div>
                      </div>
                      <div className={styles.badgesCol}>
                        <div className={`${styles.skeletonPill} ${styles.skeletonBlock}`} />
                        <div className={`${styles.skeletonPill} ${styles.skeletonBlock}`} />
                      </div>
                    </div>

                    <div className={styles.kpiRow}>
                      <div className={`${styles.kpiCard} ${styles.skeletonBlock}`} />
                      <div className={`${styles.kpiCard} ${styles.skeletonBlock}`} />
                      <div className={`${styles.kpiCard} ${styles.skeletonBlock}`} />
                    </div>

                    <div className={styles.pricing}>
                      <div className={`${styles.priceCard} ${styles.skeletonBlock}`} />
                      <div className={`${styles.priceCard} ${styles.skeletonBlock}`} />
                    </div>

                    <div className={styles.tags}>
                      <div className={`${styles.skeletonPillWide} ${styles.skeletonBlock}`} />
                      <div className={`${styles.skeletonPill} ${styles.skeletonBlock}`} />
                      <div className={`${styles.skeletonPill} ${styles.skeletonBlock}`} />
                    </div>
                  </article>
                ))
                : null}
              {sortedItems.map((item, index) => (
                <ConciergeCard
                  key={item.id}
                  item={item}
                  index={index}
                  isSelected={selectedIdSet.has(item.id)}
                  onToggle={toggleConciergeSelection}
                />
              ))}
            </div>
          </div>

          <aside className={styles.sidebar}>
            <form className={styles.requestPanel} onSubmit={handleSendRequest} id="owner-request-panel">
              <div className={styles.requestHeader}>
                <div>
                  <p className={styles.eyebrow}>Demande</p>
                  <h2 className={styles.requestTitle}>Votre brief concierge</h2>
                </div>
                <span className={styles.requestCount}>{selectedConciergeIds.length} cible(s)</span>
              </div>

              <div className={styles.selectionSummary}>
                <div className={styles.panelSummary}>
                  <strong>Recherche active</strong>
                  <div className={styles.summaryChips}>
                    {activeSearchSummary.length > 0 ? (
                      activeSearchSummary.map((item) => (
                        <span key={item} className={styles.summaryChip}>
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className={styles.tagMuted}>Aucun filtre actif pour le moment.</span>
                    )}
                  </div>
                </div>

                <div className={styles.selectionDivider} />

                <strong>Concierges sélectionnés</strong>
                <div className={styles.selectedList}>
                  {selectedConcierges.length > 0 ? (
                    selectedConcierges.map((item) => (
                      <span key={item.id} className={styles.selectedChip}>
                        <span className={styles.selectedChipAvatar}>
                          <ConciergeAvatar
                            src={item.avatar_url}
                            alt={
                              item.avatar_url
                                ? `Avatar de ${item.display_name}`
                                : `Avatar par defaut de ${item.display_name}`
                            }
                            className={styles.selectedChipAvatarImage}
                            width={28}
                            height={28}
                          />
                        </span>
                        <span className={styles.selectedChipLabel}>{item.display_name}</span>
                      </span>
                    ))
                  ) : (
                    <span className={styles.tagMuted}>
                      Selectionnez un ou plusieurs concierges dans la liste.
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.sidebarFields}>
                <label className={styles.field}>
                  <span>Type de demande</span>
                  <select
                    value={requestForm.requestType}
                    onChange={(event) =>
                      updateRequestForm("requestType", event.target.value as RequestType)
                    }
                  >
                    <option value="ponctuel">Besoin ponctuel</option>
                    <option value="renfort">Remplacement / renfort</option>
                    <option value="durable">Besoin durable</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Region</span>
                  <OwnerLocationAutocomplete
                    ariaLabel="Region"
                    value={requestForm.region}
                    onChange={(value) => updateRequestForm("region", value)}
                    placeholder="Region ou zone d'intervention"
                    getSuggestions={getOwnerRegionSuggestions}
                  />
                </label>

                <label className={styles.field}>
                  <span>Ville</span>
                  <OwnerLocationAutocomplete
                    ariaLabel="Ville"
                    value={requestForm.city}
                    onChange={(value) => updateRequestForm("city", value)}
                    placeholder="Ville d'intervention"
                    getSuggestions={getOwnerCitySuggestions}
                  />
                </label>

                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    <span>Code postal</span>
                    <input
                      value={requestForm.postalCode}
                      onChange={(event) => updateRequestForm("postalCode", event.target.value)}
                      placeholder="75015"
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Budget max</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={requestForm.budgetMax}
                      onChange={(event) => updateRequestForm("budgetMax", event.target.value)}
                      placeholder="120"
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span>Date souhaitee</span>
                  <input
                    type="datetime-local"
                    value={requestForm.desiredDate}
                    onChange={(event) => updateRequestForm("desiredDate", event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Titre</span>
                  <input
                    value={requestForm.title}
                    onChange={(event) => updateRequestForm("title", event.target.value)}
                    placeholder="Ex: besoin de check-in ce week-end"
                  />
                </label>

                <label className={styles.field}>
                  <span>Description</span>
                  <textarea
                    className={styles.requestTextarea}
                    value={requestForm.description}
                    onChange={(event) => updateRequestForm("description", event.target.value)}
                    placeholder="Expliquez la situation, le logement, l'urgence et ce que vous attendez."
                    rows={5}
                  />
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={requestForm.urgency}
                    onChange={(event) => updateRequestForm("urgency", event.target.checked)}
                  />
                  <span>Cette demande est urgente</span>
                </label>
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={submittingRequest || selectedConciergeIds.length === 0}
                >
                  {submittingRequest ? "Envoi..." : "Envoyer ma demande"}
                </button>
                <Link href="/dashboard/owner/conciergerie" className={styles.secondaryBtn}>
                  Suivre mes demandes envoyées
                </Link>
              </div>
            </form>
          </aside>
        </div>

        <div className={styles.mobileSelectionBar}>
          <div className={styles.mobileSelectionCopy}>
            <strong>{selectedConciergeIds.length} concierge(s) sélectionné(s)</strong>
            <span>
              {selectedConciergeIds.length > 0
                ? "Finalisez votre brief ou ajustez votre sélection."
                : "Ajoutez des profils pour envoyer une demande."}
            </span>
          </div>
          <a href="#owner-request-panel" className={styles.primaryBtn}>
            Voir ma demande
          </a>
        </div>

        {mobileFiltersOpen ? (
          <div className={styles.mobileDrawerBackdrop} onClick={() => setMobileFiltersOpen(false)}>
            <div
              className={styles.mobileDrawer}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Filtres de recherche"
            >
              <div className={styles.mobileDrawerHeader}>
                <div>
                  <p className={styles.eyebrow}>Filtres</p>
                  <h2 className={styles.requestTitle}>Affinez votre recherche</h2>
                </div>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Fermer
                </button>
              </div>
              <form className={styles.mobileDrawerBody} onSubmit={handleSubmit}>
                {filterControls}
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
