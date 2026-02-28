"use client";

import React, { useEffect, useState } from "react";
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

export default function ConciergeSettingsPage() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos parametres.");
        }

        setProfile(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos parametres.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

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
    />
  );
}
