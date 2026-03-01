type BillingHistoryPayload = {
  subscription: {
    is_pro: boolean;
    source: string | null;
    reference: string | null;
    updated_at: string | null;
  } | null;
  events: Array<{
    id: string;
    profile_id: string | null;
    stripe_object_id: string;
    stripe_event_type: string;
    source: string;
    payload: Record<string, unknown> | null;
    created_at: string | null;
  }>;
};

export function formatBillingDate(value: string | null) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getBillingSourceLabel(source: string | null) {
  if (source === "webhook") return "Webhook Stripe";
  if (source === "return") return "Retour navigateur";
  return "Source non renseignée";
}

export function buildBillingCards(
  data: BillingHistoryPayload | null,
  loading: boolean,
  error: string | null,
) {
  if (!data || data.events.length === 0) {
    return [
      {
        title: "Aucun événement pour le moment",
        text: loading
          ? "Chargement de l'historique en cours."
          : error || "Les paiements et webhooks apparaîtront ici dès qu'un checkout sera traité.",
        actions: [
          {
            label: "Voir l'abonnement PRO",
            href: "/abonnement/concierge-pro",
            variant: "primary" as const,
          },
        ],
      },
    ];
  }

  return data.events.slice(0, 6).map((event) => ({
    title: event.stripe_event_type || "Événement Stripe",
    text: `${event.stripe_object_id || "Objet Stripe"} - ${getBillingSourceLabel(event.source)} - ${formatBillingDate(event.created_at)}`,
  }));
}

