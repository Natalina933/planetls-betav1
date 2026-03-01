"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { buildRecentBillingEvents, buildSettingsChecklist } from "./settingsHelpers";

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
          throw new Error(profilePayload?.error || "Impossible de charger vos paramètres.");
        }
        if (!billingResponse.ok) {
          throw new Error(
            billingPayload?.error || "Impossible de charger l'historique abonnement.",
          );
        }

        setProfile(profilePayload);
        setBilling(billingPayload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos paramètres.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const subscription = billing?.subscription ?? null;
  const recentEvents = billing?.events ?? [];

  const settingsChecklist = useMemo(
    () => buildSettingsChecklist(profile, subscription),
    [profile, subscription],
  );

  const recentBillingEvents = useMemo(
    () => buildRecentBillingEvents(recentEvents),
    [recentEvents],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Compte"
      title="Paramètres concierge"
      description={
        loading
          ? "Chargement de votre configuration..."
          : error ||
            "Retrouvez les repères de votre compte, votre niveau d'abonnement et les raccourcis pour maintenir votre offre à jour."
      }
      chips={[
        profile?.role === "concierge_pro" ? "Compte PRO" : "Compte Standard",
        profile?.service_area || profile?.city || "Zone non renseignée",
      ]}
      actions={[
        { label: "Modifier ma fiche", href: "/dashboard/concierge/profile?tab=fiche" },
        { label: "Voir mon abonnement", href: "/abonnement/concierge-pro" },
      ]}
      metrics={[
        {
          label: "Tarif horaire",
          value:
            typeof profile?.hourly_rate === "number"
              ? `${profile.hourly_rate.toFixed(0)} EUR`
              : "-",
        },
        {
          label: "Forfait mensuel",
          value:
            typeof profile?.monthly_rate === "number"
              ? `${profile.monthly_rate.toFixed(0)} EUR`
              : "-",
        },
        {
          label: "Événements Stripe",
          value: loading ? "..." : String(recentEvents.length),
          hint: "Historique récent disponible",
        },
        {
          label: "Sync abonnement",
          value: loading ? "..." : subscription?.syncedVia || "-",
          hint: "Source de synchronisation",
        },
      ]}
      cards={[
        {
          title: "Identité de compte",
          text: `${profile?.first_name || profile?.company_name || "Compte concierge"} - ${profile?.email || "email non disponible"}`,
          actions: [
            {
              label: "Mettre à jour mon profil",
              href: "/dashboard/concierge/profile?tab=fiche",
              variant: "primary",
            },
          ],
        },
        {
          title: "Abonnement et facturation",
          text:
            profile?.role === "concierge_pro"
              ? "Votre compte PRO est actif. Vérifiez vos références Stripe et votre historique de paiement."
              : "Passez à PRO pour booster votre visibilité et débloquer les outils premium.",
          actions: [
            {
              label: "Historique Stripe",
              href: "/dashboard/concierge/billing",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Configuration opérationnelle",
          text:
            "Vos zones, vos missions, vos documents et vos tarifs restent accessibles depuis la fiche concierge. Utilisez cet espace comme point de contrôle global.",
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
            "Les principaux points de contrôle de votre compte concierge, pour garder votre profil, vos accès et votre offre alignés.",
          emptyText: "Aucune configuration à afficher.",
          items: settingsChecklist,
        },
        {
          title: "Historique abonnement récent",
          description:
            "Derniers événements connus liés à Stripe pour vérifier rapidement l'état de synchronisation de votre compte.",
          emptyText:
            loading
              ? "Chargement de l'historique Stripe."
              : error || "Aucun événement Stripe récent disponible.",
          items: recentBillingEvents,
        },
      ]}
    />
  );
}
