"use client";

import { useId, useState } from "react";
import { ChevronDown, MapPin, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import FilterSliders from "@/app/components/ui/FilterSliders";
import { Button, Checkbox, Select } from "@/components/ui";
import { OptionToggleGroup } from "@/features/shared/components/OptionToggleGroup";
import type { OwnerConciergeSearchFilters, ViewMode } from "@/features/owner-concierges/lib/search";
import { OwnerLocationAutocomplete } from "@/features/owner-concierges/components/OwnerLocationAutocomplete";
import {
  PLANETLS_SERVICE_FAMILIES,
  PLANETLS_SERVICE_TARGET,
} from "@/app/lib/planetlsServiceCatalogTarget";
import { getGuestCheckinCheckoutDisplaySelections } from "@/app/lib/guestCheckinCheckout";
import { PlanetLSServicePicker } from "@/components/ui/PlanetLSServicePicker/PlanetLSServicePicker";

type SearchFiltersProps = {
  styles: Record<string, string>;
  filters: OwnerConciergeSearchFilters;
  propertyTypeOptions: string[];
  loading: boolean;
  viewMode: ViewMode;
  isStaySearchMode?: boolean;
  stayNeedLabel?: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onViewModeChange: (value: ViewMode) => void;
  onFilterChange: <Key extends keyof OwnerConciergeSearchFilters>(
    key: Key,
    value: OwnerConciergeSearchFilters[Key],
  ) => void;
  onToggleService: (value: string) => void;
  getCitySuggestions: (query: string) => string[];
  parseSliderValue: (value: string) => number;
};

const VIEW_OPTIONS = [
  { value: "cards", label: "Cartes" },
  { value: "list", label: "Liste" },
] as const;

const RADIUS_OPTIONS = ["10", "20", "30", "50", "100"];

export function SearchFilters({
  styles,
  filters,
  propertyTypeOptions,
  loading,
  viewMode,
  isStaySearchMode = false,
  stayNeedLabel = null,
  onSubmit,
  onReset,
  onViewModeChange,
  onFilterChange,
  onToggleService,
  getCitySuggestions,
  parseSliderValue,
}: SearchFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const panelId = useId();

  const selectedServices = filters.selectedServices;
  const selectedFamilies = filters.selectedServiceFamilies ?? [];

  return (
    <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Professionnels</span>
            <h1 className={styles.title}>Trouver un professionnel</h1>
            <p className={styles.heroSubtitle}>
              Des professionnels près de chez vous pour prendre soin de votre logement.
            </p>
          </div>

          <div className={styles.mobileHeroActions}>
            <OptionToggleGroup
              ariaLabel="Mode d'affichage"
              options={VIEW_OPTIONS}
              value={viewMode}
              onChange={onViewModeChange}
              className={styles.viewToggle}
              getClassName={(selected) => (selected ? styles.viewToggleActive : styles.viewToggleBtn)}
            />
          </div>

      {!isStaySearchMode ? (
        <div role="group" aria-label="Type de professionnel" className={styles.professionalTypes}>
          {[
            { value: "all", label: "Tous" },
            { value: "concierge", label: "Concierges" },
            { value: "provider", label: "Artisans et prestataires" },
          ].map((option) => {
            const selected = (filters.professionalType ?? "all") === option.value;
            return <Button key={option.value} type="button" variant="ghost" aria-pressed={selected}
              className={selected ? styles.serviceChipActive : styles.serviceChip}
              onClick={() => onFilterChange("professionalType", option.value as "all" | "concierge" | "provider")}>
              {option.label}
            </Button>;
          })}
        </div>
      ) : null}
      <form className={styles.searchShell} onSubmit={onSubmit}>
        <div className={styles.searchBar}>
          <div className={`${styles.field} ${styles.searchField}`}>
            <span id="search-city-label">Ville ou code postal</span>
            <div className={styles.locationControl}>
              <MapPin size={17} className={styles.fieldIcon} aria-hidden="true" />
              <OwnerLocationAutocomplete
                ariaLabel="Ville ou code postal"
                value={filters.city}
                onChange={(value) => onFilterChange("city", value)}
                placeholder="Paris, 75015, Annecy..."
                getSuggestions={getCitySuggestions}
              />
            </div>
          </div>

          <label className={styles.field}>
            <span>Rayon</span>
            <Select
              aria-label="Rayon de recherche"
              value={filters.radiusKm}
              onChange={(event) => onFilterChange("radiusKm", event.target.value)}
            >
              <option value="">Libre</option>
              {RADIUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} km
                </option>
              ))}
            </Select>
          </label>


        </div>

        {!isStaySearchMode ? (
          <section className={styles.servicePicker} aria-labelledby="service-picker-title">
            <h2 className={styles.prestationsTitle} id="service-picker-title">Prestations</h2>
            <PlanetLSServicePicker
              selected={selectedServices}
              onChange={(services) => onFilterChange("selectedServices", services)}
              preferredFamily={selectedFamilies[0] ?? PLANETLS_SERVICE_TARGET.find(entry => selectedServices.includes(entry.slug))?.family}
              allowGroups={false}
              collapseGuestCheckinCheckout
              compact
              emptyMessage="Aucune prestation disponible."
            />
            {selectedServices.length > 0 ? (
              <div className={styles.serviceChips} aria-label="Prestations choisies">
                {getGuestCheckinCheckoutDisplaySelections(selectedServices).map(service => {
                  const label = PLANETLS_SERVICE_TARGET.find(entry => entry.slug === service)?.label ?? service;
                  return <Button key={service} type="button" variant="ghost" className={styles.selectedServiceChip}
                    aria-label={`Retirer ${label}`} onClick={() => onToggleService(service)}>{label} ×</Button>;
                })}
              </div>
            ) : null}
            {selectedFamilies.length > 0 ? (
              <div className={styles.legacyFamilyCriteria} aria-label="Filtres de famille conservés">
                <p>Filtres de famille conservés depuis votre inscription ou le lien. Retirez-les pour filtrer uniquement par prestations choisies.</p>
                <div className={styles.serviceChips}>
                  {selectedFamilies.map(family => {
                    const label = PLANETLS_SERVICE_FAMILIES.find(entry => entry.slug === family)?.label ?? family;
                    return <Button key={family} type="button" variant="ghost" className={styles.selectedServiceChip}
                      aria-label={`Retirer le filtre de famille ${label}`}
                      onClick={() => onFilterChange("selectedServiceFamilies", selectedFamilies.filter(value => value !== family))}>
                      {label} ×
                    </Button>;
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <div className={styles.stayServiceLock}>
            <span className={styles.blockLabel}>Prestation recherchée</span>
            <strong>{stayNeedLabel ?? selectedServices[0] ?? "Prestation du séjour"}</strong>
          </div>
        )}

        <section className={styles.advancedShell}>
          <Button
            type="button"
            variant="ghost"
            className={`${styles.allServicesToggle} ${styles.advancedToggle}`}
            onClick={() => setAdvancedOpen((value) => !value)}
            aria-expanded={advancedOpen}
            aria-controls={`${panelId}-advanced`}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span>{advancedOpen ? "Replier les filtres avancés" : "Filtres avancés"}</span>
            <ChevronDown
              size={17}
              className={advancedOpen ? styles.advancedChevronOpen : styles.advancedChevron}
              aria-hidden="true"
            />
          </Button>

          {advancedOpen ? (
            <div className={styles.advancedFilters} id={`${panelId}-advanced`}>
              <label className={styles.field}>
                <span>Type de bien</span>
                <Select
                  aria-label="Type de bien"
                  value={filters.propertyType}
                  onChange={(event) => onFilterChange("propertyType", event.target.value)}
                >
                  <option value="">Tous</option>
                  {propertyTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </label>

              <div className={styles.budgetCompact}>
                <FilterSliders
                  title="Budget"
                  budget={{
                    label: "Budget max",
                    value: parseSliderValue(filters.budgetMax),
                    min: 0,
                    max: 300,
                    step: 10,
                    helperText: "0 = libre",
                    formatValue: (value) => (value === 0 ? "Libre" : `${value} EUR/h`),
                    onChange: (value) => onFilterChange("budgetMax", value === 0 ? "" : String(value)),
                  }}
                />
              </div>

              <Checkbox
                aria-label="Afficher uniquement les professionnels PRO"
                checked={filters.proOnly}
                onChange={(event) => onFilterChange("proOnly", event.target.checked)}
                label="PRO uniquement"
                className={styles.checkboxInput}
                labelClassName={styles.checkboxLabel}
              />
            </div>
          ) : null}
        </section>
        {(filters.region || filters.propertyType || filters.budgetMax || filters.proOnly || filters.selectedCategories.length > 0) ? (
          <div className={styles.activeCriteria} aria-label="Critères actifs">
            <span className={styles.blockLabel}>Critères actifs</span>
            <div className={styles.serviceChips}>
              {filters.region ? <Button variant="ghost" className={styles.selectedServiceChip} onClick={() => onFilterChange("region", "")} aria-label="Retirer la région">{filters.region} ×</Button> : null}
              {filters.propertyType ? <Button variant="ghost" className={styles.selectedServiceChip} onClick={() => onFilterChange("propertyType", "")} aria-label="Retirer le type de bien">{filters.propertyType} ×</Button> : null}
              {filters.budgetMax ? <Button variant="ghost" className={styles.selectedServiceChip} onClick={() => onFilterChange("budgetMax", "")} aria-label="Retirer le budget">Budget : {filters.budgetMax} €/h ×</Button> : null}
              {filters.proOnly ? <Button variant="ghost" className={styles.selectedServiceChip} onClick={() => onFilterChange("proOnly", false)} aria-label="Retirer le filtre PRO">PRO ×</Button> : null}
              {filters.selectedCategories.map(category => <Button key={category} variant="ghost" className={styles.selectedServiceChip} onClick={() => onFilterChange("selectedCategories", filters.selectedCategories.filter(value => value !== category))} aria-label={`Retirer la catégorie ${category}`}>{category} ×</Button>)}
            </div>
          </div>
        ) : null}
          <div className={styles.searchActions}>
            <Button type="submit" variant="primary" className={styles.primaryBtn} disabled={loading}>
              <Search size={17} aria-hidden="true" />
              {loading ? "Recherche..." : "Rechercher"}
            </Button>
            <Button type="button" variant="secondary" className={styles.secondaryBtn} onClick={onReset} disabled={loading}>
              <RotateCcw size={17} aria-hidden="true" />
              Réinitialiser
            </Button>
          </div>
      </form>
    </div>
  );
}
