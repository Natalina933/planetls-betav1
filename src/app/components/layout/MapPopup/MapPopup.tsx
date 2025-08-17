"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import styles from "./MapPopup.module.scss";

// Import dynamique du composant MapWithSearch
const MapWithSearch = dynamic(() => import("../Home/MapWithSearch/MapWithSearch"), { ssr: false });

export default function MapPopup() {
  const [visible, setVisible] = useState(false);
  const [hasBeenClosed, setHasBeenClosed] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasBeenClosed) return;

    const timer = setTimeout(() => setVisible(true), 120000); // 2 min

    const handleScroll = () => {
      if (window.scrollY > 600) setVisible(true);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasBeenClosed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVisible(false);
        setHasBeenClosed(true);
      }
    };

    if (visible) {
      document.addEventListener("keydown", handleKeyDown);
      popupRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible]);

  const closePopup = () => {
    setVisible(false);
    setHasBeenClosed(true);
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div
        className={styles.popup}
        ref={popupRef}
        tabIndex={-1}
        aria-label="Fenêtre de recherche"
      >
        <button className={styles.close} onClick={closePopup} aria-label="Fermer la fenêtre">
          ✕
        </button>
        <MapWithSearch />
      </div>
    </div>
  );
}
