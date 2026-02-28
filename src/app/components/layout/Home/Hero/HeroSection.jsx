"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./HeroSection.module.scss";
import CategoryCarousel from "./CategoryCarousel";

const HeroSection = () => {
  const router = useRouter();

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
        alt="Plateforme de location saisonniere"
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
            Simplifiez la <span className={styles.highlight}>location saisonniere</span>
          </h1>
          <p className={styles.subHeadline}>
            PlanetLS connecte <strong>proprietaires</strong>, <strong>concierges</strong> et{" "}
            <strong>prestataires locaux</strong> de confiance.
          </p>

          <p className={styles.valueProp}>
            Centralisez la mise en relation, la gestion des biens et le pilotage terrain dans une
            seule plateforme.
          </p>

          <div className={styles.buttonsRow}>
            <button
              className={`${styles.CTAButton} ${styles.primary}`}
              onClick={() => router.push("/login")}
            >
              Creer mon compte
            </button>

            <button
              className={`${styles.CTAButton} ${styles.secondary}`}
              onClick={scrollToHowItWorks}
            >
              Decouvrir comment ca marche
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
