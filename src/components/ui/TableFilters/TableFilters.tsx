import type { ReactNode } from "react";
import { Button } from "../Button";
import styles from "./TableFilters.module.scss";

export type TableFiltersProps = {
  children: ReactNode;
  resultCount?: number;
  showMeta?: boolean;
  layout?: "default" | "fields" | "toolbar";
  activeCount?: number;
  onReset?: () => void;
  className?: string;
  resultLabel?: string;
  resetLabel?: string;
};

export function TableFilters({ children, resultCount, showMeta = true, layout = "default", activeCount = 0, onReset, className = "", resultLabel, resetLabel = "Reinitialiser" }: TableFiltersProps) {
  return (
    <div className={[layout === "default" ? styles.filters : styles.bare, className].filter(Boolean).join(" ")} aria-label="Filtres du tableau">
      <div className={layout === "default" ? styles.controls : styles[layout]}>{children}</div>
      {showMeta && <div className={styles.meta} aria-live="polite">
        <span>{resultLabel ?? `${resultCount} resultat(s)`}</span>
        {activeCount > 0 ? <span>{activeCount} filtre(s) actif(s)</span> : null}
        {onReset && activeCount > 0 ? <Button variant="ghost" size="sm" onClick={onReset}>{resetLabel}</Button> : null}
      </div>}
    </div>
  );
}
