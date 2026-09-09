"use client";

import { HeroSection } from "@/components/ui/layout/HeroSection/HeroSection";
import { Section } from "@/components/ui/layout/Section/Section";
import Image from "next/image";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui";
import CategoryCarousel from "../components/layout/Home/Hero/CategoryCarousel";
import FirstVisit from "../components/layout/Home/FirstVisit/FirstVisit";
import { HowItWorksSection } from "../components/layout/Home/HowItWorksSection/HowItWorksSection";
import RecommendedConciergesSection from "../components/layout/Home/RecommendedConciergesSection/RecommendedConciergesSection";
import ServiceList from "../components/layout/Home/SectionBlock/services/ServiceList";
import VideoIntro from "../components/layout/Home/VideoIntro/VideoIntro";
import { homeContent as copy } from "./home.content";
import styles from "./HomePage.module.scss";

export default function HomePage() {
  return (
    <div data-home-heritage className={styles.home}>
      <FirstVisit />
      <HeroSection className={styles.hero} animated={false} backgroundImage="/images/hero-warmv2.jpg" backgroundImageAlt="Une maison lumineuse, ouverte sur la verdure" backgroundImagePosition="center 59%" overlay="linear-gradient(90deg, rgba(21,37,28,.9), rgba(21,37,28,.72) 50%, rgba(21,37,28,.22))" ornament>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 id="home-title">{copy.title}<br /><em>{copy.subtitle}</em></h1>
          <p>{copy.introduction}</p>
          <p>Gardez une vision claire de votre logement, des séjours et des personnes qui en prennent soin.</p>
          <div className={styles.actions}><ButtonLink href="/parcours" className={styles.primary}>Découvrir PlanetLS</ButtonLink><a href="#fonctionnement" className={styles.heroLink}>Comment ça marche ? <span aria-hidden>↗</span></a></div>
          <small>Pensé pour vous permettre de rester maître de votre logement.</small>
        </div>
        <span className={styles.heroCaption}>Un lieu à vous. Des personnes de confiance.</span>
      </HeroSection>

      <Section id="fonctionnement" variant="transparent" paddingY="clamp(48px, 6vw, 96px)" paddingX="clamp(24px, 4vw, 40px)">
        <p className={styles.eyebrow}>Un quotidien mieux organisé</p>
        <h2>Une gestion plus simple,<br /><em>sans perdre le contrôle.</em></h2>
        <div className={styles.steps}>{copy.steps.map((step, index) => <article key={step.title}><span className={styles.number}>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
        <details className={styles.disclosure}><summary>Découvrir le fonctionnement par profil <span aria-hidden>＋</span></summary><HowItWorksSection /></details>
      </Section>

      <section id="services" className={`${styles.section} ${styles.story}`}>
        <div className={styles.storyImage}><Image src="/images/hero-warmv2.jpg" alt="Un intérieur chaleureux avec des plantes et du mobilier en bois" fill sizes="(max-width: 760px) 100vw, 45vw" /></div>
        <div><p className={styles.eyebrow}>Pensé pour la vie réelle</p><h2>Votre logement a une histoire.<br /><em>PlanetLS vous aide à la suivre.</em></h2><p>Un logement, ce n’est pas seulement un calendrier. Ce sont des personnes à coordonner, des documents à retrouver et des imprévus à gérer.</p><p>Centralisez les informations et gardez le fil de ce qui se passe, séjour après séjour.</p><ul className={styles.chips}>{copy.features.map(item => <li key={item}>{item}</li>)}</ul><Link href="/parcours" className={styles.textLink}>Découvrir la plateforme <span aria-hidden>↗</span></Link></div>
      </section>
      <div className={styles.section}><details className={styles.disclosure}><summary>Explorer tous les services <span aria-hidden>＋</span></summary><ServiceList /></details></div>
      <div className={`${styles.section} ${styles.existing}`}><VideoIntro /></div>


      <Section id="apercu" variant="soft" maxWidth="100%" paddingY="clamp(48px, 6vw, 96px)" paddingX="clamp(24px, 4vw, 40px)">
        <div className={styles.showcase}>
          <div><p className={styles.eyebrow}>L’essentiel, au même endroit</p><h2>Moins de dispersion.<br /><em>Plus de visibilité.</em></h2><p>Du prochain séjour à la dernière intervention, retrouvez les informations de votre logement et les personnes avec qui vous travaillez.</p><Link href="/parcours" className={styles.textLink}>Explorer les espaces PlanetLS <span aria-hidden>↗</span></Link></div>
          <figure className={styles.productPreview} aria-labelledby="preview-caption">
            <div className={styles.previewHeader}><span>PlanetLS</span><span>Espace propriétaire</span></div>
            <div className={styles.previewBody}><p className={styles.eyebrow}>Votre logement</p><h3>Une vue sur votre quotidien</h3><div className={styles.previewTabs}><span>Logement</span><span>Séjours</span><span>Missions</span></div><ul><li><span aria-hidden>01</span><div><strong>Préparer les arrivées</strong><p>Réservations et informations du séjour</p></div></li><li><span aria-hidden>02</span><div><strong>Coordonner les interventions</strong><p>Missions et échanges avec vos partenaires</p></div></li><li><span aria-hidden>03</span><div><strong>Retrouver vos documents</strong><p>Les repères utiles à votre logement</p></div></li></ul></div>
            <figcaption id="preview-caption">Illustration des usages · aperçu simplifié, sans données réelles.</figcaption>
          </figure>
        </div>
      </Section>

      <section id="profils" className={styles.profileSection}>
        <Section variant="transparent" paddingY="clamp(48px, 6vw, 96px)" paddingX="clamp(24px, 4vw, 40px)"><p className={styles.eyebrow}>Chacun sa place, un même lieu</p><h2>Une plateforme,<br /><em>trois expériences.</em></h2><div className={styles.profiles}>{copy.profiles.map(profile => <article key={profile.title} id={profile.image}><div className={styles.profileImage}><Image src={`/images/carousel/planetls-private-${profile.image}.png`} alt={profile.title} fill sizes="(max-width: 760px) 100vw, 33vw" /></div><div className={styles.profileBody}><h3>{profile.title}</h3><p>{profile.text}</p><Link href={profile.href} className={styles.textLink}>{profile.action} <span aria-hidden>↗</span></Link></div></article>)}</div></Section>
      </section>

      <section className={`${styles.section} ${styles.professional}`}><div><p className={styles.eyebrow}>Vous êtes professionnel ?</p><h2>Faites connaître<br /><em>votre savoir-faire.</em></h2></div><div><p>Ménage, accueil, entretien, dépannage… Vos services répondent à des besoins concrets. Présentez votre activité et facilitez la rencontre avec les propriétaires.</p><ButtonLink href="/abonnement/concierge-pro" className={styles.primary}>Je veux proposer mes services</ButtonLink></div></section>

      <section className={styles.network}><div className={styles.section}><p className={styles.eyebrow}>Demain, un réseau local</p><h2>Autour de chaque logement,<br /><em>un écosystème de confiance.</em></h2><p>Notre ambition : rapprocher les propriétaires des professionnels de leur territoire et faire grandir, progressivement, un réseau ancré dans la vie locale.</p><details className={styles.disclosure}><summary>Découvrir les profils du réseau <span aria-hidden>＋</span></summary><CategoryCarousel /></details></div></section>
      <div className={`${styles.section} ${styles.existing}`}><RecommendedConciergesSection editorial /><Link href="/dashboard/owner/concierges" className={styles.textLink}>Explorer les conciergeries <span aria-hidden>↗</span></Link></div>
      <section className={`${styles.section} ${styles.values}`} aria-labelledby="home-values-title"><h2 id="home-values-title">Notre façon de faire</h2>{copy.values.map(value => <article key={value.title}><h3>{value.title}</h3><p>{value.text}</p></article>)}</section>

      <section id="conseils" className={`${styles.section} ${styles.journal}`}><div><p className={styles.eyebrow}>Le carnet PlanetLS</p><h2>Guides &amp; conseils</h2><p>Des repères pour améliorer votre quotidien et offrir une meilleure expérience à vos voyageurs.</p><span id="guides-status" className={styles.preparation}>En préparation · Aucun guide publié pour le moment</span><Button disabled aria-describedby="guides-status" className={styles.pendingAdvice}>Voir tous les conseils</Button></div><ol>{copy.guides.map(guide => <li key={guide}>{guide}<span aria-hidden>↗</span></li>)}</ol></section>
      <section className={`${styles.section} ${styles.tools}`}><p className={styles.eyebrow}>Les petits outils du quotidien</p><h2>De bons repères,<br /><em>pour ne rien oublier.</em></h2><ul className={styles.chips}>{copy.tools.map(tool => <li key={tool}>{tool}</li>)}</ul><p>Une collection de modèles et de supports est en préparation.</p></section>
      <section className={styles.finalCta}><p className={styles.eyebrow}>Bienvenue chez PlanetLS</p><h2>Votre logement mérite<br /><em>une gestion plus sereine.</em></h2><p>{copy.finalDescription}</p><div className={styles.actions}><ButtonLink href="/login" className={styles.primary}>Créer mon espace</ButtonLink><Link href="/parcours" className={styles.textLink}>Découvrir PlanetLS <span aria-hidden>↗</span></Link></div></section>
      <footer id="contact" className={styles.footer}><Link href="/home" className={styles.brand}>PlanetLS<small>Simplifiez la location</small></Link><p>Des lieux vivants. Des liens durables.<br />© 2026 PlanetLS</p><nav aria-label="Liens de pied de page"><Link href="/about">À propos</Link><Link href="/contact">Contact</Link></nav></footer>
    </div>
  );
}
