"use client";

import React from "react";
import styles from "./AccessPopup.module.scss";

interface AccessPopupProps {
  onClose: () => void;
  selectedOption: string;
}

const sampleProfiles = [
  { name: "Sandrine", role: "conciergerie indépendante", location: "à Paris 4ème" },
  { name: "Danaé", role: "conciergerie professionnelle", location: "à Paris 13ème" },
  { name: "Margaux", role: "gestion complète", location: "à Paris 12ème" },
  { name: "Elizabeth", role: "check-in / check-out", location: "à Paris 14ème" },
  { name: "Manon", role: "ménage et accueil", location: "à Paris 13ème" },
  { name: "Yahazmin", role: "conciergerie digitale", location: "à Paris 10ème" },
];

export default function AccessPopup({ onClose, selectedOption }: AccessPopupProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>

        <h2>Accès aux annonces pour : <span className={styles.highlight}>{selectedOption}</span></h2>
        <p className={styles.intro}>Pour les contacter, rejoignez gratuitement notre club !</p>

        <ul className={styles.profileList}>
          {sampleProfiles.map((profile, index) => (
            <li key={index}>
              <strong>{profile.name}</strong> – {profile.role} <span>{profile.location}</span>
            </li>
          ))}
        </ul>

        <p className={styles.highlight}>
          WOW ! Et 9994 profils de plus sont disponibles immédiatement à moins de 10 km de chez vous !
        </p>

        <form className={styles.form}>
          <label>
            Prénom
            <input type="text" placeholder="ex: Camille" required />
          </label>
          <label>
            Nom de famille
            <input type="text" placeholder="ex: Duval" required />
          </label>
          <label>
            Adresse email
            <input type="email" placeholder="email@exemple.com" required />
          </label>
          <label>
            Votre besoin
            <textarea placeholder={`Décrivez votre besoin pour "${selectedOption}"`} />
          </label>
          <button type="submit">Accéder aux annonces</button>
        </form>

        <p className={styles.legal}>
          En vous inscrivant, vous acceptez les conditions d’utilisation du site.
        </p>
      </div>
    </div>
  );
}
