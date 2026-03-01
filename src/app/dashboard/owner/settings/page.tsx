"use client";

import React, { useEffect, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

type CurrentProfile = {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  company_name?: string | null;
  role?: string | null;
};

export default function OwnerSettingsPage() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setError(null);
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger votre profil.");
        }

        setProfile(payload?.profile ?? payload ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger votre profil.");
      }
    }

    loadProfile();
  }, []);

  const displayName =
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
    profile?.username ||
    "Compte proprietaire";

  return (
    <OwnerWorkspacePage
      eyebrow="Parametres"
      title="Parametres"
      description={
        error
          ? error
          : "Consultez les informations de votre compte, vos coordonnees et les acces utiles a votre espace proprietaire."
      }
      chips={[
        profile?.role?.endsWith("_pro") ? "Compte PRO" : "Compte standard",
        profile?.city || "Ville non renseignee",
        profile?.email || "Email non renseigne",
      ]}
      metrics={[
        {
          label: "Profil",
          value: displayName,
          hint: profile?.company_name || "Sans societe renseignee",
        },
        { label: "Telephone", value: profile?.phone || "-", hint: "Coordonnee de contact" },
      ]}
      actions={[
        { label: "Tableau de bord", href: "/dashboard/owner" },
        { label: "Documents", href: "/dashboard/owner/documents" },
      ]}
      cards={[
        {
          title: "Compte",
          text: "Retrouvez ici vos informations principales de connexion et de presentation.",
        },
        {
          title: "Notifications",
          text: "Le prochain usage sera de piloter vos preferences d'alertes, de facturation et de mission depuis cet espace.",
        },
      ]}
      detailSections={[
        {
          title: "Informations du profil",
          description: "Synthese des donnees deja disponibles sur votre compte.",
          items: [
            {
              title: displayName,
              meta: profile?.role || "owner",
              description: `${profile?.email || "Email non renseigne"}${profile?.phone ? ` | ${profile.phone}` : ""}`,
            },
            {
              title: profile?.company_name || "Aucune societe renseignee",
              description: profile?.city || "Ville non renseignee",
            },
          ],
        },
      ]}
    />
  );
}
