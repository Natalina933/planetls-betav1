import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import styles from "./page.module.scss";

const onboardingSteps = [
  {
    title: "Présentez votre activité",
    description: "Renseignez votre profil, votre zone d'intervention et vos spécialités métier.",
  },
  {
    title: "Activez vos services",
    description: "Indiquez les interventions que vous prenez en charge et vos disponibilités.",
  },
  {
    title: "Ouvrez vos clients",
    description: "Suivez les propriétaires et concierges avec qui vous travaillez déjà ou que vous relancez.",
  },
  {
    title: "Pilotez interventions et devis",
    description: "Gardez alertes, chantiers, devis et conversations dans le même espace.",
  },
];

const proofPoints = [
  "Interventions, alertes et clients visibles dans un seul tableau de bord",
  "Accès rapide aux conversations, devis et suivis terrain",
  "Parcours clair pour exécuter vite sans perdre la relation client",
];

const actionSteps = [
  {
    icon: Sparkles,
    title: "1. Compléter votre profil",
    description: "Votre zone, vos services et vos coordonnées doivent être clairs avant toute activation.",
    href: "/dashboard/provider/settings",
    cta: "Ouvrir mes paramètres",
  },
  {
    icon: Wrench,
    title: "2. Suivre les interventions",
    description: "Gardez visibles les missions ouvertes, en attente ou proches de l'exécution.",
    href: "/dashboard/provider/interventions",
    cta: "Voir les interventions",
  },
  {
    icon: AlertTriangle,
    title: "3. Traiter les alertes",
    description: "Commencez par les points urgents qui bloquent le terrain ou la satisfaction client.",
    href: "/dashboard/provider/alertes",
    cta: "Traiter les alertes",
  },
  {
    icon: Users,
    title: "4. Entretenir la relation client",
    description: "Relancez les clients utiles, répondez vite et suivez vos devis sans friction.",
    href: "/dashboard/provider/clients",
    cta: "Voir les clients",
  },
];

export const metadata: Metadata = {
  title: "Artisan | Pilotez interventions, clients et alertes",
  description:
    "Découvrez le parcours artisan PlanetLS : profil, interventions, alertes, clients, devis et conversations dans un espace clair.",
};

export default function ProviderLandingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Parcours Artisan</span>
          <h1>Gérez vos interventions, vos clients et vos alertes dans un seul espace.</h1>
          <p className={styles.lead}>
            PlanetLS aide les artisans et commerçants partenaires à exécuter vite, garder une vue
            nette sur les urgences, et structurer leur relation client sans interface trop lourde.
          </p>

          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryCta}>
              Créer mon compte partenaire
            </Link>
            <Link href="/dashboard/provider" className={styles.secondaryCta}>
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
          <h2>Passer d'activité locale à exécution pilotée</h2>
          <p className={styles.panelLead}>
            Le bon parcours artisan ne consiste pas seulement à recevoir une demande. Il faut aussi
            traiter les alertes, suivre les clients et garder un flux d&apos;intervention propre.
          </p>
          <div className={styles.panelMetrics}>
            <article>
              <strong>1</strong>
              <span>profil crédible</span>
            </article>
            <article>
              <strong>1</strong>
              <span>terrain sous contrôle</span>
            </article>
            <article>
              <strong>3+</strong>
              <span>leviers de réactivité</span>
            </article>
          </div>
        </aside>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Onboarding</span>
          <h2>Un parcours partenaire en 4 étapes</h2>
          <p>Commencez par votre profil, puis l'exécution terrain, puis la relation client.</p>
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
          <h2>Commencez par ce qui fait avancer le terrain</h2>
          <p>
            Votre premier enjeu n&apos;est pas d&apos;ouvrir tous les écrans, mais d&apos;avoir les
            bonnes interventions, les bonnes alertes et les bons clients sous la main.
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
            <span className={styles.sectionKicker}>Exécution</span>
            <h2>Le bon enchaînement partenaire</h2>
            <p>
              Alerte reçue, intervention ouverte, conversation active, devis suivi : PlanetLS relie
              déjà ces briques pour rendre votre activité plus simple à piloter au quotidien.
            </p>
          </div>

          <div className={styles.highlightFlow}>
            <span>Alerte</span>
            <ArrowRight size={16} />
            <span>Intervention</span>
            <ArrowRight size={16} />
            <span>Client</span>
            <ArrowRight size={16} />
            <span>Devis</span>
          </div>
        </div>
      </section>

      <section className={styles.bottomCta}>
        <div>
          <span className={styles.sectionKicker}>Suite</span>
          <h2>Structurer, intervenir, relancer</h2>
          <p>
            Commencez par vos paramètres puis vos interventions. C&apos;est le point d&apos;entrée le
            plus utile pour un parcours partenaire clair.
          </p>
        </div>

        <div className={styles.bottomActions}>
          <Link href="/dashboard/provider/settings" className={styles.primaryCta}>
            Compléter mon profil
          </Link>
          <Link href="/dashboard/provider/interventions" className={styles.secondaryCta}>
            Voir les interventions
          </Link>
        </div>

        <div className={styles.trustRow}>
          <span>
            <ShieldCheck size={15} />
            Priorités terrain plus lisibles
          </span>
          <span>
            <MessageSquare size={15} />
            Conversations et clients déjà reliés
          </span>
          <span>
            <FileText size={15} />
            Devis et suivi déjà centralisés
          </span>
        </div>
      </section>
    </main>
  );
}
