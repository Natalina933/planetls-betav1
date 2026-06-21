"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import OnboardingStepHeader from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";
import { trackOnboardingEvent } from "@/app/lib/onboardingAnalytics";
import {
  CONCIERGE_PROPERTY_TYPES,
  OWNER_PROPERTY_TYPES,
} from "@/features/shared/data/propertyTypes";
import styles from "./AccessPopup.module.scss";

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalInfo: string;
  companyName: string;
  legalForm: string;
  serviceRadiusKm: string;
  availability: string;
  missionPreference: string;
  signupMode: string;
  onboardingGoal: string;
  supportNeed: string;
  existingTools: string[];
  businessLink: string;
  propertyTypes: string[];
  propertyType: string;
  needVolume: string;
  tradeBody: string;
  startingPriceRange: string;
  firstRequestTemplate: string;
}

interface AccessPopupProps {
  selectedOptions: string[];
  initialData?: Partial<FormData>;
  recap: {
    category: string;
    searchTarget: string;
    location: string;
    experienceLevel: string;
    yearsExperience: string;
  };
  onBack: () => void;
  onClose: () => void;
  onValidate: (data: FormData) => void;
}

type ProfileKey = "proprietaire" | "concierge" | "artisan";
type ExpressStep = 1 | 2 | 3;

const PROFILE_COPY: Record<
  ProfileKey,
  {
    title: string;
    intro: string;
    needLabel: string;
    targetLabel: string;
  }
> = {
  proprietaire: {
    title: "Étape 4/5 - Vos coordonnées",
    intro: "Renseignez vos informations pour que nous puissions vous recontacter et préparer la suite.",
    needLabel: "Votre besoin",
    targetLabel: "Vous recherchez",
  },
  concierge: {
    title: "Étape 4/5 - Vos coordonnées",
    intro: "Renseignez vos informations et précisez votre activité pour recevoir des demandes adaptées.",
    needLabel: "Vos services ou précisions",
    targetLabel: "Vous souhaitez collaborer avec",
  },
  artisan: {
    title: "Étape 4/5 - Vos coordonnées",
    intro: "Renseignez vos informations pour présenter votre activité et faciliter les premiers contacts.",
    needLabel: "Votre spécialité ou précisions",
    targetLabel: "Vous souhaitez collaborer avec",
  },
};

const CONCIERGE_TOOLS = [
  "Airbnb",
  "Booking",
  "Google Agenda",
  "Excel / Google Sheets",
  "WhatsApp",
  "Smoobu / Guesty",
];

const OWNER_GOALS = [
  { value: "gestion_complete", label: "Déléguer la gestion complète" },
  { value: "besoin_ponctuel", label: "Service ponctuel" },
  { value: "comparer_concierges", label: "Comparer plusieurs concierges" },
];

const OWNER_NEED_VOLUMES = [
  { value: "occasionnel", label: "Occasionnel" },
  { value: "regulier", label: "Régulier" },
  { value: "saisonnier", label: "Saisonnier" },
  { value: "urgent", label: "Besoin urgent" },
];

const TRADE_BODIES = [
  "Plomberie",
  "Électricité",
  "Ménage professionnel",
  "Peinture",
  "Jardin / piscine",
  "Petits travaux",
  "Serrurerie",
  "Autre métier",
];

const ARTISAN_PRICE_RANGES = [
  { value: "sur_devis", label: "Sur devis" },
  { value: "moins_50", label: "Moins de 50 € / h" },
  { value: "50_80", label: "50 à 80 € / h" },
  { value: "80_plus", label: "80 € / h et +" },
];

const ARTISAN_URGENCY_LEVELS = [
  { value: "urgence_24h", label: "Urgences sous 24 h" },
  { value: "interventions_planifiees", label: "Interventions planifiées" },
  { value: "les_deux", label: "Les deux" },
];

const ARTISAN_INSURANCE_OPTIONS = [
  { value: "assurance_ok", label: "Assurance professionnelle à jour" },
  { value: "assurance_a_preciser", label: "À préciser plus tard" },
];

const ARTISAN_SLOTS = [
  "Matin",
  "Après-midi",
  "Soir",
  "Week-end",
];

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const getProfileKey = (category: string): ProfileKey => {
  if (category === "proprietaire" || category === "artisan" || category === "concierge") {
    return category;
  }
  return "concierge";
};

