import Link from "next/link";
import {
  ClipboardCheck,
  FileText,
  Handshake,
  Lock,
  Search,
  Send,
  UsersRound,
} from "lucide-react";
import styles from "./OwnerJourney.module.scss";

type OwnerJourneyStepId = "search" | "selection" | "request" | "quotes" | "partner" | "missions";
type OwnerJourneyState = "done" | "active" | "idle" | "locked";

type OwnerJourneyStep = {
  id: OwnerJourneyStepId;
  label: string;
  description: string;
  href: string;
  icon: typeof Search;
};

type OwnerJourneyRailProps = {
  activeStep?: OwnerJourneyStepId;
  className?: string;
};

type OwnerDecisionSummaryProps = {
  pendingQuotesCount?: number;
  acceptedCount?: number;
  rejectedCount?: number;
  className?: string;
};

const steps: OwnerJourneyStep[] = [
  {
    id: "search",
    label: "Recherche",
    description: "Trouver les conciergeries adaptées.",
    href: "/dashboard/owner/concierges",
    icon: Search,
  },
  {
    id: "selection",
    label: "Sélection",
    description: "Comparer les profils et services.",
    href: "/dashboard/owner/concierges",
    icon: UsersRound,
  },
  {
    id: "request",
    label: "Demande",
    description: "Envoyer le besoin aux professionnels.",
    href: "/dashboard/owner/demandes",
    icon: Send,
  },
  {
    id: "quotes",
    label: "Devis",
    description: "Comparer prix, packs et prestations.",
    href: "/dashboard/owner/devis",
    icon: FileText,
  },
  {
    id: "partner",
    label: "Partenaire",
    description: "Valider la relation et les accès.",
    href: "/dashboard/owner/partenaires",
    icon: Handshake,
  },
  {
    id: "missions",
    label: "Missions",
    description: "Piloter les séjours après acceptation.",
    href: "/dashboard/owner/missions",
    icon: ClipboardCheck,
  },
];

function getStepState(activeStep: OwnerJourneyStepId, stepId: OwnerJourneyStepId): OwnerJourneyState {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const stepIndex = steps.findIndex((step) => step.id === stepId);

  if (stepId === activeStep) return "active";
  if (stepIndex < activeIndex) return "done";
  if (activeStep !== "partner" && activeStep !== "missions" && stepId === "missions") return "locked";
  return "idle";
}

export function OwnerJourneyRail({ activeStep = "quotes", className = "" }: OwnerJourneyRailProps) {
  return (
    <section className={[styles.journey, className].filter(Boolean).join(" ")} aria-label="Parcours propriétaire">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Parcours propriétaire</p>
          <h2>De la recherche au pilotage opérationnel</h2>
        </div>
        <p>
          Les missions deviennent disponibles après acceptation d’un devis, afin de garder un parcours clair et sécurisé.
        </p>
      </div>

      <ol className={styles.steps}>
        {steps.map((step) => {
          const Icon = step.icon;
          const state = getStepState(activeStep, step.id);
          const content = (
            <>
              <span className={styles.icon} aria-hidden="true">
                {state === "locked" ? <Lock size={17} /> : <Icon size={17} />}
              </span>
              <span className={styles.copy}>
                <strong>{step.label}</strong>
                <small>{step.description}</small>
              </span>
            </>
          );

          return (
            <li key={step.id} className={styles[state]}>
              {state === "locked" ? (
                <span className={styles.step}>{content}</span>
              ) : (
                <Link className={styles.step} href={step.href}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function OwnerDecisionSummary({
  pendingQuotesCount = 0,
  acceptedCount = 0,
  rejectedCount = 0,
  className = "",
}: OwnerDecisionSummaryProps) {
  const items = [
    {
      label: "À comparer",
      value: String(pendingQuotesCount),
      text: "Prix, services inclus, packs, validité et disponibilité au même endroit.",
    },
    {
      label: "Partenaires validés",
      value: String(acceptedCount),
      text: "Un devis accepté active la relation et archive les conditions choisies.",
    },
    {
      label: "Refus envoyés",
      value: String(rejectedCount),
      text: "La conciergerie reçoit une réponse professionnelle sans action manuelle.",
    },
  ];

  return (
    <section className={[styles.summary, className].filter(Boolean).join(" ")} aria-label="Synthèse de décision">
      {items.map((item) => (
        <article key={item.label} className={styles.summaryCard}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.text}</p>
        </article>
      ))}
    </section>
  );
}
