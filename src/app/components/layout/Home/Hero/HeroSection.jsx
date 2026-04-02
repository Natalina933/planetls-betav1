"use client";

import React from "react";
import Image from "next/image";
import { Button, ButtonLink } from "@/components/ui";
import CategoryCarousel from "./CategoryCarousel";
import styles from "./HeroSection.module.scss";

const HeroSection = () => {
  const scrollToHowItWorks = () => {
    try {
      const target = document.getElementById("how-it-works");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      window.scrollTo({ top: 800, behavior: "smooth" });
    } catch (error) {
      console.error("Échec du scroll :", error);
    }
  };

  return (
    <section className={styles.hero}>
      <Image
        src="/images/hero-warmv2.jpg"
        alt="Plateforme de gestion pour la location courte durée"
        fill
        priority
        style={{ objectFit: "cover" }}
        className={styles.heroImage}
      />
      <div className={styles.overlay} />

      <div className={styles.grid}>
        <div className={styles.carouselWrapper}>
          <CategoryCarousel />
        </div>

        <div className={styles.content}>
          <h1>
            Pilotez la <span className={styles.highlight}>location courte durée</span>
          </h1>
          <p className={styles.subHeadline}>
            PlanetLS relie <strong>propriétaires</strong>, <strong>conciergeries</strong>,{" "}
            <strong>indépendants</strong> et <strong>prestataires locaux</strong> sur une seule
            plateforme.
          </p>

          <p className={styles.valueProp}>
            Recherchez les bons partenaires, organisez les missions, suivez les plannings et
            centralisez les documents utiles à votre activité, que vous gériez déjà plusieurs
            logements ou que vous souhaitiez créer un complément de revenu.
          </p>

          <div className={styles.buttonsRow}>
            <ButtonLink
              href="/mission-urgente"
              variant="paper"
              size="lg"
              className={styles.heroButton}
            >
              Besoin d&apos;une mission urgente ?
            </ButtonLink>

            <ButtonLink
              href="/login"
              variant="paper"
              size="lg"
              className={styles.heroButton}
            >
              Créer mon compte
            </ButtonLink>

            <Button
              variant="paper"
              size="lg"
              className={styles.heroButton}
              onClick={scrollToHowItWorks}
            >
              Découvrir comment ça marche
            </Button>
          </div>

          <p className={styles.urgentHint}>
            Une base plus claire pour coordonner votre gestion locative ou démarrer une activité
            complémentaire sereinement.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
