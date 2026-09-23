"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, ChevronLeft, MapPinned, Sparkles, X } from "lucide-react";
import { buildMissionProfileFromSelection } from "./profile/missionEditing";
import {
  buildLegacyFromMissionProfile,
  parseAvailabilityPayloadRaw,
  parseMissionPayload,
  toMissionTypeId,
} from "./profile/profileMissionPricing";
import { formatExperienceLabel } from "./profile/profilePageConstants";
import type { ConciergeServiceMode } from "@/types/profile";
import styles from "./ConciergePostSignupOnboarding.module.scss";

export type ConciergeOnboardingStep = "welcome" | "activity" | "services" | "organization" | "complete";
type ExperienceLevel = "debutant" | "intermediaire" | "experimente";
type SituationValue = "micro-entreprise" | "societe" | "autre";
type OrganizationCondition = "weekend" | "night" | "highSeason";

const BUSINESS_STEPS = ["activity", "services", "organization"] satisfies ConciergeOnboardingStep[];
const RADIUS_OPTIONS = [10, 20, 30, 50] as const;

const FUTURE_STEPS = [
  {
    number: 1,
    title: "Votre activité",
    description: "Expérience et situation professionnelle.",
    icon: BriefcaseBusiness,
  },
  {
    number: 2,
    title: "Vos services",
    description: "Les prestations que vous souhaitez proposer.",
    icon: Sparkles,
  },
  {
    number: 3,
    title: "Votre organisation",
    description: "Zone d'intervention, disponibilités et préférences de collaboration.",
    icon: MapPinned,
  },
];

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceLevel; description: string }> = [
  {
    value: "debutant",
    description: "Je démarre mon activité ou réalise mes premières missions.",
  },
  {
    value: "intermediaire",
    description: "J'exerce déjà régulièrement cette activité.",
  },
  {
    value: "experimente",
    description: "J'ai une activité bien établie et une expérience confirmée.",
  },
];

const SITUATION_OPTIONS: Array<{ value: SituationValue; label: string; description: string }> = [
  {
    value: "micro-entreprise",
    label: "Micro-entreprise",
    description: "J'exerce avec un statut individuel déjà identifié.",
  },
  {
    value: "societe",
    label: "Entreprise / société",
    description: "Mon activité est portée par une structure professionnelle.",
  },
  {
    value: "autre",
    label: "Autre",
    description: "Je préciserai ma situation depuis mon profil si nécessaire.",
  },
];

const SERVICE_MODE_OPTIONS: Array<{ value: ConciergeServiceMode; label: string; description: string }> = [
  {
    value: "a_la_carte",
    label: "Prestations à la carte",
    description: "Je propose des interventions ponctuelles selon les besoins du propriétaire.",
  },
  {
    value: "full_management",
    label: "Gestion complète",
    description: "Je prends en charge la gestion quotidienne du logement et des voyageurs.",
  },
  {
    value: "both",
    label: "Les deux",
    description: "Je propose des prestations ponctuelles ainsi qu'une prise en charge complète.",
  },
];

const SERVICE_FAMILIES = [
  {
    title: "Accueil et départ",
    services: ["Check-in / accueil voyageurs", "Check-out / contrôle de sortie"],
  },
  {
    title: "Ménage",
    services: ["Ménage entre deux séjours", "Ménage ponctuel", "Grand ménage / remise en état", "Contrôle du ménage"],
  },
  {
    title: "Linge",
    services: ["Linge et blanchisserie", "Préparation des lits"],
  },
  {
    title: "Intendance",
    services: ["Intendance / contrôle du logement", "Réassort / petites courses"],
  },
  {
    title: "Maintenance",
    services: [
      "Maintenance légère",
      "Gestion / signalement des incidents",
      "Réception / coordination d'un artisan",
    ],
  },
];

const FULL_MANAGEMENT_GROUPS = [
  {
    title: "Gestion",
    services: [
      "Gestion de l'annonce",
      "Gestion des réservations",
      "Communication voyageurs",
      "Coordination des opérations",
      "Suivi du logement",
    ],
  },
  {
    title: "Services terrain",
    services: ["Check-in", "Check-out", "Ménage", "Linge", "Intendance", "Maintenance"],
  },
];

const A_LA_CARTE_SERVICE_LABELS = new Set(SERVICE_FAMILIES.flatMap((family) => family.services));

const ORGANIZATION_CONDITIONS: Array<{ value: OrganizationCondition; label: string }> = [
  { value: "weekend", label: "Week-end" },
  { value: "night", label: "En soirée" },
  { value: "highSeason", label: "Haute saison" },
];

