"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ExperiencePopup.module.scss";

export type ExperienceLevel = "debutant" | "intermediaire" | "experimente" | "peu_importe";

type ProfileKey = "proprietaire" | "concierge" | "artisan";

interface ExperiencePopupProps {
  category?: string;
  onClose: () => void;
  onValidate: (level: ExperienceLevel, years: string) => void;
}

const EXPERIENCE_LEVELS: {
  label: string;
  value: ExperienceLevel;
  years: string;
}[] = [
  {
    label: "Débutant",
    value: "debutant",
    years: "0-1 an",
  },
  {
    label: "Intermédiaire",
    value: "intermediaire",
    years: "1-3 ans",
  },
  {
    label: "Expérimenté",
    value: "experimente",
    years: "+3 ans",
  },
  {
    label: "Peu importe",
    value: "peu_importe",
    years: "Tous niveaux",
  },
];

const PROFILE_CONTENT: Record<
  ProfileKey,
  {
    title: string;
    descriptions: Record<ExperienceLevel, string>;
  }
> = {
  proprietaire: {
    title: "Quel niveau d'expérience recherchez-vous ?",
    descriptions: {
      debutant: "Vous acceptez un partenaire qui débute.",
      intermediaire: "Vous visez un partenaire avec une expérience confirmée.",
      experimente: "Vous recherchez un partenaire très expérimenté.",
      peu_importe: "Le niveau d'expérience n'est pas un critère bloquant.",
    },
  },
  concierge: {
    title: "Quel est votre niveau d'expérience en conciergerie ?",
    descriptions: {
      debutant: "Je découvre la conciergerie ou un domaine similaire.",
      intermediaire: "J'ai déjà une première expérience opérationnelle.",
      experimente: "J'ai une expérience solide et régulière avec des clients.",
      peu_importe: "Je suis ouvert à toutes les opportunités.",
    },
  },
  artisan: {
    title: "Quel est votre niveau d'expérience dans votre métier ?",
    descriptions: {
      debutant: "Je débute mon activité ou je viens de me lancer.",
      intermediaire: "Je réalise des chantiers réguliers depuis plusieurs mois.",
      experimente: "J'interviens depuis plusieurs années avec une expertise confirmée.",
      peu_importe: "Je suis flexible selon les besoins.",
    },
  },
};

const getProfileKey = (category?: string): ProfileKey => {
  if (category === "proprietaire" || category === "artisan" || category === "concierge") {
    return category;
  }
  return "concierge";
};

export default function ExperiencePopup({ category, onClose, onValidate }: ExperiencePopupProps) {
  const [selected, setSelected] = useState<ExperienceLevel | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const profileKey = getProfileKey(category);
  const profileContent = PROFILE_CONTENT[profileKey];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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
        <p className={styles.stepIndicator}>Étape 2/5 - Expérience</p>
        <h3>{profileContent.title}</h3>

        <ul className={styles.optionList}>
          {EXPERIENCE_LEVELS.map((opt) => (
            <li key={opt.value}>
              <label className={styles.optionLabel}>
                <input
                  type="radio"
                  checked={selected === opt.value}
                  onChange={() => setSelected(opt.value)}
                />
                <span>
                  <strong>{opt.label}</strong>
                  <small className={styles.years}>{opt.years}</small>
                  <p>{profileContent.descriptions[opt.value]}</p>
                </span>
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
