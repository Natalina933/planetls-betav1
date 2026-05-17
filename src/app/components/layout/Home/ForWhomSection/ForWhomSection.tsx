"use client";

import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { ArrowRight, CalendarCheck, FileText, MapPin, MessageSquare, Search, Sparkles } from "lucide-react";
import { ButtonLink, SectionIntro } from "@/components/ui";
import styles from "./ForWhomSection.module.scss";

interface CardData {
  key: "proprietaire" | "concierge" | "artisan";
  title: string;
  visual: string;
  cta: string;
  href: string;
  eyebrow: string;
  description: string;
  features: string[];
}

const CARDS: CardData[] = [
  {
    key: "proprietaire",
    title: "Propriétaires",
    visual: "/images/carousel/planetls-private-proprietaires.png",
    cta: "Découvrir le parcours propriétaire",
    href: "/owner",
    eyebrow: "Confiance et simplicité",
    description:
      "Recherchez une conciergerie selon votre ville, votre logement et vos attentes. Recevez des devis, comparez les profils et suivez les missions sans multiplier les outils.",
    features: ["Recherche concierge", "Réception devis", "Suivi missions"],
  },
  {
    key: "concierge",
    title: "Conciergeries",
    visual: "/images/carousel/planetls-private-conciergeries.png",
    cta: "Développer mon activité",
    href: "/concierge",
    eyebrow: "Organisation terrain",
    description:
      "Transformez les demandes entrantes en missions claires. Centralisez logements, planning, messages, interventions et documents depuis un dashboard conçu pour l'action.",
    features: ["Demandes qualifiées", "Dashboard terrain", "Planning optimisé"],
  },
  {
    key: "artisan",
    title: "Artisans",
    visual: "/images/carousel/planetls-private-artisans.png",
    cta: "Découvrir le parcours partenaire",
    href: "/provider",
    eyebrow: "Opportunités locales",
    description:
      "Soyez visible auprès des conciergeries et propriétaires actifs. Recevez des interventions contextualisées, validez vos passages et développez des partenariats durables.",
    features: ["Missions locales", "Validation intervention", "Visibilité partenaire"],
  },
];

const PREMIUM_FEATURES = [
  [Search, "Recherche intelligente"],
  [MapPin, "Carte interactive"],
  [FileText, "Devis et documents"],
  [CalendarCheck, "Missions et séjours"],
  [MessageSquare, "Messages centralisés"],
  [Sparkles, "Optimisation terrain"],
] as const;

interface CustomImageProps extends ImageProps {
  src: string;
  alt: string;
}

const CustomImage: React.FC<CustomImageProps> = ({ src, alt, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const fallbackSrc = "/icons/placeholder.png";

  return <Image src={imgSrc} alt={alt} onError={() => setImgSrc(fallbackSrc)} {...props} />;
};

const ActionCard: React.FC<{ data: CardData }> = ({ data }) => (
  <article className={`${styles.block} ${styles[data.key] || ""}`}>
    <div className={styles.cardVisual}>
      <CustomImage src={data.visual} alt="" fill sizes="(max-width: 980px) 100vw, 33vw" className={styles.visualImage} />
    </div>
    <span className={styles.eyebrow}>{data.eyebrow}</span>
    <h3>{data.title}</h3>
    <p>{data.description}</p>
    <div className={styles.featureList}>
      {data.features.map((feature) => (
        <span key={feature}>{feature}</span>
      ))}
    </div>
    <ButtonLink href={data.href} variant="primary" className={styles.CTAButton}>
      {data.cta} <ArrowRight size={16} />
    </ButtonLink>
  </article>
);

const ForWhomSection: React.FC = () => (
  <section id="pour-qui" className={styles.forWhomSection} aria-labelledby="for-whom-title">
    <div className={styles.content}>
      <div className={styles.introBlock}>
        <SectionIntro
          titleId="for-whom-title"
          eyebrow="Pour qui ?"
          title="Trois rôles, une même expérience de pilotage"
          description="PlanetLS donne à chaque acteur de la location saisonnière un parcours lisible : chercher, comparer, organiser, intervenir, valider."
        />
      </div>

      <div className={styles.blocks}>
        {CARDS.map((card) => (
          <ActionCard key={card.key} data={card} />
        ))}
      </div>

      <div className={styles.sectionMission}>
        <strong>Notre mission :</strong> centraliser la mise en relation, la gestion des missions
        et la coordination terrain pour professionnaliser la location saisonnière, sans perdre la
        dimension humaine du métier.
      </div>

      <div className={styles.productRibbon} aria-label="Fonctionnalités premium PlanetLS">
        {PREMIUM_FEATURES.map(([Icon, label]) => (
          <span key={label}>
            <Icon size={18} />
            {label}
          </span>
        ))}
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
