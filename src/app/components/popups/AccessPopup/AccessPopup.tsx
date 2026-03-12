"use client";

import React, { useState } from "react";
import styles from "./AccessPopup.module.scss";

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalInfo: string;
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
    title: "Acces proprietaire",
    needLabel: "Votre besoin",
    targetLabel: "Vous recherchez",
  },
  concierge: {
    title: "Acces concierge",
    needLabel: "Vos services",
    targetLabel: "Vous souhaitez collaborer avec",
  },
  artisan: {
    title: "Acces artisan",
    needLabel: "Votre specialite",
    targetLabel: "Vous souhaitez collaborer avec",
  },
};

const getProfileKey = (category: string): ProfileKey => {
  if (category === "proprietaire" || category === "artisan" || category === "concierge") {
    return category;
  }
  return "concierge";
};

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
  });

  const profileKey = getProfileKey(recap.category);
  const copy = PROFILE_COPY[profileKey];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        <button className={styles.close} onClick={onClose} aria-label="Fermer la fenetre" type="button">
          X
        </button>

        <h2>{copy.title}</h2>

        <section className={styles.recapBox}>
          <h3>Recapitulatif</h3>

          <ul>
            <li>
              <strong>Categorie :</strong> {recap.category}
            </li>
            <li>
              <strong>{copy.targetLabel} :</strong> {recap.searchTarget}
            </li>
            <li>
              <strong>Localisation :</strong> {recap.location}
            </li>
            <li>
              <strong>Experience :</strong> {recap.yearsExperience} - {recap.experienceLevel}
            </li>
            <li>
              <strong>Options :</strong> {selectedOptions.length ? selectedOptions.join(" - ") : "Aucune"}
            </li>
          </ul>
        </section>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Prenom *
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
            Telephone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>

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
