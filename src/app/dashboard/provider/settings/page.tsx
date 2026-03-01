"use client";

import { useEffect, useMemo, useState } from "react";
import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";
import {
  buildProviderDisplayName,
  fetchCurrentProviderProfile,
  type ProviderCurrentProfile,
  type ProviderWorkspacePayload,
} from "../_components/providerProfile";

type ProviderSettingsForm = {
  username: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  city: string;
  postal_code: string;
  website: string;
};

function buildFormState(profile: ProviderCurrentProfile | null): ProviderSettingsForm {
  return {
    username: profile?.username ?? "",
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    company_name: profile?.company_name ?? "",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    postal_code: profile?.postal_code ?? "",
    website: profile?.website ?? "",
  };
}

export default function ProviderSettingsPage() {
  const [workspace, setWorkspace] = useState<ProviderWorkspacePayload | null>(null);
  const [form, setForm] = useState<ProviderSettingsForm>(buildFormState(null));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const nextWorkspace = await fetchCurrentProviderProfile();
        if (!cancelled) {
          setWorkspace(nextWorkspace);
          setForm(buildFormState(nextWorkspace.profile));
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de mettre a jour le profil.");
      }

      const refreshedWorkspace = await fetchCurrentProviderProfile();
      setWorkspace(refreshedWorkspace);
      setForm(buildFormState(refreshedWorkspace.profile));
      setSuccess("Les parametres artisan ont ete enregistres.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre a jour le profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProviderWorkspacePage
      eyebrow="Compte"
      title="Parametres"
      description={
        error ||
        "Retrouvez ici vos informations de compte artisan et mettez a jour les reglages principaux relies a votre profil."
      }
      chips={[
        displayName,
        locationLabel,
        workspace?.summary.is_pro ? "Artisan PRO" : "Artisan standard",
      ]}
      actions={[
        { label: "Voir les outils", href: "/dashboard/provider/outils" },
        { label: "Voir la vue d'ensemble", href: "/dashboard/provider" },
      ]}
      cards={[
        {
          title: "Identite du compte",
          text: profile
            ? `${displayName}${profile.company_name ? ` - ${profile.company_name}` : ""}`
            : "Chargement des informations de compte.",
        },
        {
          title: "Coordonnees",
          text: profile
            ? [profile.email, profile.phone, locationLabel].filter(Boolean).join(" - ")
            : "Les coordonnees reliees au profil apparaitront ici.",
        },
        {
          title: "Statut du profil",
          text: profile
            ? `Role: ${profile.role || "non renseigne"} - Categorie: ${profile.category || "non renseignee"}`
            : "Le statut du compte apparaitra ici une fois le profil charge.",
        },
      ]}
    >
      <section
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1.1rem",
          borderRadius: "18px",
          border: "1px solid rgba(184, 139, 74, 0.22)",
          background: "rgba(255, 252, 245, 0.96)",
          boxShadow: "0 10px 24px rgba(74, 53, 16, 0.06)",
        }}
      >
        <h2 style={{ margin: 0, color: "#4a3510" }}>Modifier mon profil</h2>

        {success ? <p style={{ margin: 0, color: "#166534", fontWeight: 700 }}>{success}</p> : null}
        {error ? <p style={{ margin: 0, color: "#991b1b", fontWeight: 700 }}>{error}</p> : null}

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {(
            [
              ["username", "Nom d'utilisateur"],
              ["first_name", "Prenom"],
              ["last_name", "Nom"],
              ["company_name", "Entreprise"],
              ["phone", "Telephone"],
              ["city", "Ville"],
              ["postal_code", "Code postal"],
              ["website", "Site web"],
            ] as Array<[keyof ProviderSettingsForm, string]>
          ).map(([field, label]) => (
            <label key={field} style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ color: "#5f5237", fontWeight: 600 }}>{label}</span>
              <input
                value={form[field]}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    [field]: event.target.value,
                  }))
                }
                style={{
                  minHeight: 42,
                  borderRadius: 12,
                  border: "1px solid rgba(184, 139, 74, 0.24)",
                  padding: "0.65rem 0.8rem",
                  background: "#fff",
                }}
              />
            </label>
          ))}

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                minHeight: 42,
                padding: "0.7rem 1rem",
                borderRadius: 999,
                border: "1px solid rgba(184, 139, 74, 0.35)",
                background: "linear-gradient(135deg, #b88b4a, #d4af37)",
                color: "#fff",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </section>
    </ProviderWorkspacePage>
  );
}
