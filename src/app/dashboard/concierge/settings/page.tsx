"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

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

export default function ConciergeSettingsPage() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [billing, setBilling] = useState<BillingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const [profileResponse, billingResponse] = await Promise.all([
          fetch("/api/profiles/current", { cache: "no-store" }),
          fetch("/api/billing/history", { cache: "no-store" }),
        ]);

        const profilePayload = await profileResponse.json();
        const billingPayload = await billingResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profilePayload?.error || "Impossible de charger vos parametres.");
        }
        if (!billingResponse.ok) {
          throw new Error(billingPayload?.error || "Impossible de charger l'historique abonnement.");
        }

        setProfile(profilePayload);
        setBilling(billingPayload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos parametres.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const subscription = billing?.subscription ?? null;
  const recentEvents = billing?.events ?? [];
  const settingsChecklist = useMemo(
    () => [
      {
        title: "Fiche concierge publique",
        meta: profile?.service_area || profile?.city || "Zone non renseignee",
        description:
          "Verifiez votre zone d'intervention, vos services et vos tarifs afin de rester visible et coherent dans la recherche proprietaire.",
        href: "/dashboard/concierge/profile?tab=fiche",
        actionLabel: "Mettre a jour la fiche",
      },
      {
        title: "Abonnement et facturation",
        meta: subscription?.isPro ? "PRO actif" : "Standard",
        description:
          subscription?.isPro
            ? `Derniere synchronisation ${formatDate(subscription.updatedAt)}.`
            : "Passez a PRO pour renforcer votre visibilite et afficher votre badge premium.",
        href: "/abonnement/concierge-pro",
        actionLabel: "Gerer l'abonnement",
        tone: subscription?.isPro ? ("success" as const) : ("warning" as const),
      },
      {
        title: "Documents et conformite",
        meta: profile?.email || "Email non renseigne",
        description:
          "Gardez vos documents, vos informations d'assurance et vos supports commerciaux a jour dans votre profil.",
        href: "/dashboard/concierge/profile?tab=documents",
        actionLabel: "Verifier mes documents",
      },
    ],
    [profile?.city, profile?.email, profile?.service_area, subscription?.isPro, subscription?.updatedAt],
  );
  const recentBillingEvents = useMemo(
    () =>
      recentEvents.slice(0, 5).map((event) => ({
        title: event.stripe_event_type || "Evenement Stripe",
        meta: formatDate(event.created_at),
        description: `Source: ${event.source || "indisponible"}. Suivez l'etat de votre abonnement et de vos synchronisations.`,
        href: "/dashboard/concierge/billing",
        actionLabel: "Voir l'historique",
      })),
    [recentEvents],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Compte"
      title="Parametres concierge"
      description={
        loading
          ? "Chargement de votre configuration..."
          : error ||
            "Retrouvez les reperes de votre compte, vos acces sensibles et les raccourcis pour maintenir votre fiche concierge a jour."
      }
      chips={[
        profile?.role === "concierge_pro" ? "Compte PRO" : "Compte Standard",
        profile?.service_area || profile?.city || "Zone non renseignee",
      ]}
      actions={[
        { label: "Modifier ma fiche", href: "/dashboard/concierge/profile?tab=fiche" },
        { label: "Voir mon abonnement", href: "/abonnement/concierge-pro" },
      ]}
      metrics={[
        {
          label: "Tarif horaire",
          value:
            typeof profile?.hourly_rate === "number" ? `${profile.hourly_rate.toFixed(0)} EUR` : "-",
        },
        {
          label: "Forfait mensuel",
          value:
            typeof profile?.monthly_rate === "number" ? `${profile.monthly_rate.toFixed(0)} EUR` : "-",
        },
        {
          label: "Events Stripe",
          value: loading ? "..." : String(recentEvents.length),
          hint: "Historique recent disponible",
        },
      ]}
      cards={[
        {
          title: "Identite de compte",
          text: `${profile?.first_name || profile?.company_name || "Compte concierge"} - ${profile?.email || "email non disponible"}`,
          actions: [
            {
              label: "Mettre a jour mon profil",
              href: "/dashboard/concierge/profile?tab=fiche",
              variant: "primary",
            },
          ],
        },
        {
          title: "Abonnement et facturation",
          text:
            profile?.role === "concierge_pro"
              ? "Votre compte PRO est actif. Verifiez vos references Stripe et votre historique de paiement."
              : "Passez a PRO pour booster votre visibilite et debloquer les outils premium.",
          actions: [
            {
              label: "Historique Stripe",
              href: "/dashboard/concierge/billing",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Configuration operationnelle",
          text:
            "Vos zones, vos missions et vos documents restent accessibles depuis la fiche concierge. Utilisez cet espace comme point de controle global.",
          actions: [
            {
              label: "Ouvrir documents et avis",
              href: "/dashboard/concierge/profile?tab=documents",
              variant: "secondary",
            },
          ],
        },
      ]}
      detailSections={[
        {
          title: "Checklist de configuration",
          description:
            "Les principaux points de controle de votre compte concierge, pour garder votre profil, vos acces et votre offre alignes.",
          emptyText: "Aucune configuration a afficher.",
          items: settingsChecklist,
        },
        {
          title: "Historique abonnement recent",
          description:
            "Derniers evenements connus lies a Stripe pour verifier rapidement l'etat de synchronisation de votre compte.",
          emptyText:
            loading
              ? "Chargement de l'historique Stripe."
              : error || "Aucun evenement Stripe recent disponible.",
          items: recentBillingEvents,
        },
      ]}
    />
  );
}
