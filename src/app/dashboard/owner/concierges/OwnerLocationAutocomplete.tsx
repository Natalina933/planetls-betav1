"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./OwnerConciergesPage.module.scss";

type OwnerLocationAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  getSuggestions: (input: string) => string[];
};

export function OwnerLocationAutocomplete({
  value,
  onChange,
  placeholder,
  ariaLabel,
  getSuggestions,
}: OwnerLocationAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const suggestions = useMemo(() => getSuggestions(value), [getSuggestions, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className={styles.autocomplete} ref={containerRef}>
      <input
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && suggestions.length > 0 ? (
        <div className={styles.autocompletePanel}>
          {suggestions.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.autocompleteOption}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
