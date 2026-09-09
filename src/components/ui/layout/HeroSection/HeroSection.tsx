"use client";

import React, { ReactNode } from "react";
import Image, { ImageProps } from "next/image";
import { useReveal } from "@/app/components/hooks/useReveal";
import styles from "./HeroSection.module.scss";

/**
 * Props pour le composant HeroSection
 */
export interface HeroSectionProps {
  /**
   * Type de hero
   * - "immersive": Image en fond avec overlay (par défaut)
   * - "split": Contenu à gauche, image à droite
   * - "centered": Contenu centré sur image
   */
  variant?: "immersive" | "split" | "centered";
  
  /** Image de fond - obligatoire pour les variants immersive et centered */
  backgroundImage?: ImageProps["src"];
  
  /** Alt text pour l'image */
  backgroundImageAlt?: string;
  
  /** Position de l'image */
  backgroundImagePosition?: string;
  
  /** Sizes pour Next/Image */
  backgroundImageSizes?: string;
  
  /** Priorité de chargement */
  priority?: boolean;
  
  /**
   * Contenu principal (titre, sous-titre, description, CTA)
   * Accepte ReactNode ou objet structuré
   */
  children?: ReactNode;
  
  /**
   * Eyebrow/Kicker - texte court en haut du titre
   * Ex: "Bienvenue", "Découvrez", "Nouveau"
   */
  eyebrow?: string;
  
  /**
   * Titre principal
   * Serif par défaut (Cormorant Garamond)
   */
  title?: ReactNode;
  
  /**
   * Sous-titre ou description
   * Peut contenir du texte ou des composants
   */
  subtitle?: ReactNode;
  
  /**
   * Contenu additionnel en bas (CTA, liens, etc.)
   */
  actions?: ReactNode;
  
  /**
   * Contenu à droite (pour variant split)
   * Peut être une image, un visuel, des métriques, etc.
   */
  rightContent?: ReactNode;
  
  /**
   * Couleur de l'overlay (gradient ou couleur unie)
   * Par défaut: gradient vertical sombre
   */
  overlay?: "dark" | "light" | "gold" | "none" | string;
  
  /**
   * Hauteur minimale du hero
   * Par défaut: 720px (desktop), 600px (mobile)
   */
  minHeight?: string;
  
  /**
   * Alignement du contenu
   * Par défaut: "left" pour immersive et split, "center" pour centered
   */
  align?: "left" | "center" | "right";
  
  /**
   * Animation activée
   * Par défaut: true (reveal-up)
   */
  animated?: boolean;
  
  /**
   * Classe CSS additionnelle
   */
  className?: string;
  
  /**
   * ID pour le section
   */
  id?: string;
  
  /**
   * Style inline additionnel
   */
  style?: React.CSSProperties;
  
  /**
   * Motif 1900 en filigrane
   * URL de l'image ou true pour utiliser le motif par défaut
   */
  ornament?: boolean | string;
}

/**
 * HeroSection - Composant de section hero réutilisable
 * 
 * Ce composant implémente le design immerif avec :
 * - Image de fond
 * - Overlay avec gradient
 * - Contenu aligné
 * - Animations reveal au scroll
 * - Responsive intégrée
 * 
 * @example
 * ```tsx
 * <HeroSection
 *   variant="immersive"
 *   backgroundImage="/images/hero-warmv2.jpg"
 *   backgroundImageAlt="Une maison lumineuse"
 *   eyebrow="Accueil"
 *   title={<>Bienvenue chez<br />PlanetLS</>}
 *   actions={<Button variant="primary">Commencer</Button>}
 * />
 * ```
 */
