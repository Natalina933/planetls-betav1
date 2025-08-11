"use client";
import React, { useState } from "react";
import Head from "next/head";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

import SectionBlock from "../SectionBlock"; // Assurez-vous que le chemin est correct
import styles from "./ServiceList.module.scss";
import { services } from "../../../../../data/services/services";

export default function ServiceList() {
  const [flippedCards, setFlippedCards] = useState<string[]>([]);

  const keyPoints = [
    ...new Set(services.map((s) => s.keyPoint).filter(Boolean)),
  ];

  const handleKeyPointClick = (point: string) => {
    setFlippedCards((prev) =>
      prev.includes(point)
        ? prev.filter((p) => p !== point)
        : [...prev, point]
    );
  };

  return (
    <>
      <Head>
        <title>Découvrez Notre Plateforme de Gestion Intuitive et Complète</title>
        <meta
          name="description"
          content="Plateforme centralisée, sécurisée et intelligente pour propriétaires, concierges et artisans."
        />
        <meta
          property="og:title"
          content="Plateforme de Gestion Intuitive pour Tous Vos Besoins"
        />
        <meta
          property="og:description"
          content="Centralisez, automatisez, sécurisez vos activités de location saisonnière."
        />
        <meta property="og:image" content="/images/social-share-platform.jpg" />
        <meta property="og:url" content="https://votre-site.com/plateforme" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <SectionBlock
        title="Découvrer notre Plateforme de gestion tout-en-un"
        subtitle="La solution en ligne pour l’ensemble des acteurs de la location saisonnière"
        description="Une application et une plateforme entièrement sécurisées, pensées pour automatiser la gestion, fluidifier la communication, et vous assister à chaque étape, que vous soyez propriétaire, professionnel, ou en quête de solutions fiables."
      >
        <header className={styles.platformHeader}>
          <p className={styles.sectionIntro}>
            Conçue pour{" "}
            <span className={styles.highlightText}>
              simplifier la vie de toutes les catégories professionnelles
            </span>
            , notre plateforme centralise vos outils, automatise vos tâches et
            sécurise vos données. Que vous soyez{" "}
            <strong className={styles.userCategory}>
              propriétaire, concierge ou artisan
            </strong>
            , gagnez en efficacité et en sérénité.
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
          {services.map((service, index) => {
            const safeTitle = service.title?.trim() || "Service sans titre";
            const safeDescription =
              service.description?.trim() || "Aucune description disponible.";
            const SafeIcon = service.icon || null;
            const safeKeyPoint = service.keyPoint?.trim() || `fallback-${index}`;
            const safeQuote =
              service.quote?.trim() || "Découvrez nos services d'exception.";

            const isFlipped = flippedCards.includes(safeKeyPoint);

            const toggleFlip = () => handleKeyPointClick(safeKeyPoint);
            const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleFlip();
              }
            };

            return (
              <div
                key={`${safeTitle}-${index}`}
                tabIndex={0}
                role="button"
                aria-pressed={isFlipped}
                onClick={toggleFlip}
                onKeyDown={onKeyDown}
                className={clsx(styles.flippable, {
                  [styles.flipped]: isFlipped,
                })}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardFront}>
                    <span className={styles.serviceCardIconWrap} aria-hidden="true">
                      {SafeIcon ? (
                        <SafeIcon className={styles.goldenIcon} />
                      ) : (
                        <svg
                          className={styles.goldenIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12h8" />
                          <path d="M12 8v8" />
                        </svg>
                      )}
                    </span>
                    <h3 className={styles.serviceCardTitle}>{safeTitle}</h3>
                    <p className={styles.serviceCardDesc}>{safeDescription}</p>
                  </div>

                  <div className={styles.cardBack}>
                    <blockquote className={styles.cardQuote}>{safeQuote}</blockquote>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.ctaZone}>
          <a className={styles.CTAButton} href="/inscription" aria-label="Essayer la plateforme gratuitement">
            Essayer gratuitement
          </a>
          <span className={styles.ctaSub}>
            Assistance personnalisée & offres sans commission.
          </span>
        </div>
      </SectionBlock>
    </>
  );
}
