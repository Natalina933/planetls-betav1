"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, MapPin, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import FilterSliders from "@/app/components/ui/FilterSliders";
import { Button, Checkbox, Select, ServiceCategoryIcon } from "@/components/ui";
import { FilterChipGroup } from "@/features/shared/components/FilterChipGroup";
import { OptionToggleGroup } from "@/features/shared/components/OptionToggleGroup";
import type { OwnerConciergeSearchFilters, ViewMode } from "@/features/owner-concierges/lib/search";
import { OwnerLocationAutocomplete } from "@/features/owner-concierges/components/OwnerLocationAutocomplete";

type SearchFiltersProps = {
  styles: Record<string, string>;
  mode?: "full" | "compact";
  filters: OwnerConciergeSearchFilters;
  propertyTypeOptions: string[];
  categoryOptions: string[];
  serviceOptions: string[];
  visibleServicesByCategory: Array<{ category: string; services: string[] }>;
  openServiceSections: Record<string, boolean>;
  loading: boolean;
  viewMode: ViewMode;
  isStaySearchMode?: boolean;
  stayNeedLabel?: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onOpenMobileFilters: () => void;
  onViewModeChange: (value: ViewMode) => void;
  onFilterChange: <Key extends keyof OwnerConciergeSearchFilters>(
    key: Key,
    value: OwnerConciergeSearchFilters[Key],
  ) => void;
  onToggleCategory: (value: string) => void;
  onToggleService: (value: string) => void;
  onToggleServiceSection: (category: string) => void;
  getCitySuggestions: (query: string) => string[];
  parseSliderValue: (value: string) => number;
};

const VIEW_OPTIONS = [
  { value: "cards", label: "Cartes" },
  { value: "list", label: "Liste" },
] as const;

const QUICK_SERVICE_LABELS = ["Ménage", "Check-in / Check-out", "Linge", "Maintenance légère", "Accueil voyageurs"];
const RADIUS_OPTIONS = ["10", "20", "30", "50", "100"];

function normalizeServiceLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function findServiceOption(options: string[], label: string) {
  const normalizedLabel = normalizeServiceLabel(label);
  const normalizedParts = normalizedLabel.split("/").map((part) => part.trim()).filter(Boolean);

  return options.find((option) => {
    const normalizedOption = normalizeServiceLabel(option);
    return normalizedOption === normalizedLabel || normalizedParts.some((part) => normalizedOption.includes(part));
  });
}

