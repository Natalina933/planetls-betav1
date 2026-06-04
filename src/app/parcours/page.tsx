import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Sparkles,
} from "lucide-react";
import { OnboardingIllustration } from "@/features/onboarding-assistant/components/OnboardingIllustration";
import { PUBLIC_PARCOURS_VISUALS } from "@/features/onboarding-assistant/visuals";
import styles from "./page.module.scss";

const paths = [
  {
    title: "Propri\u00e9taire",
    eyebrow: "Contr\u00f4le du parc",
    description:
      "Suivez vos logements, choisissez votre conciergerie, gardez la main sur les missions et vos finances.",
    href: "/owner",
    cta: "D\u00e9couvrir le parcours propri\u00e9taire",
    icon: Building2,
    tone: "owner",
    visual: PUBLIC_PARCOURS_VISUALS.owner,
  },
  {
    title: "Concierge",
    eyebrow: "D\u00e9marrage ou d\u00e9veloppement d'activit\u00e9",
    description:
      "Activez votre profil, trouvez vos premiers clients, convertissez vos leads et pilotez vos missions.",
    href: "/concierge",
    cta: "D\u00e9couvrir le parcours concierge",
    icon: Sparkles,
    tone: "concierge",
    visual: PUBLIC_PARCOURS_VISUALS.concierge,
  },
  {
    title: "Artisans",
    eyebrow: "Ex\u00e9cution terrain",
    description:
      "Recevez des missions locales, suivez vos interventions, vos clients et vos devis dans un espace plus clair.",
    href: "/provider",
    cta: "D\u00e9couvrir le parcours des artisans",
    icon: BriefcaseBusiness,
    tone: "provider",
    visual: PUBLIC_PARCOURS_VISUALS.provider,
  },
] as const;

export const metadata: Metadata = {
  title: "Parcours | Choisissez votre espace PlanetLS",
  description:
    "Choisissez le parcours PlanetLS adapt\u00e9 \u00e0 votre r\u00f4le : propri\u00e9taire, concierge ou artisans.",
};

export default function ParcoursPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Choix du parcours</span>
          <h1>Choisissez l&apos;espace PlanetLS adapt\u00e9 \u00e0 votre r\u00f4le.</h1>
          <p className={styles.lead}>
            Propri\u00e9taire, concierge ou artisans : chaque parcours public a sa propre entr\u00e9e,
            sa logique m\u00e9tier et sa lecture produit.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryCta}>
              Me connecter
            </Link>
            <Link href="/home" className={styles.secondaryCta}>
              Revenir \u00e0 l&apos;accueil
            </Link>
          </div>
        </div>

        <aside className={styles.heroPanel}>
          <OnboardingIllustration
            visual={PUBLIC_PARCOURS_VISUALS.overview}
            variant="hero"
            className={styles.heroVisual}
          />
          <p className={styles.panelEyebrow}>Vision</p>
          <h2>Un produit, trois entr\u00e9es m\u00e9tier publiques</h2>
          <p className={styles.panelLead}>
            L&apos;objectif n&apos;est pas d&apos;avoir une interface g\u00e9n\u00e9rique, mais un point
            d&apos;entr\u00e9e clair pour chaque r\u00f4le public. L&apos;administration reste un espace de
            gestion interne.
          </p>
          <div className={styles.panelMetrics}>
            <article>
              <strong>3</strong>
              <span>parcours distincts</span>
            </article>
            <article>
              <strong>1</strong>
              <span>grammaire produit</span>
            </article>
            <article>
              <strong>0</strong>
              <span>entr\u00e9e ambigu\u00eb</span>
            </article>
          </div>
        </aside>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>S\u00e9lection</span>
          <h2>Entrez par votre vrai besoin</h2>
          <p>
            Chaque parcours renvoie vers une page publique d\u00e9di\u00e9e, puis vers un dashboard
            structur\u00e9 autour de ses priorit\u00e9s r\u00e9elles.
          </p>
        </div>

        <div className={styles.pathGrid}>
          {paths.map((path) => {
            const Icon = path.icon;
            return (
              <article key={path.title} className={`${styles.pathCard} ${styles[path.tone]}`}>
                <OnboardingIllustration
                  visual={path.visual}
                  variant="card"
                  className={styles.pathVisual}
                />
                <div className={styles.pathTop}>
                  <span className={styles.pathIcon}>
                    <Icon size={20} />
                  </span>
                  <span className={styles.pathEyebrow}>{path.eyebrow}</span>
                </div>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <Link href={path.href} className={styles.inlineLink}>
                  {path.cta}
                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
