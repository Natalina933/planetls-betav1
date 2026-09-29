"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, ChevronLeft, Home, ListChecks, X } from "lucide-react";
import { buildOwnerHousingCompletion } from "@/app/dashboard/shared/categoryCompletion";
import {
  EMPTY_OWNER_ONBOARDING_V1,
  getOwnerProfilePreferences,
  type OwnerOnboardingBillingPref,
  type OwnerOnboardingHelpFrequency,
  type OwnerOnboardingManagementMode,
  type OwnerOnboardingNeed,
  type OwnerOnboardingProOrg,
  type OwnerOnboardingRequestOrg,
  type OwnerOnboardingSituation,
  type OwnerOnboardingV1,
  type OwnerProfilePreferences,
} from "@/features/owner-preferences/profilePreferences";
import styles from "./OwnerPostSignupOnboarding.module.scss";

export type OwnerOnboardingStep = "welcome" | "project" | "housing" | "organization" | "complete";

type CurrentProfilePayload = {
  availability_hours?: string | null;
  error?: string;
};

type OwnerHousingRow = Record<string, unknown>;

type Option<Value extends string> = {
  value: Value;
  label: string;
  description?: string;
};

const ONBOARDING_STEPS: OwnerOnboardingStep[] = ["project", "housing", "organization"];

const WELCOME_ITEMS = [
  {
    number: 1,
    title: "Votre projet",
    description: "Votre façon de gérer votre location, vos besoins et où vous en êtes aujourd'hui.",
    icon: ListChecks,
  },
  {
    number: 2,
    title: "Vos logements",
    description: "Votre rythme d'accompagnement et l'état réel de vos logements.",
    icon: Home,
  },
  {
    number: 3,
    title: "Votre organisation",
    description: "L'organisation de vos demandes, la facturation et le nombre de professionnels.",
    icon: CalendarCheck,
  },
];

const MANAGEMENT_MODE_OPTIONS: Array<Option<OwnerOnboardingManagementMode>> = [
  {
    value: "autonomous",
    label: "Je gère seul",
    description: "Vous pilotez vos logements et déléguez uniquement ponctuellement.",
  },
  {
    value: "supported",
    label: "Je veux être accompagné",
    description: "Vous souhaitez un appui régulier sur les tâches du quotidien.",
  },
  {
    value: "full_delegation",
    label: "Je veux tout déléguer",
    description: "Vous cherchez un professionnel pour prendre en charge vos logements.",
  },
];

const NEED_OPTIONS: Array<Option<OwnerOnboardingNeed>> = [
  { value: "check_in", label: "Accueil / Check-in" },
  { value: "check_out", label: "Départ / Check-out" },
  { value: "cleaning", label: "Ménage" },
  { value: "linen", label: "Gestion du linge" },
  { value: "maintenance", label: "Maintenance / petites réparations" },
  { value: "traveler_messages", label: "Gestion des messages voyageurs" },
  { value: "full_management", label: "Gestion complète du logement" },
  { value: "other", label: "Autre" },
];

const HELP_FREQUENCY_OPTIONS: Array<Option<OwnerOnboardingHelpFrequency>> = [
  {
    value: "occasional",
    label: "Ponctuellement",
    description: "Quelques interventions selon mes réservations.",
  },
  {
    value: "regular",
    label: "Régulièrement",
    description: "J'ai des besoins récurrents au cours du mois.",
  },
  {
    value: "very_regular",
    label: "Très régulièrement",
    description: "Je gère une activité locative soutenue ou plusieurs logements.",
  },
];

const SITUATION_OPTIONS: Array<Option<OwnerOnboardingSituation>> = [
  {
    value: "first_rental",
    label: "Je prépare ma première location",
    description: "Vos premiers voyageurs sont attendus, tout reste à mettre en place.",
  },
  {
    value: "already_renting",
    label: "Mon logement est déjà en location",
    description: "Votre logement reçoit déjà des voyageurs.",
  },
  {
    value: "looking_for_professional",
    label: "Je recherche un professionnel",
    description: "Vous cherchez activement un professionnel pour vous accompagner.",
  },
  {
    value: "already_with_professional",
    label: "Je travaille déjà avec un professionnel",
    description: "Un professionnel intervient déjà sur votre logement.",
  },
];

