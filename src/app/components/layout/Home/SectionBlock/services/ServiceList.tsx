"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import { ButtonLink, ShowcaseFlipCard, TabButton } from "@/components/ui";

import ServicesBlock from "../ServicesBlock";
import styles from "./ServiceList.module.scss";
import { services } from "../../../../../data/services/services";

export default function ServiceList() {
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const cardLayouts = [
    "heroWide",
    "standard",
    "standard",
    "wide",
    "wide",
    "wide",
    "tall",
    "heroWide",
  ] as const;

  const keyPoints = [...new Set(services.map((s) => s.keyPoint).filter(Boolean))];

  const handleKeyPointClick = (point: string) => {
    setFlippedCards((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point],
    );
  };

  const getCardSize = (index: number) => cardLayouts[index] ?? "standard";

  const getCardAccentClass = (index: number, size: ReturnType<typeof getCardSize>) => {
    if (size === "heroWide" && index % 2 === 0) return styles.cardDriftDown;
    if (size === "heroWide") return styles.cardDriftUp;
    if (size === "wide" && index % 2 === 1) return styles.cardInset;
    if (size === "tall") return styles.cardAnchor;
    return "";
  };

  return (
    <>
      <ServicesBlock
        title={
          <>
            Decouvrir notre Plateforme <br />
            de gestion tout-en-un
          </>
        }
        subtitle="La solution en ligne pour l'ensemble des acteurs de la location saisonniere"
        description="Une application et une plateforme entierement securisees, pensees pour automatiser la gestion, fluidifier la communication, et vous assister a chaque etape, que vous soyez proprietaire, professionnel, ou en quete de solutions fiables."
      >
        <header className={styles.platformHeader}>
          <p className={styles.sectionIntro}>
            Concue pour <span className={styles.highlightText}>simplifier la vie de toutes les categories professionnelles</span>,
            notre plateforme centralise vos outils, automatise vos taches et securise vos donnees. Que vous soyez <strong className={styles.userCategory}>proprietaire, concierge ou artisan</strong>,
            gagnez en efficacite et en serenite.
          </p>

          <ButtonLink href="#contact" variant="primary" className={styles.CTAButton}>
            Decouvrir la Plateforme <ArrowRight className={styles.ctaIcon} />
          </ButtonLink>
        </header>

        <ul
          className={clsx(styles.keyPoints, styles["keyPoints--chips"])}
          aria-label="Points cles de la plateforme"
        >
          {keyPoints.map((point) => (
            <li key={point} className={styles.keyPointChipWrapper}>
              <TabButton
                onClick={() => handleKeyPointClick(point)}
                className={clsx(styles.keyPointChip, {
                  [styles.isActive]: flippedCards.includes(point),
                })}
                active={flippedCards.includes(point)}
                aria-pressed={flippedCards.includes(point)}
              >
                {point}
              </TabButton>
            </li>
          ))}
        </ul>

        <div className={styles.serviceGrid}>
          {services.map(({ title, description, quote, icon, keyPoint, posterLabel, posterTone, posterLayout }, index) => {
            const safeKeyPoint = keyPoint?.trim() || `fallback-${index}`;
            const isFlipped = flippedCards.includes(safeKeyPoint);
            const size = getCardSize(index);

            return (
              <ShowcaseFlipCard
                key={`${title}-${index}`}
                title={title}
                description={description}
                quote={quote}
                posterLabel={posterLabel}
                posterTone={posterTone}
                posterLayout={posterLayout}
                icon={icon}
                isFlipped={isFlipped}
                onToggle={() => handleKeyPointClick(safeKeyPoint)}
                size={size}
                className={getCardAccentClass(index, size)}
              />
            );
          })}
        </div>
      </ServicesBlock>

      <div className={styles.ctaZone}>
        <ButtonLink
          className={styles.CTAButton}
          href="/complete-registration"
          aria-label="Essayer la plateforme gratuitement"
        >
          Essayer gratuitement
        </ButtonLink>
        <span className={styles.ctaSub}>Assistance personnalisee et offres sans commission.</span>
      </div>
    </>
  );
}
