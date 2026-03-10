"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
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
      <Input
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
        className={styles.autocompleteInput}
      />

      {isOpen && suggestions.length > 0 ? (
        <div className={styles.autocompletePanel}>
          {suggestions.map((option) => (
            <Button
              key={option}
              type="button"
              variant="ghost"
              size="sm"
              className={styles.autocompleteOption}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
