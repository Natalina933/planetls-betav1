import type { ReactNode } from "react";
import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
  title: string;
  variant?: "default" | "centered";
  description: string;
  illustration?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  variant = "default",
  description,
  illustration,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  const rootClassName = [
    variant === "centered" ? styles.centered : styles.root,
    illustration && variant === "default" ? styles.withIllustration : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const Title = variant === "centered" ? "h3" : "h2";
  return (
    <section className={rootClassName}>
      {illustration ? <div className={styles.illustration}>{illustration}</div> : null}
      <div className={styles.content}>
        <Title className={variant === "centered" ? styles.centeredTitle : styles.title}>{title}</Title>
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
