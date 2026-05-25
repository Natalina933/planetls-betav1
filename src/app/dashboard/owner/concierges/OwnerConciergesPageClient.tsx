"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button, ButtonLink } from "@/components/ui";
import styles from "./OwnerConciergesPage.module.scss";
import type { ServiceCatalogItem, SortMode, ViewMode } from "./conciergeSearchTypes";
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
import { upsertOwnerConciergeSearchAlert } from "../searchAlerts";
import { ResultsGrid, ResultsHeader, RequestPanel, SearchFilters } from "@/features/owner-concierges/components";
import { OwnerJourneyRail } from "@/features/owner-dashboard";
import type { RequestWorkflowStatus } from "@/app/lib/requestStatus";
import type { RequestFormState } from "@/features/owner-concierges/types";
import { focusFirstModalElement, trapFocusInModal } from "../modalAccessibility";

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
  city: "",
  postalCode: "",
  budgetMax: "",
  currency: "EUR",
  urgency: false,
};

function parseSliderValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function OwnerConciergesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<OwnerConciergeSearchFilters>(initialFilters);
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("available");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [requestComposerOpen, setRequestComposerOpen] = useState(false);
  const [selectedConciergeIds, setSelectedConciergeIds] = useState<string[]>([]);
  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [openServiceSections, setOpenServiceSections] = useState<Record<string, boolean>>({});
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [lastSubmittedStatus, setLastSubmittedStatus] = useState<RequestWorkflowStatus | null>(null);
  const [lastSentSummary, setLastSentSummary] = useState<{
    title: string;
    city: string;
    recipients: string[];
  } | null>(null);
  const { items, loading, error, serverOptions, search, clear, setError } = useOwnerConciergeSearch();
  const hydratedFromUrlRef = useRef(false);
  const requestPanelRef = useRef<HTMLElement | null>(null);
  const requestReturnFocusRef = useRef<HTMLElement | null>(null);
  const lastToastMessageRef = useRef<string | null>(null);

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
    setFeedback(null);
    setLastSentSummary(null);
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
    const queryValue = filters.city.trim();
    const looksLikePostalCode = /^\d{4,6}$/.test(queryValue);

    setRequestForm((prev) => ({
      ...prev,
      city: looksLikePostalCode ? "" : filters.city,
      postalCode: looksLikePostalCode ? queryValue : prev.postalCode,
    }));
  }, [filters.city]);

  useEffect(() => {
    if (hydratedFromUrlRef.current) return;

    const nextFilters: OwnerConciergeSearchFilters = {
      region: searchParams.get("region") ?? "",
      city: searchParams.get("city") ?? searchParams.get("postalCode") ?? "",
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
    const nextEditingAlertId = searchParams.get("alertId");

    const hasUrlFilters = hasOwnerConciergeSearchCriteria(nextFilters);
    if (!hasUrlFilters) {
      hydratedFromUrlRef.current = true;
      setEditingAlertId(nextEditingAlertId);
      return;
    }

    hydratedFromUrlRef.current = true;
    setEditingAlertId(nextEditingAlertId);
    setFilters(nextFilters);
    setHasSubmittedSearch(true);
    void search(nextFilters);
  }, [search, searchParams]);

  useEffect(() => {
    if (!feedback || lastToastMessageRef.current === feedback) return;
    lastToastMessageRef.current = feedback;
    toast.success(feedback, {
      position: "top-right",
      autoClose: 3500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  }, [feedback]);

  useEffect(() => {
    if (!error || lastToastMessageRef.current === error) return;
    lastToastMessageRef.current = error;
    toast.error(error, {
      position: "top-right",
      autoClose: 4500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  }, [error]);

  function openRequestComposer() {
    requestReturnFocusRef.current =
      typeof document !== "undefined" && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setRequestComposerOpen(true);
  }

  function closeRequestComposer() {
    setRequestComposerOpen(false);
    window.setTimeout(() => requestReturnFocusRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!requestComposerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => focusFirstModalElement(requestPanelRef.current), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRequestComposer();
        return;
      }

      trapFocusInModal(event, requestPanelRef.current);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [requestComposerOpen]);

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
    setEditingAlertId(null);
    setLastSubmittedStatus(null);
    setLastSentSummary(null);
    lastToastMessageRef.current = null;
    clearResults();
    router.replace("/dashboard/owner/concierges");
  }

  function handleCreateAlert() {
    try {
      const result = upsertOwnerConciergeSearchAlert(editingAlertId, {
        city: /^\d{4,6}$/.test(filters.city.trim()) ? "" : filters.city,
        postalCode: /^\d{4,6}$/.test(filters.city.trim()) ? filters.city : "",
        budgetMax: filters.budgetMax,
        radiusKm: filters.radiusKm,
      });
      setFeedback(
        result.created
          ? editingAlertId
            ? "Alerte mise à jour. Vous la retrouverez dans vos alertes propriétaire."
            : "Alerte créée. Vous la retrouverez dans vos alertes propriétaire."
          : "Une alerte existe déjà pour cette ville. Vous la retrouverez dans vos alertes propriétaire.",
      );
      if (editingAlertId) {
        setEditingAlertId(result.alert.id);
        router.replace("/dashboard/owner/concierges");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l'alerte.");
    }
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
    setLastSentSummary(null);
    setError(null);
  }

  async function handleSendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedConciergeIds.length === 0) {
      setError("Sélectionnez au moins un concierge avant d'envoyer une demande.");
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
            postal_code: requestForm.postalCode.trim(),
            desired_date: null,
          urgency: requestForm.urgency,
          budget_max: requestForm.budgetMax ? Number(requestForm.budgetMax) : null,
          currency: requestForm.currency,
          recipient_ids: selectedConciergeIds,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer votre demande.");
      }

      const recipientNames = selectedConcierges.map((item) => item.display_name);
      setFeedback(
        `Votre demande a bien été envoyée à ${selectedConciergeIds.length} concierge(s).`,
      );
      setLastSubmittedStatus("NEW");
      setLastSentSummary({
        title: requestForm.title.trim(),
        city: requestForm.city.trim(),
        recipients: recipientNames,
      });
      setSelectedConciergeIds([]);
      setMobileFiltersOpen(false);
      setRequestForm({
        ...initialRequestForm,
        city: /^\d{4,6}$/.test(filters.city.trim()) ? "" : filters.city,
        postalCode: /^\d{4,6}$/.test(filters.city.trim()) ? filters.city : "",
      });
      requestPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer votre demande.");
      requestPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmittingRequest(false);
    }
  }

  const filtersLabel = [filters.region.trim(), filters.city.trim()].filter(Boolean).join(" · ");

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <ToastContainer newestOnTop position="top-right" />
        <OwnerJourneyRail activeStep={selectedConciergeIds.length > 0 ? "selection" : "search"} />
        <SearchFilters
          styles={styles}
          filters={filters}
          propertyTypeOptions={propertyTypeOptions}
          categoryOptions={categoryOptions}
          visibleServicesByCategory={visibleServicesByCategory}
          openServiceSections={openServiceSections}
          loading={loading}
          viewMode={viewMode}
          itemsCount={items.length}
          stats={stats}
          selectedConciergeCount={selectedConciergeIds.length}
          onSubmit={handleSubmit}
          onReset={resetFilters}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          onViewModeChange={setViewMode}
          onFilterChange={updateFilters}
          onToggleCategory={toggleCategory}
          onToggleService={toggleService}
          onToggleServiceSection={toggleServiceSection}
          getRegionSuggestions={getOwnerRegionSuggestions}
          getCitySuggestions={getOwnerCitySuggestions}
          parseSliderValue={parseSliderValue}
        />

        <div className={styles.contentLayout}>
          <div className={styles.resultsColumn} ref={resultsRef}>
            <ResultsHeader
              styles={styles}
              loading={loading}
              hasSubmittedSearch={hasSubmittedSearch}
              itemsCount={items.length}
              sortMode={sortMode}
              viewMode={viewMode}
              onSortModeChange={setSortMode}
              onViewModeChange={setViewMode}
            />

            <ResultsGrid
              styles={styles}
              loading={loading}
              error={error}
              hasSubmittedSearch={hasSubmittedSearch}
              hasSearchCriteria={hasSearchCriteria}
              filtersLabel={filtersLabel}
              filters={filters}
              items={sortedItems}
              selectedIds={selectedIdSet}
              viewMode={viewMode}
              onToggleSelection={toggleConciergeSelection}
              onCreateAlert={handleCreateAlert}
            />
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.requestDock}>
              <div>
                <p className={styles.eyebrow}>Demande</p>
                <h2 className={styles.requestTitle}>Lancer une recherche concierge</h2>
              </div>
              <p className={styles.requestIntro}>
                Envoyez un brief court aux conciergeries sélectionnées pour obtenir une réponse ou un devis.
              </p>
              <div className={styles.selectionSummary}>
                <span className={styles.requestSectionLabel}>Sélection</span>
                <strong>{selectedConciergeIds.length} concierge(s) sélectionné(s)</strong>
                {selectedConcierges.length > 0 ? (
                  <div className={styles.summaryChips}>
                    {selectedConcierges.slice(0, 4).map((item) => (
                      <span key={item.id} className={styles.summaryChip}>
                        {item.display_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.tagMuted}>Sélectionnez un profil dans les résultats.</span>
                )}
              </div>
              <Button
                type="button"
                variant="primary"
                className={styles.primaryBtn}
                disabled={selectedConciergeIds.length === 0}
                onClick={openRequestComposer}
              >
                Lancer la recherche
              </Button>
              <ButtonLink href="/dashboard/owner/demandes" variant="secondary" className={styles.secondaryBtn}>
                Suivre mes demandes
              </ButtonLink>
            </div>
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
          <Button
            type="button"
            variant="primary"
            className={styles.primaryBtn}
            disabled={selectedConciergeIds.length === 0}
            onClick={openRequestComposer}
          >
            Lancer la recherche
          </Button>
        </div>

        {requestComposerOpen ? (
          <div className={styles.modalOverlay} onMouseDown={closeRequestComposer}>
            <section
              ref={requestPanelRef}
              className={styles.requestModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="owner-request-composer-title"
              tabIndex={-1}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.eyebrow}>Recherche concierge</p>
                  <h2 id="owner-request-composer-title" className={styles.requestTitle}>
                    Lancer une recherche concierge
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.secondaryBtn}
                  onClick={closeRequestComposer}
                >
                  Fermer
                </Button>
              </div>
              <RequestPanel
                styles={styles}
                selectedConcierges={selectedConcierges}
                selectedServices={filters.selectedServices}
                activeSearchSummary={activeSearchSummary}
                requestForm={requestForm}
                submittingRequest={submittingRequest}
                requestFeedback={feedback}
                requestError={error}
                lastSubmittedStatus={lastSubmittedStatus}
                lastSentSummary={lastSentSummary}
                onSubmit={handleSendRequest}
                onRequestFormChange={updateRequestForm}
                getCitySuggestions={getOwnerCitySuggestions}
              />
            </section>
          </div>
        ) : null}

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
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.secondaryBtn}
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Fermer
                </Button>
              </div>
              <div className={styles.mobileDrawerBody}>
                <SearchFilters
                  styles={styles}
                  mode="compact"
                  filters={filters}
                  propertyTypeOptions={propertyTypeOptions}
                  categoryOptions={categoryOptions}
                  visibleServicesByCategory={visibleServicesByCategory}
                  openServiceSections={openServiceSections}
                  loading={loading}
                  viewMode={viewMode}
                  itemsCount={items.length}
                  stats={stats}
                  selectedConciergeCount={selectedConciergeIds.length}
                  onSubmit={handleSubmit}
                  onReset={resetFilters}
                  onOpenMobileFilters={() => setMobileFiltersOpen(true)}
                  onViewModeChange={setViewMode}
                  onFilterChange={updateFilters}
                  onToggleCategory={toggleCategory}
                  onToggleService={toggleService}
                  onToggleServiceSection={toggleServiceSection}
                  getRegionSuggestions={getOwnerRegionSuggestions}
                  getCitySuggestions={getOwnerCitySuggestions}
                  parseSliderValue={parseSliderValue}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

