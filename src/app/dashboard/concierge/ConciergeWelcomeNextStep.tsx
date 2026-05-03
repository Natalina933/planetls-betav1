"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Home, MapPinned, PackageCheck, SlidersHorizontal, UserPlus } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import { parseOnboardingDetails, type SignupMode } from "@/features/onboarding-assistant";
import styles from "./ConciergeWelcomeNextStep.module.scss";

type WelcomeAction = {
  title: string;
  detail: string;
  href: string;
  icon: typeof Home;
};

type WelcomeContent = {
  badge: string;
  title: string;
  description: string;
  actions: WelcomeAction[];
};

const STORAGE_KEY = "planetls-concierge-welcome-dismissed";

const getWelcomeContent = (mode: SignupMode): WelcomeContent => {
  if (mode === "express") {
    return {
      badge: "Parcours express",
      title: "Profil prêt, actions prioritaires.",
      description: "Créez une base exploitable: un bien, une offre, puis un premier propriétaire.",
      actions: [
        {
          title: "Créer un bien",
          detail: "Ajoutez un logement ou une zone utilisable tout de suite.",
          href: "/dashboard/concierge/logements/create",
          icon: Home,
        },
        {
          title: "Créer une offre",
          detail: "Transformez vos services en pack clair.",
          href: "/dashboard/concierge/services-packages",
          icon: PackageCheck,
        },
        {
          title: "Inviter",
          detail: "Lancez votre premier contact.",
          href: "/dashboard/concierge/contacts",
          icon: UserPlus,
        },
      ],
    };
  }

  if (mode === "business") {
    return {
      badge: "Parcours business+",
      title: "Structurez l'activité.",
      description: "Passez directement aux offres, tarifs et documents utiles.",
      actions: [
        {
          title: "Packs",
          detail: "Posez vos offres récurrentes.",
          href: "/dashboard/concierge/services-packages",
          icon: PackageCheck,
        },
        {
          title: "Tarifs",
          detail: "Cadrez vos prix pour accélérer les devis.",
          href: "/dashboard/concierge/pricing",
          icon: SlidersHorizontal,
        },
        {
          title: "Documents",
          detail: "Préparez devis et contrats.",
          href: "/dashboard/concierge/billing",
          icon: FileText,
        },
      ],
    };
  }

  return {
    badge: "Parcours simple",
    title: "Complétez l'essentiel.",
    description: "Fiche, zone et services suffisent pour recevoir des opportunités plus pertinentes.",
    actions: [
      {
        title: "Fiche",
        detail: "Ajoutez vos points forts.",
        href: "/dashboard/concierge/profile?tab=fiche",
        icon: FileText,
      },
      {
        title: "Zone",
        detail: "Vérifiez votre rayon.",
        href: "/dashboard/concierge/profile?tab=missions",
        icon: MapPinned,
      },
      {
        title: "Services",
        detail: "Gardez les prestations assurables.",
        href: "/dashboard/concierge/profile?tab=missions",
        icon: PackageCheck,
      },
    ],
  };
};

interface ConciergeWelcomeNextStepProps {
  availabilityHours?: string | null;
}

export default function ConciergeWelcomeNextStep({ availabilityHours }: ConciergeWelcomeNextStepProps) {
  const mode = useMemo(() => parseOnboardingDetails(availabilityHours).signupMode, [availabilityHours]);
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
        {content.actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href + action.title} href={action.href} className={styles.actionCard}>
              <span className={styles.actionIcon}>
                <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <strong>{action.title}</strong>
              <span>{action.detail}</span>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
