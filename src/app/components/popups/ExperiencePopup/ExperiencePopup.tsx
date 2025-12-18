"use client";

import React, { useState } from "react";
import styles from "./ExperiencePopup.module.scss";

interface ExperiencePopupProps {
    onClose: () => void;
    onNext: (experience_level: "debutant" | "intermediaire" | "experimente") => void;
}

const EXPERIENCE_LEVELS = [
    {
        label: "Débutant",
        value: "debutant" as const,
        description: "Je découvre la conciergerie ou un domaine similaire.",
    },
    {
        label: "Petite expérience",
        value: "intermediaire" as const,
        description: "J’ai déjà travaillé un peu dans la conciergerie ou un service équivalent.",
    },
    {
        label: "Expérimenté",
        value: "experimente" as const,
        description: "J’ai une expérience solide et régulière dans ce domaine.",
    },
];

export default function ExperiencePopup({ onClose, onNext }: ExperiencePopupProps) {
    const [selected, setSelected] = useState<
        "debutant" | "intermediaire" | "experimente" | null
    >(null);

    const handleValidate = () => {
        if (selected) onNext(selected);
    };

    return (
        <div className={styles.popupOverlay}>
            <div className={styles.popupContent}>
                <h3>Quel est votre niveau d’expérience en conciergerie ou similaire ?</h3>

                <ul className={styles.optionList}>
                    {EXPERIENCE_LEVELS.map((opt) => (
                        <li key={opt.value}>
                            <label className={styles.optionLabel}>
                                <input
                                    type="radio"
                                    name="experience_level"
                                    checked={selected === opt.value}
                                    onChange={() => setSelected(opt.value)}
                                />
                                <span>
                                    <strong>{opt.label}</strong> – {opt.description}
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>

                <div className={styles.actions}>
                    <button className={styles.closeButton} onClick={onClose}>
                        Annuler
                    </button>
                    <button
                        type="button"
                        disabled={!selected}
                        onClick={handleValidate}
                    >
                        Valider mon niveau
                    </button>
                </div>
            </div>
        </div>
    );
}
