"use client";

import { useEffect } from "react";
import MapWithSearch from "../Home/MapWithSearch/MapWithSearch";
import { useSearchPopup } from "@/app/context/SearchPopupContext";
import { usePathname } from "next/navigation";

export default function MapPopup() {
  const { searchOpen, setSearchOpen, forceClose, setForceClose } = useSearchPopup();
  const pathname = usePathname();

  const isHomePage = pathname === "/home";

  useEffect(() => {
    if (!searchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (forceClose) {
      setSearchOpen(false);
      setForceClose(false);
    }
  }, [forceClose, setSearchOpen, setForceClose]);

  if (!isHomePage) return null;
  if (!searchOpen) return null;

  return <MapWithSearch onClose={() => setSearchOpen(false)} />;
}
