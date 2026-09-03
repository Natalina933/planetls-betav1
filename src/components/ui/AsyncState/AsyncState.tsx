import type { ReactNode } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import styles from "./AsyncState.module.scss";

export type AsyncStateProps = {
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  className?: string;
  children: ReactNode;
};

export function AsyncState({
  loading = false,
  error = null,
  isEmpty = false,
  loadingLabel = "Chargement...",
  emptyLabel = "Aucune donnée disponible.",
  className = "",
  children,
}: AsyncStateProps) {
  const classes = [styles.state, className].filter(Boolean).join(" ");

  if (loading) {
    return (
      <div className={classes} role="status" aria-live="polite">
        <div className={styles.skeletonPanel}>
          <div className={styles.skeletonHeader}>
            <span />
            <span />
          </div>
          <div className={styles.skeletonGrid}>
            <span />
            <span />
            <span />
          </div>
          <p className={styles.message}>{loadingLabel}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes}>
        <div className={`${styles.emptyPanel} ${styles.errorPanel}`} role="alert">
          <AlertCircle size={22} aria-hidden="true" />
          <strong>Une action est necessaire</strong>
          <p className={styles.message}>{error}</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={classes}>
        <div className={styles.emptyPanel}>
          <Sparkles size={22} aria-hidden="true" />
          <strong>Rien a afficher pour le moment</strong>
          <p className={styles.message}>{emptyLabel}</p>
        </div>
      </div>
    );
  }

  return <div className={classes}>{children}</div>;
}
