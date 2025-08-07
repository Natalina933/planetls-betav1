import React from "react";
// import Image from 'next/image';
import styles from "./HeroSection.module.css";
import CategoryCarousel from "./CategoryCarousel";
import CTAButton from "@/components/common/Buttons/CTAButton/CTAButton";
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
                try {
                  // Exemple : ouvrir une page ou lancer une modale
                  console.log("✅ Bouton cliqué !");
                  // navigate("/a-propos"); // si tu utilises `useRouter()`
                } catch (error) {
                  console.error("⛔ Action échouée :", error);
                }
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
