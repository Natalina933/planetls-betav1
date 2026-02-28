"use client";

import Link from "next/link";
import React from "react";
import styles from "./ConciergeWorkspace.module.scss";

interface ConciergeCardAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

interface ConciergeCard {
  title: string;
  text: string;
  actions?: ConciergeCardAction[];
}

interface ConciergeMetric {
  label: string;
  value: string;
  hint?: string;
}

interface ConciergeWorkspacePageProps {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: ConciergeMetric[];
  cards: ConciergeCard[];
  chips?: string[];
  actions?: Array<{ label: string; href: string }>;
}

export default function ConciergeWorkspacePage({
  eyebrow,
  title,
  description,
  metrics,
  cards,
  chips,
  actions,
}: ConciergeWorkspacePageProps) {
  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>

          {chips && chips.length > 0 ? (
            <div className={styles.chips}>
              {chips.map((chip) => (
                <span key={chip} className={styles.chip}>
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          {actions && actions.length > 0 ? (
            <div className={styles.actions}>
              {actions.map((action) => (
                <Link key={action.href} href={action.href} className={styles.actionLink}>
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {metrics && metrics.length > 0 ? (
          <div className={styles.metrics}>
            {metrics.map((metric) => (
              <article key={metric.label} className={styles.metricCard}>
                <span className={styles.metricLabel}>{metric.label}</span>
                <strong className={styles.metricValue}>{metric.value}</strong>
                {metric.hint ? <p className={styles.metricHint}>{metric.hint}</p> : null}
              </article>
            ))}
          </div>
        ) : null}

        <div className={styles.grid}>
          {cards.map((card) => (
            <article key={card.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardText}>{card.text}</p>
              {card.actions && card.actions.length > 0 ? (
                <div className={styles.cardActions}>
                  {card.actions.map((action) => (
                    <Link
                      key={`${card.title}-${action.href}-${action.label}`}
                      href={action.href}
                      className={
                        action.variant === "primary"
                          ? styles.cardActionPrimary
                          : styles.cardActionSecondary
                      }
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
