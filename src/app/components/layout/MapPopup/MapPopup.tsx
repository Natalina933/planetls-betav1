"use client";

import { useEffect, useRef } from "react";
import styles from "./MapPopup.module.scss";
import MapWithSearch from "../Home/MapWithSearch/MapWithSearch";
import { useSearchPopup } from "../../../context/SearchPopupContext";
import { useRouter } from "next/navigation";

export default function MapPopup() {
  const { searchOpen, setSearchOpen, forceClose, setForceClose } = useSearchPopup();
  const popupRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (hasTriggeredRef.current) return;

    const timer = setTimeout(() => {
      setSearchOpen(true);
      hasTriggeredRef.current = true;
    }, 120000);

    const handleScroll = () => {
      if (!hasTriggeredRef.current && window.scrollY > 600) {
        setSearchOpen(true);
        hasTriggeredRef.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [setSearchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        router.push("/");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    popupRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen, setSearchOpen, router]);

  useEffect(() => {
    if (forceClose) {
      setSearchOpen(false);
      setForceClose(false);
    }
  }, [forceClose, setSearchOpen, setForceClose]);

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
          onClick={() => {
            setSearchOpen(false);
            router.push("/");
          }}
          aria-label="Fermer la fenêtre"
        >
          ✕
        </button>

        <MapWithSearch />
      </div>
    </div>
  );
}
