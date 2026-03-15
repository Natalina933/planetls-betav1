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
      console.error("Echec du scroll :", error);
    }
  };

  return (
    <section className={styles.hero}>
      <Image
        src="/images/hero-warmv2.jpg"
        alt="Plateforme de location saisonnière"
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
            Simplifiez la <span className={styles.highlight}>location saisonnière</span>
          </h1>
          <p className={styles.subHeadline}>
            PlanetLS connecte <strong>propriétaires</strong>, <strong>concierges</strong> et{" "}
            <strong>prestataires locaux</strong> de confiance.
          </p>

          <p className={styles.valueProp}>
            Centralisez la mise en relation, la gestion des biens et le pilotage terrain dans une
            seule plateforme.
          </p>

          <div className={styles.buttonsRow}>
            <ButtonLink
              href="/mission-urgente"
              variant="paper"
              size="lg"
              className={styles.heroButton}
            >
              Besoin d&apos;un check-in en urgence ?
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

          <p className={styles.urgentHint}>Trouvez un concierge disponible en moins de 24h.</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
