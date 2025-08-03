"use client";
import React, { useState } from "react";
import Head from "next/head";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

import styles from "./ServiceList.module.scss";
import { services } from "../../data/services/services";

export default function PlatformIntroSection() {
  const [flippedCards, setFlippedCards] = useState<string[]>([]);

  const keyPoints = [...new Set(services.map((s) => s.keyPoint).filter(Boolean))];

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
        <meta property="og:title" content="Plateforme de Gestion Intuitive pour Tous Vos Besoins" />
        <meta
          property="og:description"
          content="Centralisez, automatisez, sécurisez vos activités de location saisonnière."
        />
        <meta property="og:image" content="/images/social-share-platform.jpg" />
        <meta property="og:url" content="https://votre-site.com/plateforme" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <section className={styles.platformSection} aria-labelledby="platform-title">
        <header id="platform-title" className={styles.platformHeader}>
          <p className={styles.sectionIntro}>
            Conçue pour <span className={styles.highlightText}>simplifier la vie de toutes les catégories professionnelles</span>, notre plateforme centralise vos outils, automatise vos tâches et sécurise vos données. Que vous soyez <strong className={styles.userCategory}>propriétaire, concierge ou artisan</strong>, gagnez en efficacité et en sérénité.
          </p>

          <a href="#contact" className={styles.ctaButton}>
            Découvrir la Plateforme <ArrowRight className={styles.ctaIcon} />
          </a>
        </header>

        <ul className={clsx(styles.keyPoints, styles["keyPoints--chips"])} aria-label="Points clés de la plateforme">
          {keyPoints.map((point) => (
            <li key={point} className={styles.keyPointChipWrapper}>
              <button
                onClick={() => handleKeyPointClick(point)}
                className={clsx(styles.keyPointChip, {
                  [styles.isActive]: flippedCards.includes(point),
                })}
              >
                {point}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.serviceGrid}>
          {services.map(({ title, description, icon: Icon, keyPoint, quote }) => {
            const isFlipped = flippedCards.includes(keyPoint);
            return (
              <div key={title} className={clsx(styles.flippable, { [styles.flipped]: isFlipped })}>
                <div className={styles.cardInner}>
                  {/* Face avant */}
                  <div className={styles.cardFront}>
                    <span className={styles.serviceCardIconWrap} aria-hidden="true">
                      <Icon className={styles.goldenIcon} />
                    </span>
                    <h3 className={styles.serviceCardTitle}>{title}</h3>
                    <p className={styles.serviceCardDesc}>{description}</p>
                  </div>

                  {/* Face arrière */}
                  <div className={styles.cardBack}>
                    <blockquote className={styles.cardQuote}>{quote}</blockquote>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
