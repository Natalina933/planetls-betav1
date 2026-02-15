"use client";

import React, { useState } from "react";
import styles from "./AccessPopup.module.scss";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.popup}>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Fermer la fenêtre"
          type="button"
        >
          ✕
        </button>

        <h2>Accès aux annonces</h2>

        {/* ------------------------------------------------------------------ */}
        {/* RÉCAP */}
        {/* ------------------------------------------------------------------ */}
        <section className={styles.recapBox}>
          <h3>Récapitulatif</h3>

          <ul>
            <li>
              <strong>Catégorie :</strong> {recap.category}
            </li>
            <li>
              <strong>Recherche :</strong> {recap.searchTarget}
            </li>
            <li>
              <strong>Localisation :</strong> {recap.location}
            </li>
            <li>
              <strong>Expérience :</strong>{" "}
              {recap.yearsExperience} – {recap.experienceLevel}
            </li>
            <li>
              <strong>Options :</strong> {selectedOptions.join(" — ")}
            </li>
          </ul>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FORMULAIRE */}
        {/* ------------------------------------------------------------------ */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Prénom *
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Nom *
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
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
            />
          </label>

          <label>
            Téléphone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </label>

          <label>
            Votre besoin
            <textarea
              name="additionalInfo"
              value={form.additionalInfo}
              onChange={handleChange}
            />
          </label>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onBack}
            >
              ← Retour
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
