import type { ReactNode } from "react";
import { Button } from "../Button";
import styles from "./TableFilters.module.scss";

export type TableFiltersProps = {
  children: ReactNode;
  resultCount: number;
  activeCount?: number;
  onReset?: () => void;
  className?: string;
};

export function TableFilters({ children, resultCount, activeCount = 0, onReset, className = "" }: TableFiltersProps) {
  return (
    <div className={[styles.filters, className].filter(Boolean).join(" ")} aria-label="Filtres du tableau">
      <div className={styles.controls}>{children}</div>
      <div className={styles.meta} aria-live="polite">
        <span>{resultCount} resultat(s)</span>
        {activeCount > 0 ? <span>{activeCount} filtre(s) actif(s)</span> : null}
        {onReset && activeCount > 0 ? <Button variant="ghost" size="sm" onClick={onReset}>Reinitialiser</Button> : null}
      </div>
    </div>
  );
}
