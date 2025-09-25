"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./SearchFormPage.module.scss";

const stepList = [
  {
    label: "Qui et où ?",
    help: "Indique la localisation et la catégorie recherchée.",
  },
  {
    label: "Quel est votre besoin ?",
    help: "Décris précisément ton besoin ou sélectionne une option.",
  },
  {
    label: "Infos complémentaires",
    help: "Ajoute les dates ou renseignements utiles à ta demande.",
  },
  {
    label: "Coordonnées",
    help: "Précise tes coordonnées pour finaliser l’inscription.",
  },
];

export default function SearchFormPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
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

  // Remplir depuis l’URL
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const optionParam = searchParams.get("option") || "";
    const location = searchParams.get("location") || "";
    const firstName = searchParams.get("firstName") || "";
    const lastName = searchParams.get("lastName") || "";
    const email = searchParams.get("email") || "";
    const phone = searchParams.get("phone") || "";
    const additionalInfo = searchParams.get("additionalInfo") || "";

    const optionsArray = optionParam ? optionParam.split(",") : [];
    const optionDisplay = optionsArray.length ? optionsArray.join(", ") : "";

    setFormData((prev) => ({
      ...prev,
      category,
      option: optionDisplay,
      location,
      firstName,
      lastName,
      email,
      phone,
      additionalInfo,
    }));
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, stepList.length));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Envoie réel à implémenter ici
    alert("Votre inscription a été enregistrée !");
  };

  return (
    <div className={styles.pageContainer}>
      {/* Barre latérale de progression */}
      <aside className={styles.sideNav} aria-label="Progression">
        <ul className={styles.steps}>
          {stepList.map((item, idx) => (
            <li
              key={item.label}
              className={step === idx + 1 ? styles.activeStep : ""}
              aria-current={step === idx + 1 ? "step" : undefined}
            >
              <span className={styles.stepNumber}>{idx + 1}</span>
              {item.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* Contenu principal et résumé */}
      <main className={styles.mainContent}>
        <h1 className={styles.title}>Inscription étape par étape</h1>
        <p className={styles.stepHelp}>{stepList[step - 1]?.help}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {step === 1 && (
            <section className={styles.step}>
              <label>
                Localisation
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ville ou région"
                  required
                />
              </label>
              <label>
                Catégorie
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  readOnly
                  required
                />
              </label>
            </section>
          )}

          {step === 2 && (
            <section className={styles.step}>
              <label>
                Besoin
                <input
                  type="text"
                  name="option"
                  value={formData.option}
                  readOnly
                  required
                />
              </label>
              <label>
                Détails supplémentaires
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  placeholder="Précise ton besoin"
                />
              </label>
            </section>
          )}

          {step === 3 && (
            <section className={styles.step}>
              <label>
                Date de début
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </label>
              <label>
                Date de fin
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </label>
            </section>
          )}

          {step === 4 && (
            <section className={styles.step}>
              <label>
                Prénom
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Nom
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Téléphone
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </label>
            </section>
          )}

          <div className={styles.buttons}>
            {step > 1 && (
              <button type="button" onClick={prevStep}>Précédent</button>
            )}
            {step < stepList.length && (
              <button type="button" onClick={nextStep}>Suivant</button>
            )}
            {step === stepList.length && (
              <button type="submit">Envoyer</button>
            )}
          </div>
        </form>

        {/* Résumé dynamique */}
        <aside className={styles.summarySection}>
          <h2>Résumé de votre inscription</h2>
          <dl className={styles.summaryList}>
            <dt>Catégorie</dt>
            <dd>{formData.category || "–"}</dd>
            <dt>Besoin</dt>
            <dd>{formData.option || "–"}</dd>
            <dt>Localisation</dt>
            <dd>{formData.location || "–"}</dd>
            <dt>Période</dt>
            <dd>
              {formData.startDate && formData.endDate
                ? `${formData.startDate} → ${formData.endDate}`
                : "–"}
            </dd>
          </dl>
        </aside>
      </main>
    </div>
  );
}
