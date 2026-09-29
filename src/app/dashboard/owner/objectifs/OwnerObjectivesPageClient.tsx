"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, ChevronUp, CircleDot, ClipboardList, Handshake, Home } from "lucide-react";
import {
  OWNER_COLLABORATION_TYPE_OPTIONS,
  OWNER_REQUEST_FREQUENCY_OPTIONS,
  OWNER_REQUEST_GOAL_OPTIONS,
  OWNER_RESPONSIBILITY_LEVEL_OPTIONS,
} from "@/app/lib/serviceRequestBrief";
import { OWNER_PROPERTY_TYPES } from "@/features/shared/data/propertyTypes";
import {
  getOwnerOnboardingProgress,
  getOwnerProfilePreferences,
  type OwnerOnboardingBillingPref,
  type OwnerOnboardingHelpFrequency,
  type OwnerOnboardingManagementMode,
  type OwnerOnboardingNeed,
  type OwnerOnboardingProOrg,
  type OwnerOnboardingRequestOrg,
  type OwnerOnboardingSituation,
  type OwnerProfilePreferences,
} from "@/features/owner-preferences/profilePreferences";
import OwnerPostSignupOnboarding from "../OwnerPostSignupOnboarding";
import styles from "./OwnerObjectivesPageClient.module.scss";

type CurrentProfilePayload = {
  first_name?: string | null;
  city?: string | null;
  availability_hours?: string | null;
};

type LabelOption<Value extends string> = {
  value: Value;
  label: string;
};

const EMPTY_PREFERENCES: OwnerProfilePreferences = getOwnerProfilePreferences(null);
const ICON_BASE = "/icons";
const FIELD_ICONS = {
  settings: `${ICON_BASE}/set-svgrepo-com.svg`,
  goal: `${ICON_BASE}/pentagram-svgrepo-com.svg`,
  collaboration: `${ICON_BASE}/praise-svgrepo-com.svg`,
  responsibility: `${ICON_BASE}/selected-svgrepo-com.svg`,
  rhythm: `${ICON_BASE}/calendar-svgrepo-com.svg`,
  property: `${ICON_BASE}/home-icon.svg`,
  volume: `${ICON_BASE}/gauge-svgrepo-com.svg`,
  context: `${ICON_BASE}/survey-svgrepo-com.svg`,
  expectations: `${ICON_BASE}/remember-1-svgrepo-com.svg`,
  duration: `${ICON_BASE}/hourglass-svgrepo-com.svg`,
  brief: `${ICON_BASE}/message-suggestions-svgrepo-com.svg`,
} as const;

const MANAGEMENT_MODE_OPTIONS: Array<LabelOption<OwnerOnboardingManagementMode>> = [
  { value: "autonomous", label: "Autonome" },
  { value: "supported", label: "Accompagné" },
  { value: "full_delegation", label: "Gestion déléguée" },
];

const NEED_OPTIONS: Array<LabelOption<OwnerOnboardingNeed>> = [
  { value: "check_in", label: "Accueil / Check-in" },
  { value: "check_out", label: "Départ / Check-out" },
  { value: "cleaning", label: "Ménage" },
  { value: "linen", label: "Gestion du linge" },
  { value: "maintenance", label: "Maintenance / petites réparations" },
  { value: "traveler_messages", label: "Gestion des messages voyageurs" },
  { value: "full_management", label: "Gestion complète du logement" },
  { value: "other", label: "Autre" },
];

const SITUATION_OPTIONS: Array<LabelOption<OwnerOnboardingSituation>> = [
  { value: "first_rental", label: "Je prépare ma première location" },
  { value: "already_renting", label: "Mon logement est déjà en location" },
  { value: "looking_for_professional", label: "Je recherche un professionnel" },
  { value: "already_with_professional", label: "Je travaille déjà avec un professionnel" },
];

const HELP_FREQUENCY_OPTIONS: Array<LabelOption<OwnerOnboardingHelpFrequency>> = [
  { value: "occasional", label: "Ponctuellement" },
  { value: "regular", label: "Régulièrement" },
  { value: "very_regular", label: "Très régulièrement" },
];

const REQUEST_ORG_OPTIONS: Array<LabelOption<OwnerOnboardingRequestOrg>> = [
  { value: "bookings", label: "Selon mes réservations" },
  { value: "regular", label: "Besoins réguliers" },
  { value: "both", label: "Les deux" },
];

const BILLING_PREF_OPTIONS: Array<LabelOption<OwnerOnboardingBillingPref>> = [
  { value: "per_mission", label: "Par mission" },
  { value: "monthly", label: "Fin de mois" },
  { value: "both", label: "Les deux" },
];

