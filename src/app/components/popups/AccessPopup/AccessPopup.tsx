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
  const [error, setError] = useState<string | null>(null);

  const profileKey = getProfileKey(recap.category);
  const copy = PROFILE_COPY[profileKey];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setError(null);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    onValidate(form);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-popup-title"
      aria-describedby="access-popup-recap"
    >
      <div className={styles.popup}>
        <button className={styles.close} onClick={onClose} aria-label="Fermer la fenetre" type="button">
          X
        </button>

        <h2 id="access-popup-title">{copy.title}</h2>

        <section id="access-popup-recap" className={styles.recapBox}>
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

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label>
            Prénom *
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              aria-invalid={Boolean(error && !form.firstName)}
              aria-describedby={error && !form.firstName ? "access-popup-error" : undefined}
            />
          </label>

          <label>
            Nom *
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              aria-invalid={Boolean(error && !form.lastName)}
              aria-describedby={error && !form.lastName ? "access-popup-error" : undefined}
            />
          </label>

          <label>
            Email *
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              aria-invalid={Boolean(error && !form.email)}
              aria-describedby={error && !form.email ? "access-popup-error" : undefined}
            />
          </label>

          <label>
            Téléphone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>

          <label>
            {copy.needLabel}
            <textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} />
          </label>

          {error ? (
            <p id="access-popup-error" className={styles.errorMsg} role="alert" aria-live="assertive">
              {error}
            </p>
          ) : null}

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
