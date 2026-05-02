"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard";
import styles from "./ConciergeWelcomeNextStep.module.scss";

type SignupMode = "simple" | "express" | "business";

type OnboardingPayload = {
  onboarding?: {
    signupMode?: string | null;
    onboardingGoal?: string | null;
    supportNeed?: string | null;
    existingTools?: string[] | null;
    propertyTypes?: string[] | null;
  };
  preferences?: {
    signupMode?: string | null;
  };
};

type WelcomeAction = {
  title: string;
  detail: string;
  href: string;
};

type WelcomeContent = {
  badge: string;
  title: string;
  description: string;
  actions: WelcomeAction[];
};

const STORAGE_KEY = "planetls-concierge-welcome-dismissed";

const parseSignupMode = (availabilityHours?: string | null): SignupMode => {
  if (!availabilityHours) return "simple";

  try {
    const payload = JSON.parse(availabilityHours) as OnboardingPayload;
    const rawMode = payload.onboarding?.signupMode ?? payload.preferences?.signupMode;
    if (rawMode === "express" || rawMode === "business") return rawMode;
  } catch {
    return "simple";
  }

  return "simple";
};

const getWelcomeContent = (mode: SignupMode): WelcomeContent => {
  if (mode === "express") {
    return {
      badge: "Parcours express",
      title: "Votre profil expert est prêt, passons aux premières actions.",
      description:
        "Vous avez choisi une entrée rapide. Le plus utile maintenant est de créer une base concrète: un bien, une offre, puis un premier propriétaire à inviter.",
      actions: [
        {
          title: "Créer mon premier bien",
          detail: "Ajoutez un logement ou une zone de mission exploitable tout de suite.",
          href: "/dashboard/concierge/logements/create",
        },
        {
          title: "Créer une offre",
          detail: "Transformez vos services en pack clair pour vos futurs propriétaires.",
          href: "/dashboard/concierge/services-packages",
        },
        {
          title: "Inviter un propriétaire",
          detail: "Lancez votre premier contact depuis l'espace contacts.",
          href: "/dashboard/concierge/contacts",
        },
      ],
    };
  }

  if (mode === "business") {
    return {
      badge: "Parcours business+",
      title: "Préparons votre cockpit de gestion.",
      description:
        "Votre inscription contient déjà des signaux pro. Le dashboard peut maintenant vous aider à structurer vos packs, vos tarifs et vos documents commerciaux.",
      actions: [
        {
          title: "Configurer mes packs",
          detail: "Posez vos offres récurrentes et vos prestations principales.",
          href: "/dashboard/concierge/services-packages",
        },
        {
          title: "Mettre mes tarifs",
          detail: "Cadrez vos prix pour accélérer les devis et la conversion.",
          href: "/dashboard/concierge/pricing",
        },
        {
          title: "Préparer devis et contrats",
          detail: "Passez aux documents commerciaux quand votre offre est prête.",
          href: "/dashboard/concierge/billing",
        },
      ],
    };
  }

  return {
    badge: "Parcours simple",
    title: "Bienvenue, on va configurer votre présence locale pas à pas.",
    description:
      "Votre espace démarre avec l'essentiel. Complétez d'abord votre fiche, votre zone et vos services pour recevoir des opportunités plus pertinentes.",
    actions: [
      {
        title: "Compléter ma fiche",
        detail: "Ajoutez vos points forts, votre présentation et les informations visibles.",
        href: "/dashboard/concierge/profile?tab=fiche",
      },
      {
        title: "Définir ma zone",
        detail: "Vérifiez votre rayon et votre secteur d'intervention.",
        href: "/dashboard/concierge/profile?tab=missions",
      },
      {
        title: "Vérifier mes services",
        detail: "Gardez seulement les prestations que vous pouvez assurer sereinement.",
        href: "/dashboard/concierge/profile?tab=missions",
      },
    ],
  };
};

interface ConciergeWelcomeNextStepProps {
  availabilityHours?: string | null;
}

export default function ConciergeWelcomeNextStep({ availabilityHours }: ConciergeWelcomeNextStepProps) {
  const mode = useMemo(() => parseSignupMode(availabilityHours), [availabilityHours]);
  const content = useMemo(() => getWelcomeContent(mode), [mode]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(window.localStorage.getItem(STORAGE_KEY) === mode);
  }, [mode]);

  if (isDismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, mode);
    setIsDismissed(true);
  };

  return (
    <DashboardPanel
      title="Prochaine étape"
      className={styles.welcomePanel}
      bodyClassName={styles.welcomeBody}
      action={
        <button type="button" className={styles.dismissButton} onClick={dismiss}>
          Masquer
        </button>
      }
    >
      <div className={styles.headline}>
        <span className={styles.modeBadge}>{content.badge}</span>
        <h3>{content.title}</h3>
        <p>{content.description}</p>
      </div>
      <div className={styles.actionGrid}>
        {content.actions.map((action) => (
          <Link key={action.href + action.title} href={action.href} className={styles.actionCard}>
            <strong>{action.title}</strong>
            <span>{action.detail}</span>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  );
}