const PRO_ORG_OPTIONS: Array<LabelOption<OwnerOnboardingProOrg>> = [
  { value: "main_professional", label: "Un professionnel principal" },
  { value: "multiple_professionals", label: "Plusieurs professionnels" },
  { value: "depending_on_needs", label: "Selon les besoins" },
];

function labelOf<Value extends string>(
  options: Array<LabelOption<Value>>,
  value: Value | null | undefined,
  fallback = "Non renseigné",
) {
  return options.find((option) => option.value === value)?.label ?? fallback;
}

function summarizeNeeds(needs: OwnerOnboardingNeed[]) {
  if (needs.length === 0) return "Non renseigné";
  return needs.map((need) => labelOf(NEED_OPTIONS, need)).join(", ");
}

function FieldIcon({ src }: { src: string }) {
  return (
    <span className={styles.fieldIcon} aria-hidden="true">
      <Image src={src} alt="" width={22} height={22} />
    </span>
  );
}

export default function OwnerObjectivesPageClient() {
  const [preferences, setPreferences] = useState<OwnerProfilePreferences>(EMPTY_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const advancedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const payload = (await response.json()) as CurrentProfilePayload & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger vos préférences.");
        }

        if (!cancelled) {
          setPreferences(getOwnerProfilePreferences(payload.availability_hours));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger vos préférences.");
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

  const onboarding = preferences.ownerOnboardingV1;
  const onboardingProgress = getOwnerOnboardingProgress(onboarding);
  const isConfigured = onboardingProgress.isComplete;
  const neutral = "Non renseigné";
  const needsCountLabel =
    onboarding?.needs.length ? `${onboarding.needs.length} service${onboarding.needs.length > 1 ? "s" : ""}` : neutral;

  const kpis = useMemo(
    () => [
      {
        label: "MODE DE GESTION",
        value: labelOf(MANAGEMENT_MODE_OPTIONS, onboarding?.managementMode),
        description: "Votre niveau d'implication souhaité.",
        icon: Home,
      },
      {
        label: "BESOINS HABITUELS",
        value: needsCountLabel,
        description: onboarding?.needs.length ? summarizeNeeds(onboarding.needs) : "Aucun service sélectionné.",
        icon: ClipboardList,
      },
      {
        label: "ORGANISATION",
        value: labelOf(REQUEST_ORG_OPTIONS, onboarding?.requestOrg),
        description: "La façon dont vous souhaitez déclencher les demandes.",
        icon: CircleDot,
      },
      {
        label: "RÈGLEMENT PRÉFÉRÉ",
        value: labelOf(BILLING_PREF_OPTIONS, onboarding?.billingPref),
        description: "Votre préférence pour cadrer les règlements.",
        icon: Handshake,
      },
    ],
    [needsCountLabel, onboarding],
  );

  const openAdvanced = () => {
    setAdvancedOpen(true);
    window.requestAnimationFrame(() => {
      advancedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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
            operatingContext: preferences.operatingContext,
            recurringExpectations: preferences.recurringExpectations,
            firstRequestTemplate: preferences.firstRequestTemplate,
          },
        }),
      });

      const payload = (await response.json()) as CurrentProfilePayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer vos préférences.");
      }

      setPreferences(getOwnerProfilePreferences(payload.availability_hours));
      setSuccess("Préférences enregistrées. Elles seront reprises dans vos prochaines recherches concierge.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer vos préférences.");
    } finally {
      setSaving(false);
    }
  }

  const renderSummaryItem = (label: string, value: string) => (
    <div className={styles.preferenceItem}>
      <span aria-hidden="true" />
      <div>
        <strong>{label}</strong>
        <p>{value}</p>
      </div>
    </div>
  );

  return (
    <>
    <form className={styles.preferencesPage} onSubmit={handleSubmit}>
      <header className={styles.pageIntro}>
        <p className={styles.eyebrow}>PRÉFÉRENCES</p>
        <h1>Mes préférences de collaboration</h1>
        <p>
          Retrouvez et ajustez la façon dont vous souhaitez organiser vos locations et travailler avec vos
          professionnels.
        </p>
      </header>

      <section className={styles.preferenceStatus} aria-label="État des préférences">
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>
            <Check size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>{isConfigured ? "Profil configuré" : "Profil à compléter"}</strong>
            <span>
              {isConfigured
                ? "Ces préférences sont utilisées pour vos recherches et demandes."
                : `${onboardingProgress.completed} étape${onboardingProgress.completed > 1 ? "s" : ""} sur ${onboardingProgress.total} complétée${onboardingProgress.completed > 1 ? "s" : ""}.`}
            </span>
          </div>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>
            <Check size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>Modifiable à tout moment</strong>
            <span>Vous pouvez les ajuster selon l'évolution de vos besoins.</span>
          </div>
        </div>
        <div className={styles.statusActions}>
          {!isConfigured ? (
            <button type="button" className={styles.saveButton} onClick={() => setOnboardingOpen(true)}>
              Terminer ma configuration
            </button>
          ) : null}
          <button type="submit" className={styles.saveButton} disabled={loading || saving}>
            {saving ? "Enregistrement..." : "Enregistrer mes modifications"}
          </button>
        </div>
      </section>

      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {success ? <div className={styles.successBox}>{success}</div> : null}

      <section className={styles.pageSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>VUE D'ENSEMBLE</p>
          <h2>Mes informations clés</h2>
          <p>Un aperçu rapide de vos préférences actuelles.</p>
        </div>

        <div className={styles.summaryGrid}>
          {kpis.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className={styles.summaryCard}>
                <span className={styles.summaryIcon}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className={styles.summaryLabel}>{item.label}</span>
                <p className={styles.summaryValue}>{item.value}</p>
                <p className={styles.summaryDescription}>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={styles.sectionHeading}>
          <h2>Mes préférences principales</h2>
          <p>
            Les informations définies lors de votre inscription et de l'onboarding. Vous pouvez les modifier à tout
            moment.
          </p>
        </div>

        <div className={styles.preferenceCards}>
          <article className={styles.preferenceCard}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.cardNumber}>01</span>
                <h3>Mon projet</h3>
              </div>
              <div className={`${styles.cardImage} ${styles.projectImage}`} aria-hidden="true" />
            </div>
            {renderSummaryItem("Mode de gestion", labelOf(MANAGEMENT_MODE_OPTIONS, onboarding?.managementMode))}
            {renderSummaryItem("Situation actuelle", labelOf(SITUATION_OPTIONS, onboarding?.situation))}
            {renderSummaryItem("Services recherchés", onboarding ? summarizeNeeds(onboarding.needs) : neutral)}
            <button type="button" className={styles.editPreference} onClick={openAdvanced}>
              Modifier mon projet
            </button>
          </article>

          <article className={styles.preferenceCard}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.cardNumber}>02</span>
                <h3>Mes besoins</h3>
              </div>
              <div className={`${styles.cardImage} ${styles.needsImage}`} aria-hidden="true" />
            </div>
            {renderSummaryItem("Fréquence d'aide", labelOf(HELP_FREQUENCY_OPTIONS, onboarding?.helpFrequency))}
            <button type="button" className={styles.editPreference} onClick={openAdvanced}>
              Modifier mes besoins
            </button>
          </article>

          <article className={styles.preferenceCard}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.cardNumber}>03</span>
                <h3>Mon organisation</h3>
              </div>
              <div className={`${styles.cardImage} ${styles.organizationImage}`} aria-hidden="true" />
            </div>
            {renderSummaryItem("Organisation des demandes", labelOf(REQUEST_ORG_OPTIONS, onboarding?.requestOrg))}
            {renderSummaryItem("Mode de règlement", labelOf(BILLING_PREF_OPTIONS, onboarding?.billingPref))}
            {renderSummaryItem("Organisation des professionnels", labelOf(PRO_ORG_OPTIONS, onboarding?.proOrg))}
            <button type="button" className={styles.editPreference} onClick={openAdvanced}>
              Modifier mon organisation
            </button>
          </article>
        </div>
      </section>

      <section className={styles.advancedSection} ref={advancedRef}>
        <div className={styles.advancedHeader}>
          <div className={styles.advancedTitle}>
            <span className={styles.advancedIcon}>
              <Image src={FIELD_ICONS.settings} alt="" width={24} height={24} />
            </span>
            <div>
              <h2>Préférences avancées</h2>
              <p>Affinez ces informations si vous souhaitez améliorer les futures recherches et demandes.</p>
              <span>Ces éléments sont facultatifs mais permettent des suggestions plus pertinentes.</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.advancedToggle}
            onClick={() => setAdvancedOpen((current) => !current)}
            aria-expanded={advancedOpen}
            aria-controls="owner-advanced-preferences"
          >
            {advancedOpen ? "Masquer les préférences avancées" : "Afficher les préférences avancées"}
            {advancedOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
        </div>

        {advancedOpen ? (
          <div id="owner-advanced-preferences" className={styles.advancedPanel}>
            {loading ? <span className={styles.stateTag}>Chargement...</span> : null}

            <div className={styles.editorialGrid}>
              <label className={styles.field}>
                <FieldIcon src={FIELD_ICONS.goal} />
                <span className={styles.fieldBody}>
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
                  <small>Fixe la nature de votre besoin récurrent et oriente le brief de demande.</small>
                </span>
              </label>

              <label className={styles.field}>
                <FieldIcon src={FIELD_ICONS.collaboration} />
                <span className={styles.fieldBody}>
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
                  <small>Permet de décrire le périmètre général de l'accompagnement attendu.</small>
                </span>
              </label>

              <label className={styles.field}>
                <FieldIcon src={FIELD_ICONS.responsibility} />
                <span className={styles.fieldBody}>
                  <span>Niveau de responsabilité attendu</span>
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
                  <small>Utile pour qualifier ce que vous gardez en pilotage et ce que vous déléguez.</small>
                </span>
              </label>

              <label className={styles.field}>
                <FieldIcon src={FIELD_ICONS.rhythm} />
                <span className={styles.fieldBody}>
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
                  <small>Permet de repartir sur une base utile avant même la première demande.</small>
                </span>
              </label>

              <span className={styles.fieldSeparator} aria-hidden="true" />

              <label className={styles.field}>
                <FieldIcon src={FIELD_ICONS.property} />
                <span className={styles.fieldBody}>
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
                    <option value="">À préciser</option>
                    {OWNER_PROPERTY_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <small>Ce contexte alimente les futures recherches et la lecture du besoin.</small>
                </span>
              </label>

              <label className={styles.field}>
                <FieldIcon src={FIELD_ICONS.volume} />
                <span className={styles.fieldBody}>
                  <span>Volume ou contexte d'exploitation</span>
                  <input
                    type="text"
                    value={preferences.needVolume}
                    disabled={loading || saving}
                    placeholder="Ex : haute saison, toute l'année, 2 logements"
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        needVolume: event.target.value,
                      }))
                    }
                  />
                  <small>Conservez ici le rythme ou le volume qui revient souvent dans vos demandes.</small>
                </span>
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <FieldIcon src={FIELD_ICONS.context} />
                <span className={styles.fieldBody}>
                <span>Cadre général d'exploitation</span>
                <textarea
                  value={preferences.operatingContext}
                  disabled={loading || saving}
                  rows={4}
                  placeholder="Ex : location saisonnière de mai à septembre, arrivées le samedi, accès autonome, linge externalisé."
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      operatingContext: event.target.value,
                    }))
                  }
                />
                <small>Résumez les contraintes stables de votre exploitation pour les reprendre dans vos demandes.</small>
                </span>
              </label>

              <span className={styles.fieldSeparator} aria-hidden="true" />

              <label className={styles.field}>
                <FieldIcon src={FIELD_ICONS.expectations} />
                <span className={styles.fieldBody}>
                  <span>Attentes récurrentes</span>
                  <textarea
                    value={preferences.recurringExpectations}
                    disabled={loading || saving}
                    rows={4}
                    placeholder="Ex : ménage et linge à chaque départ, contrôle consommables, photos après intervention, réactivité en haute saison."
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        recurringExpectations: event.target.value,
                      }))
                    }
                  />
                  <small>Listez les attentes qui reviennent souvent pour éviter de les ressaisir à chaque brief.</small>
                </span>
              </label>

              <label className={styles.field}>
                <FieldIcon src={FIELD_ICONS.brief} />
                <span className={styles.fieldBody}>
                  <span>Brief récurrent</span>
                  <textarea
                    value={preferences.firstRequestTemplate}
                    disabled={loading || saving}
                    rows={5}
                    placeholder="Ex : Je cherche une conciergerie réactive pour un appartement à Nice, avec ménage, linge et coordination voyageurs."
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        firstRequestTemplate: event.target.value,
                      }))
                    }
                  />
                  <small>Ce texte sert de base quand vous ouvrez une nouvelle recherche concierge.</small>
                </span>
              </label>

              <label className={`${styles.field} ${styles.fieldHalf}`}>
                <FieldIcon src={FIELD_ICONS.duration} />
                <span className={styles.fieldBody}>
                  <span>Durée estimée</span>
                  <input
                    type="text"
                    value={preferences.estimatedDuration}
                    disabled={loading || saving}
                    placeholder="Ex : test de 1 mois, saison été, toute l'année"
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        estimatedDuration: event.target.value,
                      }))
                    }
                  />
                  <small>Permet de poser le cadre temporel de la collaboration ou du test souhaité.</small>
                </span>
              </label>
            </div>

            <div className={styles.advancedActions}>
              <button type="submit" className={styles.saveButton} disabled={loading || saving}>
                {saving ? "Enregistrement..." : "Enregistrer mes préférences"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </form>
    <OwnerPostSignupOnboarding
      open={onboardingOpen}
      currentStep={onboardingProgress.nextStep}
      onClose={() => setOnboardingOpen(false)}
      onPostpone={() => setOnboardingOpen(false)}
    />
    </>
  );
}
