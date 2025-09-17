"use client";

import { useEffect, useRef } from "react";
import styles from "./MapPopup.module.scss";
import MapWithSearch from "../Home/MapWithSearch/MapWithSearch";
import { useSearchPopup } from "../../../context/SearchPopupContext";

export default function MapPopup() {
  const { searchOpen, setSearchOpen } = useSearchPopup();
  const popupRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false); // pour savoir si le scroll/timer a déjà déclenché l'ouverture

  // Auto-ouverture après 2 min ou scroll
  useEffect(() => {
    if (hasTriggeredRef.current) return;

    const timer = setTimeout(() => {
      setSearchOpen(true);
      hasTriggeredRef.current = true; // marque comme déclenché
    }, 120000); // 2 min

    const handleScroll = () => {
      if (!hasTriggeredRef.current && window.scrollY > 600) {
        setSearchOpen(true);
        hasTriggeredRef.current = true; // marque comme déclenché
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [setSearchOpen]);

  // ESC pour fermer
  useEffect(() => {
    if (!searchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    popupRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div
        className={styles.popup}
        ref={popupRef}
        tabIndex={-1}
        aria-label="Fenêtre de recherche"
      >
        <button
          className={styles.close}
          onClick={() => setSearchOpen(false)}
          aria-label="Fermer la fenêtre"
        >
          ✕
        </button>

        {/* Contenu de la popup */}
        <MapWithSearch />
      </div>
    </div>
  );
}
