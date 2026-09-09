"use client";

import React, { ReactNode } from "react";
import Image from "next/image";
import { useReveal } from "@/app/components/hooks/useReveal";
import styles from "./Section.module.scss";

/**
 * Props pour le composant Section
 */
export interface SectionProps {
  /**
   * Contenu de la section
   */
  children: ReactNode;
  
  /**
   * Variante de la section
   * - "default": Section standard avec fond surface
   * - "soft": Fond surface-soft
   * - "muted": Fond surface-muted
   * - "transparent": Fond transparent
   * - "gold": Accent doré léger
   * - "green": Accent vert léger
   */
  variant?: "default" | "soft" | "muted" | "transparent" | "gold" | "green";
  
  /**
   * Eyebrow/Kicker - texte court au-dessus du titre
   */
  eyebrow?: string;
  
  /**
   * Titre de la section
   */
  title?: ReactNode;
  
  /**
   * Sous-titre ou description
   */
  subtitle?: ReactNode;
  
  /**
   * Actions à afficher dans la section
   */
  actions?: ReactNode;
  
  /**
   * Largeur maximale du contenu
   * Par défaut: var(--ds-layout-max-width)
   */
  maxWidth?: string;
  
  /**
   * Padding vertical
   * Par défaut: var(--ds-space-9) (96px)
   */
  paddingY?: string;
  
  /**
   * Padding horizontal
   * Par défaut: var(--ds-space-page)
   */
  paddingX?: string;
  
  /**
   * Gap vertical entre les éléments
   * Par défaut: var(--ds-space-6) (32px)
   */
  gap?: string;
  
  /**
   * Animation activée
   * Par défaut: true
   */
  animated?: boolean;
  
  /**
   * Classe CSS additionnelle
   */
  className?: string;
  
  /**
   * ID pour la section
   */
  id?: string;
  
  /**
   * Style inline additionnel
   */
  style?: React.CSSProperties;
  
  /**
   * Bordure supérieure
   */
  borderTop?: boolean;
  
  /**
   * Bordure inférieure
   */
  borderBottom?: boolean;
  
  /**
   * Motif 1900 en filigrane
   */
  ornament?: boolean | string;
}

/**
 * Section - Composant de section réutilisable
 * 
 * Ce composant implémente une section avec :
 * - Fond configurable
 * - Padding cohérent
 * - Animations reveal au scroll
 * - Responsive intégrée
 * - Support des bordures
 * 
 * @example
 * ```tsx
 * <Section
 *   variant="soft"
 *   eyebrow="Nos services"
 *   title="Découvrez ce que nous offrons"
 *   subtitle="Une solution complète pour votre location saisonnière"
 * >
 *   <FeatureGrid />
 * </Section>
 * ```
 */
export function Section({
  children,
  variant = "default",
  eyebrow,
  title,
  subtitle,
  actions,
  maxWidth,
  paddingY,
  paddingX,
  gap,
  animated = true,
  className = "",
  id,
  style,
  borderTop = false,
  borderBottom = false,
  ornament,
}: SectionProps) {
  const { ref, className: animationClass } = useReveal({
    disabled: !animated,
    animation: "reveal-up",
  });

  // Détermine la classe de fond selon la variante
  const getBackgroundClass = () => {
    switch (variant) {
      case "soft":
        return styles.soft;
      case "muted":
        return styles.muted;
      case "transparent":
        return styles.transparent;
      case "gold":
        return styles.gold;
      case "green":
        return styles.green;
      case "default":
      default:
        return styles.default;
    }
  };

  // Style calculé
  const sectionStyle: React.CSSProperties = {
    ...style,
    ...(maxWidth !== undefined && { maxWidth }),
    ...(paddingY !== undefined && { paddingTop: paddingY, paddingBottom: paddingY }),
    ...(paddingX !== undefined && { paddingLeft: paddingX, paddingRight: paddingX }),
    ...(gap !== undefined && { gap }),
  };

  return (
    <section
      id={id}
      ref={ref}
      className={`${styles.section} ${getBackgroundClass()} ${animationClass} ${className}`}
      style={sectionStyle}
    >
      <div className={styles.container}>
        {/* Header de la section */}
        {(eyebrow || title || subtitle || actions) && (
          <header className={styles.header}>
            {eyebrow && (
              <p className={styles.eyebrow}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className={styles.title}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={styles.subtitle}>
                {subtitle}
              </p>
            )}
            {actions && (
              <div className={styles.headerActions}>
                {actions}
              </div>
            )}
          </header>
        )}
        
        {/* Contenu principal */}
        <div className={styles.content}>
          {children}
        </div>
        
        {/* Motif 1900 optionnel */}
        {ornament && (
          <div className={styles.ornament}>
            <Image
              src={ornament === true ? "/ornements/ornement-right.svg" : ornament}
              alt=""
              width={200}
              height={200}
              className={styles.ornamentImage}
            />
          </div>
        )}
        
        {/* Bordures */}
        {borderTop && <div className={styles.borderTop} />}
        {borderBottom && <div className={styles.borderBottom} />}
      </div>
    </section>
  );
}

/**
 * Section avec bordures
 * Variante avec bordures supérieure et inférieure
 */
export function BorderedSection({
  children,
  ...props
}: Omit<SectionProps, "borderTop" | "borderBottom">) {
  return (
    <Section
      borderTop
      borderBottom
      paddingY="var(--ds-space-8)"
      {...props}
    >
      {children}
    </Section>
  );
}

/**
 * Section pour la page d'accueil
 * Pré-configurée avec les styles de la marque
 */
export function HomeSection({
  children,
  ...props
}: SectionProps) {
  return (
    <Section
      variant="transparent"
      paddingY="var(--ds-space-8)"
      {...props}
    >
      {children}
    </Section>
  );
}

/**
 * Section avec fond crème
 */
export function CreamSection({
  children,
  ...props
}: Omit<SectionProps, "variant">) {
  return (
    <Section
      variant="soft"
      {...props}
    >
      {children}
    </Section>
  );
}

/**
 * Section de storytelling
 * Avec layout asymétrique
 */
export interface StorySectionProps extends Omit<SectionProps, "children"> {
  children?: ReactNode;
  /** Contenu à gauche (texte) */
  textContent?: ReactNode;
  /** Contenu à droite (image/visuel) */
  visualContent?: ReactNode;
  /** Ordre des éléments (text first ou visual first) */
  order?: "text-first" | "visual-first";
}

export function StorySection({
  textContent,
  visualContent,
  order = "text-first",
  children,
  ...props
}: StorySectionProps) {
  return (
    <Section
      variant="transparent"
      paddingY="var(--ds-space-10)"
      {...props}
    >
      <div className={`${styles.storyGrid} ${styles[order]}`}>
        {order === "visual-first" && visualContent && (
          <div className={styles.storyVisual}>{visualContent}</div>
        )}
        {textContent && (
          <div className={styles.storyText}>
            {textContent}
          </div>
        )}
        {order === "text-first" && visualContent && (
          <div className={styles.storyVisual}>
            {visualContent}
          </div>
        )}
        {children}
      </div>
    </Section>
  );
}
