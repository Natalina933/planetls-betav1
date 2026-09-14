import type { ReactNode } from "react";
import styles from "./PageHeader.module.scss";

export type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  breadcrumb?: ReactNode;
  quote?: ReactNode;
  action?: ReactNode;
  variant?: "plain" | "illustrated";
  className?: string;
};

/** Composition de présentation : la page fournit textes, navigation et action. */
export function PageHeader({
  title, description, eyebrow, breadcrumb, quote, action,
  variant = "plain", className = "",
}: PageHeaderProps) {
  return (
    <header className={[styles.header, styles[variant], className].filter(Boolean).join(" ")}>
      {breadcrumb && <nav aria-label="Fil d’Ariane">{breadcrumb}</nav>}
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {quote && <blockquote>{quote}</blockquote>}
      {action && <div className={styles.actions}>{action}</div>}
    </header>
  );
}
