import React from "react";
// import Image from 'next/image';
import CTAButton from "@/app/components/common/buttons/CTAbutton/CTAButton";
import styles from "./HeroSection.module.css";
import CategoryCarousel from "./CategoryCarousel";

const HeroSection = () => {
  const scrollToCommunity = () => {
    window.scrollTo({ top: 800, behavior: "smooth" });
  };

  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />

      <div className={styles.grid}>
        <div className={styles.carouselWrapper}>
          <CategoryCarousel />
        </div>

        <div className={styles.content}>
          <h1>Bienvenue sur PlanetLS</h1>
          <p>
            La plateforme de mise en relation pour les acteurs de la location
            saisonnière.
          </p>
          <span className={styles.highlight}>
            4,5 millions de loueur et de professionnels partout en France
          </span>
          <div className={styles.buttonsRow}>
            <CTAButton
              variant="primary"
              onClick={() => {
                /* lien vers inscription */
              }}>
              Inscription gratuite
            </CTAButton>
            <CTAButton variant="secondary" onClick={scrollToCommunity}>
              Créer un compte
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
