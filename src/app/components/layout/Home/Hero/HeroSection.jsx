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
            et artisans pour piloter la location saisonnière.
          </h1>
          <p className={styles.subHeadline}>
            Trouvez les bons interlocuteurs, envoyez des demandes qualifiées, suivez les missions et
            centralisez les échanges dans un espace clair.
          </p>

          <p className={styles.valueProp}>
            Profils lisibles, devis centralisés, suivi des interventions, messages et documents :
            chaque rôle garde une vision nette de ce qui est demandé, accepté, réalisé et validé.
          </p>

          <div className={styles.buttonsRow}>
            <ButtonLink
              href="/parcours"
              variant="primary"
              size="lg"
              className={styles.heroButton}
            >
              Choisir mon parcours <ArrowRight size={18} />
            </ButtonLink>

            <ButtonLink href="/mission-urgente" variant="paper" size="lg" className={styles.heroButton}>
              Lancer une demande urgente
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
