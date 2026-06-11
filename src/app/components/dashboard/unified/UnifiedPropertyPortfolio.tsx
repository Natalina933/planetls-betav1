"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import styles from "./UnifiedPropertyPortfolio.module.scss";

export interface UnifiedPropertyMetric {
  label: string;
  value: string;
}

export interface UnifiedPropertyItem {
  id: string;
  name: string;
  location: string;
  status: string;
  note: string;
  href: string;
  icon?: ReactNode;
  tone?: "neutral" | "accent" | "soft" | "gold" | "clay" | "ink";
  metrics: UnifiedPropertyMetric[];
}

interface UnifiedPropertyPortfolioProps {
  items: UnifiedPropertyItem[];
  emptyHref?: string;
  emptyLabel?: string;
}

export default function UnifiedPropertyPortfolio({
  items,
  emptyHref = "/dashboard/owner/logements/create",
  emptyLabel = "Ajoutez votre premier logement pour alimenter ce tableau de bord.",
}: UnifiedPropertyPortfolioProps) {
  if (items.length === 0) {
    return (
      <Link href={emptyHref} className={styles.emptyCard}>
        {emptyLabel}
      </Link>
    );
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={[styles.card, styles[item.tone ?? "neutral"]].join(" ")}
        >
          <div className={styles.head}>
            <span className={styles.icon}>
              {item.icon ?? <Building2 size={18} />}
            </span>
            <div className={styles.identity}>
              <strong>{item.name}</strong>
              <p>{item.location}</p>
            </div>
            <span className={styles.status}>{item.status}</span>
          </div>

          <div className={styles.metrics}>
            {item.metrics.map((metric) => (
              <div key={`${item.id}-${metric.label}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <p className={styles.note}>{item.note}</p>
        </Link>
      ))}
    </div>
  );
}
