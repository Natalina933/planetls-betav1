import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, BriefcaseBusiness, Shield, Sparkles, Users } from "lucide-react";
import styles from "../concierge/page.module.scss";

const paths = [
  {
    title: "Propriétaire",
    eyebrow: "Contrôle du parc",
    description:
      "Suivez vos logements, choisissez votre conciergerie, gardez la main sur les missions et vos finances.",
    href: "/owner",
    cta: "Découvrir le parcours propriétaire",
    icon: Building2,
  },
  {
    title: "Concierge",
    eyebrow: "Développement d'activité",
    description:
      "Activez votre profil, ouvrez la prospection, convertissez vos leads et pilotez vos missions.",
    href: "/concierge",
    cta: "Découvrir le parcours concierge",
    icon: Sparkles,
  },
  {
    title: "Artisan / partenaire",
    eyebrow: "Exécution terrain",
    description:
      "Gérez alertes, interventions, clients et devis dans un espace plus clair et plus rapide.",
    href: "/provider",
    cta: "Découvrir le parcours partenaire",
    icon: BriefcaseBusiness,
  },
  {
    title: "Administration",
    eyebrow: "Pilotage plateforme",
    description:
      "Accédez au tableau de bord global pour superviser comptes, activité et indicateurs de plateforme.",
    href: "/dashboard/admin",
    cta: "Ouvrir l'administration",
    icon: Shield,
  },
];

export const metadata: Metadata = {
  title: "Parcours | Choisissez votre espace PlanetLS",
  description:
    "Choisissez le parcours PlanetLS adapté à votre rôle : propriétaire, concierge, artisan partenaire ou administration.",
};

export default function ParcoursPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Choix du parcours</span>
          <h1>Choisissez l’espace PlanetLS adapté à votre rôle.</h1>
          <p className={styles.lead}>
            Propriétaire, concierge, artisan ou administration : chaque parcours a maintenant sa
            propre entrée, sa logique métier et sa lecture produit.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryCta}>
              Me connecter
            </Link>
            <Link href="/home" className={styles.secondaryCta}>
              Revenir à l’accueil
            </Link>
          </div>
        </div>

        <aside className={styles.heroPanel}>
          <p className={styles.panelEyebrow}>Vision</p>
          <h2>Un produit, plusieurs entrées métier</h2>
          <p className={styles.panelLead}>
            L’objectif n’est pas d’avoir une interface générique, mais un point d’entrée clair pour
            chaque rôle afin de réduire la charge cognitive dès les premières secondes.
          </p>
          <div className={styles.panelMetrics}>
            <article>
              <strong>4</strong>
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
          <h2>Entrez par votre vrai métier</h2>
          <p>
            Chaque parcours renvoie vers une page publique dédiée, puis vers un dashboard structuré
            autour de ses priorités réelles.
          </p>
        </div>

        <div className={styles.actionGrid}>
          {paths.map((path) => {
            const Icon = path.icon;
            return (
              <article key={path.title} className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <Icon size={18} />
                </div>
                <span className={styles.sectionKicker}>{path.eyebrow}</span>
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
            d’ouvrir le dashboard. La lecture sera plus rapide et plus cohérente.
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
            Une entrée claire par rôle
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
