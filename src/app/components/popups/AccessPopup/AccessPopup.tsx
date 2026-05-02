"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import OnboardingStepHeader from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";
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

const CONCIERGE_PROPERTY_TYPES = [
  "Location courte durée",
  "Résidence secondaire",
  "Résidence principale",
  "Immeuble ou multi-logements",
];

const CONCIERGE_TOOLS = [
  "Airbnb",
  "Booking",
  "Google Agenda",
  "Excel / Google Sheets",
  "WhatsApp",
  "Smoobu / Guesty",
];

const OWNER_GOALS = [
  { value: "deleguer_location", label: "Déléguer la gestion locative" },
  { value: "trouver_concierge", label: "Trouver une conciergerie fiable" },
  { value: "securiser_interventions", label: "Sécuriser les interventions" },
  { value: "optimiser_revenus", label: "Optimiser mes revenus" },
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

const getProfileKey = (category: string): ProfileKey => {
  if (category === "proprietaire" || category === "artisan" || category === "concierge") {
    return category;
  }
  return "concierge";
};

const formatProfileLabel = (category: string) => {
  switch (category) {
    case "proprietaire":
      return "Propriétaire";
    case "concierge":
      return "Conciergerie";
    case "artisan":
      return "Artisan";
    default:
      return category;
  }
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
  });
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();
  const [submitError, setSubmitError] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);
  const copy = PROFILE_COPY[profileKey];
  const isSimpleMode = form.signupMode === "simple";
  const isExpressMode = form.signupMode === "express";
  const isBusinessMode = form.signupMode === "business";
  const titleId = "access-popup-title";

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
    });
  }, [defaultSignupMode, initialData]);

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

  const quickContext = useMemo(
    () => [
      { label: "Profil", value: formatProfileLabel(recap.category) },
      { label: copy.targetLabel, value: recap.searchTarget || "À définir" },
      { label: "Ville", value: recap.location || "À définir" },
      {
        label: "Services",
        value:
          selectedOptions.length > 0
            ? `${selectedOptions.length} sélection${selectedOptions.length > 1 ? "s" : ""}`
            : "À définir",
      },
    ],
    [copy.targetLabel, recap.category, recap.location, recap.searchTarget, selectedOptions.length]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email) {
      setSubmitError("Veuillez renseigner au minimum votre prénom, votre nom et votre email.");
      return;
    }

    onValidate(form);
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

        <section className={styles.contextPanel} aria-label="Contexte rapide">
          {quickContext.map((item) => (
            <div key={item.label} className={styles.contextCard}>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          ))}
        </section>

        <form className={styles.form} onSubmit={handleSubmit}>
          {submitError ? <p className={styles.formAlert}>{submitError}</p> : null}

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

          {profileKey === "concierge" && (
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

                  <label>
                    Site, page ou lien professionnel
                    <input
                      name="businessLink"
                      value={form.businessLink}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </label>
                </>
              )}

              <label>
                Type de collaboration recherchée
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
            </section>
          )}

          {profileKey === "artisan" && (
            <section className={styles.profileVariantFields}>
              <h3>Votre activité artisan</h3>
              <div className={styles.identityGrid}>
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
            </section>
          )}

          <label>
            {copy.needLabel}
            <textarea
              name="additionalInfo"
              value={form.additionalInfo}
              onChange={handleChange}
              placeholder="Ajoutez ici une précision utile pour la suite."
            />
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={onBack}>
              Retour
            </button>
            <button type="submit" className={styles.primaryButton}>
              Continuer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
