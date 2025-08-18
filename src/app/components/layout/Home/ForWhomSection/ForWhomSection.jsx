import Image from "next/image";
import styles from "./ForWhomSection.module.scss";

const cards = [
  {
    key: "homeowner",
    title: "Homeowners",
    img: "/icons/proprio_belle_epoque.png",
    alt: "Icône Homeowners",
    cta: "Trouver une conciergerie",
    description: `Vous êtes propriétaire d’un bien en location saisonnière ? Rejoignez PlanetLS et simplifiez votre gestion locative.
      Accédez à une sélection de conciergeries indépendantes de confiance, prêtes à valoriser votre bien, optimiser vos revenus,
      et offrir une expérience exceptionnelle à vos voyageurs. Notre réseau vous connecte aux bons professionnels, au bon moment.`,
  },
  {
    key: "manager",
    title: "Property Managers",
    img: "/icons/concierges_belle_epoque.png",
    alt: "Icône Property Managers",
    cta: "Développer mon réseau",
    description: `Vous gérez des biens en location courte durée ou souhaitez élargir votre clientèle ? PlanetLS vous aide à développer votre réseau local
      et à renforcer votre activité. Grâce à notre plateforme, vous pouvez proposer vos services en toute autonomie,
      gérer vos missions, et échanger avec des propriétaires à la recherche de partenaires fiables et professionnels.`,
  },
  {
    key: "partner",
    title: "Partners",
    img: "/icons/artisans_belle_epoque.png",
    alt: "Icône Partners",
    cta: "Proposer mon savoir-faire",
    description: `Vous êtes artisan, commerçant ou professionnel de proximité ? PlanetLS vous permet de mettre en avant votre savoir-faire
      auprès d’une communauté active dans la location saisonnière. Développez votre visibilité locale, proposez vos services aux propriétaires et conciergeries,
      et contribuez à une expérience voyageur unique et authentique.`,
  }
];

const ForWhomSection = () => (
  <section id="pour-qui" className={styles.forWhomSection} aria-label="À qui s’adresse PlanetLS">
    <div className={styles.content}>
      <h2 className={styles.planetLSTitle}>Rejoignez PlanetLS</h2>
      <p className={styles.planetLSIntro}>
        Une plateforme collaborative qui connecte tous les acteurs de la location saisonnière.
      </p>
      <div className={styles.blocks}>
        {cards.map(({ key, title, img, alt, cta, description }) => (
          <div key={key} className={styles[`block${title.replace(' ', '')}`]}>
            <ImageWithFallback
              src={img}
              alt={alt}
              width={64}
              height={64}
              className={styles.icon}
            />
            <h3>{title}</h3>
            <p>{description}</p>
            <div role="button" tabIndex={0} className={styles.CTAButton}>
              {cta}
            </div>
          </div>
        ))}
      </div>
      <span className={styles.sectionMission}>
        Notre mission est de créer un pont fiable et efficace, permettant aux propriétaires de trouver la conciergerie idéale pour leurs biens,
        et aux concierges de développer leur portefeuille client avec des opportunités qualifiées.
      </span>
      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          <div role="button" tabIndex={0} className={styles.CTAButton}>Proposer un service</div>
          <div role="button" tabIndex={0} className={styles.CTAButtonSecondary}>Rechercher un prestataire</div>
        </div>
        <a href="#fonctionnement" className={styles.ctaTertiary}>Découvrir comment ça marche</a>
      </div>
    </div>
  </section>
);

// Composant Image avec fallback (gestion d’erreur élégante)
function ImageWithFallback({ src, alt, ...props }) {
  try {
    // Next.js 14+ gère nativement un fallback (mais on améliore côté dev; sinon voir l’export ci-dessous)
    return <Image src={src} alt={alt} {...props} onError={(e) => { e.target.src = "/icons/placeholder.png"; }} />;
  } catch {
    // Au cas où import Image échoue ou src non trouvé
    return <img src="/icons/placeholder.png" alt="Image manquante" {...props} />;
  }
}

export default ForWhomSection;
