import type { SortMode, ViewMode } from "@/features/owner-concierges/lib/search";

type ResultsHeaderProps = {
  styles: Record<string, string>;
  loading: boolean;
  hasSubmittedSearch: boolean;
  itemsCount: number;
  summary: string;
  sortMode: SortMode;
  viewMode: ViewMode;
  onSortModeChange: (value: SortMode) => void;
  onViewModeChange: (value: ViewMode) => void;
};

export function ResultsHeader({
  styles,
  loading,
  hasSubmittedSearch,
  itemsCount: _itemsCount,
  summary,
  sortMode: _sortMode,
  viewMode: _viewMode,
  onSortModeChange: _onSortModeChange,
  onViewModeChange: _onViewModeChange,
}: ResultsHeaderProps) {
  return (
    <div className={styles.resultsHeader}>
      <div>
        <p className={styles.eyebrow}>Résultats</p>
        <h2 className={styles.sectionTitle}>
          {loading ? "Recherche en cours..." : hasSubmittedSearch ? summary : "Aucun professionnel affiché pour le moment"}
        </h2>
      </div>
      <div className={styles.resultsTools}>
        <span className={styles.tagMuted}>Profils réels PlanetLS</span>
      </div>
    </div>
  );
}
