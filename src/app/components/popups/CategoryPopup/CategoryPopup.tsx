"use client";

import React from "react";
import styles from "./CategoryPopup.module.scss";

interface CategoryPopupProps {
  category: string;
  onClose: () => void;
  onNext: (selectedOption: string) => void;
}

const POPUP_CONTENT: Record<string, { title: string; options: string[] }> = {
  proprietaire: {
    title: "Quel type de service recherchez-vous ?",
    options: [
      "Accueil des voyageurs (check-in / check-out)",
      "Ménage entre les séjours",
      "Gestion complète du logement (planning, communication, ménage)",
      "Maintenance et petits travaux",
      "Gestion des clés et des accès",
      "Service ponctuel (remplacement, urgence, imprévu)",
      "Conciergerie digitale (suivi à distance, automatisation)",
      "Autre besoin spécifique"
    ],
  },
  concierge: {
    title: "Quel type de service proposez-vous ?",
    options: [
      "Conciergerie complète (ménage, accueil, gestion)",
      "Conciergerie ponctuelle (check-in/out, ménage)",
      "Conciergerie digitale (gestion à distance)",
      "Autres services spécifiques",
    ],
  },
  artisan: {
    title: "Quel est votre domaine d’activité ?",
    options: [
      "Plomberie / Électricité",
      "Jardinage / Espaces verts",
      "Petits travaux / Rénovation",
      "Services commerciaux (épicerie, pressing, etc.)",
    ],
  },
};

export default function CategoryPopup({ category, onClose, onNext }: CategoryPopupProps) {
  const content = POPUP_CONTENT[category];

  if (!content) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContent}>
        <h3>{content.title}</h3>
        <ul className={styles.optionList}>
          {content.options.map((option, index) => (
            <li key={index}>
              <button
                className={styles.optionButton}
                onClick={() => onNext(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
        <button className={styles.closeButton} onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
