import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Landmark,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import styles from "./page.module.scss";

const onboardingSteps = [
  {
    title: "Ajoutez vos logements",
    description: "Structurez vos biens, vos informations clés et vos documents avant de déléguer.",
  },
  {
    title: "Choisissez votre conciergerie",
    description: "Comparez les profils compatibles et lancez une relation de travail plus cadrée.",
  },
  {
    title: "Suivez vos missions",
    description: "Gardez la main sur les interventions, les urgences et le niveau de service.",
  },
  {
    title: "Pilotez vos finances",
    description: "Centralisez devis, factures et arbitrages sans vous disperser entre plusieurs outils.",
  },
];

const proofPoints = [
  "Logements, missions et documents reliés dans le même espace",
  "Accès rapide à la conciergerie, aux échanges et aux arbitrages financiers",
  "Vue simple pour contrôler qualité, exécution et budget",
];

const actionSteps = [
  {
    icon: Building2,
    title: "1. Structurer votre parc",
    description: "Ajoutez vos logements et finalisez les fiches qui bloquent encore l'activation.",
    href: "/dashboard/owner/logements",
    cta: "Voir mes logements",
  },
  {
    icon: Sparkles,
    title: "2. Ouvrir la relation conciergerie",
    description: "Consultez les profils disponibles et sélectionnez les partenaires les plus adaptés.",
    href: "/dashboard/owner/concierges",
    cta: "Trouver une conciergerie",
  },
  {
    icon: Wrench,
    title: "3. Suivre les missions",
    description: "Gardez visibles les interventions en cours, les urgences et les prochaines validations.",
    href: "/dashboard/owner/planning",
    cta: "Ouvrir le planning",
  },
  {
    icon: Landmark,
    title: "4. Contrôler vos finances",
    description: "Passez de la vue factures aux devis et sécurisez les paiements à impact direct.",
    href: "/dashboard/owner/factures",
    cta: "Voir mes finances",
  },
];

export const metadata: Metadata = {
  title: "Propriétaire | Pilotez logements, conciergerie et finances",
  description:
    "Découvrez le parcours propriétaire PlanetLS : logements, conciergerie, missions, documents et finances dans un espace clair.",
};

export default function OwnerLandingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Parcours Propriétaire</span>
          <h1>Pilotez vos logements, votre conciergerie et vos finances au même endroit.</h1>
          <p className={styles.lead}>
            PlanetLS aide les propriétaires à garder une lecture claire de leur parc, de
            l&apos;exécution terrain et des paiements, sans multiplier les outils ni les échanges
            dispersés.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryCta}>
              Créer mon compte propriétaire
            </Link>
            <Link href="/dashboard/owner" className={styles.secondaryCta}>
              Ouvrir mon dashboard
            </Link>
          </div>

          <ul className={styles.proofList}>
            {proofPoints.map((item) => (
              <li key={item}>
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className={styles.heroPanel}>
          <p className={styles.panelEyebrow}>Objectif</p>
          <h2>Passer de logements isolés à parc piloté</h2>
          <p className={styles.panelLead}>
            Le bon parcours propriétaire ne consiste pas seulement à publier un bien. Il faut aussi
            cadrer les partenaires, suivre les missions et contrôler la rentabilité.
          </p>
          <div className={styles.panelMetrics}>
            <article>
              <strong>1</strong>
              <span>parc structuré</span>
            </article>
            <article>
              <strong>1</strong>
              <span>conciergerie cadrée</span>
            </article>
            <article>
              <strong>3+</strong>
              <span>axes de pilotage</span>
            </article>
          </div>
        </aside>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Onboarding</span>
          <h2>Un parcours propriétaire en 4 étapes</h2>
          <p>La bonne séquence commence par le parc, puis la relation conciergerie, puis le suivi.</p>
        </div>

        <div className={styles.stepGrid}>
          {onboardingSteps.map((step) => (
            <article key={step.title} className={styles.stepCard}>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Activation</span>
          <h2>Commencez par les points qui donnent du contrôle</h2>
          <p>
            L&apos;objectif n&apos;est pas de tout ouvrir d&apos;un coup, mais de sécuriser les
            logements, les partenaires et les paiements qui comptent vraiment.
          </p>
        </div>

        <div className={styles.actionGrid}>
          {actionSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <Icon size={18} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <Link href={step.href} className={styles.inlineLink}>
                  {step.cta}
                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.highlightCard}>
          <div>
            <span className={styles.sectionKicker}>Pilotage</span>
            <h2>Le bon enchaînement propriétaire</h2>
            <p>
              Logement structuré, conciergerie activée, mission suivie, document validé : PlanetLS
              relie déjà ces briques pour vous donner une lecture plus nette de votre activité.
            </p>
          </div>

          <div className={styles.highlightFlow}>
            <span>Logement</span>
            <ArrowRight size={16} />
            <span>Conciergerie</span>
            <ArrowRight size={16} />
            <span>Mission</span>
            <ArrowRight size={16} />
            <span>Finance</span>
          </div>
        </div>
      </section>

      <section className={styles.bottomCta}>
        <div>
          <span className={styles.sectionKicker}>Suite</span>
          <h2>Structurer, déléguer, contrôler</h2>
          <p>
            Commencez par vos logements, puis ouvrez la sélection de conciergerie. C&apos;est le
            point d&apos;entrée le plus utile pour un parcours propriétaire lisible.
          </p>
        </div>

        <div className={styles.bottomActions}>
          <Link href="/dashboard/owner/logements" className={styles.primaryCta}>
            Structurer mon parc
          </Link>
          <Link href="/dashboard/owner/concierges" className={styles.secondaryCta}>
            Voir les conciergeries
          </Link>
        </div>

        <div className={styles.trustRow}>
          <span>
            <ShieldCheck size={15} />
            Lecture claire du parc et des risques
          </span>
          <span>
            <FileText size={15} />
            Devis et factures déjà centralisés
          </span>
          <span>
            <Sparkles size={15} />
            Sélection concierge plus simple
          </span>
        </div>
      </section>
    </main>
  );
}
