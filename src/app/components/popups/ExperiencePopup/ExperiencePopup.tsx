// components/popups/ExperiencePopup/ExperiencePopup.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ExperiencePopup.module.scss";

export type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

interface ExperiencePopupProps {
  onClose: () => void;
  onValidate: (level: ExperienceLevel, years: string) => void;
}

const EXPERIENCE_LEVELS: {
  label: string;
  value: ExperienceLevel;
  years: string;
  description: string;
}[] = [
  {
    label: "Débutant",
    value: "debutant",
    years: "0-1 an",
    description: "Je découvre la conciergerie ou un domaine similaire.",
  },
  {
    label: "Intermédiaire",
    value: "intermediaire",
    years: "1-3 ans",
    description: "J’ai déjà une première expérience.",
  },
  {
    label: "Expérimenté",
    value: "experimente",
    years: "+3 ans",
    description: "J’ai une expérience solide et régulière.",
  },
];

export default function ExperiencePopup({ onClose, onValidate }: ExperiencePopupProps) {
  const [selected, setSelected] = useState<ExperienceLevel | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Bloquer le scroll arrière-plan
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Fermer en cliquant en dehors
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const handleValidate = () => {
    if (!selected) return;
    const level = EXPERIENCE_LEVELS.find((l) => l.value === selected);
    if (!level) return;
    onValidate(level.value, level.years);
  };

  return (
    <div className={styles.popupOverlay} role="dialog" aria-modal="true">
      <div className={styles.popupContent} ref={popupRef}>
        <h3>Quel est votre niveau d’expérience ?</h3>

        <ul className={styles.optionList}>
          {EXPERIENCE_LEVELS.map((opt) => (
            <li key={opt.value}>
              <label>
                <input
                  type="radio"
                  checked={selected === opt.value}
                  onChange={() => setSelected(opt.value)}
                />
                <strong>{opt.label}</strong> ({opt.years})
                <p>{opt.description}</p>
              </label>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button type="button" onClick={onClose}>
            Annuler
          </button>
          <button type="button" onClick={handleValidate} disabled={!selected}>
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
