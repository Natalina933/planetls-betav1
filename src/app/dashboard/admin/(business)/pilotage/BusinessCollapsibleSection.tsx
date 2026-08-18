"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./BusinessCollapsibleSection.module.scss";

type BusinessCollapsibleSectionProps = {
  id: string;
  eyebrow?: string;
  title: string;
  summary: string;
  badge?: string;
  secondaryBadge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function BusinessCollapsibleSection({
  id,
  eyebrow,
  title,
  summary,
  badge,
  secondaryBadge,
  isOpen,
  onToggle,
  children,
}: BusinessCollapsibleSectionProps) {
  const contentId = `${id}-content`;

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.trigger}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <div className={styles.copy}>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          <div className={styles.titleRow}>
            <span className={styles.title}>{title}</span>
          </div>
          <span className={styles.summary}>{summary}</span>
        </div>

        <div className={styles.badgeRow}>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
          {secondaryBadge ? <span className={styles.badge}>{secondaryBadge}</span> : null}
          <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
        </div>
      </button>

      {isOpen ? (
        <div id={contentId} className={styles.content}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
