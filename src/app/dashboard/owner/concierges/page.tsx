"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./OwnerConciergesPage.module.scss";
import { ConciergeAvatar } from "./ConciergeAvatar";
import { ConciergeCard } from "./ConciergeCard";
import type { SortMode, ViewMode } from "./conciergeSearchTypes";
import {
  createConciergeComparator,
  getActiveSearchSummary,
  mergeSortedOptions,
} from "./conciergeSearchUtils";
import { useOwnerConciergeSearch } from "./useOwnerConciergeSearch";
import {
  buildOwnerConciergeFilterOptions,
  hasOwnerConciergeSearchCriteria,
  toggleOwnerConciergeService,
  type OwnerConciergeSearchFilters,
} from "./searchHelpers";

type RequestType = "ponctuel" | "renfort" | "durable";

type RequestFormState = {
  requestType: RequestType;
  title: string;
  description: string;
  location: string;
  postalCode: string;
  desiredDate: string;
  budgetMax: string;
  urgency: boolean;
};

const initialFilters: OwnerConciergeSearchFilters = {
  location: "",
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
  location: "",
  postalCode: "",
  desiredDate: "",
  budgetMax: "",
  urgency: false,
};

export default function OwnerConciergesPage() {
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
  const { items, loading, error, serverOptions, search, clear, setError } = useOwnerConciergeSearch();

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
    setRequestForm((prev) => ({
      ...prev,
      location: prev.location || filters.location,
    }));
  }, [filters.location]);

  function clearResults() {
    clear();
    setSelectedConciergeIds([]);
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
          requested_services: filters.selectedServices,
          city: requestForm.location.trim(),
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
        `Demande envoyee a ${selectedConciergeIds.length} concierge(s). Vous pouvez maintenant suivre les retours.`,
      );
      setSelectedConciergeIds([]);
      setMobileFiltersOpen(false);
      setRequestForm({
        ...initialRequestForm,
        location: filters.location,
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
          <span>Region</span>
          <input
            aria-label="Region"
            value={filters.location}
            onChange={(event) => updateFilters("location", event.target.value)}
            placeholder="Ile-de-France, Annecy, Bordeaux, PACA..."
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

        <label className={styles.field}>
          <span>Budget max / heure</span>
          <input
            aria-label="Budget maximum par heure"
            type="number"
            min="0"
            inputMode="numeric"
            value={filters.budgetMax}
            onChange={(event) => updateFilters("budgetMax", event.target.value)}
            placeholder="90"
          />
        </label>

        <label className={styles.field}>
          <span>Rayon max</span>
          <input
            aria-label="Rayon maximum"
            type="number"
            min="0"
            inputMode="numeric"
            value={filters.radiusKm}
            onChange={(event) => updateFilters("radiusKm", event.target.value)}
            placeholder="25"
          />
        </label>

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
            Reinitialiser
          </button>
        </div>
      </div>

      <div className={styles.searchMeta}>
        <div className={styles.servicesBlock}>
          <span className={styles.blockLabel}>Services recherches</span>
          <div className={styles.serviceChips}>
            {serviceOptions.length === 0 ? (
              <span className={styles.tagMuted}>
                Les services apparaitront apres le premier chargement.
              </span>
            ) : (
              serviceOptions.map((serviceLabel) => {
                const isSelected = filters.selectedServices.includes(serviceLabel);
                return (
                  <button
                    key={serviceLabel}
                    type="button"
                    aria-pressed={isSelected}
                    className={isSelected ? styles.serviceChipActive : styles.serviceChip}
                    onClick={() =>
                      updateFilters(
                        "selectedServices",
                        toggleOwnerConciergeService(filters.selectedServices, serviceLabel),
                      )
                    }
                  >
                    {serviceLabel}
                  </button>
                );
              })
            )}
          </div>
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
            <h1 className={styles.title}>Trouvez un concierge disponible dans votre region</h1>
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
              <span className={styles.statLabel}>Concierges trouves</span>
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
              <span className={styles.statLabel}>Votre selection</span>
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
                <p className={styles.eyebrow}>Resultats</p>
                <h2 className={styles.sectionTitle}>
                  {loading
                    ? "Recherche en cours..."
                    : hasSubmittedSearch
                      ? `${items.length} concierge(s) disponible(s)`
                      : "Aucun concierge affiche pour le moment"}
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
                    Mieux notes
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
                  {filters.location.trim()
                    ? `Aucun concierge disponible dans la region ${filters.location.trim()}.`
                    : "Aucun concierge disponible pour cette recherche."}
                </h2>
                <p>
                  Aucun profil actif n&apos;a ete trouve avec les filtres actuels. Essayez une region
                  voisine, augmentez le rayon ou retirez quelques filtres.
                </p>
              </div>
            ) : null}

            {!loading && !error && items.length === 0 && !hasSubmittedSearch ? (
              <div className={styles.emptyState}>
                <h2>Lancez une recherche pour voir les concierges disponibles.</h2>
                <p>
                  {hasSearchCriteria
                    ? "Vos filtres sont prets. Cliquez sur Rechercher pour afficher les concierges disponibles."
                    : "Saisissez une region, puis affinez selon le type de bien, le budget ou les services attendus."}
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

                <strong>Concierges selectionnes</strong>
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
                  <span>Localisation</span>
                  <input
                    value={requestForm.location}
                    onChange={(event) => updateRequestForm("location", event.target.value)}
                    placeholder="Region ou zone d'intervention"
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
                  Voir mon suivi concierge
                </Link>
              </div>
            </form>
          </aside>
        </div>

        <div className={styles.mobileSelectionBar}>
          <div className={styles.mobileSelectionCopy}>
            <strong>{selectedConciergeIds.length} concierge(s) selectionne(s)</strong>
            <span>
              {selectedConciergeIds.length > 0
                ? "Finalisez votre brief ou ajustez votre selection."
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
