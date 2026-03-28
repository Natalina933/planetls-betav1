import FilterSliders from "@/app/components/ui/FilterSliders";
import { Button, Checkbox, Select } from "@/components/ui";
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
  itemsCount: number;
  stats: { totalAvailable: number; totalPro: number };
  selectedConciergeCount: number;
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
  getRegionSuggestions: (query: string) => string[];
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
  itemsCount,
  stats,
  selectedConciergeCount,
  onSubmit,
  onReset,
  onOpenMobileFilters,
  onViewModeChange,
  onFilterChange,
  onToggleCategory,
  onToggleService,
  onToggleServiceSection,
  getRegionSuggestions,
  getCitySuggestions,
  parseSliderValue,
}: SearchFiltersProps) {
  return (
    <div className={mode === "full" ? styles.hero : ""}>
      {mode === "full" ? (
        <>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Mise en relation</span>
            <h1 className={styles.title}>Trouvez un concierge disponible dans votre ville ou code postal</h1>
            <p className={styles.description}>
              Recherchez par zone, comparez les profils les plus utiles puis envoyez un brief clair
              aux concierges que vous retenez.
            </p>
          </div>

          <div className={styles.mobileHeroActions}>
            <Button
              type="button"
              variant="secondary"
              className={styles.secondaryBtn}
              onClick={onOpenMobileFilters}
            >
              Ouvrir les filtres
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
            <span id="search-region-label">Région</span>
            <OwnerLocationAutocomplete
              ariaLabel="Région"
              value={filters.region}
              onChange={(value) => onFilterChange("region", value)}
              placeholder="Ile-de-France, PACA, Bretagne..."
              getSuggestions={getRegionSuggestions}
            />
          </div>

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
              <option value="">Tous les biens</option>
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
                label: "Budget max par heure",
                value: parseSliderValue(filters.budgetMax),
                min: 0,
                max: 300,
                step: 10,
                helperText: "0 = sans limite",
                formatValue: (value) => (value === 0 ? "Sans limite" : `${value} EUR/h`),
                onChange: (value) => onFilterChange("budgetMax", value === 0 ? "" : String(value)),
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
            <span className={styles.blockLabel}>Services recherchés</span>
            <FilterChipGroup
              items={categoryOptions}
              selectedItems={filters.selectedCategories}
              onToggle={onToggleCategory}
              className={styles.serviceChips}
              emptyLabel="Les catégories apparaîtront après le premier chargement."
              getClassName={(selected) => (selected ? styles.serviceChipActive : styles.serviceChip)}
            />
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={styles.serviceSectionHeader}
                        onClick={() => onToggleServiceSection(group.category)}
                        aria-expanded={isOpen}
                      >
                        <span>{group.category}</span>
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
            label="Afficher uniquement les concierges PRO"
            className={styles.checkboxInput}
            labelClassName={styles.checkboxLabel}
          />
        </div>
      </form>

      {mode === "full" ? (
        <div className={styles.statsRow}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Concierges trouvés</span>
            <strong>{itemsCount}</strong>
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
            <strong>{selectedConciergeCount}</strong>
          </article>
        </div>
      ) : null}
    </div>
  );
}
