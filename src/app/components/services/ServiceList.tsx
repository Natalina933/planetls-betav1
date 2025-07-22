"use client";
import React, { useState } from "react";
import Head from "next/head";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

// Styles
import styles from "./ServiceList.module.scss";

// Données
import { services } from "../../data/services/services";

export default function PlatformIntroSection() {
  const [selectedKeyPoint, setSelectedKeyPoint] = useState<string | null>(null);

  // Récupère les keyPoints uniques à partir des services
  const keyPoints = [...new Set(services.map((service) => service.keyPoint))];

  // Filtre les services en fonction du keyPoint sélectionné (ou tout afficher si null)
  const filteredServices = selectedKeyPoint
    ? services.filter((service) => service.keyPoint === selectedKeyPoint)
    : [];

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

      <section className={styles.platformSection} aria-labelledby="platform-title">
        <header id="platform-title" className={styles.platformHeader}>
          <h2 className={styles.sectionTitle}>
            Votre Plateforme de Gestion Unique et Intuitive
          </h2>
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
          <a href="#contact" className={styles.ctaButton}>
            Découvrir la Plateforme <ArrowRight className={styles.ctaIcon} />
          </a>
        </header>

        {/* KeyPoints interactifs */}
        <ul
          className={clsx(styles.keyPoints, styles["keyPoints--chips"])}
          aria-label="Points clés de la plateforme"
        >
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

        {/* Affichage conditionnel des services */}
        {selectedKeyPoint && (
          <div className={styles.serviceGrid}>
            {filteredServices.map(({ title, description, icon: Icon }) => (
              <div key={title} className={styles.serviceCard}>
                <span className={styles.serviceCardIconWrap} aria-hidden="true">
                  <Icon className={styles.serviceCardIcon} />
                </span>
                <h3 className={styles.serviceCardTitle}>{title}</h3>
                <p className={styles.serviceCardDesc}>{description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
