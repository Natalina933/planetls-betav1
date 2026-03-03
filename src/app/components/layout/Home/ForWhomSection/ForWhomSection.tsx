import Image, { ImageProps } from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import styles from "./ForWhomSection.module.scss";

interface CardData {
  key: "proprietaire" | "concierge" | "artisan";
  title: string;
  img: string;
  alt: string;
  cta: string;
  href: string;
  eyebrow: string;
  description: string;
}

const CARDS: CardData[] = [
  {
    key: "proprietaire",
    title: "Propriétaires",
    img: "/icons/proprio_belle_epoque.png",
    alt: "Illustration propriétaire location saisonnière",
    cta: "Trouver une conciergerie",
    href: "/dashboard/owner/concierges",
    eyebrow: "Mise en relation rapide",
    description:
      "Trouvez une conciergerie adaptée à votre ville, à votre type de bien et à votre niveau d'accompagnement, puis pilotez missions, documents et paiements depuis un même espace.",
  },
  {
    key: "concierge",
    title: "Concierges",
    img: "/icons/concierges_belle_epoque.png",
    alt: "Illustration conciergerie premium",
    cta: "Développer mon activité",
    href: "/abonnement/concierge-pro",
    eyebrow: "Pilotage tout-en-un",
    description:
      "Structurez vos services, vos tarifs, vos packs, vos logements et vos missions. PlanetLS vous aide à gagner du temps et à rendre votre activité plus lisible et plus premium.",
  },
  {
    key: "artisan",
    title: "Artisans et partenaires",
    img: "/icons/artisans_belle_epoque.png",
    alt: "Illustration artisan partenaire local",
    cta: "Proposer mon savoir-faire",
    href: "/login",
    eyebrow: "Réseau local qualifié",
    description:
      "Rejoignez un écosystème de propriétaires et de concierges qui cherchent des partenaires fiables pour l'entretien, la maintenance, le linge ou les urgences.",
  },
];

interface CustomImageProps extends ImageProps {
  src: string;
  alt: string;
}

const CustomImage: React.FC<CustomImageProps> = ({ src, alt, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const fallbackSrc = "/icons/placeholder.png";

  return <Image src={imgSrc} alt={alt} onError={() => setImgSrc(fallbackSrc)} {...props} />;
};

const ActionCard: React.FC<{ data: CardData }> = ({ data }) => {
  const { key, title, img, alt, cta, description, href, eyebrow } = data;

  return (
    <article className={`${styles.block} ${styles[key] || ""}`}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <CustomImage src={img} alt={alt} width={72} height={72} className={styles.icon} priority />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={href} className={styles.CTAButton}>
        {cta}
      </Link>
    </article>
  );
};

const ForWhomSection: React.FC = () => (
  <section id="pour-qui" className={styles.forWhomSection} aria-labelledby="for-whom-title">
    <div className={styles.content}>
      <div className={styles.introBlock}>
        <span className={styles.kicker}>Pour qui ?</span>
        <h2 id="for-whom-title" className={styles.planetLSTitle}>
          Une plateforme conçue pour faire grandir tout l&apos;écosystème locatif
        </h2>
        <p className={styles.planetLSIntro}>
          PlanetLS relie propriétaires, concierges et partenaires terrain dans une expérience plus
          fluide, plus rassurante et beaucoup plus simple à piloter au quotidien.
        </p>
      </div>

      <div className={styles.blocks}>
        {CARDS.map((card) => (
          <ActionCard key={card.key} data={card} />
        ))}
      </div>

      <div className={styles.sectionMission}>
        <strong>Notre mission :</strong> centraliser la mise en relation, la gestion des biens et
        la coordination terrain pour professionnaliser la location saisonnière, sans complexifier
        le quotidien.
      </div>

      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          <Link href="/login" className={styles.CTAButton}>
            Démarrer sur PlanetLS
          </Link>
          <Link href="/home#how-it-works" className={styles.CTAButtonSecondary}>
            Voir le fonctionnement
          </Link>
        </div>
        <Link href="/dashboard/owner/concierges" className={styles.ctaTertiary}>
          Explorer les concierges disponibles
        </Link>
      </div>
    </div>
  </section>
);

export default ForWhomSection;