type CurrentProfilePayload = {
  experience_level?: ExperienceLevel | null;
  years_experience?: number | string | null;
  legal_form?: string | null;
  availability_hours?: string | null;
  location?: string | null;
  service_area?: string | null;
  service_mode?: string | null;
  city?: string | null;
  service_radius_km?: number | string | null;
};

export async function markConciergeOnboardingComplete() {
  const response = await fetch("/api/profiles", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarding_complete: true }),
  });

  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error || "Impossible de finaliser l'onboarding.");
  }

  window.dispatchEvent(new Event("user-profile-updated"));
  return payload;
}

type ConciergePostSignupOnboardingProps = {
  open: boolean;
  currentStep?: ConciergeOnboardingStep;
  onClose: () => void;
};

const getBusinessStepIndex = (step: ConciergeOnboardingStep) => {
  const index = BUSINESS_STEPS.indexOf(step as (typeof BUSINESS_STEPS)[number]);
  return index >= 0 ? index : 0;
};

const parseSituationValue = (value?: string | null): SituationValue | "" => {
  if (value === "micro-entreprise" || value === "societe" || value === "autre") return value;
  return "";
};

const parseServiceMode = (value?: string | null): ConciergeServiceMode | "" => {
  return value === "a_la_carte" || value === "full_management" || value === "both" ? value : "";
};

