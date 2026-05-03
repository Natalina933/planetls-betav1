"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaTimes } from "react-icons/fa";
import OnboardingStepHeader from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";
import styles from "./ExperiencePopup.module.scss";

export type ExperienceLevel = "debutant" | "intermediaire" | "experimente" | "peu_importe";
type VisibleExperienceLevel = Exclude<ExperienceLevel, "peu_importe">;
type ProfileKey = "proprietaire" | "concierge" | "artisan";
type ExperienceOption = {
  label: string;
  value: VisibleExperienceLevel;
  years: string;
  description: string;
};

interface ExperiencePopupProps {
  category?: string;
  onBack?: () => void;
  onClose: () => void;
  onValidate: (level: ExperienceLevel, years: string) => void;
}

const PROFILE_CONTENT: Record<
  ProfileKey,
  {
    title: string;
    intro: string;
    options: ExperienceOption[];
  }
> = {
  proprietaire: {
    title: "Quel niveau d'expérience souhaitez-vous pour gérer votre bien ?",
    intro: "Choisissez le profil que vous souhaitez contacter en priorité.",
    options: [
      {
        label: "Ouvert à un nouveau profil",
        value: "debutant",
        years: "Premiers biens ou premières missions",
        description: "Vous êtes prêt à échanger avec un profil qui démarre, s'il est sérieux, réactif et bien accompagné.",
      },
      {
        label: "Déjà opérationnel",
        value: "intermediaire",
        years: "Déjà actif sur plusieurs missions",
        description: "Vous recherchez quelqu'un qui connaît déjà le terrain et peut prendre en main votre besoin rapidement.",
      },
      {
        label: "Très expérimenté",
        value: "experimente",
        years: "3 ans d'expérience et +",
        description: "Vous voulez un partenaire confirmé, autonome et rassurant dès le départ.",
      },
    ],
  },
  concierge: {
    title: "Où en êtes-vous dans votre activité de conciergerie ?",
    intro: "Cela nous aide à vous proposer un parcours et des contacts adaptés à votre rythme.",
    options: [
      {
        label: "Je me lance",
        value: "debutant",
        years: "0 à 1 an",
        description: "Vous lancez votre activité ou vous démarrez vos premières missions.",
      },
      {
        label: "Je prends mon rythme",
        value: "intermediaire",
        years: "1 à 3 ans",
        description: "Vous gérez déjà quelques biens ou missions et vous voulez accélérer.",
      },
      {
        label: "Je suis structuré(e)",
        value: "experimente",
        years: "3 ans et +",
        description: "Votre activité est déjà installée et vous voulez développer votre portefeuille.",
      },
    ],
  },
  artisan: {
    title: "Où en êtes-vous dans votre activité professionnelle ?",
    intro: "Choisissez le niveau qui décrit le mieux votre activité actuelle.",
    options: [
      {
        label: "Je démarre",
        value: "debutant",
        years: "0 à 1 an",
        description: "Vous démarrez votre activité ou vous ouvrez ce service à de nouveaux clients.",
      },
      {
        label: "Je développe ma clientèle",
        value: "intermediaire",
        years: "1 à 3 ans",
        description: "Vous avez déjà des interventions régulières et vous voulez gagner en visibilité.",
      },
      {
        label: "Je suis bien installé(e)",
        value: "experimente",
        years: "3 ans et +",
        description: "Votre activité est bien en place et vous voulez capter des demandes qualifiées.",
      },
    ],
  },
};

const getProfileKey = (category?: string): ProfileKey => {
  if (category === "proprietaire" || category === "artisan" || category === "concierge") {
    return category;
  }
  return "concierge";
};

export default function ExperiencePopup({ category, onBack, onClose, onValidate }: ExperiencePopupProps) {
  const [selected, setSelected] = useState<VisibleExperienceLevel | null>(null);
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();
  const popupRef = useRef<HTMLDivElement>(null);
  const profileKey = getProfileKey(category);
  const profileContent = PROFILE_CONTENT[profileKey];
  const titleId = "experience-popup-title";

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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleValidate = () => {
    if (!selected) return;
    const level = profileContent.options.find((item) => item.value === selected);
    if (!level) return;
    onValidate(level.value, level.years);
  };

  return (
    <div className={styles.popupOverlay} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={styles.popupContent} ref={popupRef}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer la fenêtre"
        >
          <FaTimes />
        </button>

        <OnboardingStepHeader
          title={"Étape 2/5 - Votre expérience"}
          step={2}
          readabilityScale={readabilityScale}
          onReadabilityChange={setReadabilityScale}
        />

        <h3 id={titleId}>{profileContent.title}</h3>
        <p className={styles.introText}>{profileContent.intro}</p>

        <ul className={styles.optionList}>
          {profileContent.options.map((opt) => (
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
                  <p>{opt.description}</p>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button type="button" onClick={onBack ?? onClose}>
            Retour
          </button>
          <button type="button" onClick={handleValidate} disabled={!selected}>
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
