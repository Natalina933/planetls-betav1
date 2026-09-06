"use client";

import type { ReactNode } from "react";
import styles from "./dashboardSaas.module.scss";

interface DashboardSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  muted?: boolean;
}

export default function DashboardSection({
  eyebrow,
  title,
  description,
  aside,
  children,
  muted = false,
}: DashboardSectionProps) {
  const className = [styles.surface, styles.sectionCard, muted ? styles.surfaceMuted : ""].filter(Boolean).join(" ");

  return (
    <section className={className}>
      <header className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2 className={styles.sectionTitle}>{title}</h2>
          {description ? <p className={styles.sectionDescription}>{description}</p> : null}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
