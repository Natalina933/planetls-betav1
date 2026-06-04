import type { Metadata } from "next";
import Image from "next/image";
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
    description:
      "Choisissez les missions que vous acceptez : check-in, ménage, maintenance, urgence.",
  },
  {
    title: "Présentez votre offre",
    description:
      "Ajoutez vos tarifs, vos services et vos éléments de réassurance pour être plus lisible.",
  },
  {
    title: "Recevez vos premières opportunités",
    description:
      "PlanetLS vous aide à trouver des propriétaires compatibles et à lancer la relation.",
  },
];

const proofPoints = [
  "Prospection propriétaires directement dans le dashboard",
  "Demandes reçues, messages, devis et factures reliés au même parcours",
  "Profil, zone et services centralisés pour mieux vous présenter",
];

const actionSteps = [
  {
    icon: MapPin,
    title: "1. Compléter votre profil",
    description: "Zone, services, disponibilités et informations doivent être clairs dès le départ.",
    href: "/dashboard/concierge/profile?tab=fiche",
    cta: "Compléter ma fiche",
  },
  {
    icon: Sparkles,
    title: "2. Configurer vos missions",
    description:
      "Activez les services que vous souhaitez proposer et vos règles de disponibilité.",
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
    title: "4. Répondre et organiser",
    description:
      "Répondez vite, ouvrez le message, préparez un devis et transformez la demande en mission.",
    href: "/dashboard/concierge/demandes",
    cta: "Voir mes demandes",
  },
];

const showcaseAvatars = [
  { src: "/avatars/marie.png", alt: "Profil concierge Marie" },
  { src: "/avatars/sophie.png", alt: "Profil concierge Sophie" },
  { src: "/avatars/leo.png", alt: "Profil concierge Leo" },
];

export const metadata: Metadata = {
  title: "Concierge | Démarrez ou développez votre activité",
  description:
    "Créez votre profil, trouvez des propriétaires, recevez des missions et organisez votre activité avec PlanetLS.",
};

export default function ConciergeLandingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Parcours concierge</span>
          <h1>Trouvez des propriétaires et organisez votre activité au même endroit.</h1>
          <p className={styles.lead}>
            PlanetLS réunit prospection, activation, demandes, messages, devis et pilotage dans un
            seul espace, que vous soyez une conciergerie déjà lancée ou une personne qui souhaite
            créer un complément de revenu.
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
          <div className={styles.heroShowcase}>
            <div className={styles.showcaseFrame}>
              <Image
                src="/images/generated/parcours/planetls-parcours-concierge.png"
                alt="Aperçu visuel du parcours concierge PlanetLS"
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className={styles.showcaseImage}
              />
            </div>
            <div className={styles.showcaseMeta}>
              <span>Prospection</span>
              <span>Demandes</span>
              <span>Missions</span>
            </div>
          </div>
          <p className={styles.panelEyebrow}>Objectif</p>
          <h2>Passer de profil créé à activité active</h2>
          <p className={styles.panelLead}>
            Le bon parcours concierge n&apos;est pas réservé aux structures déjà établies. C&apos;est
            aussi un moyen simple de vous lancer, de rendre votre offre lisible et de trouver vos
            premières missions.
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
          <div className={styles.showcaseAvatarRow} aria-label="Profils mis en avant">
            {showcaseAvatars.map((avatar) => (
              <div key={avatar.src} className={styles.showcaseAvatar}>
                <Image src={avatar.src} alt={avatar.alt} fill sizes="48px" className={styles.showcaseImage} />
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Onboarding</span>
          <h2>Un parcours simple en 4 étapes</h2>
          <p>
            Voici la structure cible du tunnel concierge : commencer simplement, puis structurer
            votre activité au fur et à mesure.
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
              Profil visible, premier contact, devis préparé, mission planifiée : le produit a déjà
              une grande partie de ces briques. Cette page les relie maintenant de façon plus
              lisible pour une petite activité comme pour une structure plus développée.
            </p>
          </div>

          <div className={styles.highlightVisual}>
            <div className={styles.highlightImageWrap}>
              <Image
                src="/images/generated/parcours/planetls-parcours-concierge.png"
                alt="Vue d'ensemble du parcours concierge"
                fill
                sizes="(max-width: 1024px) 100vw, 360px"
                className={styles.showcaseImage}
              />
            </div>
            <p className={styles.highlightCaption}>Une lecture plus visuelle du passage profil vers mission.</p>
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
          <h2>Créer, activer, organiser</h2>
          <p>
            Commencez par votre profil concierge puis ouvrez votre prospection. C&apos;est le point de
            départ le plus simple pour lancer ou faire grandir votre activité.
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
