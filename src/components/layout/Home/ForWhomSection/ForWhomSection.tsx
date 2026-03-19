"use client";

import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { ButtonLink, SectionIntro } from "@/components/ui";
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
    title: "Proprietaires",
    img: "/icons/proprio_belle_epoque.png",
    alt: "Illustration proprietaire location saisonniere",
    cta: "Decouvrir le parcours proprietaire",
    href: "/owner",
    eyebrow: "Mise en relation rapide",
    description:
      "Trouvez une conciergerie adaptee a votre ville, a votre type de bien et a votre niveau d'accompagnement, puis pilotez missions, documents et paiements depuis un meme espace.",
  },
  {
    key: "concierge",
    title: "Concierges",
    img: "/icons/concierges_belle_epoque.png",
    alt: "Illustration conciergerie premium",
    cta: "Developper mon activite",
    href: "/concierge",
    eyebrow: "Pilotage tout-en-un",
    description:
      "Structurez vos services, vos tarifs, vos packs, vos logements et vos missions. PlanetLS vous aide a gagner du temps et a rendre votre activite plus lisible et plus premium.",
  },
  {
    key: "artisan",
    title: "Artisans et partenaires",
    img: "/icons/artisans_belle_epoque.png",
    alt: "Illustration artisan partenaire local",
    cta: "Decouvrir le parcours partenaire",
    href: "/provider",
    eyebrow: "Reseau local qualifie",
    description:
      "Rejoignez un ecosysteme de proprietaires et de concierges qui cherchent des partenaires fiables pour l'entretien, la maintenance, le linge ou les urgences.",
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
      <ButtonLink href={href} variant="primary" className={styles.CTAButton}>
        {cta}
      </ButtonLink>
    </article>
  );
};

const ForWhomSection: React.FC = () => (
  <section id="pour-qui" className={styles.forWhomSection} aria-labelledby="for-whom-title">
    <div className={styles.content}>
      <div className={styles.introBlock}>
        <SectionIntro
          titleId="for-whom-title"
          eyebrow="Pour qui ?"
          title="Une plateforme concue pour faire grandir tout l'ecosysteme locatif"
          description="PlanetLS relie proprietaires, concierges et partenaires terrain dans une experience plus fluide, plus rassurante et beaucoup plus simple a piloter au quotidien."
        />
      </div>

      <div className={styles.blocks}>
        {CARDS.map((card) => (
          <ActionCard key={card.key} data={card} />
        ))}
      </div>

      <div className={styles.sectionMission}>
        <strong>Notre mission :</strong> centraliser la mise en relation, la gestion des biens et la
        coordination terrain pour professionnaliser la location saisonniere, sans complexifier le
        quotidien.
      </div>

      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          <ButtonLink href="/login" variant="primary" className={styles.CTAButton}>
            Demarrer sur PlanetLS
          </ButtonLink>
          <ButtonLink href="/parcours" variant="secondary" className={styles.CTAButtonSecondary}>
            Choisir mon parcours
          </ButtonLink>
        </div>
        <Link href="/home#how-it-works" className={styles.ctaTertiary}>
          Voir le fonctionnement
        </Link>
      </div>
    </div>
  </section>
);

export default ForWhomSection;
