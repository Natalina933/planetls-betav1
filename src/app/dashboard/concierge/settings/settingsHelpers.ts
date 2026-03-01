type CurrentProfile = {
  first_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  city?: string | null;
  service_area?: string | null;
  hourly_rate?: number | null;
  monthly_rate?: number | null;
  email?: string | null;
};

type BillingHistoryResponse = {
  subscription?: {
    isPro?: boolean;
    stripeCustomerId?: string | null;
    syncedVia?: string | null;
    updatedAt?: string | null;
  } | null;
  events?: Array<{
    id: string;
    stripe_event_type: string | null;
    source: string | null;
    created_at: string | null;
  }>;
};

type WorkspaceTone = "success" | "warning" | "default";

export type ConciergeSettingsCard = {
  title: string;
  meta: string;
  description: string;
  href: string;
  actionLabel: string;
  tone?: WorkspaceTone;
};

function formatDate(value?: string | null) {
  if (!value) return "Date indisponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function buildSettingsChecklist(
  profile: CurrentProfile | null,
  subscription: BillingHistoryResponse["subscription"] | null,
): ConciergeSettingsCard[] {
  return [
    {
      title: "Fiche concierge publique",
      meta: profile?.service_area || profile?.city || "Zone non renseignée",
      description:
        "Vérifiez votre zone d'intervention, vos services et vos tarifs afin de rester visible et cohérent dans la recherche propriétaire.",
      href: "/dashboard/concierge/profile?tab=fiche",
      actionLabel: "Mettre à jour la fiche",
    },
    {
      title: "Abonnement et facturation",
      meta: subscription?.isPro ? "PRO actif" : "Standard",
      description: subscription?.isPro
        ? `Dernière synchronisation ${formatDate(subscription.updatedAt)}.`
        : "Passez à PRO pour renforcer votre visibilité et afficher votre badge premium.",
      href: "/abonnement/concierge-pro",
      actionLabel: "Gérer l'abonnement",
      tone: subscription?.isPro ? "success" : "warning",
    },
    {
      title: "Documents et conformité",
      meta: profile?.email || "Email non renseigné",
      description:
        "Gardez vos documents, vos informations d'assurance et vos supports commerciaux à jour dans votre profil.",
      href: "/dashboard/concierge/profile?tab=documents",
      actionLabel: "Vérifier mes documents",
    },
    {
      title: "Centre tarifaire",
      meta:
        typeof profile?.hourly_rate === "number" || typeof profile?.monthly_rate === "number"
          ? "Base tarifaire renseignée"
          : "Tarification à compléter",
      description:
        "Un socle tarifaire propre améliore la lisibilité de votre offre et accélère les prises de décision.",
      href: "/dashboard/concierge/profile?tab=tarifs",
      actionLabel: "Revoir mes tarifs",
      tone:
        typeof profile?.hourly_rate === "number" || typeof profile?.monthly_rate === "number"
          ? "success"
          : "warning",
    },
  ];
}

export function buildRecentBillingEvents(
  recentEvents: BillingHistoryResponse["events"] | undefined,
): ConciergeSettingsCard[] {
  return (recentEvents ?? []).slice(0, 6).map((event) => ({
    title: event.stripe_event_type || "Événement Stripe",
    meta: formatDate(event.created_at),
    description: `Source : ${event.source || "indisponible"}. Suivez l'état de votre abonnement et de vos synchronisations.`,
    href: "/dashboard/concierge/billing",
    actionLabel: "Voir l'historique",
  }));
}

