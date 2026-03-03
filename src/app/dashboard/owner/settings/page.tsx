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
    "Compte propriétaire";

  return (
    <OwnerWorkspacePage
      eyebrow="Compte et préférences"
      title="Compte et préférences"
      description={
        error
          ? error
          : "Retrouvez les informations de votre compte, vos coordonnées et les repères utiles pour garder un espace propriétaire clair."
      }
      chips={[
        profile?.role?.endsWith("_pro") ? "Compte PRO" : "Compte standard",
        profile?.city || "Ville non renseignée",
        profile?.email || "Email non renseigné",
      ]}
      metrics={[
        {
          label: "Profil",
          value: displayName,
          hint: profile?.company_name || "Sans société renseignée",
        },
        { label: "Téléphone", value: profile?.phone || "-", hint: "Coordonnée de contact" },
      ]}
      actions={[
        { label: "Revenir à la vue prioritaire", href: "/dashboard/owner" },
        { label: "Voir mes documents", href: "/dashboard/owner/documents" },
      ]}
      cards={[
        {
          title: "1. Identité du compte",
          text: "Retrouvez ici vos informations principales de connexion et de présentation.",
        },
        {
          title: "2. Préférences à structurer",
          text: "Cet espace a vocation à centraliser vos préférences d'alertes, de facturation et de suivi propriétaire.",
        },
      ]}
      detailSections={[
        {
          title: "Informations du profil",
          description: "Synthèse des données déjà disponibles sur votre compte.",
          items: [
            {
              title: displayName,
              meta: profile?.role || "owner",
              description: `${profile?.email || "Email non renseigné"}${profile?.phone ? ` | ${profile.phone}` : ""}`,
            },
            {
              title: profile?.company_name || "Aucune société renseignée",
              description: profile?.city || "Ville non renseignée",
            },
          ],
        },
      ]}
    />
  );
}
