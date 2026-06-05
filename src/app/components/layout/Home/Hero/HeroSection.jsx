"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, FileText, MessagesSquare, SearchCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import { OnboardingIllustration } from "@/features/onboarding-assistant/components/OnboardingIllustration";
import { PUBLIC_PARCOURS_VISUALS } from "@/features/onboarding-assistant/visuals";
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
        <div className={`${styles.content} theme-texture-panel theme-texture-panel--hero`}>
          <div className={styles.copyTop}>
            <span className={styles.eyebrow}>SaaS métier pour la location saisonnière</span>
            <h1>PlanetLS relie propriétaires, conciergeries et artisans.</h1>
            <p className={styles.subHeadline}>Un seul espace pour trouver, demander et suivre.</p>
          </div>

          <div className={styles.quickPoints} aria-label="Bénéfices clés">
            <span className={styles.quickPoint}>
              <SearchCheck size={18} aria-hidden="true" />
              Trouver
            </span>
            <span className={styles.quickPoint}>
              <MessagesSquare size={18} aria-hidden="true" />
              Demander
            </span>
            <span className={styles.quickPoint}>
              <FileText size={18} aria-hidden="true" />
              Suivre
            </span>
          </div>

          <div className={styles.proofVisualWrap} aria-label="Vue d'ensemble des parcours">
            <OnboardingIllustration
              visual={PUBLIC_PARCOURS_VISUALS.overview}
              variant="hero"
              className={styles.proofVisual}
              decorative
              priority
            />
          </div>
          <div className={styles.buttonsRow}>
            <ButtonLink href="/parcours" variant="primary" size="lg" className={styles.heroButton}>
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
