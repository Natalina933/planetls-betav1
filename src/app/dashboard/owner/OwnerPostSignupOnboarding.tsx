"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ChevronLeft, Home, ListChecks, X } from "lucide-react";
import { buildOwnerHousingCompletion } from "@/app/dashboard/shared/categoryCompletion";
import {
  EMPTY_OWNER_ONBOARDING_V1,
  getOwnerProfilePreferences,
  type OwnerOnboardingHelpFrequency,
  type OwnerOnboardingManagementMode,
  type OwnerOnboardingNeed,
  type OwnerOnboardingSituation,
  type OwnerOnboardingV1,
  type OwnerProfilePreferences,
} from "@/features/owner-preferences/profilePreferences";
import styles from "./OwnerPostSignupOnboarding.module.scss";

export type OwnerOnboardingStep = "welcome" | "project" | "housing" | "complete";

type CurrentProfilePayload = {
  availability_hours?: string | null;
  location?: string | null;
  city?: string | null;
  service_area?: string | null;
  error?: string;
};

type OwnerHousingRow = Record<string, unknown>;

type Option<Value extends string> = {
  value: Value;
  label: string;
  description?: string;
};

const ONBOARDING_STEPS: OwnerOnboardingStep[] = ["project", "housing"];
const DEFAULT_CONCIERGE_SEARCH_RADIUS_KM = "20";

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
  currentStep?: OwnerOnboardingStep | "organization";
  onClose: () => void;
  onPostpone?: () => void;
};

export default function OwnerPostSignupOnboarding({
  open,
  currentStep = "welcome",
  onClose,
  onPostpone = onClose,
}: OwnerPostSignupOnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState<OwnerOnboardingStep>(() =>
    currentStep === "organization" ? "housing" : currentStep,
  );
  const [managementMode, setManagementMode] = useState<OwnerOnboardingManagementMode | "">("");
  const [needs, setNeeds] = useState<OwnerOnboardingNeed[]>([]);
  const [situation, setSituation] = useState<OwnerOnboardingSituation | "">("");
  const [helpFrequency, setHelpFrequency] = useState<OwnerOnboardingHelpFrequency | "">("");
  const [preferences, setPreferences] = useState<OwnerProfilePreferences | null>(null);
  const [signupCity, setSignupCity] = useState("");
  const [housings, setHousings] = useState<OwnerHousingRow[]>([]);
  const [housingDeferred, setHousingDeferred] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    // L'étape historique « organization » n'est plus proposée : reprendre au logement.
    setStep(currentStep === "organization" ? "housing" : currentStep);
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
        setSignupCity(
          [profile.city, profile.location, profile.service_area]
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .find((value) => value.length > 0) ?? "",
        );
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
      setStep("complete");
      setMessage("Votre rythme d'accompagnement est enregistré. Votre espace est prêt.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer vos logements.");
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
  const conciergeSearchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (signupCity.trim()) {
      params.set("city", signupCity.trim());
    }
    params.set("radiusKm", DEFAULT_CONCIERGE_SEARCH_RADIUS_KM);
    return params.toString();
  }, [signupCity]);
  const conciergeSearchHref = conciergeSearchParams
    ? `/dashboard/owner/concierges?${conciergeSearchParams}`
    : "/dashboard/owner/concierges";

  const openConciergeSearch = () => {
    onClose();
    router.push(conciergeSearchHref);
  };
  const stepIndex = ONBOARDING_STEPS.indexOf(step === "complete" ? "housing" : step);
  const selectedNeedLabels = needs.map((need) => labelOf(NEED_OPTIONS, need)).filter(Boolean);

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
        <span className={styles.kicker}>Étape 1 sur 2</span>
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
        <button type="button" className={styles.laterAction} onClick={onPostpone}>
          Je le ferai plus tard
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

      <div className={styles.steps}>
        {WELCOME_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className={styles.stepCard}>
              <span className={styles.stepIcon}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <span className={styles.stepNumber}>{item.number} / 2</span>
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
        <button type="button" className={styles.laterAction} onClick={onPostpone}>
          Je le ferai plus tard
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
        <span className={styles.kicker}>Étape 2 sur 2</span>
        <h2 id="owner-onboarding-title">Vos logements &amp; besoins</h2>
        <p>Vérifions vos logements et la fréquence à laquelle vous avez besoin d&apos;aide.</p>
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
        <button type="button" className={styles.laterAction} onClick={onPostpone}>
          Je le ferai plus tard
        </button>
        <button type="submit" className={styles.primaryAction} disabled={saving || loadingProfile}>
          {saving ? "Enregistrement..." : "Continuer"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const renderComplete = () => (
    <div className={`${styles.complete} ${styles.completePremium}`}>
      <p className={styles.completeEyebrow}>Bienvenue sur PlanetLS</p>
      <h2 id="owner-onboarding-title" className={styles.completeTitle}>
        Votre espace est prêt
      </h2>
      <Image
        src="/ornements/divider.png"
        alt=""
        aria-hidden="true"
        width={320}
        height={24}
        className={styles.completeDivider}
      />
      <p className={styles.completeDescription}>
        Découvrez les concierges proches de chez vous pour donner vie à votre projet.
      </p>

      <button type="button" className={styles.primaryAction} onClick={openConciergeSearch}>
        Trouver ma concierge
        <ArrowRight size={18} aria-hidden="true" />
      </button>
      <p className={styles.completeHint}>Vous pourrez compléter vos préférences plus tard.</p>

      {message ? <p className={styles.feedback}>{message}</p> : null}

      <div className={styles.actionBar}>
        <Link className={styles.secondaryAction} href="/dashboard/owner/logements">
          Ajouter un logement
        </Link>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={finalizeOnboarding}
          disabled={finalizing}
        >
          {finalizing ? "Finalisation..." : "Découvrir mon espace"}
        </button>
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="owner-onboarding-title">
      <section className={styles.modal}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
          <X size={20} aria-hidden="true" />
        </button>

        {step === "welcome" ? renderWelcome() : null}
        {step === "project" ? renderProject() : null}
        {step === "housing" ? renderHousing() : null}
        {step === "complete" ? renderComplete() : null}
      </section>
    </div>
  );
}
