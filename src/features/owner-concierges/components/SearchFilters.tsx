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
  visibleServicesByCategory: Array<{ category: string; services: string[] }>;
  openServiceSections: Record<string, boolean>;
  loading: boolean;
  viewMode: ViewMode;
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

export function SearchFilters({
  styles,
  mode = "full",
  filters,
  propertyTypeOptions,
  categoryOptions,
  visibleServicesByCategory,
  openServiceSections,
  loading,
  viewMode,
  onSubmit,
  onReset,
  onOpenMobileFilters,
  onViewModeChange,
  onFilterChange,
  onToggleCategory,
  onToggleService,
  onToggleServiceSection,
  getCitySuggestions,
  parseSliderValue,
}: SearchFiltersProps) {
  return (
    <div className={mode === "full" ? styles.hero : ""}>
      {mode === "full" ? (
        <>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Mise en relation</span>
            <h1 className={styles.title}>Recherche concierge</h1>
          </div>

          <div className={styles.mobileHeroActions}>
            <Button
              type="button"
              variant="secondary"
              className={styles.secondaryBtn}
              onClick={onOpenMobileFilters}
            >
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

      <form className={mode === "full" ? styles.searchShell : ""} onSubmit={onSubmit}>
        <div className={styles.searchBar}>
          <div className={`${styles.field} ${styles.searchField}`}>
            <span id="search-city-label">Ville ou code postal</span>
            <OwnerLocationAutocomplete
              ariaLabel="Ville ou code postal"
              value={filters.city}
              onChange={(value) => onFilterChange("city", value)}
              placeholder="Paris, 75015, Annecy..."
              getSuggestions={getCitySuggestions}
            />
          </div>

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

          <div className={styles.sliderFilters}>
            <FilterSliders
              title="Budget et rayon"
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
              radius={{
                label: "Rayon",
                value: parseSliderValue(filters.radiusKm),
                min: 0,
                max: 100,
                step: 5,
                unit: "km",
                helperText: "0 = libre",
                formatValue: (value) => (value === 0 ? "Libre" : `${value} km`),
                onChange: (value) => onFilterChange("radiusKm", value === 0 ? "" : String(value)),
              }}
            />
          </div>

          <div className={styles.searchActions}>
            <Button type="submit" variant="primary" className={styles.primaryBtn} disabled={loading}>
              {loading ? "Recherche..." : "Rechercher"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={styles.secondaryBtn}
              onClick={onReset}
              disabled={loading}
            >
              Réinitialiser
            </Button>
          </div>
        </div>

        <div className={styles.searchMeta}>
          <div className={styles.servicesBlock}>
            <span className={styles.blockLabel}>Services</span>
            <FilterChipGroup
              items={categoryOptions}
              selectedItems={filters.selectedCategories}
              onToggle={onToggleCategory}
              className={styles.serviceChips}
              emptyLabel="Les catégories apparaîtront après le premier chargement."
              getClassName={(selected) => (selected ? styles.serviceChipActive : styles.serviceChip)}
            />
          </div>

          <div className={styles.servicesBlock}>
            <span className={styles.blockLabel}>Détails</span>
            {filters.selectedCategories.length === 0 ? (
              <span className={styles.tagMuted}>Choisissez un service.</span>
            ) : visibleServicesByCategory.length === 0 ? (
              <span className={styles.tagMuted}>Aucun détail disponible.</span>
            ) : (
              <div className={styles.serviceSections}>
                {visibleServicesByCategory.map((group) => {
                  const isOpen = openServiceSections[group.category] ?? true;
                  const selectedCount = group.services.filter((service) =>
                    filters.selectedServices.includes(service),
                  ).length;

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
                          {selectedCount}/{group.services.length} {isOpen ? "-" : "+"}
                        </span>
                      </Button>

                      {isOpen ? (
                        <FilterChipGroup
                          items={group.services}
                          selectedItems={filters.selectedServices}
                          onToggle={onToggleService}
                          className={styles.serviceSectionBody}
                          getClassName={(selected) =>
                            selected ? styles.serviceChipActive : styles.serviceChip
                          }
                        />
                      ) : null}
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          <Checkbox
            aria-label="Afficher uniquement les concierges PRO"
            checked={filters.proOnly}
            onChange={(event) => onFilterChange("proOnly", event.target.checked)}
            label="PRO uniquement"
            className={styles.checkboxInput}
            labelClassName={styles.checkboxLabel}
          />
        </div>
      </form>
    </div>
  );
}
