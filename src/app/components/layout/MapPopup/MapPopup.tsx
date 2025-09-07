"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./MapPopup.module.scss";
import { useSearchPopup } from "../../../context/SearchPopupContext";
const MapWithSearch = dynamic(
  () => import("../Home/MapWithSearch/MapWithSearch"),
  { ssr: false }
);

export default function MapPopup() {
  const { searchOpen, openSearchPopup, closeSearchPopup } = useSearchPopup();
  const popupRef = useRef<HTMLDivElement>(null);

  // Empêche l'ouverture multiple
  const [hasTriggered, setHasTriggered] = useState(false);
  // Empêche la réouverture après fermeture
  const [hasBeenClosed, setHasBeenClosed] = useState(false);
  // Pour animation
  const [visible, setVisible] = useState(false);

  // Gestion scroll / timer
  useEffect(() => {
    if (hasTriggered || hasBeenClosed) return;

    const timer = setTimeout(() => {
      openSearchPopup();
      setHasTriggered(true);
    }, 120000); // 2 min

    const handleScroll = () => {
      if (!hasTriggered && window.scrollY > 600) {
        openSearchPopup();
        setHasTriggered(true);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasTriggered, hasBeenClosed, openSearchPopup]);

  // Gestion ouverture/fermeture avec animation
  useEffect(() => {
    if (searchOpen) setVisible(true);
    else setVisible(false);
  }, [searchOpen]);

  // Gestion touche ESC
  useEffect(() => {
    if (!searchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSearchPopup();
        setHasBeenClosed(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    popupRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen, closeSearchPopup]);

  if (!searchOpen && !visible) return null;

  const handleClose = () => {
    closeSearchPopup();
    setHasBeenClosed(true);
  };

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.show : styles.hide}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`${styles.popup} ${visible ? styles.show : styles.hide}`}
        ref={popupRef}
        tabIndex={-1}
        aria-label="Fenêtre de recherche"
      >
        <button
          className={styles.close}
          onClick={handleClose}
          aria-label="Fermer la fenêtre"
        >
          ✕
        </button>
        <MapWithSearch />
      </div>
    </div>
  );
}