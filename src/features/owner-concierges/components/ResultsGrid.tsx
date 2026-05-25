import { Button, ButtonLink } from "@/components/ui";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { ConciergeCard } from "@/features/owner-concierges/components/ConciergeCard";
import type {
  ConciergeSearchRow,
  OwnerConciergeSearchFilters,
  ViewMode,
} from "@/features/owner-concierges/lib/search";

type ResultsGridProps = {
  styles: Record<string, string>;
  loading: boolean;
  error: string | null;
  hasSubmittedSearch: boolean;
  hasSearchCriteria: boolean;
  filtersLabel: string;
  filters: OwnerConciergeSearchFilters;
  items: ConciergeSearchRow[];
  selectedIds: Set<string>;
  viewMode: ViewMode;
  onToggleSelection: (itemId: string) => void;
  onCreateAlert: () => void;
};

export function ResultsGrid({
  styles,
  loading,
  error,
  hasSubmittedSearch,
  hasSearchCriteria,
  filtersLabel,
  filters,
  items,
  selectedIds,
  viewMode,
  onToggleSelection,
  onCreateAlert,
}: ResultsGridProps) {
  const showSearchEmpty = !loading && !error && items.length === 0 && hasSubmittedSearch;
  const showIdleEmpty = !loading && !error && items.length === 0 && !hasSubmittedSearch;

  return (
    <>
      {showSearchEmpty ? (
        <EmptyState
          className={styles.emptyState}
          title={
            filtersLabel
              ? `Aucun concierge disponible pour ${filtersLabel}.`
              : "Aucun concierge disponible pour cette recherche."
          }
          description="Aucun profil actif n'a été trouvé avec les filtres actuels. Essayez une région voisine, augmentez le rayon ou retirez quelques filtres."
          primaryAction={
            filtersLabel ? (
              <Button type="button" variant="primary" className={styles.primaryBtn} onClick={onCreateAlert}>
                Créer une alerte pour cette zone
              </Button>
            ) : undefined
          }
          secondaryAction={
            filtersLabel ? (
              <ButtonLink href="/dashboard/owner/alertes" variant="secondary" className={styles.secondaryBtn}>
                Voir mes alertes
              </ButtonLink>
            ) : undefined
          }
        />
      ) : null}

      {showIdleEmpty ? (
        <EmptyState
          className={styles.emptyState}
          title="Lancez une recherche pour voir les concierges disponibles."
          description={
            hasSearchCriteria
              ? "Vos filtres sont prêts. Cliquez sur Rechercher pour afficher les concierges disponibles."
              : "Saisissez une ville ou un code postal pour affiner."
          }
        />
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

        {items.map((item, index) => (
          <ConciergeCard
            key={item.id}
            item={item}
            index={index}
            isSelected={selectedIds.has(item.id)}
            filters={filters}
            onToggle={onToggleSelection}
          />
        ))}
      </div>
    </>
  );
}
