"use client";

import { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import {
  OWNER_COLLABORATION_TYPE_OPTIONS,
  OWNER_REQUEST_FREQUENCY_OPTIONS,
  OWNER_REQUEST_GOAL_OPTIONS,
  OWNER_RESPONSIBILITY_LEVEL_OPTIONS,
} from "@/app/lib/serviceRequestBrief";
import { OWNER_PROPERTY_TYPES } from "@/features/shared/data/propertyTypes";
import {
  getOwnerProfilePreferences,
  type OwnerProfilePreferences,
} from "@/features/owner-preferences/profilePreferences";
import styles from "./OwnerObjectivesPageClient.module.scss";

type CurrentProfilePayload = {
  first_name?: string | null;
  city?: string | null;
  availability_hours?: string | null;
};

const EMPTY_PREFERENCES: OwnerProfilePreferences = getOwnerProfilePreferences(null);

export default function OwnerObjectivesPageClient() {
  const [preferences, setPreferences] = useState<OwnerProfilePreferences>(EMPTY_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<CurrentProfilePayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const payload = (await response.json()) as CurrentProfilePayload & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger vos preferences.");
        }

        if (!cancelled) {
          setProfile(payload);
          setPreferences(getOwnerProfilePreferences(payload.availability_hours));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger vos preferences.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const completionCount = useMemo(() => {
    let count = 0;
    if (preferences.ownerGoal) count += 1;
    if (preferences.collaborationType) count += 1;
    if (preferences.responsibilityLevel) count += 1;
    if (preferences.frequency && preferences.frequency !== "unknown") count += 1;
    if (preferences.propertyType) count += 1;
    if (preferences.firstRequestTemplate.trim()) count += 1;
    return count;
  }, [preferences]);

  const metrics = [
    {
      label: "Objectif",
      value:
        OWNER_REQUEST_GOAL_OPTIONS.find((option) => option.value === preferences.ownerGoal)?.label ||
        "A cadrer",
      hint: "Le besoin principal a reutiliser dans vos recherches et demandes",
    },
    {
      label: "Collaboration",
      value:
        OWNER_COLLABORATION_TYPE_OPTIONS.find(
          (option) => option.value === preferences.collaborationType,
        )?.label || "A definir",
      hint: "Le mode d'accompagnement que vous souhaitez cadrer",
    },
    {
      label: "Completude",
      value: `${completionCount}/6`,
      hint: "Plus ce bloc est precise, moins vous ressaisissez dans les parcours owner",
    },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_preferences: {
            ownerGoal: preferences.ownerGoal,
            collaborationType: preferences.collaborationType,
            frequency: preferences.frequency,
            estimatedDuration: preferences.estimatedDuration,
            responsibilityLevel: preferences.responsibilityLevel,
            propertyType: preferences.propertyType,
            needVolume: preferences.needVolume,
            firstRequestTemplate: preferences.firstRequestTemplate,
          },
        }),
      });

      const payload = (await response.json()) as CurrentProfilePayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer vos preferences.");
      }

      setProfile(payload);
      setPreferences(getOwnerProfilePreferences(payload.availability_hours));
      setSuccess("Preferences enregistrees. Elles seront reprises dans vos prochaines recherches concierge.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer vos preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OwnerWorkspacePage
      eyebrow="Tableau de bord"
      title="Objectifs de collaboration"
      description="Cadrez une fois vos preferences owner pour eviter la ressaisie et envoyer des briefs plus coherents."
      chips={["Profil owner", "Preferences durables", "Reutilisable dans les demandes"]}
      actions={[
        { label: "Rechercher une conciergerie", href: "/dashboard/owner/concierges" },
        { label: "Voir mes logements", href: "/dashboard/owner/logements" },
      ]}
      metrics={metrics}
      cards={[
        {
          title: "1. Fixer l'objectif principal",
          text: "Clarifiez si vous cherchez une conciergerie, un devis ponctuel, un remplacement ou un accompagnement regulier.",
        },
        {
          title: "2. Cadrer la delegation",
          text: "Definissez le type de collaboration, le niveau de responsabilite attendu et le rythme pressenti.",
        },
        {
          title: "3. Reutiliser partout",
          text: "Ces preferences servent ensuite de base dans la recherche concierge et dans vos prochaines demandes.",
        },
      ]}
      detailSections={[
        {
          title: "Ce que cette page alimente",
          description: "Les preferences owner deviennent un point d'entree stable dans le dashboard.",
          items: [
            {
              title: "Recherche concierge",
              meta: "Actif",
              description: "Le brief de recherche repartira de ces choix plutot que de repartit de zero.",
              href: "/dashboard/owner/concierges",
              actionLabel: "Ouvrir la recherche",
            },
            {
              title: "Qualification du besoin",
              meta: profile?.city?.trim() ? profile.city : "Localisation a completer",
              description:
                "Le contexte local et le type de bien aident les concierges a proposer une offre plus juste.",
              href: "/dashboard/owner/settings",
              actionLabel: "Voir mon profil",
            },
          ],
        },
      ]}
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Edition</p>
            <h2>Preferences proprietaire</h2>
            <p>
              Ces informations seront conservees dans votre profil puis reprises comme base dans le
              parcours concierge.
            </p>
          </div>
          {loading ? <span className={styles.stateTag}>Chargement...</span> : null}
        </div>

        {error ? <div className={styles.errorBox}>{error}</div> : null}
        {success ? <div className={styles.successBox}>{success}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Objectif principal</span>
              <select
                value={preferences.ownerGoal}
                disabled={loading || saving}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    ownerGoal: event.target.value as OwnerProfilePreferences["ownerGoal"],
                  }))
                }
              >
                {OWNER_REQUEST_GOAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>
                Fixe la nature de votre besoin recurrent et oriente le brief de demande.
              </small>
            </label>

            <label className={styles.field}>
              <span>Type de collaboration</span>
              <select
                value={preferences.collaborationType}
                disabled={loading || saving}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    collaborationType: event.target.value as OwnerProfilePreferences["collaborationType"],
                  }))
                }
              >
                {OWNER_COLLABORATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>Permet de decrire le perimetre general de l'accompagnement attendu.</small>
            </label>

            <label className={styles.field}>
              <span>Niveau de responsabilite attendu</span>
              <select
                value={preferences.responsibilityLevel}
                disabled={loading || saving}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    responsibilityLevel: event.target.value as OwnerProfilePreferences["responsibilityLevel"],
                  }))
                }
              >
                {OWNER_RESPONSIBILITY_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>Utile pour qualifier ce que vous gardez en pilotage et ce que vous deleguez.</small>
            </label>

            <label className={styles.field}>
              <span>Rythme pressenti</span>
              <select
                value={preferences.frequency}
                disabled={loading || saving}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    frequency: event.target.value as OwnerProfilePreferences["frequency"],
                  }))
                }
              >
                {OWNER_REQUEST_FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>Permet de repartir sur une base utile avant meme la premiere demande.</small>
            </label>

            <label className={styles.field}>
              <span>Type de bien principal</span>
              <select
                value={preferences.propertyType}
                disabled={loading || saving}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    propertyType: event.target.value,
                  }))
                }
              >
                <option value="">A preciser</option>
                {OWNER_PROPERTY_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <small>Ce contexte alimente les futures recherches et la lecture du besoin.</small>
            </label>

            <label className={styles.field}>
              <span>Volume ou contexte d'exploitation</span>
              <input
                type="text"
                value={preferences.needVolume}
                disabled={loading || saving}
                placeholder="Ex : haute saison, toute l'annee, 2 logements"
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    needVolume: event.target.value,
                  }))
                }
              />
              <small>Conservez ici le rythme ou le volume qui revient souvent dans vos demandes.</small>
            </label>
          </div>

          <label className={styles.field}>
            <span>Duree estimee</span>
            <input
              type="text"
              value={preferences.estimatedDuration}
              disabled={loading || saving}
              placeholder="Ex : test de 1 mois, saison ete, toute l'annee"
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  estimatedDuration: event.target.value,
                }))
              }
            />
            <small>Permet de poser le cadre temporel de la collaboration ou du test souhaite.</small>
          </label>

          <label className={styles.field}>
            <span>Brief recurrent</span>
            <textarea
              value={preferences.firstRequestTemplate}
              disabled={loading || saving}
              rows={5}
              placeholder="Ex : Je cherche une conciergerie reactive pour un appartement a Nice, avec menage, linge et coordination voyageurs."
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  firstRequestTemplate: event.target.value,
                }))
              }
            />
            <small>
              Ce texte sert de base quand vous ouvrez une nouvelle recherche concierge.
            </small>
          </label>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton} disabled={loading || saving}>
              {saving ? "Enregistrement..." : "Enregistrer mes preferences"}
            </button>
            <a className={styles.secondaryLink} href="/dashboard/owner/concierges">
              Tester dans la recherche concierge
            </a>
          </div>
        </form>
      </section>
    </OwnerWorkspacePage>
  );
}
