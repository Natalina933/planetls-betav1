"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./SearchFormPage.module.scss";

interface FormData {
  location: string;
  category: string;
  option: string;
  startDate: string;
  endDate: string;
  additionalInfo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function SearchFormPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    location: "",
    category: "",
    option: "",
    startDate: "",
    endDate: "",
    additionalInfo: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Remplissage initial depuis l'URL
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const option = searchParams.get("option") || "";
    const location = searchParams.get("location") || "";
    setFormData((prev) => ({ ...prev, category, option, location }));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Votre recherche a été enregistrée !");
  };

  return (
    <div className={styles.pageContainer}>
      {/* Menu latéral */}
<ul className={styles.steps}>
  {["Qui et où ?", "Quel est votre besoin ?", "Infos complémentaires", "Coordonnées"].map(
    (label, idx) => (
      <li
        key={idx}
        className={step === idx + 1 ? styles.activeStep : ""}
        aria-current={step === idx + 1 ? "step" : undefined}
      >
        <span>{idx + 1}</span> {label}
      </li>
    )
  )}
</ul>


      {/* Formulaire principal */}
      <main className={styles.mainContent}>
        <h1>Encore quelques infos pour trouver le partenaire idéal</h1>
        <p className={styles.subtitle}>Cela ne prendra que quelques minutes.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {step === 1 && (
            <div className={styles.step}>
              <label>
                Où recherchez-vous ?
                <input type="text" name="location" value={formData.location} onChange={handleChange} required />
              </label>
              <label>
                Catégorie
                <input type="text" name="category" value={formData.category} readOnly />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className={styles.step}>
              <label>
                Quel est votre besoin ?
                <input type="text" name="option" value={formData.option} readOnly />
              </label>
              <label>
                Description / détails supplémentaires
                <textarea name="additionalInfo" value={formData.additionalInfo} onChange={handleChange} placeholder="Précisez votre besoin" />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className={styles.step}>
              <label>
                Date de début
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
              </label>
              <label>
                Date de fin
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
              </label>
            </div>
          )}

          {step === 4 && (
            <div className={styles.step}>
              <label>
                Prénom
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </label>
              <label>
                Nom
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </label>
              <label>
                Téléphone
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </label>
            </div>
          )}

          <div className={styles.buttons}>
            {step > 1 && <button type="button" onClick={prevStep}>Précédent</button>}
            {step < 4 && <button type="button" onClick={nextStep}>Suivant</button>}
            {step === 4 && <button type="submit">Envoyer ma recherche</button>}
          </div>
        </form>

        {/* Résumé dynamique */}
        <div className={styles.summary}>
          <h3>Résumé de votre sélection :</h3>
          <p>Je recherche : <strong>{formData.category}</strong></p>
          <p>Pour : <strong>{formData.option}</strong></p>
          <p>Localisation : <strong>{formData.location}</strong></p>
          {formData.startDate && formData.endDate && (
            <p>Pour la période : <strong>{formData.startDate} → {formData.endDate}</strong></p>
          )}
        </div>
      </main>
    </div>
  );
}
