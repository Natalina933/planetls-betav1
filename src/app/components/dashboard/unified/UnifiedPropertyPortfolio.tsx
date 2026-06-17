"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Building2 } from "lucide-react";
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
  imageSrc?: string | null;
  imageAlt?: string;
  eyebrow?: string;
  nextArrival?: string;
  nextMission?: string;
  concierge?: string;
  icon?: ReactNode;
  tone?: "neutral" | "accent" | "soft" | "gold" | "clay" | "ink";
  metrics: UnifiedPropertyMetric[];
  actions?: Array<{
    id: string;
    label: string;
    href: string;
  }>;
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
        <article key={item.id} className={[styles.card, styles[item.tone ?? "neutral"]].join(" ")}>
          <Link href={item.href} className={styles.cardMain}>
            <div className={styles.media}>
              {item.imageSrc ? (
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt || item.name}
                  fill
                  className={styles.mediaImage}
                  sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div className={styles.mediaFallback} aria-hidden="true">
                  {item.icon ?? <Building2 size={22} />}
                </div>
              )}
              <span className={styles.status}>{item.status}</span>
            </div>

            <div className={styles.head}>
              <div className={styles.identityCluster}>
                <span className={styles.icon}>
                  {item.icon ?? <Building2 size={18} />}
                </span>
                {item.eyebrow ? <span className={styles.eyebrow}>{item.eyebrow}</span> : null}
              </div>
              <div className={styles.identity}>
                <strong>{item.name}</strong>
                <p>{item.location}</p>
              </div>
            </div>

            {(item.nextArrival || item.nextMission || item.concierge) ? (
              <div className={styles.facts}>
                {item.nextArrival ? (
                  <span>
                    <strong>Arrivee</strong>
                    {item.nextArrival}
                  </span>
                ) : null}
                {item.nextMission ? (
                  <span>
                    <strong>Mission</strong>
                    {item.nextMission}
                  </span>
                ) : null}
                {item.concierge ? (
                  <span>
                    <strong>Concierge</strong>
                    {item.concierge}
                  </span>
                ) : null}
              </div>
            ) : null}

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

          {item.actions?.length ? (
            <div className={styles.actions}>
              {item.actions.map((action) => (
                <Link key={action.id} href={action.href} className={styles.actionLink}>
                  <span>{action.label}</span>
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
