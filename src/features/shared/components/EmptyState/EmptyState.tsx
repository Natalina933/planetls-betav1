import type { ReactNode } from "react";
import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <section className={[styles.root, className].filter(Boolean).join(" ")}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {primaryAction || secondaryAction ? (
        <div className={styles.actions}>
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}
