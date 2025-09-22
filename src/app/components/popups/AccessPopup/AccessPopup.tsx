"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AccessPopup.module.scss";

interface AccessPopupProps {
  selectedOptions: string[]; // <--- tableau
  category: string;
  location: string;
  onClose?: () => void;
}

const sampleProfiles = [
  { name: "Sandrine", role: "conciergerie indépendante", location: "à Paris 4ème" },
  { name: "Danaé", role: "conciergerie professionnelle", location: "à Paris 13ème" },
  { name: "Margaux", role: "gestion complète", location: "à Paris 12ème" },
];

export default function AccessPopup({ selectedOptions, category, location, onClose }: AccessPopupProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    additionalInfo: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProceed = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = {
      category,
      option: selectedOptions.join(","), // join -> "A,B"
      location,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      additionalInfo: form.additionalInfo,
    };
    const qs = new URLSearchParams(params).toString();
    router.push(`/search-form?${qs}`);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <button className={styles.close} onClick={() => onClose?.()} aria-label="Fermer">✕</button>

        <h2>Accès aux annonces pour :</h2>
        <p className={styles.highlight}>{selectedOptions.join(" — ")}</p>

        <ul className={styles.profileList}>
          {sampleProfiles.map((p, i) => (
            <li key={i}><strong>{p.name}</strong> – {p.role} <span>{p.location}</span></li>
          ))}
        </ul>

        <form className={styles.form} onSubmit={handleProceed}>
          <label>Prénom
            <input name="firstName" value={form.firstName} onChange={handleChange} required />
          </label>
          <label>Nom
            <input name="lastName" value={form.lastName} onChange={handleChange} required />
          </label>
          <label>Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>Téléphone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>Votre besoin
            <textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} />
          </label>

          <div className={styles.actions}>
            <button type="button" onClick={() => onClose?.()}>Retour</button>
            <button type="submit">Continuer vers le formulaire</button>
          </div>
        </form>
      </div>
    </div>
  );
}
