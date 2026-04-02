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
    title: "Definissez votre zone",
    description: "Indiquez les villes couvertes, votre rayon d'action et vos disponibilites.",
  },
  {
    title: "Activez vos services",
    description:
      "Choisissez les missions que vous acceptez : check-in, menage, maintenance, urgence.",
  },
  {
    title: "Presentez votre offre",
    description:
      "Ajoutez vos tarifs, vos services et vos elements de reassurance pour etre plus lisible.",
  },
  {
    title: "Recevez vos premieres opportunites",
    description:
      "PlanetLS vous aide a trouver des proprietaires compatibles et a lancer la relation.",
  },
];

const proofPoints = [
  "Prospection proprietaires directement dans le dashboard",
  "Demandes recues, messages, devis et factures relies au meme parcours",
  "Profil, zone et services centralises pour mieux vous presenter",
];

const actionSteps = [
  {
    icon: MapPin,
    title: "1. Completer votre profil",
    description: "Zone, services, disponibilites et informations doivent etre clairs des le depart.",
    href: "/dashboard/concierge/profile?tab=fiche",
    cta: "Completer ma fiche",
  },
  {
    icon: Sparkles,
    title: "2. Configurer vos missions",
    description:
      "Activez les services que vous souhaitez proposer et vos regles de disponibilite.",
    href: "/dashboard/concierge/profile?tab=missions",
    cta: "Configurer mes missions",
  },
  {
    icon: Target,
    title: "3. Trouver des proprietaires",
    description: "Lancez votre prospection et ouvrez les opportunites les plus compatibles.",
    href: "/dashboard/concierge/recherche",
    cta: "Ouvrir la prospection",
  },
  {
    icon: MessageSquare,
    title: "4. Repondre et organiser",
    description:
      "Repondez vite, ouvrez le message, preparez un devis et transformez la demande en mission.",
    href: "/dashboard/concierge/demandes",
    cta: "Voir mes demandes",
  },
];

export const metadata: Metadata = {
  title: "Concierge | Demarrez ou developpez votre activite",
  description:
    "Creez votre profil, trouvez des proprietaires, recevez des missions et organisez votre activite avec PlanetLS.",
};

export default function ConciergeLandingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Parcours concierge</span>
          <h1>Trouvez des proprietaires et organisez votre activite au meme endroit.</h1>
          <p className={styles.lead}>
            PlanetLS reunit prospection, activation, demandes, messages, devis et pilotage dans un
            seul espace, que vous soyez une conciergerie deja lancee ou une personne qui souhaite
            creer un complement de revenu.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryCta}>
              Creer mon compte concierge
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
          <h2>Passer de profil cree a activite active</h2>
          <p className={styles.panelLead}>
            Le bon parcours concierge n&apos;est pas reserve aux structures deja etabli es. C&apos;est
            aussi un moyen simple de vous lancer, de rendre votre offre lisible et de trouver vos
            premieres missions.
          </p>
          <div className={styles.panelMetrics}>
            <article>
              <strong>1</strong>
              <span>profil bien cadre</span>
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
          <h2>Un parcours simple en 4 etapes</h2>
          <p>
            Voici la structure cible du tunnel concierge : commencer simplement, puis structurer
            votre activite au fur et a mesure.
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
          <h2>Commencez par les actions les plus utiles</h2>
          <p>
            L&apos;objectif n&apos;est pas de tout ouvrir d&apos;un coup. Il faut d&apos;abord rendre votre profil
            credible, puis activer les demandes et la prospection.
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
            <h2>Le bon enchainement concierge</h2>
            <p>
              Profil visible, premier contact, devis prepare, mission planifiee : le produit a deja
              une grande partie de ces briques. Cette page les relie maintenant de facon plus
              lisible pour une petite activite comme pour une structure plus developpee.
            </p>
          </div>

          <div className={styles.highlightFlow}>
            <span>Profil</span>
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
          <h2>Creer, activer, organiser</h2>
          <p>
            Commencez par votre profil concierge puis ouvrez votre prospection. C&apos;est le point de
            depart le plus simple pour lancer ou faire grandir votre activite.
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
            Prospection proprietaire deja existante
          </span>
          <span>
            <MessageSquare size={15} />
            Messages et demandes deja branches
          </span>
        </div>
      </section>
    </main>
  );
}