export default function ConciergePostSignupOnboarding({
  open,
  currentStep = "welcome",
  onClose,
}: ConciergePostSignupOnboardingProps) {
  const [step, setStep] = useState<ConciergeOnboardingStep>(currentStep);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [situation, setSituation] = useState<SituationValue | "">("");
  const [serviceMode, setServiceMode] = useState<ConciergeServiceMode | "">("");
  const [persistedServiceMode, setPersistedServiceMode] = useState<ConciergeServiceMode | "">("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availabilityHours, setAvailabilityHours] = useState<string | null>(null);
  const [primaryLocation, setPrimaryLocation] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number | "">("");
  const [organizationConditions, setOrganizationConditions] = useState<Record<OrganizationCondition, boolean>>({
    weekend: false,
    night: false,
    highSeason: false,
  });
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

    const loadProfile = async () => {
      setLoadingProfile(true);
      setMessage("");

      try {
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const profile = (await response.json()) as CurrentProfilePayload;

        if (!response.ok) {
          throw new Error("Impossible de charger votre profil.");
        }

        if (!isMounted) return;
        setExperienceLevel(profile.experience_level ?? "");
        setYearsExperience(profile.years_experience == null ? "" : String(profile.years_experience));
        setSituation(parseSituationValue(profile.legal_form));
        setAvailabilityHours(profile.availability_hours ?? null);
        setPrimaryLocation(profile.location?.trim() || profile.service_area?.trim() || profile.city?.trim() || "");
        setServiceRadiusKm(
          typeof profile.service_radius_km === "number"
            ? profile.service_radius_km
            : typeof profile.service_radius_km === "string" && Number.isFinite(Number(profile.service_radius_km))
              ? Number(profile.service_radius_km)
              : "",
        );
        const missionPayload = parseMissionPayload(profile.availability_hours);
        setOrganizationConditions({
          weekend: missionPayload.missionProfile.specialConditions.acceptWeekendInterventions,
          night: missionPayload.missionProfile.specialConditions.acceptNightInterventions,
          highSeason: missionPayload.missionProfile.specialConditions.acceptHighSeasonInterventions,
        });
        setSelectedServices(
          missionPayload.missionProfile.missions.filter((mission) => mission.isActive && A_LA_CARTE_SERVICE_LABELS.has(mission.label))
            .map((mission) => mission.label),
        );
        const profileServiceMode = parseServiceMode(profile.service_mode);
        setServiceMode(profileServiceMode);
        setPersistedServiceMode(profileServiceMode);
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

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [open]);

  if (!open) return null;

  const businessStepIndex = getBusinessStepIndex(step);

  const saveActivity = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const parsedYears = yearsExperience.trim() === "" ? null : Number(yearsExperience);
      if (parsedYears !== null && (!Number.isFinite(parsedYears) || parsedYears < 0)) {
        throw new Error("Le nombre d'années d'expérience doit être positif.");
      }

      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience_level: experienceLevel || null,
          years_experience: parsedYears,
          legal_form: situation || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.error) {
        throw new Error(payload?.error || "Impossible d'enregistrer votre activité.");
      }

      window.dispatchEvent(new Event("user-profile-updated"));
      setStep("services");
      setMessage("Votre activité est enregistrée. Vous pouvez maintenant choisir vos services.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer votre activité.");
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (label: string) => {
    setSelectedServices((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  const toggleOrganizationCondition = (condition: OrganizationCondition) => {
    setOrganizationConditions((current) => ({
      ...current,
      [condition]: !current[condition],
    }));
  };

  const saveServices = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (!serviceMode) {
        throw new Error("Choisissez une façon de travailler pour continuer.");
      }

      const parsed = parseMissionPayload(availabilityHours);
      const missionProfile = buildMissionProfileFromSelection(parsed, selectedServices, toMissionTypeId);
      const legacy = buildLegacyFromMissionProfile(missionProfile);
      const nextAvailabilityHours = JSON.stringify({
        ...parseAvailabilityPayloadRaw(availabilityHours),
        missionProfile,
        missionCatalog: legacy.missionCatalog,
        preferences: legacy.preferences,
      });

      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability_hours: nextAvailabilityHours,
          service_mode: serviceMode,
        }),
      });
      const payload = (await response.json()) as CurrentProfilePayload & { error?: string };

      if (!response.ok || payload?.error) {
        throw new Error(payload?.error || "Impossible d'enregistrer vos services.");
      }

      setAvailabilityHours(nextAvailabilityHours);
      setPersistedServiceMode(parseServiceMode(payload.service_mode) || serviceMode);
      window.dispatchEvent(new Event("user-profile-updated"));
      setStep("organization");
      setMessage("Vos services sont enregistrés.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer vos services.");
    } finally {
      setSaving(false);
    }
  };

  const saveOrganization = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const location = primaryLocation.trim() || null;
      const radiusKm = typeof serviceRadiusKm === "number" ? serviceRadiusKm : null;
      const parsed = parseMissionPayload(availabilityHours);
      const missionProfile = {
        ...parsed.missionProfile,
        specialConditions: {
          ...parsed.missionProfile.specialConditions,
          acceptWeekendInterventions: organizationConditions.weekend,
          acceptNightInterventions: organizationConditions.night,
          acceptHighSeasonInterventions: organizationConditions.highSeason,
        },
      };
      const nextAvailabilityHours = JSON.stringify({
        ...parseAvailabilityPayloadRaw(availabilityHours),
        missionProfile,
      });

      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          service_area: location,
          city: location,
          service_radius_km: radiusKm,
          availability_hours: nextAvailabilityHours,
        }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.error) {
        throw new Error(payload?.error || "Impossible d'enregistrer votre organisation.");
      }

      setAvailabilityHours(nextAvailabilityHours);
      window.dispatchEvent(new Event("user-profile-updated"));
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
      await markConciergeOnboardingComplete();
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

  const selectedConditionLabels = ORGANIZATION_CONDITIONS.filter(
    (condition) => organizationConditions[condition.value],
  ).map((condition) => condition.label);

  const activeServiceMode = persistedServiceMode || serviceMode;
  const serviceModeLabel = SERVICE_MODE_OPTIONS.find((option) => option.value === activeServiceMode)?.label ?? "";

  const renderProgress = () => (
    <div className={styles.progress} aria-label="Progression de l'onboarding concierge">
      {FUTURE_STEPS.map((item, index) => (
        <span key={item.title} aria-current={index === businessStepIndex ? "step" : undefined} />
      ))}
    </div>
  );

  const renderWelcome = () => (
    <>
      <div className={styles.header}>
        <span className={styles.kicker}>Bienvenue</span>
        <h2 id="concierge-onboarding-title">Bienvenue sur PlanetLS</h2>
        <p className={styles.lead}>Votre compte est créé.</p>
        <p>Quelques informations nous permettront maintenant d'adapter votre espace à votre activité.</p>
      </div>

      {renderProgress()}

      <div className={styles.steps}>
        {FUTURE_STEPS.map((item) => {
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
        <button type="button" className={styles.primaryAction} onClick={() => setStep("activity")}>
          Configurer mon profil
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p>Quelques minutes suffisent. Vous pourrez modifier ces informations plus tard depuis votre profil.</p>
      </div>
    </>
  );

  const renderActivity = () => (
    <form onSubmit={saveActivity} className={styles.activityForm}>
      <div className={styles.header}>
        <span className={styles.kicker}>Étape 1 sur 3</span>
        <h2 id="concierge-onboarding-title">Votre activité</h2>
        <p>Parlez-nous brièvement de votre activité pour adapter votre espace PlanetLS.</p>
      </div>

      {renderProgress()}

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Votre expérience</h3>
          <p>Oû en êtes-vous aujourd'hui dans votre activité ?</p>
        </div>
        <div className={styles.choiceGrid}>
          {EXPERIENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${experienceLevel === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={experienceLevel === option.value}
              onClick={() => setExperienceLevel(option.value)}
            >
              <strong>{formatExperienceLabel(option.value)}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.formSection}>
        <label className={styles.inlineField}>
          <span>Depuis combien de temps exercez-vous ?</span>
          <input
            type="number"
            min="0"
            step="1"
            value={yearsExperience}
            onChange={(event) => setYearsExperience(event.target.value)}
            placeholder="Nombre d'années"
          />
        </label>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Votre situation</h3>
          <p>Le profil actuel permet de renseigner la forme juridique de votre activité.</p>
        </div>
        <div className={styles.choiceGrid}>
          {SITUATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${situation === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={situation === option.value}
              onClick={() => setSituation(option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
        <p className={styles.modelNote}>
          "Complément de revenu" n'est pas enregistré ici : le modèle actuel ne dispose pas d'un champ dédié distinct
          de la forme juridique.
        </p>
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

  const renderFullManagementBlock = () => (
    <section className={styles.fullManagementBlock}>
      <div className={styles.sectionHeading}>
        <h3>Gestion complète du logement</h3>
        <p>Votre offre comprend la gestion quotidienne du logement et des voyageurs.</p>
      </div>
      <div className={styles.includedGrid}>
        {FULL_MANAGEMENT_GROUPS.map((group) => (
          <div key={group.title} className={styles.includedGroup}>
            <h4>{group.title}</h4>
            <ul>
              {group.services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className={styles.modelNote}>
        Vous pourrez préciser plus tard l'organisation de ces prestations, vos partenaires, vos conditions et vos tarifs.
      </p>
    </section>
  );

  const renderAlaCarteServices = () => (
    <section className={styles.formSection}>
      <div className={styles.sectionHeading}>
        <h3>Quels services proposez-vous ?</h3>
        <p>Sélectionnez librement les prestations que vous souhaitez réaliser.</p>
      </div>
      <div className={styles.serviceFamilies}>
        {SERVICE_FAMILIES.map((family) => (
          <div key={family.title} className={styles.serviceFamily}>
            <h4>{family.title}</h4>
            <div className={styles.serviceOptions}>
              {family.services.map((service) => {
                const selected = selectedServices.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    className={`${styles.serviceOption} ${selected ? styles.serviceOptionSelected : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderServices = () => (
    <form onSubmit={saveServices} className={styles.activityForm}>
      <div className={styles.header}>
        <span className={styles.kicker}>Étape 2 sur 3</span>
        <h2 id="concierge-onboarding-title">Vos services</h2>
        <p>Choisissez la façon dont vous souhaitez accompagner les propriétaires.</p>
      </div>
      {renderProgress()}

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Comment souhaitez-vous travailler ?</h3>
        </div>
        <div className={styles.choiceGrid}>
          {SERVICE_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.choiceCard} ${serviceMode === option.value ? styles.choiceCardSelected : ""}`}
              aria-pressed={serviceMode === option.value}
              onClick={() => setServiceMode(option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      {serviceMode === "full_management" || serviceMode === "both" ? renderFullManagementBlock() : null}
      {serviceMode === "a_la_carte" || serviceMode === "both" ? renderAlaCarteServices() : null}

      {message ? <p className={styles.feedback}>{message}</p> : null}
      <div className={styles.actionBar}>
        <button type="button" className={styles.secondaryAction} onClick={() => setStep("activity")}>
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
        <h2 id="concierge-onboarding-title">Votre organisation</h2>
        <p>Indiquez votre secteur principal et les conditions dans lesquelles vous pouvez intervenir.</p>
      </div>
      {renderProgress()}

      <section className={styles.formSection}>
        <label className={styles.inlineField}>
          <span>Où intervenez-vous principalement ?</span>
          <small>
            Indiquez votre ville de référence. Vous pourrez ajouter d'autres zones d'intervention plus tard depuis votre
            profil.
          </small>
          <input
            type="text"
            value={primaryLocation}
            onChange={(event) => setPrimaryLocation(event.target.value)}
            placeholder="Ville principale"
          />
        </label>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Jusqu'où intervenez-vous autour de votre ville principale ?</h3>
          <p>Vous pourrez ajouter d'autres zones d'intervention plus tard depuis votre profil.</p>
        </div>
        <div className={styles.segmentedOptions} aria-label="Rayon d'intervention">
          {RADIUS_OPTIONS.map((radius) => (
            <button
              key={radius}
              type="button"
              className={`${styles.segmentedOption} ${serviceRadiusKm === radius ? styles.segmentedOptionSelected : ""}`}
              aria-pressed={serviceRadiusKm === radius}
              onClick={() => setServiceRadiusKm(radius)}
            >
              {radius} km
            </button>
          ))}
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <h3>Vos disponibilités particulières</h3>
          <p>En complément de vos disponibilités habituelles, pouvez-vous intervenir dans ces situations ?</p>
        </div>
        <div className={styles.compactToggleGrid}>
          {ORGANIZATION_CONDITIONS.map((condition) => (
            <button
              key={condition.value}
              type="button"
              className={`${styles.compactToggle} ${
                organizationConditions[condition.value] ? styles.compactToggleSelected : ""
              }`}
              aria-pressed={organizationConditions[condition.value]}
              onClick={() => toggleOrganizationCondition(condition.value)}
            >
              {condition.label}
            </button>
          ))}
        </div>
      </section>

      {message ? <p className={styles.feedback}>{message}</p> : null}
      <div className={styles.actionBar}>
        <button type="button" className={styles.secondaryAction} onClick={() => setStep("services")}>
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

  const renderComplete = () => (
    <>
      <div className={styles.header}>
        <span className={styles.successBadge}>Prêt</span>
        <h2 id="concierge-onboarding-title">Votre profil est prêt</h2>
        <p>Vous avez terminé la configuration essentielle de votre activité sur PlanetLS.</p>
        <p>
          Vous pourrez maintenant compléter progressivement vos tarifs, vos offres et les informations de votre profil
          depuis votre espace.
        </p>
      </div>
      {renderProgress()}

      <div className={styles.summaryGrid} aria-label="Récapitulatif de votre onboarding">
        <section className={styles.summaryCard}>
          <h3>Activité</h3>
          <ul>
            {experienceLevel ? <li>{formatExperienceLabel(experienceLevel)}</li> : null}
            {yearsExperience.trim() ? <li>{yearsExperience.trim()} an(s) d'expérience</li> : null}
            {situation ? <li>{SITUATION_OPTIONS.find((option) => option.value === situation)?.label}</li> : null}
            {!experienceLevel && !yearsExperience.trim() && !situation ? <li>Non renseigné</li> : null}
          </ul>
        </section>

        <section className={styles.summaryCard}>
          <h3>Services</h3>
          <ul>
            {serviceModeLabel ? <li>{serviceModeLabel}</li> : null}
            {selectedServices.length > 0 ? <li>{selectedServices.slice(0, 3).join(" · ")}</li> : null}
            {selectedServices.length > 3 ? <li>+{selectedServices.length - 3} autre(s) prestation(s)</li> : null}
            {!serviceModeLabel && selectedServices.length === 0 ? <li>Non renseigné</li> : null}
          </ul>
        </section>

        <section className={styles.summaryCard}>
          <h3>Organisation</h3>
          <ul>
            {primaryLocation.trim() || serviceRadiusKm ? (
              <li>
                {[primaryLocation.trim(), serviceRadiusKm ? `${serviceRadiusKm} km` : ""].filter(Boolean).join(" · ")}
              </li>
            ) : null}
            {selectedConditionLabels.length > 0 ? <li>{selectedConditionLabels.join(" · ")}</li> : null}
            {!primaryLocation.trim() && !serviceRadiusKm && selectedConditionLabels.length === 0 ? (
              <li>Non renseigné</li>
            ) : null}
          </ul>
        </section>
      </div>

      <section className={styles.nextBlock}>
        <h3>Et maintenant ?</h3>
        <p>Votre espace est prêt. Vous pourrez compléter vos tarifs, vos offres et votre profil à votre rythme.</p>
      </section>

      {message ? <p className={styles.feedback}>{message}</p> : null}
      <div className={styles.actionBar}>
        <button type="button" className={styles.secondaryAction} onClick={() => setStep("organization")}>
          <ChevronLeft size={18} aria-hidden="true" />
          Retour
        </button>
        <button type="button" className={styles.primaryAction} onClick={finalizeOnboarding} disabled={finalizing}>
          {finalizing ? "Finalisation..." : "Découvrir mon espace"}
        </button>
      </div>
    </>
  );
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="concierge-onboarding-title">
      <section className={styles.modal}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
          <X size={20} aria-hidden="true" />
        </button>

        {step === "welcome" ? renderWelcome() : null}
        {step === "activity" ? renderActivity() : null}
        {step === "services" ? renderServices() : null}
        {step === "organization" ? renderOrganization() : null}
        {step === "complete" ? renderComplete() : null}
      </section>
    </div>
  );
}
