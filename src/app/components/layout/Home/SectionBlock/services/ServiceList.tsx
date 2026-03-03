"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

import ServicesBlock from "../ServicesBlock";
import FlippableCard from "./FlippableCard";
import styles from "./ServiceList.module.scss";
import { services } from "../../../../../data/services/services";

export default function ServiceList() {
  const [flippedCards, setFlippedCards] = useState<string[]>([]);

  const keyPoints = [...new Set(services.map((s) => s.keyPoint).filter(Boolean))];

  const handleKeyPointClick = (point: string) => {
    setFlippedCards((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point],
    );
  };

  const getCardSizeClass = (index: number) => {
    if (index === services.length - 1) return "card-size--tall";
    if (index % 3 === 0) return "card-size--large";
    if (index % 3 === 1) return "card-size--medium";
    return "card-size--small";
  };

  return (
    <>
      <ServicesBlock
        title={
          <>
            Découvrir notre Plateforme <br />
            de gestion tout-en-un
          </>
        }
        subtitle="La solution en ligne pour l'ensemble des acteurs de la location saisonnière"
        description="Une application et une plateforme entièrement sécurisées, pensées pour automatiser la gestion, fluidifier la communication, et vous assister à chaque étape, que vous soyez propriétaire, professionnel, ou en quête de solutions fiables."
      >
        <header className={styles.platformHeader}>
          <p className={styles.sectionIntro}>
            Conçue pour{" "}
            <span className={styles.highlightText}>
              simplifier la vie de toutes les catégories professionnelles
            </span>
            , notre plateforme centralise vos outils, automatise vos tâches et sécurise vos
            données. Que vous soyez{" "}
            <strong className={styles.userCategory}>propriétaire, concierge ou artisan</strong>,
            gagnez en efficacité et en sérénité.
          </p>

          <a href="#contact" className={styles.CTAButton}>
            Découvrir la Plateforme <ArrowRight className={styles.ctaIcon} />
          </a>
        </header>

        <ul
          className={clsx(styles.keyPoints, styles["keyPoints--chips"])}
          aria-label="Points clés de la plateforme"
        >
          {keyPoints.map((point) => (
            <li key={point} className={styles.keyPointChipWrapper}>
              <button
                onClick={() => handleKeyPointClick(point)}
                className={clsx(styles.keyPointChip, {
                  [styles.isActive]: flippedCards.includes(point),
                })}
                aria-pressed={flippedCards.includes(point)}
              >
                {point}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.serviceGrid}>
          {services.map(({ title, description, quote, icon, keyPoint }, index) => {
            const safeKeyPoint = keyPoint?.trim() || `fallback-${index}`;
            const isFlipped = flippedCards.includes(safeKeyPoint);

            return (
              <FlippableCard
                key={`${title}-${index}`}
                title={title}
                description={description}
                quote={quote}
                icon={icon}
                isFlipped={isFlipped}
                onToggle={() => handleKeyPointClick(safeKeyPoint)}
                sizeClass={getCardSizeClass(index)}
              />
            );
          })}
        </div>
      </ServicesBlock>

      <div className={styles.ctaZone}>
        <a
          className={styles.CTAButton}
          href="/complete-registration"
          aria-label="Essayer la plateforme gratuitement"
        >
          Essayer gratuitement
        </a>
        <span className={styles.ctaSub}>Assistance personnalisée et offres sans commission.</span>
      </div>
    </>
  );
}
