"use client";

import { BriefcaseBusiness, CalendarClock, CircleDollarSign, Goal, Home, MapPinned, Wrench } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import { formatOnboardingChoice, parseOnboardingDetails } from "../onboardingPayload";
import styles from "./DashboardOnboardingSummary.module.scss";

type DashboardOnboardingSummaryProps = {
  role: "owner" | "concierge" | "provider";
  availabilityHours?: string | null;
  serviceRadiusKm?: number | null;
  serviceArea?: string | null;
};

type SummaryItem = {
  label: string;
  value: string;
  icon: typeof Goal;
};

const joinLimited = (items: string[], empty = "") => {
  if (items.length === 0) return empty;
  if (items.length <= 2) return items.join(", ");
  return `${items.slice(0, 2).join(", ")} +${items.length - 2}`;
};

export default function DashboardOnboardingSummary({
  role,
  availabilityHours,
  serviceRadiusKm,
  serviceArea,
}: DashboardOnboardingSummaryProps) {
  const onboarding = parseOnboardingDetails(availabilityHours);

  const items: SummaryItem[] =
    role === "owner"
      ? [
          {
            label: "Objectif",
            value: formatOnboardingChoice(onboarding.onboardingGoal) || "A préciser",
            icon: Goal,
          },
          {
            label: "Bien",
            value: onboarding.propertyType || joinLimited(onboarding.propertyTypes, "A préciser"),
            icon: Home,
          },
          {
            label: "Besoin",
            value: formatOnboardingChoice(onboarding.needVolume || onboarding.missionPreference) || "A préciser",
            icon: CalendarClock,
          },
        ]
      : role === "provider"
        ? [
            {
              label: "Métier",
              value: onboarding.tradeBody || "A préciser",
              icon: Wrench,
            },
            {
              label: "Urgence",
              value: formatOnboardingChoice(onboarding.missionPreference) || "A préciser",
              icon: CalendarClock,
            },
            {
              label: "Tarif",
              value: formatOnboardingChoice(onboarding.startingPriceRange) || "Sur devis",
              icon: CircleDollarSign,
            },
          ]
        : [
            {
              label: "Parcours",
              value: formatOnboardingChoice(onboarding.signupMode),
              icon: BriefcaseBusiness,
            },
            {
              label: "Zone",
              value: serviceArea
                ? `${serviceArea}${serviceRadiusKm ? ` · ${serviceRadiusKm} km` : ""}`
                : serviceRadiusKm
                  ? `${serviceRadiusKm} km`
                  : "A préciser",
              icon: MapPinned,
            },
            {
              label: "Biens",
              value: joinLimited(onboarding.propertyTypes, "A préciser"),
              icon: Home,
            },
          ];

  const detail =
    role === "provider"
      ? formatOnboardingChoice(onboarding.supportNeed) || joinLimited(onboarding.propertyTypes, "Créneaux à compléter")
      : role === "owner"
        ? onboarding.firstRequestTemplate || "Ajoutez votre première demande pour accélérer la mise en relation."
        : formatOnboardingChoice(onboarding.onboardingGoal) ||
          formatOnboardingChoice(onboarding.supportNeed) ||
          joinLimited(onboarding.existingTools, "Complétez vos outils et disponibilités.");

  return (
    <DashboardPanel title="Profil d'inscription" bodyClassName={styles.body}>
      <div className={styles.grid}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className={styles.item}>
              <span className={styles.icon}>
                <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </article>
          );
        })}
      </div>
      <p className={styles.detail}>{detail}</p>
    </DashboardPanel>
  );
}
