"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AccessPopup.module.scss";
import ProfilesDisplay from "@/app/components/layout/Home/ProfilesDisplay/ProfilesDisplay";

interface AccessPopupProps {
  selectedOptions: string[];
  category: string;
  location: string;
  onClose?: () => void;
}

export default function AccessPopup({
  selectedOptions,
  category,
  location,
  onClose,
}: AccessPopupProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    additionalInfo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProceed = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = {
      category,
      option: selectedOptions.join(","),
      location,
      ...form,
    };
    const qs = new URLSearchParams(params).toString();
    router.push(`/search-form?${qs}`);
  };

  // 🔑 exemple de profils dynamiques (à récupérer via API)
  const visibleProfiles = [
    {
      id: "1",
      name: "Sandrine",
      type: "concierge",
      photo: "/default-profile.png",
      services: ["Check-in", "Ménage"],
      available: true,
      created_at: "2023-05-01",
    },
    {
      id: "2",
      name: "Danaé",
      type: "concierge",
      photo: "",
      services: ["Maintenance", "Blanchisserie"],
      available: false,
      created_at: "2022-11-15",
    },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <button
          className={styles.close}
          onClick={() => onClose?.()}
          aria-label="Fermer"
        >
          ✕
        </button>

        <h2>Accès aux annonces pour :</h2>
        <p className={styles.highlight}>{selectedOptions.join(" — ")}</p>

        {/* 👉 Intégration de ProfilesDisplay */}
        <ProfilesDisplay visibleProfiles={visibleProfiles} />

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
            <button type="button" onClick={() => onClose?.()}>
              Retour
            </button>
            <button type="submit">Continuer vers le formulaire</button>
          </div>
        </form>
      </div>
    </div>
  );
}