const REQUEST_ORG_OPTIONS: Array<Option<OwnerOnboardingRequestOrg>> = [
  {
    value: "bookings",
    label: "Selon mes réservations",
    description: "Je crée mes besoins au fur et à mesure des arrivées, départs et séjours.",
  },
  {
    value: "regular",
    label: "Besoins réguliers",
    description: "Certaines prestations reviennent régulièrement.",
  },
  { value: "both", label: "Les deux", description: "J'ai des besoins réguliers et ponctuels." },
];

const BILLING_PREF_OPTIONS: Array<Option<OwnerOnboardingBillingPref>> = [
  {
    value: "per_mission",
    label: "Par mission",
    description: "Chaque mission peut être réglée individuellement.",
  },
  {
    value: "monthly",
    label: "En fin de mois",
    description: "Les prestations réalisées sont regroupées.",
  },
  {
    value: "both",
    label: "Les deux",
    description: "Le mode de règlement pourra être choisi selon la collaboration.",
  },
];

const PRO_ORG_OPTIONS: Array<Option<OwnerOnboardingProOrg>> = [
  {
    value: "main_professional",
    label: "Un professionnel principal",
    description: "Je souhaite travailler principalement avec la même personne.",
  },
  {
    value: "multiple_professionals",
    label: "Plusieurs professionnels",
    description: "Je souhaite pouvoir faire intervenir différentes personnes selon mes besoins.",
  },
  {
    value: "depending_on_needs",
    label: "Selon les besoins",
    description: "Je préfère décider selon le logement et les prestations.",
  },
];

function labelOf<Value extends string>(options: Array<Option<Value>>, value: Value | null): string {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label ?? "";
}

function readHousingRows(payload: unknown): OwnerHousingRow[] {
  if (Array.isArray(payload)) return payload as OwnerHousingRow[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: OwnerHousingRow[] }).items;
  }
  return [];
}

function readHousingName(housing: OwnerHousingRow, index: number): string {
  const name = typeof housing.nom_logement === "string" ? housing.nom_logement.trim() : "";
  if (name) return name;
  const city = typeof housing.ville === "string" ? housing.ville.trim() : "";
  return city || `Logement ${index + 1}`;
}

function readHousingCity(housing: OwnerHousingRow): string {
  return typeof housing.ville === "string" ? housing.ville.trim() : "";
}

type OwnerPostSignupOnboardingProps = {
  open: boolean;
  currentStep?: OwnerOnboardingStep;
  onClose: () => void;
};

