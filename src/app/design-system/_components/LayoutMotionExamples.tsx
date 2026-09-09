"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { HeroSection } from "@/components/ui/layout/HeroSection/HeroSection";
import { Section, StorySection } from "@/components/ui/layout/Section/Section";
import { useParallax, useReveal, useStaggeredReveal } from "@/components/ui/motion";
import styles from "../atelier.module.scss";

function MotionSample() {
  const reveal = useReveal({ animation: "reveal-down" });
  const stagger = useStaggeredReveal(2, 150);
  const parallax = useParallax(0.15);
  return <div className={styles.grid}>
    <div ref={reveal.ref} className={`${styles.card} ${reveal.className}`} data-motion="reveal"><strong>Apparition douce</strong><p>Une animation unique à l’entrée dans la zone visible.</p></div>
    <div ref={stagger.ref} className={`${styles.card} ${stagger.className}`} data-motion="stagger"><strong>Entrée décalée</strong><p>Un délai court pour accompagner une séquence.</p></div>
    <div className={styles.card} data-motion="parallax"><strong>Décor en mouvement</strong><div ref={parallax.ref} style={parallax.style} aria-hidden="true"><span className={styles.swatch} style={{ background: "var(--ds-color-accent-soft)" }} /></div><p>Le décor seul se déplace, de 48 px au maximum.</p></div>
  </div>;
}

/** Exemples publics, sans données ni actions métier. */
export function LayoutMotionExamples() {
  const [version, setVersion] = useState(0);
  const [mounted, setMounted] = useState(true);
  return <>
    <p>Exemples des composants partagés. Les préférences d’animation du système sont respectées.</p>
    <HeroSection id="ds-hero-split" variant="split" animated={false} minHeight="320px" subtitle="Une composition claire sur fond clair." rightContent={<p>Emplacement du visuel</p>}>
      <h3>Hero partagé · split</h3>
    </HeroSection>
    <HeroSection id="ds-hero-centered" variant="centered" animated={false} minHeight="320px" overlay="linear-gradient(90deg, #294b3e, #416b59)" backgroundImage="/images/hero-warmv2.jpg" priority={false}>
      <h3 style={{ color: "var(--ds-color-text-inverse)" }}>Hero partagé · centré</h3>
    </HeroSection>
    <Section id="ds-section-example" variant="soft" animated={false} ornament>
      <h3>Section responsive</h3><p>Des marges adaptées à la largeur disponible, avec un motif décoratif.</p>
    </Section>
    <StorySection id="ds-story-example" animated={false} order="visual-first" visualContent={<p>Visuel en premier</p>} textContent={<p>Explication en second</p>} />
    <div className={styles.examples}><Button onClick={() => setVersion(value => value + 1)}>Rejouer les animations</Button><Button variant="outline" onClick={() => setMounted(value => !value)}>{mounted ? "Masquer" : "Afficher"} les exemples animés</Button></div>
    {mounted && <MotionSample key={version} />}
  </>;
}
