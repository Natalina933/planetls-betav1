"use client";

import React from "react";
import Image from "next/image";
import styles from "./HeroSection.module.scss";
import CategoryCarousel from "./CategoryCarousel";

const HeroSection = () => {
  const scrollToCommunity = () => {
    try {
      window.scrollTo({ top: 800, behavior: "smooth" });
    } catch (error) {
      console.error("⛔ Échec du scroll :", error);
    }
  };

  return (
    <section className={styles.hero}>
      {/* Background image */}
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
        {/* Carousel des catégories */}
        <div className={styles.carouselWrapper}>
          <CategoryCarousel />
        </div>

        {/* Contenu Hero */}
        <div className={styles.content}>
          <h1>
            Simplifiez la <span className={styles.highlight}>location saisonnière</span>
          </h1>
          <p className={styles.subHeadline}>
            PlanetLS connecte <strong>propriétaires</strong>, <strong>concierges</strong> et <strong>prestataires locaux</strong> de confiance.
          </p>

          <p className={styles.valueProp}>
            Gagnez du temps, augmentez vos revenus et trouvez les meilleurs services en un clic.
          </p>

          {/* Preuve sociale */}
          {/* <div className={styles.socialProof}>
            <span>✅ Déjà <strong>+4500</strong> acteurs inscrits</span>
            <span className={styles.badge}>100% gratuit</span>
          </div> */}

          {/* Boutons CTA */}
          <div className={styles.buttonsRow}>
            <button
              className={`${styles.CTAButton} ${styles.primary}`}
              onClick={scrollToCommunity}
            >
              Inscription 100% gratuite
            </button>

            <button
              className={`${styles.CTAButton} ${styles.secondary}`}
              onClick={() => {
                try {
                  console.log("Découvrir cliqué !");
                } catch (error) {
                  console.error("⛔ Action échouée :", error);
                }
              }}
            >
              Découvrir comment ça marche
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
