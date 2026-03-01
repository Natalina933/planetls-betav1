"use client";

import { useEffect, useMemo, useState } from "react";
import ProviderWorkspacePage from "./_components/ProviderWorkspacePage";
import {
  buildProviderDisplayName,
  fetchCurrentProviderProfile,
  type ProviderCurrentProfile,
  type ProviderWorkspacePayload,
} from "./_components/providerProfile";

export default function ProviderDashboardPage() {
  const [workspace, setWorkspace] = useState<ProviderWorkspacePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const nextWorkspace = await fetchCurrentProviderProfile();
        if (!cancelled) {
          setWorkspace(nextWorkspace);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le profil artisan.");
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const profile: ProviderCurrentProfile | null = workspace?.profile ?? null;
  const displayName = useMemo(() => buildProviderDisplayName(profile), [profile]);
  const locationLabel = useMemo(() => {
    return workspace?.summary.location || "Localisation a completer";
  }, [workspace]);

  return (
    <ProviderWorkspacePage
      eyebrow="Vue d'ensemble"
      title="Artisan"
      description={
        error ||
        `Pilotez l'activite de ${displayName}, vos interventions, vos devis et vos priorites quotidiennes depuis un espace unifie.`
      }
      chips={[
        profile?.company_name || "Activite artisanale",
        locationLabel,
        workspace?.summary.is_pro ? "Artisan PRO" : "Artisan standard",
      ]}
      actions={[
        { label: "Voir les interventions", href: "/dashboard/provider/interventions" },
        { label: "Voir les devis et factures", href: "/dashboard/provider/devis" },
        { label: "Voir les clients", href: "/dashboard/provider/clients" },
      ]}
      cards={[
        {
          title: "Profil actif",
          text: profile
            ? `${displayName}${profile.email ? ` - ${profile.email}` : ""}${profile.phone ? ` - ${profile.phone}` : ""}`
            : "Chargement du profil artisan en cours.",
          actions: [
            {
              label: "Ouvrir les parametres",
              href: "/dashboard/provider/settings",
              variant: "primary",
            },
          ],
        },
        {
          title: "Interventions a suivre",
          text: "Retrouvez vos chantiers en attente, en cours et termines pour garder une execution claire.",
          actions: [
            {
              label: "Ouvrir les interventions",
              href: "/dashboard/provider/interventions",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Pilotage commercial",
          text: "Gardez une vue rapide sur vos devis emis, vos validations et les paiements a suivre.",
          actions: [
            {
              label: "Voir les devis et factures",
              href: "/dashboard/provider/devis",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Organisation quotidienne",
          text: "Utilisez le planning, les messages et les alertes pour garder le bon rythme d'execution.",
          actions: [
            {
              label: "Voir le planning",
              href: "/dashboard/provider/planning",
              variant: "secondary",
            },
          ],
        },
      ]}
    />
  );
}
