"use client";

import Link from "next/link";
import { CheckCircle2, FileText, PackageCheck, SlidersHorizontal, X } from "lucide-react";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import { formatOnboardingChoice, parseOnboardingDetails } from "@/features/onboarding-assistant";
import styles from "./NextStepsPopup.module.scss";

export type NextStepAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  done?: boolean;
};

type NextStepsPopupProps = {
  open: boolean;
  availabilityHours?: string | null;
  profileComplete?: boolean;
  pricingReady?: boolean;
  servicesReady?: boolean;
  onClose: () => void;
};

const buildSteps = ({
  availabilityHours,
  profileComplete,
  pricingReady,
  servicesReady,
}: Pick<NextStepsPopupProps, "availabilityHours" | "profileComplete" | "pricingReady" | "servicesReady">) => {
  const onboarding = parseOnboardingDetails(availabilityHours);
  const goal = formatOnboardingChoice(onboarding.onboardingGoal);

  const steps: NextStepAction[] = [
    {
      id: "profile",
      title: "Configurer profil",
      detail: profileComplete ? "Fiche visible et exploitable." : goal || "Ajoutez présentation, zone et disponibilités.",
      href: "/dashboard/concierge/profile?tab=fiche",
      done: profileComplete,
    },
    {
      id: "services",
      title: "Vérifier services",
      detail: servicesReady ? "Services prêts pour les demandes." : "Gardez uniquement les prestations assurables.",
      href: "/dashboard/concierge/profile?tab=missions",
      done: servicesReady,
    },
    {
      id: "pricing",
      title: "Ajouter tarifs",
      detail: pricingReady ? "Tarifs prêts pour les devis." : "Cadrez vos prix pour répondre plus vite.",
      href: "/dashboard/concierge/pricing",
      done: pricingReady,
    },
  ];

  return steps.sort((a, b) => Number(a.done) - Number(b.done)).slice(0, 3);
};

export default function NextStepsPopup({
  open,
  availabilityHours,
  profileComplete = false,
  pricingReady = false,
  servicesReady = false,
  onClose,
}: NextStepsPopupProps) {
  if (!open) return null;

  const steps = buildSteps({ availabilityHours, profileComplete, pricingReady, servicesReady });
  const icons = [FileText, PackageCheck, SlidersHorizontal];

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="next-steps-title">
      <Card className={styles.modal} tone="elevated">
        <CardHeader className={styles.header}>
          <div>
            <span className={styles.eyebrow}>3 actions max</span>
            <h2 id="next-steps-title">Prochaines étapes</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
            <X size={22} aria-hidden="true" />
          </button>
        </CardHeader>
        <CardBody className={styles.body}>
          <div className={styles.steps}>
            {steps.map((step, index) => {
              const Icon = step.done ? CheckCircle2 : icons[index] ?? FileText;
              return (
                <Link key={step.id} href={step.href} className={styles.step} onClick={onClose}>
                  <span className={step.done ? styles.doneIcon : styles.stepIcon}>
                    <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{step.title}</strong>
                    <small>{step.detail}</small>
                  </span>
                </Link>
              );
            })}
          </div>
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Fermer
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
