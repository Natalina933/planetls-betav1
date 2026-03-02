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
          throw new Error(profilePayload?.error || "Impossible de charger vos parametres.");
        }
        if (!billingResponse.ok) {
          throw new Error(
            billingPayload?.error || "Impossible de charger l'historique abonnement.",
          );
        }

        setProfile(profilePayload);
        setBilling(billingPayload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos parametres.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
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
      eyebrow="Compte et configuration"
      title="Compte et configuration"
      description={
        loading
          ? "Chargement de votre configuration..."
          : error ||
            "Retrouvez les reperes de votre compte, votre niveau d'abonnement et les raccourcis pour maintenir votre offre a jour."
      }
      chips={[
        profile?.role === "concierge_pro" ? "Compte PRO" : "Compte standard",
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
          label: "Evenements de sync",
          value: loading ? "..." : String(recentEvents.length),
          hint: "Historique recent disponible",
        },
        {
          label: "Source abonnement",
          value: loading ? "..." : subscription?.syncedVia || "-",
          hint: "Source de synchronisation",
        },
      ]}
      cards={[
        {
          title: "1. Identite de compte",
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
          title: "2. Abonnement et revenus",
          text:
            profile?.role === "concierge_pro"
              ? "Votre compte PRO est actif. Verifiez vos references de facturation et votre historique de sync."
              : "Passez a PRO pour booster votre visibilite et debloquer les outils premium.",
          actions: [
            {
              label: "Historique de facturation",
              href: "/dashboard/concierge/billing",
              variant: "secondary",
            },
          ],
        },
        {
          title: "3. Configuration operationnelle",
          text:
            "Vos zones, vos missions, vos documents et vos tarifs restent accessibles depuis la fiche concierge. Utilisez cet espace comme point de controle global.",
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
            "Derniers evenements connus lies a la facturation pour verifier rapidement l'etat de synchronisation de votre compte.",
          emptyText:
            loading
              ? "Chargement de l'historique de facturation."
              : error || "Aucun evenement recent disponible.",
          items: recentBillingEvents,
        },
      ]}
    />
  );
}
