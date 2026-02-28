"use client";

import React from "react";
import Link from "next/link";
import styles from "./OwnerWorkspace.module.scss";

interface InfoCard {
  title: string;
  text: string;
}

interface OwnerWorkspacePageProps {
  eyebrow: string;
  title: string;
  description: string;
  cards: InfoCard[];
  chips?: string[];
  actions?: Array<{ label: string; href: string }>;
}

export default function OwnerWorkspacePage({
  eyebrow,
  title,
  description,
  cards,
  chips,
  actions,
}: OwnerWorkspacePageProps) {
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

        <div className={styles.grid}>
          {cards.map((card) => (
            <article key={card.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardText}>{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
