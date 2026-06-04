import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  Sparkles,
  Users,
} from "lucide-react";
import { OnboardingIllustration } from "@/features/onboarding-assistant/components/OnboardingIllustration";
import { PUBLIC_PARCOURS_VISUALS } from "@/features/onboarding-assistant/visuals";
import styles from "./page.module.scss";

const paths = [
  {
    title: "Propriétaire",
    eyebrow: "Contrôle du parc",
    description:
      "Suivez vos logements, choisissez votre conciergerie, gardez la main sur les missions et vos finances.",
    href: "/owner",
    cta: "Découvrir le parcours propriétaire",
    icon: Building2,
    tone: "owner",
    visual: PUBLIC_PARCOURS_VISUALS.owner,
  },
  {
    title: "Concierge",
    eyebrow: "Démarrage ou développement d'activité",
    description:
      "Activez votre profil, trouvez vos premiers clients, convertissez vos leads et pilotez vos missions.",
    href: "/concierge",
    cta: "Découvrir le parcours concierge",
    icon: Sparkles,
    tone: "concierge",
    visual: PUBLIC_PARCOURS_VISUALS.concierge,
  },
  {
    title: "Artisans",
    eyebrow: "Exécution terrain",
    description:
      "Recevez des missions locales, suivez vos interventions, vos clients et vos devis dans un espace plus clair.",
    href: "/provider",
    cta: "Découvrir le parcours des artisans",
    icon: BriefcaseBusiness,
    tone: "provider",
    visual: PUBLIC_PARCOURS_VISUALS.provider,
  },
] as const;

export const metadata: Metadata = {
  title: "Parcours | Choisissez votre espace PlanetLS",
  description:
    "Choisissez le parcours PlanetLS adapté à votre rôle : propriétaire, concierge ou artisans.",
};

export default function ParcoursPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Choix du parcours</span>
          <h1>Choisissez l&apos;espace PlanetLS adapté à votre rôle.</h1>
          <p className={styles.lead}>
            Propriétaire, concierge ou artisans : chaque parcours public a sa propre entrée, sa
            logique métier et sa lecture produit.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryCta}>
              Me connecter
            </Link>
            <Link href="/home" className={styles.secondaryCta}>
              Revenir à l&apos;accueil
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
          <h2>Un produit, trois entrées métier publiques</h2>
          <p className={styles.panelLead}>
            L&apos;objectif n&apos;est pas d&apos;avoir une interface générique, mais un point d&apos;entrée clair pour
            chaque rôle public. L&apos;administration reste un espace de gestion interne.
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
              <span>doublon inutile</span>
            </article>
          </div>
        </aside>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Sélection</span>
          <h2>Entrez par votre vrai besoin</h2>
          <p>
            Chaque parcours renvoie vers une page publique dédiée, puis vers un dashboard structuré
            autour de ses priorités réelles.
          </p>
        </div>

        <div className={styles.pathGrid}>
          {paths.map((path) => {
            const Icon = path.icon;
            return (
              <article key={path.title} className={`${styles.pathCard} ${styles[path.tone]}`}>
                <OnboardingIllustration visual={path.visual} variant="card" className={styles.pathVisual} />
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

      <section className={styles.bottomCta}>
        <div>
          <span className={styles.sectionKicker}>Suite</span>
          <h2>Choisir, comprendre, agir</h2>
          <p>
            Si vous découvrez encore le produit, commencez par la page parcours correspondante avant
            d&apos;ouvrir le dashboard. La lecture sera plus rapide et plus cohérente.
          </p>
        </div>

        <div className={styles.bottomActions}>
          <Link href="/concierge" className={styles.primaryCta}>
            Voir un exemple de parcours
          </Link>
          <Link href="/home#pour-qui" className={styles.secondaryCta}>
            Revenir au comparatif
          </Link>
        </div>

        <div className={styles.trustRow}>
          <span>
            <Users size={15} />
            Une entrée claire par rôle public
          </span>
          <span>
            <Sparkles size={15} />
            Une logique produit cohérente
          </span>
        </div>
      </section>
    </main>
  );
}
