"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";
import type { ReadabilityScale } from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import styles from "./ReadabilityControlsIcon.module.scss";

const OPTIONS: Array<{ label: string; value: ReadabilityScale; title: string }> = [
  { label: "A", value: "normal", title: "Taille normale" },
  { label: "A+", value: "large", title: "Texte plus grand" },
  { label: "A++", value: "xlarge", title: "Texte tres grand" },
];

// Icône œil sympathique
const FriendlyEyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ opacity: 0.8 }}
  >
    <g>
      {/* Œil gauche */}
      <ellipse cx="9" cy="12" rx="3" ry="4" fill="currentColor" />
      <circle cx="9" cy="12" r="1.5" fill="white" />

      {/* Œil droit */}
      <ellipse cx="18" cy="12" rx="3" ry="4" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="white" />

      {/* Sourcil gauche sympathique */}
      <path d="M 6 8 Q 9 6 12 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Sourcil droit sympathique */}
      <path d="M 15 8 Q 18 6 21 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

export function ReadabilityControlsIcon() {
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const currentOption = OPTIONS.find((opt) => opt.value === readabilityScale);

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Contrôles de lisibilité - Ajuster la taille du texte"
        aria-expanded={isOpen}
        title="Lisibilité - Ajuster la taille du texte"
      >
        <FriendlyEyeIcon />
        <span className={styles.label}>{currentOption?.label || "A"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu" aria-label="Options de taille du texte">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              className={`${styles.option} ${readabilityScale === option.value ? styles.selected : ""}`}
              onClick={() => {
                setReadabilityScale(option.value);
                setIsOpen(false);
              }}
              aria-label={option.title}
              title={option.title}
            >
              <span className={styles.optionLabel}>{option.label}</span>
              <span className={styles.optionTitle}>{option.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

