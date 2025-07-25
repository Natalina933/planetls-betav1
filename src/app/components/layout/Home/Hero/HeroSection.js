import React from "react";
// import Image from 'next/image';
import CTAButton from "@/app/components/common/buttons/CTAbutton/CTAButton";
import styles from "./HeroSection.module.css";
import CategoryCarousel from "./CategoryCarousel";
// import Image from "next/image";

const HeroSection = () => {
  const scrollToCommunity = () => {
    window.scrollTo({ top: 800, behavior: "smooth" });
  };

  return (
    <section className={styles.hero}>
      {/* <Image
        src="/images/hero-warmv2.jpg"
        alt="Image décorative"
        fill
        priority
        style={{ objectFit: "cover", zIndex: -1 }}
      /> */}
      <div className={styles.overlay} />

      <div className={styles.grid}>
        <div className={styles.carouselWrapper}>
          <CategoryCarousel />
        </div>

        <div className={styles.content}>
          <h1>Bienvenue sur PlanetLS</h1>
          <p>
            La plateforme de mise en relation qui connecte tous les acteurs de la location
            saisonnière.
          </p>
          {/* <span className={styles.highlight}>
            4,5 millions de loueurs et de professionnels partout en France
          </span> */}
          <p>
            « Simplifiez la gestion, optimisez vos revenus, trouvez les meilleurs services locaux en un clic »
          </p>
          <div className={styles.buttonsRow}>
            <CTAButton
              variant="primary"
              onClick={() => {
              }}>
              Découvrir comment ça marche
            </CTAButton>
            <CTAButton variant="secondary" onClick={scrollToCommunity}>
              Inscription gratuite
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
