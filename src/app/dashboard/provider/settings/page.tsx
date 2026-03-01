"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../ProviderCrudPage.module.scss";
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
  const [baseline, setBaseline] = useState<ProviderSettingsForm>(buildFormState(null));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const nextWorkspace = await fetchCurrentProviderProfile();
        if (!cancelled) {
          const nextForm = buildFormState(nextWorkspace.profile);
          setWorkspace(nextWorkspace);
          setForm(nextForm);
          setBaseline(nextForm);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le profil artisan.");
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const profile = workspace?.profile ?? null;
  const displayName = useMemo(() => buildProviderDisplayName(profile), [profile]);
  const locationLabel = useMemo(
    () => workspace?.summary.location || "Localisation a completer",
    [workspace],
  );
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline],
  );

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
      const refreshedForm = buildFormState(refreshedWorkspace.profile);
      setWorkspace(refreshedWorkspace);
      setForm(refreshedForm);
      setBaseline(refreshedForm);
      setSuccess("Les parametres artisan ont ete enregistres.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre a jour le profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Compte</p>
            <h1>Parametres</h1>
            <p>
              {error ||
                "Mettez a jour vos informations de compte, vos coordonnees et vos donnees de vitrine Artisan."}
            </p>
          </div>
          <div className={styles.metrics}>
            <span>{displayName}</span>
            <span>{workspace?.summary.is_pro ? "Artisan PRO" : "Artisan standard"}</span>
            <span>{locationLabel}</span>
          </div>
        </header>

        {success ? <p className={styles.successBox}>{success}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Modifier mon profil</h2>
              <span className={styles.counter}>{isDirty ? "Modifications en cours" : "A jour"}</span>
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
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
                <label key={field}>
                  <span>{label}</span>
                  <input
                    value={form[field]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}

              <div className={styles.formActions}>
                <button type="submit" disabled={saving || !isDirty}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={!isDirty}
                  onClick={() => setForm(baseline)}
                >
                  Reinitialiser
                </button>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Resume du compte</h2>
            </div>
            <div className={styles.cardList}>
              <article className={styles.itemCard}>
                <div className={styles.itemHead}>
                  <div>
                    <h3>Identite</h3>
                    <p>{displayName}</p>
                  </div>
                  <span className={styles.badge}>{profile?.role || "provider"}</span>
                </div>
                <p className={styles.itemBody}>
                  {profile?.company_name || "Entreprise non renseignee"}
                </p>
              </article>
              <article className={styles.itemCard}>
                <div className={styles.itemHead}>
                  <div>
                    <h3>Coordonnees</h3>
                    <p>{locationLabel}</p>
                  </div>
                </div>
                <div className={styles.itemMeta}>
                  <span>{profile?.email || "Email non renseigne"}</span>
                  <span>{profile?.phone || "Telephone non renseigne"}</span>
                  <span>{profile?.website || "Site non renseigne"}</span>
                </div>
              </article>
              <article className={styles.itemCard}>
                <div className={styles.itemHead}>
                  <div>
                    <h3>Navigation</h3>
                    <p>Acces rapide aux espaces relies</p>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <Link href="/dashboard/provider" className={styles.linkButton}>
                    Vue d&apos;ensemble
                  </Link>
                  <Link href="/dashboard/provider/messages" className={styles.linkButton}>
                    Messages
                  </Link>
                  <Link href="/dashboard/provider/outils" className={styles.linkButton}>
                    Outils
                  </Link>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
