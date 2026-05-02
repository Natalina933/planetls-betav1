"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import OnboardingStepHeader from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";
import styles from "./CategoryPopup.module.scss";

type ProfileKey = "proprietaire" | "concierge" | "artisan";

type ServiceOption = {
  value: string;
  label: string;
  description: string;
};

interface CategoryPopupProps {
  category: string;
  initialSelectedOptions?: string[];
  experienceLevel?: string;
  signupMode?: string;
  onSignupModeChange?: (mode: string) => void;
  onClose: () => void;
  onNext: (selectedOptions: string[]) => void;
}

const PROFILE_CONTENT: Record<
  ProfileKey,
  {
    title: string;
    intro: string;
    options: ServiceOption[];
  }
> = {
  proprietaire: {
    title: "Quels services recherchez-vous pour votre bien ?",
    intro: "Sélectionnez les besoins les plus importants pour votre location ou votre résidence.",
    options: [
      {
        value: "Accueil et remise des clés",
        label: "Accueil et remise des clés",
        description: "Pour les arrivées, départs et la bonne coordination des voyageurs.",
      },
      {
        value: "Ménage et linge",
        label: "Ménage et linge",
        description: "Pour garder un logement propre, prêt et accueillant entre deux séjours.",
      },
      {
        value: "Gestion complète",
        label: "Gestion complète",
        description: "Pour déléguer l'ensemble des opérations courantes à un seul partenaire.",
      },
      {
        value: "Maintenance et petites réparations",
        label: "Maintenance et petites réparations",
        description: "Pour intervenir rapidement sur les petits imprévus et l'entretien du bien.",
      },
      {
        value: "Intendance et suivi à distance",
        label: "Intendance et suivi à distance",
        description: "Pour surveiller le bien, coordonner les besoins et garder un œil sur place.",
      },
      {
        value: "Optimisation de l'annonce",
        label: "Optimisation de l'annonce",
        description: "Pour améliorer la visibilité, les photos, les tarifs et le taux de réservation.",
      },
    ],
  },
  concierge: {
    title: "Quels services souhaitez-vous mettre en avant ?",
    intro: "Choisissez les prestations que vous proposez déjà ou que vous voulez développer.",
    options: [
      {
        value: "Accueil voyageurs",
        label: "Accueil voyageurs",
        description: "Check-in, check-out et coordination fluide avec les voyageurs.",
      },
      {
        value: "Ménage et remise en état",
        label: "Ménage et remise en état",
        description: "Préparation du logement, contrôle qualité et remise en ordre entre les séjours.",
      },
      {
        value: "Linge et blanchisserie",
        label: "Linge et blanchisserie",
        description: "Gestion du linge propre, rotation et réassort pour les logements.",
      },
      {
        value: "Maintenance légère",
        label: "Maintenance légère",
        description: "Petites réparations, suivi des incidents et coordination des interventions.",
      },
      {
        value: "Intendance et assistance locale",
        label: "Intendance et assistance locale",
        description: "Courses, réapprovisionnement, passages de contrôle et assistance terrain.",
      },
      {
        value: "Pilotage de la location",
        label: "Pilotage de la location",
        description: "Messagerie, calendrier, coordination et gestion plus complète de l'activité.",
      },
    ],
  },
  artisan: {
    title: "Quels services professionnels proposez-vous ?",
    intro: "Sélectionnez les interventions que vous souhaitez recevoir ou développer via la plateforme.",
    options: [
      {
        value: "Plomberie",
        label: "Plomberie",
        description: "Dépannage, entretien, remplacement et petites installations.",
      },
      {
        value: "Électricité",
        label: "Électricité",
        description: "Mise en sécurité, dépannage, luminaires et interventions courantes.",
      },
      {
        value: "Peinture et finitions",
        label: "Peinture et finitions",
        description: "Rafraîchissement, retouches et valorisation visuelle du bien.",
      },
      {
        value: "Jardin, piscine et extérieur",
        label: "Jardin, piscine et extérieur",
        description: "Entretien des extérieurs, remise en état et suivi saisonnier.",
      },
      {
        value: "Petits travaux et rénovation",
        label: "Petits travaux et rénovation",
        description: "Interventions multi-services pour améliorer, réparer ou remettre en état.",
      },
      {
        value: "Décoration et aménagement",
        label: "Décoration et aménagement",
        description: "Valorisation des espaces, mise en ambiance et préparation du logement.",
      },
    ],
  },
};

const getProfileKey = (category: string): ProfileKey => {
  if (category === "proprietaire" || category === "artisan" || category === "concierge") {
    return category;
  }
  return "concierge";
};

export default function CategoryPopup({
  category,
  initialSelectedOptions = [],
  experienceLevel,
  signupMode = "simple",
  onSignupModeChange,
  onClose,
  onNext,
}: CategoryPopupProps) {
  const initialSelectedKey = initialSelectedOptions.join("\u001f");
  const [selected, setSelected] = useState<string[]>(() => initialSelectedOptions);
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();
  const popupRef = useRef<HTMLDivElement>(null);
  const profileKey = getProfileKey(category);
  const content = PROFILE_CONTENT[profileKey];
  const showConciergeModeSuggestion =
    profileKey === "concierge" && experienceLevel === "experimente" && Boolean(onSignupModeChange);
  const titleId = "category-popup-title";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setSelected(initialSelectedKey ? initialSelectedKey.split("\u001f") : []);
  }, [initialSelectedKey]);

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

  const toggle = (value: string) => {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
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
          title={"Étape 3/5 - Vos services"}
          step={3}
          readabilityScale={readabilityScale}
          onReadabilityChange={setReadabilityScale}
        />

        <h3 id={titleId}>{content.title}</h3>
        <p className={styles.introText}>{content.intro}</p>

        <div className={styles.content}>
          {showConciergeModeSuggestion ? (
            <section className={styles.modeSuggestion} aria-label="Mode d'inscription recommandé">
              <div>
                <strong>Mode express recommandé</strong>
                <span>Votre expérience permet de préparer un profil plus vite, sans vous imposer tous les champs longs.</span>
              </div>
              <div className={styles.modeSwitch} role="group" aria-label="Mode d'inscription concierge">
                <button
                  type="button"
                  className={signupMode === "simple" ? styles.modeActive : ""}
                  onClick={() => onSignupModeChange?.("simple")}
                >
                  Simple
                </button>
                <button
                  type="button"
                  className={signupMode === "express" ? styles.modeActive : ""}
                  onClick={() => onSignupModeChange?.("express")}
                >
                  Express
                </button>
                <button
                  type="button"
                  className={signupMode === "business" ? styles.modeActive : ""}
                  onClick={() => onSignupModeChange?.("business")}
                >
                  Business +
                </button>
              </div>
            </section>
          ) : null}

          <ul className={styles.optionList}>
            {content.options.map((option) => (
              <li key={option.value}>
                <label className={styles.optionLabel}>
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <p>{option.description}</p>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose}>
            Retour
          </button>
          <button type="button" onClick={() => onNext(selected)} disabled={selected.length === 0}>
            Continuer ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}
