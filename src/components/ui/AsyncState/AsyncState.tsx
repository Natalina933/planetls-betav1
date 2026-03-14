import type { ReactNode } from "react";
import { Loader } from "../Loader";
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
      <div className={classes}>
        <Loader size="sm" showText text={loadingLabel} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes}>
        <p className={`${styles.message} ${styles.error}`} role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={classes}>
        <p className={styles.message}>{emptyLabel}</p>
      </div>
    );
  }

  return <div className={classes}>{children}</div>;
}
