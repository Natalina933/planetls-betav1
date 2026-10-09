import { Select } from "@/components/ui";
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
  itemsCount,
  summary,
  sortMode,
  viewMode: _viewMode,
  onSortModeChange,
  onViewModeChange: _onViewModeChange,
}: ResultsHeaderProps) {
  return (
    <div className={styles.resultsHeader}>
      <div>
        <p className={styles.eyebrow}>Résultats</p>
        <h2 className={styles.sectionTitle}>
          {loading ? "Recherche en cours..." : hasSubmittedSearch ? summary : "Aucune concierge affichée pour le moment"}
        </h2>
      </div>
      <div className={styles.resultsTools}>
        <span className={styles.tagMuted}>{itemsCount} profil{itemsCount > 1 ? "s" : ""} PlanetLS</span>
        <label className={styles.sortControl}>
          <span>Trier par</span>
          <Select
            aria-label="Trier les concierges"
            value={sortMode}
            onChange={(event) => onSortModeChange(event.target.value as SortMode)}
          >
            <option value="available">Disponibilité</option>
            <option value="rating">Avis</option>
            <option value="pro">PRO</option>
          </Select>
        </label>
      </div>
    </div>
  );
}
