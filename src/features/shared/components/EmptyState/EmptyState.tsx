import type { ReactNode } from "react";
import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
  title: string;
  description: string;
  illustration?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  const rootClassName = [
    styles.root,
    illustration ? styles.withIllustration : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={rootClassName}>
      {illustration ? <div className={styles.illustration}>{illustration}</div> : null}
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        {primaryAction || secondaryAction ? (
          <div className={styles.actions}>
            {primaryAction}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </section>
  );
}
