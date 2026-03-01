"use client";

import React from "react";
import Link from "next/link";
import { useUserType } from "@/app/context/UserTypeContext";
import styles from "./OwnerWorkspace.module.scss";

interface InfoCard {
  title: string;
  text: string;
  actions?: Array<{ label: string; href: string; variant?: "primary" | "secondary" }>;
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
  const { userType } = useUserType();
  const themeClass =
    userType === "provider"
      ? styles.providerTheme
      : userType === "concierge"
        ? styles.conciergeTheme
        : styles.ownerTheme;

  return (
    <section className="dashboard-grid">
      <div className={`${styles.page} ${themeClass}`}>
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
