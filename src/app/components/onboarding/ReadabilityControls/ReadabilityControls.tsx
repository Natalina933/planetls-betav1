"use client";

import styles from "./ReadabilityControls.module.scss";

export type ReadabilityScale = "normal" | "large" | "xlarge";

interface ReadabilityControlsProps {
  value: ReadabilityScale;
  onChange: (scale: ReadabilityScale) => void;
  className?: string;
}

const OPTIONS: Array<{
  value: ReadabilityScale;
  label: string;
  ariaLabel: string;
  title: string;
}> = [
  {
    value: "normal",
    label: "A",
    ariaLabel: "Taille de texte normale",
    title: "Taille normale",
  },
  {
    value: "large",
    label: "A+",
    ariaLabel: "Grande taille de texte",
    title: "Texte plus grand",
  },
  {
    value: "xlarge",
    label: "A++",
    ariaLabel: "Très grande taille de texte",
    title: "Texte très grand",
  },
];

export default function ReadabilityControls({ value, onChange, className }: ReadabilityControlsProps) {
  const rootClassName = className ? `${styles.controls} ${className}` : styles.controls;

  return (
    <div className={rootClassName} role="group" aria-label="Taille du texte">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? styles.active : styles.button}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          aria-label={option.ariaLabel}
          title={option.title}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
