import { OptionToggleGroup } from "@/features/shared/components/OptionToggleGroup";
import type { SortMode, ViewMode } from "@/features/owner-concierges/lib/search";

type ResultsHeaderProps = {
  styles: Record<string, string>;
  loading: boolean;
  hasSubmittedSearch: boolean;
  itemsCount: number;
  sortMode: SortMode;
  viewMode: ViewMode;
  onSortModeChange: (value: SortMode) => void;
  onViewModeChange: (value: ViewMode) => void;
};

const SORT_OPTIONS = [
  { value: "available", label: "Disponibles" },
  { value: "rating", label: "Mieux notés" },
  { value: "pro", label: "PRO" },
] as const;

const VIEW_OPTIONS = [
  { value: "cards", label: "Cartes" },
  { value: "list", label: "Liste" },
] as const;

export function ResultsHeader({
  styles,
  loading,
  hasSubmittedSearch,
  itemsCount,
  sortMode,
  viewMode,
  onSortModeChange,
  onViewModeChange,
}: ResultsHeaderProps) {
  return (
    <div className={styles.resultsHeader}>
      <div>
        <p className={styles.eyebrow}>Résultats</p>
        <h2 className={styles.sectionTitle}>
          {loading
            ? "Recherche en cours..."
            : hasSubmittedSearch
              ? `${itemsCount} concierge(s) disponible(s)`
              : "Aucun concierge affiché pour le moment"}
        </h2>
      </div>
      <div className={styles.resultsTools}>
        <p className={styles.resultsNote}>
          Disponibles d&apos;abord, puis profils les mieux notés et les plus fiables.
        </p>
        <OptionToggleGroup
          ariaLabel="Tri des concierges"
          options={SORT_OPTIONS}
          value={sortMode}
          onChange={onSortModeChange}
          className={styles.sortTabs}
          getClassName={(selected) => (selected ? styles.sortTabActive : styles.sortTab)}
        />
        <OptionToggleGroup
          ariaLabel="Mode d'affichage"
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
          className={styles.viewToggleDesktop}
          getClassName={(selected) => (selected ? styles.viewToggleActive : styles.viewToggleBtn)}
        />
      </div>
    </div>
  );
}
