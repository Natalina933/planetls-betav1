import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import styles from "./page.module.scss";

const paths = [
  {
    title: "Proprietaire",
    eyebrow: "Controle du parc",
    description:
      "Suivez vos logements, choisissez votre conciergerie, gardez la main sur les missions et vos finances.",
    href: "/owner",
    cta: "Decouvrir le parcours proprietaire",
    icon: Building2,
    tone: "owner",
  },
  {
    title: "Concierge ou independant",
    eyebrow: "Demarrage ou developpement d'activite",
    description:
      "Activez votre profil, trouvez vos premiers clients, convertissez vos leads et pilotez vos missions.",
    href: "/concierge",
    cta: "Decouvrir le parcours concierge",
    icon: Sparkles,
    tone: "concierge",
  },
  {
    title: "Artisan / partenaire",
    eyebrow: "Execution terrain",
    description:
      "Gerez alertes, interventions, clients et devis dans un espace plus clair et plus rapide.",
    href: "/provider",
    cta: "Decouvrir le parcours partenaire",
    icon: BriefcaseBusiness,
    tone: "provider",
  },
  {
    title: "Administration",
    eyebrow: "Pilotage plateforme",
    description:
      "Accedez au tableau de bord global pour superviser comptes, activite et indicateurs de plateforme.",
    href: "/dashboard/admin",
    cta: "Ouvrir l'administration",
    icon: Shield,
    tone: "admin",
  },
] as const;

export const metadata: Metadata = {
  title: "Parcours | Choisissez votre espace PlanetLS",
  description:
    "Choisissez le parcours PlanetLS adapte a votre role : proprietaire, concierge, independant, artisan partenaire ou administration.",
};

export default function ParcoursPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Choix du parcours</span>
          <h1>Choisissez l&apos;espace PlanetLS adapte a votre role.</h1>
          <p className={styles.lead}>
            Proprietaire, concierge, independant, artisan ou administration : chaque parcours a sa
            propre entree, sa logique metier et sa lecture produit.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryCta}>
              Me connecter
            </Link>
            <Link href="/home" className={styles.secondaryCta}>
              Revenir a l&apos;accueil
            </Link>
          </div>
        </div>

        <aside className={styles.heroPanel}>
          <p className={styles.panelEyebrow}>Vision</p>
          <h2>Un produit, plusieurs entrees metier</h2>
          <p className={styles.panelLead}>
            L&apos;objectif n&apos;est pas d&apos;avoir une interface generique, mais un point d&apos;entree clair pour
            chaque role, y compris pour ceux qui commencent a petite echelle.
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
          <span className={styles.sectionKicker}>Selection</span>
          <h2>Entrez par votre vrai besoin</h2>
          <p>
            Chaque parcours renvoie vers une page publique dediee, puis vers un dashboard structure
            autour de ses priorites reelles.
          </p>
        </div>

        <div className={styles.pathGrid}>
          {paths.map((path) => {
            const Icon = path.icon;
            return (
              <article key={path.title} className={`${styles.pathCard} ${styles[path.tone]}`}>
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
            Si vous decouvrez encore le produit, commencez par la page parcours correspondante avant
            d&apos;ouvrir le dashboard. La lecture sera plus rapide et plus coherente.
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
            Une entree claire par role
          </span>
          <span>
            <Sparkles size={15} />
            Une logique produit coherente
          </span>
        </div>
      </section>
    </main>
  );
}
