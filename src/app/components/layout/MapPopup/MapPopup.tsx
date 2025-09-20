"use client";

import { useEffect, useRef } from "react";
import MapWithSearch from "../Home/MapWithSearch/MapWithSearch";
import { useSearchPopup } from "../../../context/SearchPopupContext";
import { useRouter } from "next/navigation";

export default function MapPopup() {
  const { searchOpen, setSearchOpen, forceClose, setForceClose } = useSearchPopup();
  const popupRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);
  const router = useRouter();

  // Ouverture auto (scroll ou timer)
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

  // Fermeture via touche Escape
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

  // Gestion du forceClose (depuis le contexte)
  useEffect(() => {
    if (forceClose) {
      setSearchOpen(false);
      setForceClose(false);
    }
  }, [forceClose, setSearchOpen, setForceClose]);

  // ⚡ Ne rien rendre si searchOpen est faux
  if (!searchOpen) return null;

  // ⚡ MapWithSearch gère son overlay interne
  return <MapWithSearch onClose={() => setSearchOpen(false)} />;
}
