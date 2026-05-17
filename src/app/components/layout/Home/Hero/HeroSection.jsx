"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
        alt="Intérieur premium de location saisonnière coordonné avec PlanetLS"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover" }}
        className={styles.heroImage}
      />
      <div className={styles.overlay} />

      <div className={styles.grid}>
        <div className={styles.visualStage} aria-label="Aperçu de la plateforme PlanetLS">
          <div className={styles.carouselWrapper}>
            <CategoryCarousel />
          </div>
        </div>

        <div className={styles.content}>
          <span className={styles.eyebrow}>SaaS métier pour la location saisonnière</span>
          <h1>
            PlanetLS relie <span className={styles.highlight}>propriétaires</span>, conciergeries
            et partenaires terrain.
          </h1>
          <p className={styles.subHeadline}>
            Une plateforme premium pour rechercher les bons partenaires, recevoir des devis,
            coordonner les missions et professionnaliser chaque séjour.
          </p>

          <p className={styles.valueProp}>
            Carte interactive, demandes qualifiées, suivi des interventions, messages, documents et
            dashboards : PlanetLS transforme la location saisonnière en expérience claire,
            humaine et pilotable.
          </p>

          <div className={styles.buttonsRow}>
            <ButtonLink
              href="/mission-urgente"
              variant="primary"
              size="lg"
              className={styles.heroButton}
            >
              Lancer une demande <ArrowRight size={18} />
            </ButtonLink>

            <ButtonLink href="/login" variant="paper" size="lg" className={styles.heroButton}>
              Créer mon compte
            </ButtonLink>

            <Button variant="paper" size="lg" className={styles.heroButton} onClick={scrollToHowItWorks}>
              Voir le fonctionnement
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
