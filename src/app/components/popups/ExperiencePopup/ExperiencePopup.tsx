//src/app/components/popups/ExperiencePopup/ExperiencePopup.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ExperiencePopup.module.scss";

interface ExperiencePopupProps {
    onClose: () => void;
    onNext: (
        experience_level: "debutant" | "intermediaire" | "experimente",
        years_of_experience: string
    ) => void;
}

const EXPERIENCE_LEVELS = [
    {
        label: "Débutant",
        value: "debutant" as const,
        description: "Je découvre la conciergerie ou un domaine similaire.",
        yearsRange: "0-1 an",
    },
    {
        label: "Petite expérience",
        value: "intermediaire" as const,
        description: "J'ai déjà travaillé un peu dans la conciergerie ou un service équivalent.",
        yearsRange: "1-3 ans",
    },
    {
        label: "Expérimenté",
        value: "experimente" as const,
        description: "J'ai une expérience solide et régulière dans ce domaine.",
        yearsRange: "+3 ans",
    },
];

export default function ExperiencePopup({ onClose, onNext }: ExperiencePopupProps) {
    const [selected, setSelected] = useState<
        "debutant" | "intermediaire" | "experimente" | null
    >(null);

    const popupRef = useRef<HTMLDivElement | null>(null);

    // Empêche le scroll du body
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    // Fermeture via Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    // Fermeture en cliquant en dehors
    const handleClickOutside = useCallback(
        (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    useEffect(() => {
        const focusableSelectors =
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

        const popup = popupRef.current;
        if (!popup) return;

        const focusables = popup.querySelectorAll<HTMLElement>(focusableSelectors);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        first?.focus();

        const trap = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        popup.addEventListener("keydown", trap);
        return () => popup.removeEventListener("keydown", trap);
    }, []);

    const handleValidate = () => {
        if (selected) {
            const selectedLevel = EXPERIENCE_LEVELS.find(lvl => lvl.value === selected);
            const yearsRange = selectedLevel?.yearsRange || "0-1 an";
            onNext(selected, yearsRange);
        }
    };

    return (
        <div
            className={styles.popupOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="experience-title"
        >
            <div className={styles.popupContent} ref={popupRef}>
                <h3 id="experience-title">
                    Quel est votre niveau d&apos;expérience en conciergerie ou similaire ?
                </h3>

                <div className={styles.content}>
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
                                        <strong>{opt.label}</strong>
                                        <span className={styles.yearsRange}>({opt.yearsRange})</span>
                                        <p className={styles.description}>{opt.description}</p>
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.actions}>
                    <button className={styles.closeButton} onClick={onClose}>
                        Annuler
                    </button>
                    <button disabled={!selected} onClick={handleValidate}>
                        Valider mon niveau
                    </button>
                </div>
            </div>
        </div>
    );
}