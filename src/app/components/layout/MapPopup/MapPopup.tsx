"use client";

import { useEffect, useRef } from "react";
import MapWithSearch from "../Home/MapWithSearch/MapWithSearch";
import { useSearchPopup } from "../../../context/SearchPopupContext";
import { useRouter, usePathname } from "next/navigation";

// --- AJOUT : Définition de l'interface des props ---
interface MapPopupProps {
  // Déclare la prop 'showOn' comme un tableau optionnel de chaînes de caractères.
  // Vous pouvez retirer le '?' si elle est obligatoire.
  showOn?: string[]; 
}
export default function MapPopup({ showOn }: MapPopupProps) {
  const { searchOpen, setSearchOpen, forceClose, setForceClose } = useSearchPopup();
  const popupRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname(); 
 // 2. LOGIQUE POUR DÉTERMINER SI LA POPUP DOIT ÊTRE ACTIVE SUR CE CHEMIN
  // Si showOn est défini et que le chemin actuel n'est PAS inclus, on désactive la logique d'ouverture.
  const isEnabledOnPath = !showOn || showOn.includes(pathname);
  
// Ouverture auto (scroll ou timer)
useEffect(() => {
  // Ajoutez la condition isEnabledOnPath pour ne pas déclencher la popup sur les pages non autorisées
  if (hasTriggeredRef.current || !isEnabledOnPath) return; // <-- CONDITION AJOUTÉE

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
}, [setSearchOpen, isEnabledOnPath]);

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

// Si la popup ne doit pas s'afficher sur ce chemin ET qu'elle est fermée, on ne rend rien.
if (!isEnabledOnPath && !searchOpen) return null;

// ⚡ Ne rien rendre si searchOpen est faux
if (!searchOpen) return null;

// ⚡ MapWithSearch gère son overlay interne
return <MapWithSearch onClose={() => setSearchOpen(false)} />;
}