export function HeroSection({
  variant = "immersive",
  backgroundImage,
  backgroundImageAlt = "",
  backgroundImagePosition = "center",
  backgroundImageSizes = "100vw",
  priority = true,
  children,
  eyebrow,
  title,
  subtitle,
  actions,
  rightContent,
  overlay = "dark",
  minHeight,
  align,
  animated = true,
  className = "",
  id,
  style,
  ornament,
}: HeroSectionProps) {
  const { ref, className: animationClass } = useReveal({
    disabled: !animated,
    animation: "reveal-up",
  });

  // Détermine l'alignement par défaut selon le variant
  const defaultAlign = align ?? (variant === "centered" ? "center" : "left");
  
  // Détermine la hauteur minimale
  const heroMinHeight = minHeight;

  // Détermine l'overlay
  const getOverlay = () => {
    switch (overlay) {
      case "none":
        return "none";
      case "light":
        return "linear-gradient(180deg, rgba(248, 243, 233, 0.8) 0%, rgba(248, 243, 233, 0.4) 100%)";
      case "gold":
        return "linear-gradient(180deg, rgba(139, 106, 45, 0.3) 0%, rgba(139, 106, 45, 0.1) 100%)";
      case "dark":
        return "linear-gradient(180deg, rgba(41, 40, 35, 0.8) 0%, rgba(41, 40, 35, 0.4) 100%)";
      default:
        return overlay;
    }
  };

  // Contenu principal
  const mainContent = (
    <div className={styles.content}>
      {eyebrow && (
        <p className={styles.eyebrow}>
          {eyebrow}
        </p>
      )}
      {title && <h1 className={styles.title}>{title}</h1>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );

  // Rendu selon le variant
  switch (variant) {
    case "split":
      return (
        <section
          id={id}
          ref={ref}
          className={`${styles.hero} ${styles.split} ${animationClass} ${className}`}
          style={{ ...style, minHeight: heroMinHeight }}
        >
          <div className={`${styles.splitLeft} ${styles[`align-${defaultAlign}`]}`}>
            {mainContent}
          </div>
          {rightContent && (
            <div className={styles.splitRight}>{rightContent}</div>
          )}
          {ornament && (
            <div className={styles.ornament}>
              <Image
                src={ornament === true ? "/ornements/ornement-right.svg" : ornament}
                alt=""
                fill
                className={styles.ornamentImage}
                sizes="260px"
              />
            </div>
          )}
        </section>
      );

    case "centered":
      return (
        <section
          id={id}
          ref={ref}
          className={`${styles.hero} ${styles.centered} ${animationClass} ${className}`}
          style={{ ...style, minHeight: heroMinHeight }}
        >
          {backgroundImage && (
            <div className={styles.background}>
              <Image
                src={backgroundImage}
                alt={backgroundImageAlt}
                fill
                priority={priority}
                sizes={backgroundImageSizes}
                className={styles.image}
                style={{ objectPosition: backgroundImagePosition }}
              />
              <div 
                className={styles.overlay} 
                style={{ background: getOverlay() }}
              />
            </div>
          )}
          <div className={`${styles.contentContainer} ${styles[`align-${defaultAlign}`]}`}>
            {mainContent}
          </div>
          {ornament && (
            <div className={styles.ornament}>
              <Image
                src={ornament === true ? "/ornements/ornement-right.svg" : ornament}
                alt=""
                fill
                className={styles.ornamentImage}
                sizes="260px"
              />
            </div>
          )}
        </section>
      );

    case "immersive":
    default:
      return (
        <section
          id={id}
          ref={ref}
          className={`${styles.hero} ${styles.immersive} ${animationClass} ${className}`}
          style={{ ...style, minHeight: heroMinHeight }}
        >
          {backgroundImage && (
            <div className={styles.background}>
              <Image
                src={backgroundImage}
                alt={backgroundImageAlt}
                fill
                priority={priority}
                sizes={backgroundImageSizes}
                className={styles.image}
                style={{ objectPosition: backgroundImagePosition }}
              />
              <div 
                className={styles.overlay} 
                style={{ background: getOverlay() }}
              />
            </div>
          )}
          <div className={`${styles.contentContainer} ${styles[`align-${defaultAlign}`]}`}>
            {mainContent}
          </div>
          {ornament && (
            <div className={styles.ornament}>
              <Image
                src={ornament === true ? "/ornements/ornement-right.svg" : ornament}
                alt=""
                fill
                className={styles.ornamentImage}
                sizes="260px"
              />
            </div>
          )}
        </section>
      );
  }
}

/**
 * HeroSection avec image seulement
 * Variante simplifiée pour les cas courants
 */
export function SimpleHero({
  title,
  subtitle,
  backgroundImage,
  actions,
  eyebrow,
  ...props
}: Omit<HeroSectionProps, "children"> & { children?: never }) {
  return (
    <HeroSection
      variant="immersive"
      backgroundImage={backgroundImage}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
      {...props}
    />
  );
}

/**
 * HeroSection pour la page d'accueil PlanetLS
 * Pré-configurée avec les styles de la marque
 */
export function HomeHero({
  title,
  subtitle,
  backgroundImage = "/images/hero-warmv2.jpg",
  actions,
  eyebrow,
  ...props
}: Omit<HeroSectionProps, "children" | "variant"> & { children?: never }) {
  return (
    <HeroSection
      variant="immersive"
      backgroundImage={backgroundImage}
      backgroundImageAlt="Une maison lumineuse, ouverte sur la verdure"
      backgroundImagePosition="center 59%"
      overlay="linear-gradient(90deg, rgba(21,37,28,.84), rgba(21,37,28,.58) 45%, rgba(21,37,28,.08))"
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
      ornament={true}
      {...props}
    />
  );
}
