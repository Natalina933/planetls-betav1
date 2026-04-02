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
    title: "Propriétaires",
    img: "/icons/proprio_belle_epoque.png",
    alt: "Illustration propriétaire location saisonnière",
    cta: "Découvrir le parcours propriétaire",
    href: "/owner",
    eyebrow: "Recherche et coordination",
    description:
      "Trouvez une conciergerie adaptée à votre ville, à votre type de bien et à votre niveau d'accompagnement, puis suivez missions, documents et échanges depuis un même espace.",
  },
  {
    key: "concierge",
    title: "Concierges et indépendants",
    img: "/icons/concierges_belle_epoque.png",
    alt: "Illustration conciergerie ou activité indépendante",
    cta: "Développer mon activité",
    href: "/concierge",
    eyebrow: "Activité flexible",
    description:
      "Que vous gériez déjà une conciergerie ou que vous souhaitiez créer un complément de revenu, PlanetLS vous aide à présenter vos services, trouver des missions et vous organiser simplement.",
  },
  {
    key: "artisan",
    title: "Artisans et partenaires",
    img: "/icons/artisans_belle_epoque.png",
    alt: "Illustration artisan partenaire local",
    cta: "Découvrir le parcours partenaire",
    href: "/provider",
    eyebrow: "Visibilité locale",
    description:
      "Rejoignez un écosystème de propriétaires, de conciergeries et d'indépendants qui cherchent des partenaires fiables pour l'entretien, la maintenance, le linge ou les urgences.",
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
          title="Une plateforme conçue pour faire travailler chaque acteur plus simplement"
          description="PlanetLS relie propriétaires, conciergeries, indépendants et partenaires terrain dans une expérience plus claire, plus fluide et plus simple à piloter au quotidien."
        />
      </div>

      <div className={styles.blocks}>
        {CARDS.map((card) => (
          <ActionCard key={card.key} data={card} />
        ))}
      </div>

      <div className={styles.sectionMission}>
        <strong>Notre mission :</strong> centraliser la mise en relation, la gestion des missions
        et la coordination terrain pour professionnaliser la location courte durée sans fermer la
        porte à ceux qui veulent démarrer progressivement.
      </div>

      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          <ButtonLink href="/login" variant="primary" className={styles.CTAButton}>
            Démarrer sur PlanetLS
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
