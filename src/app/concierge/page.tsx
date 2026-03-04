import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import styles from "./page.module.scss";

const onboardingSteps = [
  {
    title: "Définissez votre zone",
    description: "Indiquez les villes couvertes, votre rayon d'action et vos disponibilités.",
  },
  {
    title: "Activez vos services",
    description: "Choisissez les missions que vous acceptez : check-in, ménage, maintenance, urgence.",
  },
  {
    title: "Structurez votre offre",
    description: "Ajoutez vos tarifs, vos packs et vos éléments de réassurance pour convertir plus vite.",
  },
  {
    title: "Recevez vos premiers leads",
    description: "PlanetLS vous aide à détecter des propriétaires compatibles et à lancer la relation.",
  },
];

const proofPoints = [
  "Prospection propriétaires directement dans le dashboard",
  "Demandes reçues, messages, devis et factures reliés au même parcours",
  "Profil, zone et services centralisés pour mieux convertir",
];

const actionSteps = [
  {
    icon: MapPin,
    title: "1. Compléter votre profil",
    description: "Zone, services, documents et positionnement doivent être clairs dès le départ.",
    href: "/dashboard/concierge/profile?tab=fiche",
    cta: "Compléter ma fiche",
  },
  {
    icon: Sparkles,
    title: "2. Configurer vos missions",
    description: "Activez les services que vous souhaitez recevoir et vos règles de disponibilité.",
    href: "/dashboard/concierge/profile?tab=missions",
    cta: "Configurer mes missions",
  },
  {
    icon: Target,
    title: "3. Trouver des propriétaires",
    description: "Lancez votre prospection et ouvrez les opportunités les plus compatibles.",
    href: "/dashboard/concierge/recherche",
    cta: "Ouvrir la prospection",
  },
  {
    icon: MessageSquare,
    title: "4. Convertir vos leads",
    description: "Répondez vite, ouvrez le message, préparez un devis et transformez la demande.",
    href: "/dashboard/concierge/demandes",
    cta: "Voir mes demandes",
  },
];

export const metadata: Metadata = {
  title: "Concierge | Trouvez des propriétaires et pilotez votre activité",
  description:
    "Développez votre conciergerie avec un parcours clair : profil, zone, services, leads propriétaires, messages, devis et pilotage.",
};

export default function ConciergeLandingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Parcours Concierge</span>
          <h1>Trouvez des propriétaires et gérez toute votre conciergerie au même endroit.</h1>
          <p className={styles.lead}>
            PlanetLS réunit prospection, activation, demandes, messages, devis et pilotage dans un
            seul espace pensé pour les conciergeries qui veulent structurer leur croissance.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryCta}>
              Créer mon compte concierge
            </Link>
            <Link href="/dashboard/concierge" className={styles.secondaryCta}>
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
          <h2>Passer de profil créé à activité active</h2>
          <p className={styles.panelLead}>
            Le bon parcours concierge n&apos;est pas seulement un compte ouvert. C&apos;est un profil
            prêt, une offre lisible et des leads réellement activés.
          </p>
          <div className={styles.panelMetrics}>
            <article>
              <strong>1</strong>
              <span>profil bien cadré</span>
            </article>
            <article>
              <strong>1</strong>
              <span>offre claire</span>
            </article>
            <article>
              <strong>3+</strong>
              <span>actions d&apos;activation</span>
            </article>
          </div>
        </aside>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Onboarding</span>
          <h2>Un parcours simple en 4 étapes</h2>
          <p>
            Voici la structure cible du tunnel concierge : activation métier d&apos;abord, gestion
            avancée ensuite.
          </p>
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
          <h2>Commencez par les actions qui convertissent</h2>
          <p>
            L&apos;ordre utile n&apos;est pas de tout ouvrir. Il faut d&apos;abord rendre votre profil
            crédible, puis activer les demandes et la prospection.
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
            <span className={styles.sectionKicker}>Conversion</span>
            <h2>Le bon enchaînement concierge</h2>
            <p>
              Lead propriétaire reçu, message ouvert, devis préparé, mission planifiée : votre
              produit a déjà une grande partie de ces briques. Cette page relie maintenant ce
              tunnel de façon plus lisible.
            </p>
          </div>

          <div className={styles.highlightFlow}>
            <span>Lead</span>
            <ArrowRight size={16} />
            <span>Message</span>
            <ArrowRight size={16} />
            <span>Devis</span>
            <ArrowRight size={16} />
            <span>Mission</span>
          </div>
        </div>
      </section>

      <section className={styles.bottomCta}>
        <div>
          <span className={styles.sectionKicker}>Suite</span>
          <h2>Créer, activer, convertir</h2>
          <p>
            Commencez par votre profil concierge puis ouvrez votre prospection. C&apos;est le point
            de départ le plus rentable pour le produit actuel.
          </p>
        </div>

        <div className={styles.bottomActions}>
          <Link href="/dashboard/concierge/profile?tab=fiche" className={styles.primaryCta}>
            Commencer l&apos;activation
          </Link>
          <Link href="/abonnement/concierge-pro" className={styles.secondaryCta}>
            Voir Concierge PRO
          </Link>
        </div>

        <div className={styles.trustRow}>
          <span>
            <ShieldCheck size={15} />
            Profil et offre plus lisibles
          </span>
          <span>
            <Target size={15} />
            Prospection propriétaire déjà existante
          </span>
          <span>
            <MessageSquare size={15} />
            Messages et demandes déjà branchés
          </span>
        </div>
      </section>
    </main>
  );
}
