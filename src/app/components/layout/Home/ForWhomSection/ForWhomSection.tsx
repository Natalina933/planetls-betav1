import Image, { ImageProps } from "next/image";
import React, { useState } from "react";
import styles from "./ForWhomSection.module.scss";

// --- 1. Typage des données ---

interface CardData {
  key: "proprietaire" | "concierge" | "artisan";
  title: string;
  img: string;
  alt: string;
  cta: string;
  href: string; // Lien d'action pour le CTA
  description: string;
}

// --- 2. Les données sont clairement définies ---

const CARDS: CardData[] = [
  {
    key: "proprietaire",
    title: "Propriétaires",
    img: "/icons/proprio_belle_epoque.png",
    alt: "Icône Propriétaires de logements saisonniers",
    cta: "Trouver une conciergerie",
    href: "/connexion?role=proprietaire",
    description: `Vous êtes propriétaire d’un bien en location saisonnière ? Rejoignez PlanetLS et simplifiez votre gestion locative.
      Accédez à une sélection de conciergeries indépendantes de confiance, prêtes à valoriser votre bien, optimiser vos revenus,
      et offrir une expérience exceptionnelle à vos voyageurs. Notre réseau vous connecte aux bons professionnels, au bon moment.`,
  },
  {
    key: "concierge",
    title: "Conciergeries",
    img: "/icons/concierges_belle_epoque.png",
    alt: "Icône Gestionnaires de biens",
    cta: "Développer mon réseau",
    href: "/connexion?role=concierge",
    description: `Vous gérez des biens en location courte durée ou souhaitez élargir votre clientèle ? PlanetLS vous aide à développer votre réseau local
      et à renforcer votre activité. Grâce à notre plateforme, vous pouvez proposer vos services en toute autonomie,
      gérer vos missions, et échanger avec des propriétaires à la recherche de partenaires fiables et professionnels.`,
  },
  {
    key: "artisan",
    title: "Artisans & Partenaires",
    img: "/icons/artisans_belle_epoque.png",
    alt: "Icône Artisans et professionnels de proximité",
    cta: "Proposer mon savoir-faire",
    href: "/connexion?role=artisan",
    description: `Vous êtes artisan, commerçant ou professionnel de proximité ? PlanetLS vous permet de mettre en avant votre savoir-faire
      auprès d’une communauté active dans la location saisonnière. Développez votre visibilité locale, proposez vos services aux propriétaires et conciergeries,
      et contribuez à une expérience voyageur unique et authentique.`,
  }
];

// --- 3. Composant réutilisable (CustomImage) avec Typage résolu ---

// Interface qui étend les props de Next.js Image
interface CustomImageProps extends ImageProps {
    src: string;
    alt: string;
    // Les autres props (width, height, className) sont héritées via ImageProps
}

const CustomImage: React.FC<CustomImageProps> = ({ src, alt, ...props }) => {
    // État pour gérer le fallback en cas d'erreur de chargement
    const [imgSrc, setImgSrc] = useState(src);
    const fallbackSrc = "/icons/placeholder.png";

    return (
        <Image
            src={imgSrc}
            alt={alt}
            // Gestion d'erreur explicite pour passer au fallback
            onError={() => setImgSrc(fallbackSrc)}
            {...props}
        />
    );
};

// --- 4. Composant de carte extrait (ActionCard) ---

const ActionCard: React.FC<{ data: CardData }> = ({ data }) => {
  const { key, title, img, alt, cta, description, href } = data;

  return (
    // Utilisation de la classe générique 'block' pour tous les styles de base
    // et ajout de la clé pour d'éventuels styles spécifiques (styles.proprietaire, etc.)
    <div key={key} className={`${styles.block} ${styles[key] || ''}`}>
      <CustomImage
        src={img}
        alt={alt}
        width={64}
        height={64}
        className={styles.icon}
        priority={true} // Optionnel: pour les images importantes au-dessus du pli
      />
      <h3>{title}</h3>
      <p>{description}</p>
      
      {/* ⚠️ Utilisation du vrai lien <a> pour l'accessibilité */}
      <a href={href} className={styles.CTAButton}>
        {cta}
      </a>
    </div>
  );
};


// --- 5. Composant Principal (ForWhomSection) ---

const ForWhomSection: React.FC = () => (
  <section id="pour-qui" className={styles.forWhomSection} aria-labelledby="section-title">
    <div className={styles.content}>
      <h2 id="section-title" className={styles.planetLSTitle}>Rejoignez PlanetLS</h2>
      <p className={styles.planetLSIntro}>
        Une plateforme collaborative qui connecte tous les acteurs de la location saisonnière.
      </p>

      {/* Rendu de la grille des cartes */}
      <div className={styles.blocks}>
        {CARDS.map((card) => (
          <ActionCard key={card.key} data={card} />
        ))}
      </div>

      {/* Bloc Mission */}
      <span className={styles.sectionMission}>
        Notre mission est de créer un pont fiable et efficace, permettant aux propriétaires de trouver la conciergerie idéale pour leurs biens,
        et aux concierges de développer leur portefeuille client avec des opportunités qualifiées.
      </span>

      {/* Bloc Actions d'Héro */}
      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          {/* Utilisation de liens <a> sémantiques pour les actions de navigation */}
          <a href="/complete-registration?category=service" className={styles.CTAButton}>Proposer un service</a>
          <a href="/recherche/prestataire" className={styles.CTAButtonSecondary}>Rechercher un prestataire</a>
        </div>
        <a href="#fonctionnement" className={styles.ctaTertiary}>Découvrir comment ça marche</a>
      </div>
    </div>
  </section>
);

export default ForWhomSection;
