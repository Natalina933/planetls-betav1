"use client";

import { HeroSection } from "@/components/ui/layout/HeroSection/HeroSection";
import { Section } from "@/components/ui/layout/Section/Section";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import RecommendedConciergesSection from "../components/layout/Home/RecommendedConciergesSection/RecommendedConciergesSection";
import VideoIntro from "../components/layout/Home/VideoIntro/VideoIntro";
import { homeContent as copy } from "./home.content";
import styles from "./HomePage.module.scss";

export default function HomePage() {
  return (
    <div data-home-heritage className={styles.home}>
      {/* Hero */}
      <HeroSection
        className={styles.hero}
        animated={false}
        backgroundImage="/images/hero-warmv2.jpg"
        backgroundImageAlt="Une maison lumineuse, ouverte sur la verdure"
        backgroundImagePosition="center 59%"
        overlay="linear-gradient(90deg, rgba(21,37,28,.9), rgba(21,37,28,.72) 50%, rgba(21,37,28,.22))"
        ornament
      >
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{copy.hero.eyebrow}</p>
          <h1 id="home-title">
            {copy.hero.title}<br />
            <em>{copy.hero.subtitle}</em>
          </h1>
          <p>{copy.hero.description}</p>
          <div className={styles.actions}>
            <ButtonLink href={copy.hero.ctaPrimary.href} className={styles.primary}>
              {copy.hero.ctaPrimary.label}
            </ButtonLink>
            <Link href={copy.hero.ctaSecondary.href} className={styles.heroLink}>
              {copy.hero.ctaSecondary.label}
            </Link>
          </div>
          <div className={styles.reassurance}>
            {copy.hero.reassurance.map((item, index) => (
              <span key={index}>
                {item}
                {index < copy.hero.reassurance.length - 1 && <span className={styles.reassuranceSeparator}> · </span>}
              </span>
            ))}
          </div>
        </div>
        <span className={styles.heroCaption}>Un lieu a vous. Des personnes de confiance.</span>
      </HeroSection>

      {/* Comment PlanetLS fonctionne */}
      <Section
        id="fonctionnement"
        variant="transparent"
        paddingY="clamp(48px, 6vw, 96px)"
        paddingX="clamp(24px, 4vw, 40px)"
      >
        <p className={styles.eyebrow}>{copy.howItWorks.eyebrow}</p>
        <h2>
          {copy.howItWorks.title}<br />
          <em>{copy.howItWorks.subtitle}</em>
        </h2>
        <div className={styles.steps}>
          {copy.howItWorks.steps.map((step, index) => (
            <article key={step.title}>
              <span className={styles.number}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Votre logement a une histoire */}
      <section className={`${styles.section} ${styles.story}`}>
        <div className={styles.storyImage}>
          <Image
            src="/images/hero-warmv2.jpg"
            alt="Un interieur chaleureux avec des plantes et du mobilier en bois"
            fill
            sizes="(max-width: 760px) 100vw, 45vw"
          />
        </div>
        <div>
          <p className={styles.eyebrow}>{copy.yourStory.eyebrow}</p>
          <h2>
            {copy.yourStory.title}<br />
            <em>{copy.yourStory.subtitle}</em>
          </h2>
          <p>{copy.yourStory.description}</p>
          <ul className={styles.chips}>
            {copy.yourStory.services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
          <Link href={copy.yourStory.cta.href} className={styles.textLink}>
            {copy.yourStory.cta.label} <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>

      {/* PlanetLS en 1 minute */}
      <Section
        id="video"
        variant="soft"
        paddingY="clamp(48px, 6vw, 96px)"
        paddingX="clamp(24px, 4vw, 40px)"
      >
        <p className={styles.eyebrow}>{copy.videoIntro.eyebrow}</p>
        <h2>
          {copy.videoIntro.title}<br />
          <em>{copy.videoIntro.subtitle}</em>
        </h2>
        <p>{copy.videoIntro.description}</p>
        <div className={styles.existing}>
          <VideoIntro />
        </div>
        <ButtonLink href={copy.videoIntro.cta.href} className={styles.primary}>
          {copy.videoIntro.cta.label}
        </ButtonLink>
      </Section>

      {/* Tout centraliser */}
      <Section
        id="apercu"
        variant="soft"
        maxWidth="100%"
        paddingY="clamp(48px, 6vw, 96px)"
        paddingX="clamp(24px, 4vw, 40px)"
      >
        <div className={styles.showcase}>
          <div>
            <p className={styles.eyebrow}>{copy.allInOne.eyebrow}</p>
            <h2>
              {copy.allInOne.title}<br />
              <em>{copy.allInOne.subtitle}</em>
            </h2>
            <p>{copy.allInOne.description}</p>
            <ul className={styles.categoriesList}>
              {copy.allInOne.categories.map((category) => (
                <li key={category} className={styles.categoryItem}>{category}</li>
              ))}
            </ul>
            <Link href={copy.allInOne.cta.href} className={styles.textLink}>
              {copy.allInOne.cta.label} <span aria-hidden>↗</span>
            </Link>
          </div>
          <figure className={styles.productPreview} aria-labelledby="preview-caption">
            <div className={styles.previewHeader}>
              <span>PlanetLS</span>
              <span>Espace propriétaire</span>
            </div>
            <div className={styles.previewBody}>
              <p className={styles.eyebrow}>Votre logement</p>
              <h3>Une vue sur votre quotidien</h3>
              <div className={styles.previewTabs}>
                <span>Logement</span>
                <span>Sejours</span>
                <span>Missions</span>
              </div>
              <ul>
                <li>
                  <span aria-hidden>01</span>
                  <div>
                    <strong>Preparer les arrivees</strong>
                    <p>Reservations et informations du sejour</p>
                  </div>
                </li>
                <li>
                  <span aria-hidden>02</span>
                  <div>
                    <strong>Coordonner les interventions</strong>
                    <p>Missions et echanges avec vos partenaires</p>
                  </div>
                </li>
                <li>
                  <span aria-hidden>03</span>
                  <div>
                    <strong>Retrouver vos documents</strong>
                    <p>Les repères utiles a votre logement</p>
                  </div>
                </li>
              </ul>
            </div>
            <figcaption id="preview-caption">
              Illustration des usages · aperçu simplifié, sans données réelles.
            </figcaption>
          </figure>
        </div>
      </Section>

      {/* Une plateforme, trois experiences */}
      <section id="profils" className={styles.profileSection}>
        <Section
          variant="transparent"
          paddingY="clamp(48px, 6vw, 96px)"
          paddingX="clamp(24px, 4vw, 40px)"
        >
          <p className={styles.eyebrow}>{copy.threeExperiences.eyebrow}</p>
          <h2>
            {copy.threeExperiences.title}<br />
            <em>{copy.threeExperiences.subtitle}</em>
          </h2>
          <p className={styles.intro}>{copy.threeExperiences.intro}</p>
          <div className={styles.profiles}>
            {copy.threeExperiences.profiles.map((profile) => (
              <article key={profile.title} id={profile.image}>
                <div className={styles.profileImage}>
                  <Image
                    src={`/images/carousel/planetls-private-${profile.image}.png`}
                    alt={profile.title}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                </div>
                <div className={styles.profileBody}>
                  <h3>{profile.title}</h3>
                  <p>{profile.description}</p>
                  <Link href={profile.cta.href} className={styles.textLink}>
                    {profile.cta.label} <span aria-hidden>↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Section>
      </section>

      {/* Ecosysteme de confiance */}
      <section className={`${styles.section} ${styles.network}`}>
        <div>
          <p className={styles.eyebrow}>{copy.trustEcosystem.eyebrow}</p>
          <h2>
            {copy.trustEcosystem.title}<br />
            <em>{copy.trustEcosystem.subtitle}</em>
          </h2>
          <p>{copy.trustEcosystem.intro}</p>
          <div className={styles.engagements}>
            {copy.trustEcosystem.engagements.map((engagement, index) => (
              <div key={engagement.title} className={styles.engagement}>
                <span className={styles.engagementNumber}>0{index + 1}</span>
                <div>
                  <h3>{engagement.title}</h3>
                  <p>{engagement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conciergeries a decouvrir */}
      <section className={styles.section}>
        <p className={styles.eyebrow}>{copy.recommendedConcierges.eyebrow}</p>
        <h2>
          {copy.recommendedConcierges.title}<br />
          <em>{copy.recommendedConcierges.subtitle}</em>
        </h2>
        <p className={styles.intro}>{copy.recommendedConcierges.intro}</p>
        <div className={styles.existing}>
          <RecommendedConciergesSection editorial />
        </div>
        <Link href={copy.recommendedConcierges.cta.href} className={styles.textLink}>
          {copy.recommendedConcierges.cta.label} <span aria-hidden>↗</span>
        </Link>
      </section>

      {/* Guides & conseils */}
      <section id="conseils" className={`${styles.section} ${styles.journal}`}>
        <div>
          <p className={styles.eyebrow}>{copy.guidesAndAdvice.eyebrow}</p>
          <h2>{copy.guidesAndAdvice.title}</h2>
          <p>{copy.guidesAndAdvice.description}</p>
          <ol>
            {copy.guidesAndAdvice.guides.map((guide) => (
              <li key={guide.title}>
                <Link href={guide.href} className={styles.guideLink}>
                  {guide.title}
                </Link>
                <span aria-hidden>↗</span>
              </li>
            ))}
          </ol>
          <ButtonLink href={copy.guidesAndAdvice.cta.href} className={styles.primary}>
            {copy.guidesAndAdvice.cta.label}
          </ButtonLink>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.finalCta}>
        <p className={styles.eyebrow}>{copy.finalCta.eyebrow}</p>
        <h2>
          {copy.finalCta.title}<br />
          <em>{copy.finalCta.subtitle}</em>
        </h2>
        <p className={styles.finalDescription}>{copy.finalCta.description}</p>
        <div className={styles.actions}>
          <ButtonLink href={copy.finalCta.ctaPrimary.href} className={styles.primary}>
            {copy.finalCta.ctaPrimary.label}
          </ButtonLink>
          <Link href={copy.finalCta.ctaSecondary.href} className={styles.textLink}>
            {copy.finalCta.ctaSecondary.label} <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className={styles.footer}>
        <Link href="/home" className={styles.brand}>
          {copy.footer.brand}
          <small>{copy.footer.tagline}</small>
        </Link>
        <p>{copy.footer.description}</p>
        <nav aria-label="Liens de pied de page">
          {copy.footer.navGroups.flatMap((group) =>
            group.links.map((link) => (
              <Link key={link.label} href={link.href} className={styles.footerLink}>
                {link.label}
              </Link>
            ))
          )}
        </nav>
        <p className={styles.footerCopyright}>{copy.footer.copyright}</p>
      </footer>
    </div>
  );
}