export function SearchFilters({
  styles,
  mode = "full",
  filters,
  propertyTypeOptions,
  categoryOptions: _categoryOptions,
  serviceOptions,
  visibleServicesByCategory,
  openServiceSections,
  loading,
  viewMode,
  isStaySearchMode = false,
  stayNeedLabel = null,
  onSubmit,
  onReset,
  onOpenMobileFilters,
  onViewModeChange,
  onFilterChange,
  onToggleCategory: _onToggleCategory,
  onToggleService,
  onToggleServiceSection,
  getCitySuggestions,
  parseSliderValue,
}: SearchFiltersProps) {
  const [serviceQuery, setServiceQuery] = useState("");
  const [allServicesOpen, setAllServicesOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const quickServices = useMemo(
    () =>
      QUICK_SERVICE_LABELS.map((label) => ({
        label,
        value: findServiceOption(serviceOptions, label),
      })).filter((item): item is { label: string; value: string } => Boolean(item.value)),
    [serviceOptions],
  );

  const filteredServiceOptions = useMemo(() => {
    const query = normalizeServiceLabel(serviceQuery);
    return serviceOptions
      .filter((service) => !query || normalizeServiceLabel(service).includes(query))
      .slice(0, 80);
  }, [serviceOptions, serviceQuery]);

  const selectedServices = filters.selectedServices;

  return (
    <div className={mode === "full" ? styles.hero : ""}>
      {mode === "full" ? (
        <>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Concierges</span>
            <h1 className={styles.title}>Trouver une concierge</h1>
            <p className={styles.heroSubtitle}>
              Des professionnelles de confiance près de chez vous pour prendre soin de votre logement.
            </p>
          </div>

          <div className={styles.mobileHeroActions}>
            <Button type="button" variant="secondary" className={styles.secondaryBtn} onClick={onOpenMobileFilters}>
              Filtres
            </Button>
            <OptionToggleGroup
              ariaLabel="Mode d'affichage"
              options={VIEW_OPTIONS}
              value={viewMode}
              onChange={onViewModeChange}
              className={styles.viewToggle}
              getClassName={(selected) => (selected ? styles.viewToggleActive : styles.viewToggleBtn)}
            />
          </div>
        </>
      ) : null}

      <form className={mode === "full" ? styles.searchShell : styles.compactSearchShell} onSubmit={onSubmit}>
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
        </div>

        {!isStaySearchMode ? (
          <section className={styles.servicePicker} aria-labelledby="service-picker-title">
            <div className={styles.servicePickerHeader}>
              <span className={styles.blockLabel} id="service-picker-title">
                De quel service avez-vous besoin ?
              </span>
              <label className={`${styles.field} ${styles.serviceSearchField}`}>
                <span>Rechercher une prestation</span>
                <input
                  type="search"
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  placeholder="Rechercher une prestation..."
                />
              </label>
            </div>

            <div className={styles.serviceChips} aria-label="Raccourcis prestations">
              {quickServices.map((service) => {
                const isActive = selectedServices.includes(service.value);
                return (
                  <Button
                    key={`${service.label}-${service.value}`}
                    type="button"
                    variant="ghost"
                    className={isActive ? styles.serviceChipActive : styles.serviceChip}
                    aria-pressed={isActive}
                    onClick={() => onToggleService(service.value)}
                  >
                    {isActive ? <Check size={14} className={styles.serviceChipIcon} aria-hidden="true" /> : null}
                    {service.label}
                  </Button>
                );
              })}
            </div>

            {selectedServices.length > 0 ? (
              <div className={styles.selectedServices} aria-label="Services sélectionnés">
                <span className={styles.blockLabel}>Services sélectionnés</span>
                <div className={styles.serviceChips}>
                  {selectedServices.map((service) => (
                    <Button
                      key={service}
                      type="button"
                      variant="ghost"
                      className={styles.selectedServiceChip}
                      onClick={() => onToggleService(service)}
                    >
                      {service} ×
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              className={styles.allServicesToggle}
              onClick={() => setAllServicesOpen((value) => !value)}
              aria-expanded={allServicesOpen}
            >
              {allServicesOpen ? "Replier les prestations" : "+ Autres services"}
            </Button>

            {allServicesOpen ? (
              <div className={styles.allServicesPanel}>
                {visibleServicesByCategory.length > 0 ? (
                  <div className={styles.serviceSections}>
                    {visibleServicesByCategory.map((group) => {
                      const groupServices = group.services.filter((service) => {
                        if (!serviceQuery.trim()) return true;
                        return normalizeServiceLabel(service).includes(normalizeServiceLabel(serviceQuery));
                      });
                      if (groupServices.length === 0) return null;

                      const isOpen = openServiceSections[group.category] ?? true;
                      const selectedCount = groupServices.filter((service) => selectedServices.includes(service)).length;

                      return (
                        <section key={group.category} className={styles.serviceSection}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={styles.serviceSectionHeader}
                            onClick={() => onToggleServiceSection(group.category)}
                            aria-expanded={isOpen}
                          >
                            <span className={styles.serviceSectionTitle}>
                              <ServiceCategoryIcon category={group.category} size={17} />
                              {group.category}
                            </span>
                            <span className={styles.serviceSectionMeta}>
                              {selectedCount}/{groupServices.length} {isOpen ? "-" : "+"}
                            </span>
                          </Button>

                          {isOpen ? (
                            <FilterChipGroup
                              items={groupServices}
                              selectedItems={selectedServices}
                              onToggle={onToggleService}
                              className={styles.serviceSectionBody}
                              getClassName={(selected) => (selected ? styles.serviceChipActive : styles.serviceChip)}
                            />
                          ) : null}
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <FilterChipGroup
                    items={filteredServiceOptions}
                    selectedItems={selectedServices}
                    onToggle={onToggleService}
                    className={styles.serviceSectionBody}
                    emptyLabel="Aucune prestation disponible."
                    getClassName={(selected) => (selected ? styles.serviceChipActive : styles.serviceChip)}
                  />
                )}
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
            <div className={styles.advancedFilters}>
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
      </form>
    </div>
  );
}