export default function AccessPopup({
  selectedOptions,
  initialData,
  recap,
  onBack,
  onClose,
  onValidate,
}: AccessPopupProps) {
  const profileKey = getProfileKey(recap.category);
  const defaultSignupMode =
    profileKey === "concierge" && recap.experienceLevel === "experimente" ? "express" : "simple";
  const [form, setForm] = useState<FormData>({
    firstName: initialData?.firstName ?? "",
    lastName: initialData?.lastName ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    additionalInfo: initialData?.additionalInfo ?? "",
    companyName: initialData?.companyName ?? "",
    legalForm: initialData?.legalForm ?? "",
    serviceRadiusKm: initialData?.serviceRadiusKm ?? "30",
    availability: initialData?.availability ?? "",
    missionPreference: initialData?.missionPreference ?? "",
    signupMode: initialData?.signupMode ?? defaultSignupMode,
    onboardingGoal: initialData?.onboardingGoal ?? "",
    supportNeed: initialData?.supportNeed ?? "",
    existingTools: initialData?.existingTools ?? [],
    businessLink: initialData?.businessLink ?? "",
    propertyTypes: initialData?.propertyTypes ?? [],
    propertyType: initialData?.propertyType ?? "",
    needVolume: initialData?.needVolume ?? "",
    tradeBody: initialData?.tradeBody ?? "",
    startingPriceRange: initialData?.startingPriceRange ?? "",
    firstRequestTemplate: initialData?.firstRequestTemplate ?? "",
  });
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();
  const [submitError, setSubmitError] = useState("");
  const [expressStep, setExpressStep] = useState<ExpressStep>(1);
  const popupRef = useRef<HTMLDivElement>(null);
  const copy = PROFILE_COPY[profileKey];
  const isSimpleMode = form.signupMode === "simple";
  const isExpressMode = form.signupMode === "express";
  const isBusinessMode = form.signupMode === "business";
  const titleId = "access-popup-title";
  const isConciergeExpress = profileKey === "concierge" && isExpressMode;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!initialData) return;
    setForm({
      firstName: initialData.firstName ?? "",
      lastName: initialData.lastName ?? "",
      email: initialData.email ?? "",
      phone: initialData.phone ?? "",
      additionalInfo: initialData.additionalInfo ?? "",
      companyName: initialData.companyName ?? "",
      legalForm: initialData.legalForm ?? "",
      serviceRadiusKm: initialData.serviceRadiusKm ?? "30",
      availability: initialData.availability ?? "",
      missionPreference: initialData.missionPreference ?? "",
      signupMode: initialData.signupMode ?? defaultSignupMode,
      onboardingGoal: initialData.onboardingGoal ?? "",
      supportNeed: initialData.supportNeed ?? "",
      existingTools: initialData.existingTools ?? [],
      businessLink: initialData.businessLink ?? "",
      propertyTypes: initialData.propertyTypes ?? [],
      propertyType: initialData.propertyType ?? "",
      needVolume: initialData.needVolume ?? "",
      tradeBody: initialData.tradeBody ?? "",
      startingPriceRange: initialData.startingPriceRange ?? "",
      firstRequestTemplate: initialData.firstRequestTemplate ?? "",
    });
  }, [defaultSignupMode, initialData]);

  useEffect(() => {
    if (!isConciergeExpress) {
      setExpressStep(1);
    }
  }, [isConciergeExpress]);

  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [handleOutsideClick]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitError) {
      setSubmitError("");
    }
  };

  const togglePropertyType = (propertyType: string) => {
    setForm((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(propertyType)
        ? prev.propertyTypes.filter((item) => item !== propertyType)
        : [...prev.propertyTypes, propertyType],
    }));
  };

  const toggleExistingTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      existingTools: prev.existingTools.includes(tool)
        ? prev.existingTools.filter((item) => item !== tool)
        : [...prev.existingTools, tool],
    }));
  };

  const advanceExpressStep = () => {
    if (expressStep === 1 && !form.serviceRadiusKm) {
      setSubmitError("Choisissez un rayon d'intervention pour continuer en express.");
      return;
    }

    if (expressStep === 2 && !form.missionPreference) {
      setSubmitError("Précisez le type de collaboration recherché pour finaliser le mode express.");
      return;
    }

    trackOnboardingEvent({
      step: 4,
      category: recap.category,
      action: "concierge_onboarding_step_completed",
      metadata: {
        signupMode: "express",
        onboardingVariant: "express",
        expressStep,
        serviceRadiusKm: form.serviceRadiusKm,
        missionPreference: form.missionPreference,
        selectedServicesCount: selectedOptions.length,
      },
    });
    setSubmitError("");
    setExpressStep((current) => (current + 1) as ExpressStep);
  };

  const handleBackAction = () => {
    if (isConciergeExpress && expressStep > 1) {
      setExpressStep((current) => (current - 1) as ExpressStep);
      setSubmitError("");
      return;
    }

    onBack();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isConciergeExpress && expressStep < 3) {
      advanceExpressStep();
      return;
    }

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (!firstName || !lastName || !email) {
      setSubmitError("Veuillez renseigner au minimum votre prénom, votre nom et votre email.");
      return;
    }

    if (!isValidEmail(email)) {
      setSubmitError("Veuillez saisir une adresse email valide pour continuer.");
      return;
    }

    onValidate({
      ...form,
      firstName,
      lastName,
      email,
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={styles.popup} ref={popupRef}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer la fenêtre">
          <FaTimes />
        </button>

        <OnboardingStepHeader
          title={"Étape 4/5 - Vos coordonnées"}
          step={4}
          readabilityScale={readabilityScale}
          onReadabilityChange={setReadabilityScale}
        />

        <h2 id={titleId}>{copy.title}</h2>
        <p className={styles.introText}>{copy.intro}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {submitError ? <p className={styles.formAlert}>{submitError}</p> : null}

          {isConciergeExpress ? (
            <section className={styles.expressFlow} aria-label="Parcours d'inscription express concierge">
              <div className={styles.expressHeader}>
                <span>Express {expressStep}/3</span>
                <strong>
                  {expressStep === 1
                    ? "Zone + services"
                    : expressStep === 2
                      ? "Capacité + activité"
                      : "Confirmation + contact"}
                </strong>
              </div>

              {expressStep === 1 ? (
                <div className={styles.expressPanel}>
                  <div className={styles.expressSummary}>
                    <strong>Services sélectionnés</strong>
                    <span>
                      {selectedOptions.length > 0
                        ? selectedOptions.join(", ")
                        : "Vous pourrez les ajuster depuis votre profil."}
                    </span>
                  </div>

                  <label className={styles.radiusField}>
                    <span>
                      Rayon maximum
                      <small>Autour de {recap.location || "votre ville"} pour recevoir des missions réalistes.</small>
                    </span>
                    <select name="serviceRadiusKm" value={form.serviceRadiusKm} onChange={handleSelectChange}>
                      <option value="10">10 km maximum</option>
                      <option value="20">20 km maximum</option>
                      <option value="30">30 km maximum</option>
                      <option value="50">50 km maximum</option>
                    </select>
                  </label>

                  <fieldset className={styles.checkboxGroup}>
                    <legend>Types de biens que vous pouvez gérer</legend>
                    {CONCIERGE_PROPERTY_TYPES.map((propertyType) => (
                      <label key={propertyType}>
                        <input
                          type="checkbox"
                          checked={form.propertyTypes.includes(propertyType)}
                          onChange={() => togglePropertyType(propertyType)}
                        />
                        <span>{propertyType}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              ) : null}

              {expressStep === 2 ? (
                <div className={styles.expressPanel}>
                  <div className={styles.expressSummary}>
                    <strong>{recap.yearsExperience || "Expérience confirmée"}</strong>
                    <span>On garde l&apos;essentiel pour vous projeter vite vers vos premières actions métier.</span>
                  </div>

                  <label>
                    Objectif principal
                    <select name="onboardingGoal" value={form.onboardingGoal} onChange={handleSelectChange}>
                      <option value="">À préciser plus tard</option>
                      <option value="premieres_missions">Trouver mes premières missions</option>
                      <option value="structurer_activite">Structurer mon activité de conciergerie</option>
                      <option value="developper_portefeuille">Développer mon portefeuille clients</option>
                    </select>
                  </label>

                  <label>
                    Type de collaboration recherchée
                    <select name="missionPreference" value={form.missionPreference} onChange={handleSelectChange}>
                      <option value="">Choisir une option</option>
                      <option value="ponctuelles">Missions ponctuelles</option>
                      <option value="regulieres">Contrats réguliers</option>
                      <option value="les_deux">Les deux</option>
                    </select>
                  </label>

                  <fieldset className={styles.checkboxGroup}>
                    <legend>Outils déjà utilisés</legend>
                    {CONCIERGE_TOOLS.map((tool) => (
                      <label key={tool}>
                        <input
                          type="checkbox"
                          checked={form.existingTools.includes(tool)}
                          onChange={() => toggleExistingTool(tool)}
                        />
                        <span>{tool}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              ) : null}

              {expressStep === 3 ? (
                <div className={styles.expressPanel}>
                  <div className={styles.expressSummary}>
                    <strong>Votre profil express est prêt</strong>
                    <span>
                      {form.serviceRadiusKm} km autour de {recap.location || "votre ville"} ·{" "}
                      {selectedOptions.length} service{selectedOptions.length > 1 ? "s" : ""} ·{" "}
                      {form.missionPreference ? "collaboration ciblée" : "collaboration à préciser"}
                    </span>
                  </div>

                  <div className={styles.identityGrid}>
                    <label>
                      Prénom *
                      <input name="firstName" value={form.firstName} onChange={handleChange} required />
                    </label>

                    <label>
                      Nom *
                      <input name="lastName" value={form.lastName} onChange={handleChange} required />
                    </label>

                    <label>
                      Email *
                      <input name="email" type="email" value={form.email} onChange={handleChange} required />
                    </label>

                    <label>
                      Téléphone
                      <input name="phone" value={form.phone} onChange={handleChange} />
                    </label>
                  </div>

                  <label>
                    Nom de conciergerie ou entreprise
                    <input
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      placeholder="Ex : Maison Clés, Horizon Concierge..."
                    />
                  </label>

                  <div className={styles.expressPromise}>
                    <strong>Après inscription</strong>
                    <span>Vous arriverez directement sur les actions métier: créer un bien, créer une offre, inviter un propriétaire.</span>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {!isConciergeExpress ? (
          <div className={styles.identityGrid}>
            <label>
              Prénom *
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </label>

            <label>
              Nom *
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </label>

            <label>
              Email *
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>

            <label>
              Téléphone
              <input name="phone" value={form.phone} onChange={handleChange} />
            </label>
          </div>
          ) : null}

          {profileKey === "concierge" && !isConciergeExpress && (
            <section className={styles.conciergeFields}>
              <h3>Votre activité de conciergerie</h3>

              <div className={styles.modeSwitch} role="group" aria-label="Mode d&apos;inscription concierge">
                <button
                  type="button"
                  className={isSimpleMode ? styles.modeActive : ""}
                  onClick={() => setForm((prev) => ({ ...prev, signupMode: "simple" }))}
                >
                  Simple
                </button>
                <button
                  type="button"
                  className={isExpressMode ? styles.modeActive : ""}
                  onClick={() => setForm((prev) => ({ ...prev, signupMode: "express" }))}
                >
                  Express
                </button>
                <button
                  type="button"
                  className={isBusinessMode ? styles.modeActive : ""}
                  onClick={() => setForm((prev) => ({ ...prev, signupMode: "business" }))}
                >
                  Business +
                </button>
              </div>

              {isSimpleMode ? (
                <div className={styles.localPromise}>
                  <strong>Parcours guidé et rassurant.</strong>
                  <span>Nous vous proposerons des missions proches de {recap.location || "votre ville"} avec un réglage simple.</span>
                  <ul>
                    <li>Étapes claires</li>
                    <li>Zone locale</li>
                    <li>Réglages faciles</li>
                  </ul>
                </div>
              ) : isExpressMode ? (
                <div className={styles.expressPromise}>
                  <strong>Mode rapide expert.</strong>
                  <span>Configurez l&apos;essentiel maintenant, puis activez vos premières actions métier après inscription.</span>
                  <ul>
                    <li>Créer 1 bien</li>
                    <li>Créer 1 offre</li>
                    <li>Inviter 1 propriétaire</li>
                  </ul>
                </div>
              ) : (
                <div className={styles.businessPromise}>
                  <strong>Activité structurée.</strong>
                  <span>Ajoutez vos outils et vos objectifs pour préparer votre dashboard, vos missions et votre développement.</span>
                </div>
              )}

              <label className={styles.radiusField}>
                <span>
                  Rayon maximum
                  <small>Autour de {recap.location || "votre ville"} pour recevoir des missions réalistes.</small>
                </span>
                <select name="serviceRadiusKm" value={form.serviceRadiusKm} onChange={handleSelectChange}>
                  <option value="10">10 km maximum</option>
                  <option value="20">20 km maximum</option>
                  <option value="30">30 km maximum</option>
                  <option value="50">50 km maximum</option>
                </select>
              </label>

              <label>
                Nom de conciergerie ou entreprise
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Ex : Maison Clés, Horizon Concierge..."
                />
              </label>

              <label>
                Statut actuel
                <select name="legalForm" value={form.legalForm} onChange={handleSelectChange}>
                  <option value="">À préciser plus tard</option>
                  <option value="creation">Je démarre mon activité</option>
                  <option value="micro_entreprise">Micro-entreprise</option>
                  <option value="societe">Société déjà créée</option>
                  <option value="particulier">Particulier / complément d&apos;activité</option>
                </select>
              </label>

              {!isExpressMode && (
                <label>
                  Disponibilité principale
                  <select name="availability" value={form.availability} onChange={handleSelectChange}>
                    <option value="">À définir</option>
                    <option value="temps_plein">Temps plein</option>
                    <option value="temps_partiel">Temps partiel</option>
                    <option value="soirs_weekends">Soirs et week-ends</option>
                    <option value="sur_demande">Sur demande selon les missions</option>
                  </select>
                </label>
              )}

              <label>
                Objectif principal
                <select name="onboardingGoal" value={form.onboardingGoal} onChange={handleSelectChange}>
                  <option value="">À préciser plus tard</option>
                  <option value="premieres_missions">Trouver mes premières missions</option>
                  <option value="complement_revenu">Compléter mes revenus</option>
                  <option value="structurer_activite">Structurer mon activité de conciergerie</option>
                  <option value="developper_portefeuille">Développer mon portefeuille clients</option>
                </select>
              </label>

              {!isExpressMode && (
                <label>
                  Accompagnement souhaité
                  <select name="supportNeed" value={form.supportNeed} onChange={handleSelectChange}>
                    <option value="">Aucun choix pour le moment</option>
                    <option value="guidage_simple">Guidage simple pour bien démarrer</option>
                    <option value="modeles_outils">Modèles, tarifs et outils de gestion</option>
                    <option value="missions_qualifiees">Priorité aux demandes qualifiées</option>
                    <option value="autonome">Je suis autonome</option>
                  </select>
                </label>
              )}

              {(isBusinessMode || isExpressMode) && (
                <>
                  <fieldset className={styles.checkboxGroup}>
                    <legend>Outils déjà utilisés</legend>
                    {CONCIERGE_TOOLS.map((tool) => (
                      <label key={tool}>
                        <input
                          type="checkbox"
                          checked={form.existingTools.includes(tool)}
                          onChange={() => toggleExistingTool(tool)}
                        />
                        <span>{tool}</span>
                      </label>
                    ))}
                  </fieldset>
                </>
              )}

              <label>
Type de collaboration recherchée (retravaillé)
                <select name="missionPreference" value={form.missionPreference} onChange={handleSelectChange}>
                  <option value="">Ouverte aux opportunités</option>
                  <option value="ponctuelles">Missions ponctuelles</option>
                  <option value="regulieres">Contrats réguliers</option>
                  <option value="les_deux">Les deux</option>
                </select>
              </label>

              <fieldset className={styles.checkboxGroup}>
                <legend>Types de biens que vous pouvez gérer</legend>
                {CONCIERGE_PROPERTY_TYPES.map((propertyType) => (
                  <label key={propertyType}>
                    <input
                      type="checkbox"
                      checked={form.propertyTypes.includes(propertyType)}
                      onChange={() => togglePropertyType(propertyType)}
                    />
                    <span>{propertyType}</span>
                  </label>
                ))}
              </fieldset>
            </section>
          )}

          {profileKey === "proprietaire" && (
            <section className={styles.profileVariantFields}>
              <h3>Votre objectif propriétaire</h3>
              <label>
                Priorité au démarrage
                <select name="onboardingGoal" value={form.onboardingGoal} onChange={handleSelectChange}>
                  <option value="">À préciser plus tard</option>
                  {OWNER_GOALS.map((goal) => (
                    <option key={goal.value} value={goal.value}>
                      {goal.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Type de besoin
                <select name="missionPreference" value={form.missionPreference} onChange={handleSelectChange}>
                  <option value="">À définir</option>
                  <option value="besoin_ponctuel">Besoin ponctuel</option>
                  <option value="suivi_regulier">Suivi régulier</option>
                  <option value="les_deux">Les deux</option>
                </select>
              </label>
              <div className={styles.identityGrid}>
                <label>
                  Type de bien
                  <select name="propertyType" value={form.propertyType} onChange={handleSelectChange}>
                    <option value="">À préciser plus tard</option>
                    {OWNER_PROPERTY_TYPES.map((propertyType) => (
                      <option key={propertyType} value={propertyType}>
                        {propertyType}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Volume du besoin
                  <select name="needVolume" value={form.needVolume} onChange={handleSelectChange}>
                    <option value="">À définir</option>
                    {OWNER_NEED_VOLUMES.map((volume) => (
                      <option key={volume.value} value={volume.value}>
                        {volume.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Première demande pré-remplie
                <textarea
                  name="firstRequestTemplate"
                  value={form.firstRequestTemplate}
                  onChange={handleChange}
                  placeholder="Ex : Je cherche une conciergerie pour gérer les arrivées, le ménage et le suivi voyageurs."
                />
              </label>
              <div className={styles.profilePromise}>
                <strong>Après inscription</strong>
                <span>Vous pourrez envoyer cette première demande en 2 minutes et comparer les réponses depuis votre espace propriétaire.</span>
              </div>
            </section>
          )}

          {profileKey === "artisan" && (
            <section className={styles.profileVariantFields}>
              <h3>Votre activité artisan</h3>
              <div className={styles.identityGrid}>
                <label>
                  Corps de métier
                  <select name="tradeBody" value={form.tradeBody} onChange={handleSelectChange}>
                    <option value="">À définir</option>
                    {TRADE_BODIES.map((tradeBody) => (
                      <option key={tradeBody} value={tradeBody}>
                        {tradeBody}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Urgence acceptée
                  <select name="missionPreference" value={form.missionPreference} onChange={handleSelectChange}>
                    <option value="">À définir</option>
                    {ARTISAN_URGENCY_LEVELS.map((urgency) => (
                      <option key={urgency.value} value={urgency.value}>
                        {urgency.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Assurance
                  <select name="supportNeed" value={form.supportNeed} onChange={handleSelectChange}>
                    <option value="">À définir</option>
                    {ARTISAN_INSURANCE_OPTIONS.map((insurance) => (
                      <option key={insurance.value} value={insurance.value}>
                        {insurance.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  SIRET
                  <input
                    name="businessLink"
                    value={form.businessLink}
                    onChange={handleChange}
                    inputMode="numeric"
                    placeholder="14 chiffres"
                  />
                </label>

                <label>
                  Zone d&apos;intervention
                  <select name="serviceRadiusKm" value={form.serviceRadiusKm} onChange={handleSelectChange}>
                    <option value="10">10 km maximum</option>
                    <option value="20">20 km maximum</option>
                    <option value="30">30 km maximum</option>
                    <option value="50">50 km maximum</option>
                  </select>
                </label>

                <label>
                  Tarif de départ
                  <select name="startingPriceRange" value={form.startingPriceRange} onChange={handleSelectChange}>
                    <option value="">À préciser plus tard</option>
                    {ARTISAN_PRICE_RANGES.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className={styles.checkboxGroup}>
                <legend>Créneaux habituels</legend>
                {ARTISAN_SLOTS.map((slot) => (
                  <label key={slot}>
                    <input
                      type="checkbox"
                      checked={form.propertyTypes.includes(slot)}
                      onChange={() => togglePropertyType(slot)}
                    />
                    <span>{slot}</span>
                  </label>
                ))}
              </fieldset>
              <div className={styles.profilePromise}>
                <strong>Promesse plateforme</strong>
                <span>Vous recevrez des demandes qualifiées proches de votre zone, avec les infos utiles pour répondre vite et transformer en devis.</span>
              </div>
            </section>
          )}

          {!isConciergeExpress ? (
          <label>
            {copy.needLabel}
            <textarea
              name="additionalInfo"
              value={form.additionalInfo}
              onChange={handleChange}
              placeholder="Ajoutez ici une précision utile pour la suite."
            />
          </label>
          ) : null}

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={handleBackAction}>
              Retour
            </button>
            <button type="submit" className={styles.primaryButton}>
              {isConciergeExpress && expressStep < 3 ? "Continuer l'express" : "Continuer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
