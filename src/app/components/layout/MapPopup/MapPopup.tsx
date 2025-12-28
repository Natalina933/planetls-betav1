"use client";

import { useEffect, useRef } from "react";
import MapWithSearch from "../Home/MapWithSearch/MapWithSearch";
import { useSearchPopup } from "../../../context/SearchPopupContext";
import { useRouter, usePathname } from "next/navigation";

export default function MapPopup() {
  const { searchOpen, setSearchOpen, forceClose, setForceClose } = useSearchPopup();
  const popupRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname(); 
  
  // ✅ La popup ne s'affiche QUE sur la homepage "/"
  const isHomePage = pathname === "/home";
  
  // Ouverture auto (scroll ou timer)
  useEffect(() => {
    // Ne déclenche la popup QUE si on est sur la homepage
    if (hasTriggeredRef.current || !isHomePage) return;

    const timer = setTimeout(() => {
      setSearchOpen(true);
      hasTriggeredRef.current = true;
    }, 120000); // 2 minutes

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
  }, [setSearchOpen, isHomePage]);

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

  // ✅ Si on n'est PAS sur la homepage, ne rien afficher
  if (!isHomePage) return null;

  // ⚡ Ne rien rendre si searchOpen est faux
  if (!searchOpen) return null;

  // ⚡ MapWithSearch gère son overlay interne
  return <MapWithSearch onClose={() => setSearchOpen(false)} />;
}