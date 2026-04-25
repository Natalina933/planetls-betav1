"use client";

import React, { useState } from "react";
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
    needLabel: string;
    targetLabel: string;
  }
> = {
  proprietaire: {
    title: "Accès propriétaire",
    needLabel: "Votre besoin",
    targetLabel: "Vous recherchez",
  },
  concierge: {
    title: "Accès concierge",
    needLabel: "Vos services",
    targetLabel: "Vous souhaitez collaborer avec",
  },
  artisan: {
    title: "Accès artisan",
    needLabel: "Votre spécialité",
    targetLabel: "Vous souhaitez collaborer avec",
  },
};

const getProfileKey = (category: string): ProfileKey => {
  if (category === "proprietaire" || category === "artisan" || category === "concierge") {
    return category;
  }
  return "concierge";
};

const CONCIERGE_PROPERTY_TYPES = [
  "Location courte durée",
  "Résidence secondaire",
  "Residence principale",
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

export default function AccessPopup({
  selectedOptions,
  recap,
  onBack,
  onClose,
  onValidate,
}: AccessPopupProps) {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    additionalInfo: "",
    companyName: "",
    legalForm: "",
    serviceRadiusKm: "30",
    availability: "",
    missionPreference: "",
    signupMode: "simple",
    onboardingGoal: "",
    supportNeed: "",
    existingTools: [],
    businessLink: "",
    propertyTypes: [],
  });

  const profileKey = getProfileKey(recap.category);
  const copy = PROFILE_COPY[profileKey];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    onValidate(form);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.popup}>
        <button className={styles.close} onClick={onClose} aria-label="Fermer la fenêtre" type="button">
          X
        </button>

        <p className={styles.stepIndicator}>Étape 4/5 - Coordonnées</p>
        <h2>{copy.title}</h2>

        <section className={styles.recapBox}>
          <h3>Récapitulatif</h3>

          <ul>
            <li>
              <strong>Catégorie :</strong> {recap.category}
            </li>
            <li>
              <strong>{copy.targetLabel} :</strong> {recap.searchTarget}
            </li>
            <li>
              <strong>Localisation :</strong> {recap.location}
            </li>
            <li>
              <strong>Expérience :</strong> {recap.yearsExperience} - {recap.experienceLevel}
            </li>
            <li>
              <strong>Options :</strong> {selectedOptions.length ? selectedOptions.join(" - ") : "Aucune"}
            </li>
          </ul>
        </section>

        <form className={styles.form} onSubmit={handleSubmit}>
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

          {profileKey === "concierge" && (
            <section className={styles.conciergeFields}>
              <h3>Votre activité de concierge</h3>

              <div className={styles.modeSwitch} role="group" aria-label="Mode d'inscription concierge">
                <button
                  type="button"
                  className={form.signupMode === "simple" ? styles.modeActive : ""}
                  onClick={() => setForm((prev) => ({ ...prev, signupMode: "simple" }))}
                >
                  Simple
                </button>
                <button
                  type="button"
                  className={form.signupMode === "business" ? styles.modeActive : ""}
                  onClick={() => setForm((prev) => ({ ...prev, signupMode: "business" }))}
                >
                  Business
                </button>
              </div>

              {form.signupMode === "simple" ? (
                <div className={styles.localPromise}>
                  <strong>On vous proposera des missions proches de chez vous.</strong>
                  <span>
                    Votre ville de départ : {recap.location || "à préciser"}. Vous choisissez maintenant le rayon maximum
                    dans lequel vous souhaitez recevoir des demandes.
                  </span>
                  <ul>
                    <li>Zone claire</li>
                    <li>Missions adaptées</li>
                    <li>Profil modifiable</li>
                  </ul>
                </div>
              ) : (
                <div className={styles.businessPromise}>
                  <strong>Transformez votre savoir-faire en activité visible</strong>
                  <span>Ajoutez vos outils et vos objectifs pour préparer le dashboard, les missions et les futurs tarifs.</span>
                </div>
              )}

              <label className={styles.radiusField}>
                <span>
                  Rayon max
                  <small>Autour de {recap.location || "votre ville"} pour recevoir des missions réalistes.</small>
                </span>
                <select
                  name="serviceRadiusKm"
                  value={form.serviceRadiusKm}
                  onChange={handleSelectChange}
                >
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
                  placeholder="Ex : Lynda Services, Christa Conciergerie..."
                />
              </label>

              <label>
                Statut actuel
                <select name="legalForm" value={form.legalForm} onChange={handleSelectChange}>
                  <option value="">À préciser plus tard</option>
                  <option value="creation">Je démarre mon activité</option>
                  <option value="micro_entreprise">Micro-entreprise</option>
                  <option value="societe">Société déjà créée</option>
                  <option value="particulier">Particulier / complément d'activité</option>
                </select>
              </label>

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

              <label>
                Objectif principal
                <select
                  name="onboardingGoal"
                  value={form.onboardingGoal}
                  onChange={handleSelectChange}
                >
                  <option value="">À préciser plus tard</option>
                  <option value="premieres_missions">Trouver mes premières missions</option>
                  <option value="complement_revenu">Compléter mes revenus</option>
                  <option value="structurer_activite">Structurer mon activité de conciergerie</option>
                  <option value="developper_portefeuille">Developper mon portefeuille clients</option>
                </select>
              </label>

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

              {form.signupMode === "business" && (
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
                <select
                  name="missionPreference"
                  value={form.missionPreference}
                  onChange={handleSelectChange}
                >
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

          <label>
            {copy.needLabel}
            <textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} />
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
