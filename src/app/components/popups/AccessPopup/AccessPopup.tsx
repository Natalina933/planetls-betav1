"use client";

import React, { useState } from "react";
import styles from "./AccessPopup.module.scss";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalInfo: string;
}

interface AccessPopupProps {
  selectedOptions: string[];
  onClose: () => void;
  onBack?: () => void;
  onValidate?: (formData: FormData) => void;
}

export default function AccessPopup({
  selectedOptions,
  onClose,
  onBack,
  onValidate,
}: AccessPopupProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    additionalInfo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProceed = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validation basique
    if (!form.firstName || !form.lastName || !form.email) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (onValidate) {
      onValidate(form);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Fermer"
        >
          ✕
        </button>

        <h2>Accès aux annonces pour :</h2>
        <p className={styles.highlight}>{selectedOptions.join(" — ")}</p>

        <form className={styles.form} onSubmit={handleProceed}>
          <label>
            Prénom
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Nom
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Email
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
            <input name="phone" value={form.phone} onChange={handleChange} />
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
            <button className={styles.closeButton} type="button" onClick={handleBack}>
              Retour
            </button>

            <button type="submit" onClick={handleProceed}>
              Continuer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}