export default function OwnerPostSignupOnboarding({
  open,
  currentStep = "welcome",
  onClose,
}: OwnerPostSignupOnboardingProps) {
  const [step, setStep] = useState<OwnerOnboardingStep>(currentStep);
  const [managementMode, setManagementMode] = useState<OwnerOnboardingManagementMode | "">("");
  const [needs, setNeeds] = useState<OwnerOnboardingNeed[]>([]);
  const [situation, setSituation] = useState<OwnerOnboardingSituation | "">("");
  const [helpFrequency, setHelpFrequency] = useState<OwnerOnboardingHelpFrequency | "">("");
  const [requestOrg, setRequestOrg] = useState<OwnerOnboardingRequestOrg | "">("");
  const [billingPref, setBillingPref] = useState<OwnerOnboardingBillingPref | "">("");
  const [proOrg, setProOrg] = useState<OwnerOnboardingProOrg | "">("");
  const [preferences, setPreferences] = useState<OwnerProfilePreferences | null>(null);
  const [housings, setHousings] = useState<OwnerHousingRow[]>([]);
  const [housingDeferred, setHousingDeferred] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(currentStep);
  }, [currentStep, open]);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    const loadOnboardingData = async () => {
      setLoadingProfile(true);
      setMessage("");

      try {
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const profile = (await response.json()) as CurrentProfilePayload;

        if (!response.ok || profile?.error) {
          throw new Error(profile?.error || "Impossible de charger votre profil.");
        }

        if (!isMounted) return;

        const nextPreferences = getOwnerProfilePreferences(profile.availability_hours ?? null);
        const onboarding = nextPreferences.ownerOnboardingV1 ?? EMPTY_OWNER_ONBOARDING_V1;

        setPreferences(nextPreferences);
        setManagementMode(onboarding.managementMode ?? "");
        setNeeds(onboarding.needs);
        setSituation(onboarding.situation ?? "");
        setHelpFrequency(onboarding.helpFrequency ?? "");
        setRequestOrg(onboarding.requestOrg ?? "");
        setBillingPref(onboarding.billingPref ?? "");
        setProOrg(onboarding.proOrg ?? "");
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Impossible de charger votre profil.");
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    const loadHousings = async () => {
      try {
        const response = await fetch("/api/housing", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (isMounted) {
          setHousings(readHousingRows(payload));
        }
      } catch {
        // L'état des logements reste informatif : l'onboarding continue sans cette donnée.
      }
    };

    void loadOnboardingData();
    void loadHousings();

    return () => {
      isMounted = false;
    };
  }, [open]);

  if (!open) return null;

  const persistOwnerOnboarding = async (patch: Partial<OwnerOnboardingV1>) => {
    const base = preferences ?? getOwnerProfilePreferences(null);
    const currentOnboarding = base.ownerOnboardingV1 ?? EMPTY_OWNER_ONBOARDING_V1;
    const nextOnboarding: OwnerOnboardingV1 = { ...currentOnboarding, ...patch };

    const response = await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner_preferences: {
          ownerGoal: base.ownerGoal,
          collaborationType: base.collaborationType,
          frequency: base.frequency,
          estimatedDuration: base.estimatedDuration,
          responsibilityLevel: base.responsibilityLevel,
          propertyType: base.propertyType,
          needVolume: base.needVolume,
          operatingContext: base.operatingContext,
          recurringExpectations: base.recurringExpectations,
          firstRequestTemplate: base.firstRequestTemplate,
          ownerOnboardingV1: nextOnboarding,
        },
      }),
    });
    const payload = (await response.json().catch(() => null)) as CurrentProfilePayload | null;

    if (!response.ok || payload?.error) {
      throw new Error(payload?.error || "Impossible d'enregistrer vos réponses.");
    }

    setPreferences(getOwnerProfilePreferences(payload?.availability_hours ?? null));
  };

  const saveProject = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || loadingProfile) return;
    setSaving(true);
    setMessage("");

    try {
      if (!managementMode) {
        throw new Error("Indiquez comment vous souhaitez gérer votre location pour continuer.");
      }
      if (!situation) {
        throw new Error("Précisez où vous en êtes aujourd'hui pour continuer.");
      }
      await persistOwnerOnboarding({ managementMode, needs, situation });
      setStep("housing");
      setMessage("Votre projet est enregistré. Parlons maintenant de vos logements.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer votre projet.");
    } finally {
      setSaving(false);
    }
  };

  const saveHousing = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || loadingProfile) return;
    setSaving(true);
    setMessage("");

    try {
      if (!helpFrequency) {
        throw new Error("Sélectionnez la fréquence à laquelle vous avez besoin d'aide pour continuer.");
      }
      await persistOwnerOnboarding({ helpFrequency });
      setStep("organization");
      setMessage("Votre rythme d'accompagnement est enregistré. Terminons par votre organisation.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer vos logements.");
    } finally {
      setSaving(false);
    }
  };

  const saveOrganization = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || loadingProfile) return;
    setSaving(true);
    setMessage("");

    try {
      if (!requestOrg || !billingPref || !proOrg) {
        throw new Error("Complétez les trois choix d'organisation pour continuer.");
      }
      await persistOwnerOnboarding({ requestOrg, billingPref, proOrg });
      setStep("complete");
      setMessage("Votre organisation est enregistrée. Vous pouvez finaliser votre configuration.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer votre organisation.");
    } finally {
      setSaving(false);
    }
  };

  const finalizeOnboarding = async () => {
    if (finalizing) return;
    setFinalizing(true);
    setMessage("");

    try {
      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_complete: true }),
      });
      const payload = (await response.json().catch(() => null)) as CurrentProfilePayload | null;

      if (!response.ok || payload?.error) {
        throw new Error(
          payload?.error || "Nous n'avons pas pu finaliser votre configuration. Veuillez réessayer.",
        );
      }

      window.dispatchEvent(new Event("user-profile-updated"));
      onClose();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nous n'avons pas pu finaliser votre configuration. Veuillez réessayer.",
      );
    } finally {
      setFinalizing(false);
    }
  };

  const toggleNeed = (need: OwnerOnboardingNeed) => {
    setNeeds((current) =>
      current.includes(need) ? current.filter((item) => item !== need) : [...current, need],
    );
  };

  const housingCompletion = buildOwnerHousingCompletion(housings);
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const selectedNeedLabels = needs.map((need) => labelOf(NEED_OPTIONS, need)).filter(Boolean);
  const situationLabel = labelOf(SITUATION_OPTIONS, situation || null);
  const requestOrgLabel = labelOf(REQUEST_ORG_OPTIONS, requestOrg || null);
  const billingPrefLabel = labelOf(BILLING_PREF_OPTIONS, billingPref || null);
  const proOrgLabel = labelOf(PRO_ORG_OPTIONS, proOrg || null);

  const renderProgress = () => (
    <div className={styles.progress} aria-label="Progression de l'onboarding propriétaire">
      {ONBOARDING_STEPS.map((item, index) => (
        <span key={item} aria-current={index === stepIndex ? "step" : undefined} />
      ))}
    </div>
  );

  const renderProject = () => (
    <form onSubmit={saveProject} className={styles.activityForm}>
      <div className={styles.header}>
        <span className={styles.kicker}>Étape 1 sur 3</span>
        <h2 id="owner-onboarding-title">Votre projet</h2>
        <p>Dites-nous comment vous souhaitez gérer vos logements pour adapter votre espace propriétaire.</p>
      </div>

      {renderProgress()}

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Comment souhaitez-vous gérer votre location ?</h3>
          <p>Vous pourrez ajuster ce choix plus tard depuis vos objectifs de collaboration.</p>
        </div>
        <div className={styles.choiceGrid}>
          {MANAGEMENT_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${managementMode === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={managementMode === option.value}
              onClick={() => setManagementMode(managementMode === option.value ? "" : option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>De quoi avez-vous besoin ?</h3>
          <p>Sélectionnez un ou plusieurs besoins. Plusieurs choix sont possibles.</p>
        </div>
        <div className={styles.serviceOptions}>
          {NEED_OPTIONS.map((option) => {
            const selected = needs.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.serviceOption} ${selected ? styles.serviceOptionSelected : ""}`}
                aria-pressed={selected}
                onClick={() => toggleNeed(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Où en êtes-vous aujourd'hui ?</h3>
          <p>Votre réponse nous aide à vous proposer le bon niveau d'accompagnement.</p>
        </div>
        <div className={styles.choiceGrid}>
          {SITUATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${situation === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={situation === option.value}
              onClick={() => setSituation(situation === option.value ? "" : option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      {message ? <p className={styles.feedback}>{message}</p> : null}

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondaryAction} onClick={() => setStep("welcome")}>
          <ChevronLeft size={18} aria-hidden="true" />
          Retour
        </button>
        <button type="submit" className={styles.primaryAction} disabled={saving || loadingProfile}>
          {saving ? "Enregistrement..." : "Continuer"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const renderWelcome = () => (
    <>
      <div className={styles.header}>
        <span className={styles.kicker}>Bienvenue</span>
        <h2 id="owner-onboarding-title">Bienvenue sur PlanetLS</h2>
        <p className={styles.lead}>Votre compte propriétaire est créé.</p>
        <p>
          Quelques informations nous permettront d'adapter votre espace à vos logements et à votre façon de
          les gérer.
        </p>
      </div>

      {renderProgress()}

      <div className={styles.steps}>
        {WELCOME_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className={styles.stepCard}>
              <span className={styles.stepIcon}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <span className={styles.stepNumber}>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primaryAction} onClick={() => setStep("project")}>
          Configurer mon espace
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p>
          Quelques minutes suffisent. Vous pourrez modifier ces informations plus tard depuis votre espace
          propriétaire.
        </p>
      </div>
    </>
  );

  const housingRows = housings.slice(0, 4).map((housing, index) => ({
    key:
      typeof housing.id === "string" || typeof housing.id === "number"
        ? String(housing.id)
        : `housing-${index}`,
    name: readHousingName(housing, index),
    city: readHousingCity(housing),
  }));

  const renderHousing = () => (
    <form onSubmit={saveHousing} className={styles.activityForm}>
      <div className={styles.header}>
        <span className={styles.kicker}>Étape 2 sur 3</span>
        <h2 id="owner-onboarding-title">Vos logements &amp; besoins</h2>
        <p>Vérifions vos logements et la fréquence à laquelle vous avez besoin d'aide.</p>
      </div>

      {renderProgress()}

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>{housingRows.length > 0 ? "Vos logements" : "Ajoutez votre premier logement"}</h3>
          {housingRows.length > 0 ? (
            <p>Ces logements sont déjà enregistrés dans votre espace propriétaire.</p>
          ) : (
            <p>
              Votre logement permet à PlanetLS d'organiser vos missions, vos séjours et vos collaborations avec
              les professionnels.
            </p>
          )}
        </div>

        {housingRows.length > 0 ? (
          <>
            <ul className={styles.housingCards}>
              {housingRows.map((row) => (
                <li key={row.key} className={styles.housingCard}>
                  <strong>{row.name}</strong>
                  {row.city ? <span>{row.city}</span> : null}
                </li>
              ))}
              {housings.length > housingRows.length ? (
                <li className={styles.housingCard}>
                  <strong>{`+${housings.length - housingRows.length} autre(s) logement(s)`}</strong>
                </li>
              ) : null}
            </ul>
            <p className={styles.modelNote}>
              {housingCompletion.percentage === 100
                ? "Les informations de vos logements sont complètes."
                : "Certaines informations de vos logements restent à compléter."}
            </p>
            <div className={styles.housingActions}>
              <Link className={styles.secondaryAction} href="/dashboard/owner/logements">
                {housingRows.length > 1 ? "Voir mes logements" : "Compléter mon logement"}
              </Link>
            </div>
          </>
        ) : housingDeferred ? (
          <p className={styles.modelNote}>
            Vous pourrez ajouter votre logement à tout moment depuis votre espace propriétaire.
          </p>
        ) : (
          <div className={styles.housingActions}>
            <Link className={styles.primaryAction} href="/dashboard/owner/logements/create">
              Ajouter mon logement
            </Link>
            <button type="button" className={styles.secondaryAction} onClick={() => setHousingDeferred(true)}>
              Je le ferai plus tard
            </button>
          </div>
        )}
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Vos besoins</h3>
          {selectedNeedLabels.length > 0 ? (
            <p>Vous avez indiqué avoir besoin de :</p>
          ) : (
            <p>Vous n'avez pas encore sélectionné de besoin particulier.</p>
          )}
        </div>
        {selectedNeedLabels.length > 0 ? (
          <ul className={styles.needChips}>
            {selectedNeedLabels.map((label) => (
              <li key={label} className={styles.needChip}>
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>À quelle fréquence avez-vous généralement besoin d'aide ?</h3>
          <p>Une seule réponse possible. Vous pourrez l'ajuster plus tard.</p>
        </div>
        <div className={styles.choiceGrid}>
          {HELP_FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${helpFrequency === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={helpFrequency === option.value}
              onClick={() => setHelpFrequency(helpFrequency === option.value ? "" : option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      {message ? <p className={styles.feedback}>{message}</p> : null}

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondaryAction} onClick={() => setStep("project")}>
          <ChevronLeft size={18} aria-hidden="true" />
          Retour
        </button>
        <button type="submit" className={styles.primaryAction} disabled={saving || loadingProfile}>
          {saving ? "Enregistrement..." : "Continuer"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const renderOrganization = () => (
    <form onSubmit={saveOrganization} className={styles.activityForm}>
      <div className={styles.header}>
        <span className={styles.kicker}>Étape 3 sur 3</span>
        <h2 id="owner-onboarding-title">Votre organisation</h2>
        <p>Dernière étape : indiquez-nous comment vous préférez organiser vos demandes et vos collaborations.</p>
      </div>

      {renderProgress()}

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Comment souhaitez-vous organiser vos demandes ?</h3>
        </div>
        <div className={styles.choiceGrid}>
          {REQUEST_ORG_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${requestOrg === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={requestOrg === option.value}
              onClick={() => setRequestOrg(requestOrg === option.value ? "" : option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Comment préférez-vous régler vos prestations ?</h3>
        </div>
        <div className={styles.choiceGrid}>
          {BILLING_PREF_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${billingPref === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={billingPref === option.value}
              onClick={() => setBillingPref(billingPref === option.value ? "" : option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
        <p className={styles.modelNote}>
          Ce choix indique votre préférence. Les conditions définitives seront convenues avec le professionnel.
        </p>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Comment souhaitez-vous travailler avec vos professionnels ?</h3>
        </div>
        <div className={styles.choiceGrid}>
          {PRO_ORG_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${proOrg === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={proOrg === option.value}
              onClick={() => setProOrg(proOrg === option.value ? "" : option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      {message ? <p className={styles.feedback}>{message}</p> : null}

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondaryAction} onClick={() => setStep("housing")}>
          <ChevronLeft size={18} aria-hidden="true" />
          Retour
        </button>
        <button type="submit" className={styles.primaryAction} disabled={saving || loadingProfile}>
          {saving ? "Enregistrement..." : "Terminer la configuration"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const renderComplete = () => (
    <>
      <div className={styles.header}>
        <span className={styles.successBadge}>Configuration terminée</span>
        <h2 id="owner-onboarding-title">Votre espace est prêt</h2>
        <p>Vous avez terminé la configuration essentielle de votre espace propriétaire.</p>
      </div>

      {renderProgress()}

      <div className={styles.summaryGrid} aria-label="Récapitulatif de votre onboarding">
        <section className={styles.summaryCard}>
          <h3>Projet</h3>
          <ul>
            {managementMode ? <li>{labelOf(MANAGEMENT_MODE_OPTIONS, managementMode)}</li> : null}
            {situationLabel ? <li>{situationLabel}</li> : null}
            {selectedNeedLabels.length > 0 ? <li>{selectedNeedLabels.slice(0, 3).join(" · ")}</li> : null}
            {selectedNeedLabels.length > 3 ? (
              <li>{`+${selectedNeedLabels.length - 3} autre(s) besoin(s)`}</li>
            ) : null}
            {!managementMode && selectedNeedLabels.length === 0 && !situationLabel ? <li>Non renseigné</li> : null}
          </ul>
        </section>

        <section className={styles.summaryCard}>
          <h3>Logements</h3>
          <ul>
            {helpFrequency ? <li>{labelOf(HELP_FREQUENCY_OPTIONS, helpFrequency)}</li> : null}
            <li>{`${housings.length} logement(s) enregistré(s)`}</li>
            <li>{`Complétude : ${housingCompletion.completedCount}/${housingCompletion.totalCount}`}</li>
          </ul>
        </section>

        <section className={styles.summaryCard}>
          <h3>Organisation</h3>
          <ul>
            {requestOrgLabel ? <li>{`Demandes : ${requestOrgLabel}`}</li> : null}
            {billingPrefLabel ? <li>{`Facturation : ${billingPrefLabel}`}</li> : null}
            {proOrgLabel ? <li>{proOrgLabel}</li> : null}
            {!requestOrgLabel && !billingPrefLabel && !proOrgLabel ? <li>Non renseigné</li> : null}
          </ul>
        </section>
      </div>

      <section className={styles.nextBlock}>
        <h3>Et maintenant ?</h3>
        <p>Votre espace est prêt. Vous pourrez compléter vos logements et vos préférences à votre rythme.</p>
        <div className={styles.nextActions}>
          <Link className={styles.secondaryAction} href="/dashboard/owner/logements">
            Ajouter un logement
          </Link>
          <Link className={styles.secondaryAction} href="/dashboard/owner/objectifs">
            Affiner mes préférences
          </Link>
        </div>
      </section>

      {message ? <p className={styles.feedback}>{message}</p> : null}

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondaryAction} onClick={() => setStep("organization")}>
          <ChevronLeft size={18} aria-hidden="true" />
          Retour
        </button>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={finalizeOnboarding}
          disabled={finalizing}
        >
          {finalizing ? "Finalisation..." : "Découvrir mon espace"}
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="owner-onboarding-title">
      <section className={styles.modal}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
          <X size={20} aria-hidden="true" />
        </button>

        {step === "welcome" ? renderWelcome() : null}
        {step === "project" ? renderProject() : null}
        {step === "housing" ? renderHousing() : null}
        {step === "organization" ? renderOrganization() : null}
        {step === "complete" ? renderComplete() : null}
      </section>
    </div>
  );
}
