"use client";
import React, { useState } from "react";
import Head from "next/head";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

import styles from "./ServiceList.module.scss";
import { services } from "../../data/services/services";

export default function PlatformIntroSection() {
  const [selectedKeyPoint, setSelectedKeyPoint] = useState<string | null>(null);

  const keyPoints = [...new Set(services.map((s) => s.keyPoint).filter(Boolean))];

  const visibleServices =
    selectedKeyPoint === null
      ? services
      : services.filter((s) => s.keyPoint === selectedKeyPoint);

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

        {/* KeyPoints interactifs */}
        <ul
          className={clsx(styles.keyPoints, styles["keyPoints--chips"])}
          aria-label="Points clés de la plateforme"
        >
          {/* <li
            key="__all"
            onClick={() => setSelectedKeyPoint(null)}
            className={clsx(styles.keyPointChip, selectedKeyPoint === null && styles.isActive)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelectedKeyPoint(null)}
          >
            Tous
          </li> */}
          {keyPoints.map((point) => (
            <li
              key={point}
              onClick={() => setSelectedKeyPoint(point)}
              className={clsx(
                styles.keyPointChip,
                selectedKeyPoint === point && styles.isActive
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedKeyPoint(point)}
            >
              {point}
            </li>
          ))}
        </ul>

        {/* Toujour afficher la grille */}
        <div className={styles.serviceGrid}>
          {visibleServices.map(({ title, description, icon: Icon }) => (
            <div key={title} className={styles.serviceCard}>
              <span className={styles.serviceCardIconWrap} aria-hidden="true">
                <Icon className={styles.serviceCardIcon} />
              </span>
              <h3 className={styles.serviceCardTitle}>{title}</h3>
              <p className={styles.serviceCardDesc}>{description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
