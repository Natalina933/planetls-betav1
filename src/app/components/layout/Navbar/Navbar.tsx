"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import styles from "./Navbar.module.scss";
import { useSearchPopup } from "../../../context/SearchPopupContext";

const Icons = {
  FaUser: dynamic(() => import("react-icons/fa").then(mod => mod.FaUser), { ssr: false }),
  FaSearch: dynamic(() => import("react-icons/fa").then(mod => mod.FaSearch), { ssr: false }),
};

export default function Navbar() {
  const { setSearchOpen } = useSearchPopup();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      {/* Burger Menu */}
      <button
        className={`${styles.burger} ${menuOpen ? styles.open : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Menu Items */}
      <ul className={`${styles.menu} ${menuOpen ? styles.show : ""}`}>
        <li className={styles["nav-search"]}>
          <button
            onClick={() => setSearchOpen(true)}
            className={`${styles.searchBtn} ${styles.navButton}`}
            aria-label="Ouvrir la recherche"
          >
            <Icons.FaSearch size={18} /> Recherche
          </button>
        </li>
        <li className={styles["auth-inscription"]}>
          <button
            onClick={() => setSearchOpen(true)} // <-- même logique que Recherche
            className={`${styles.searchBtn} ${styles.navButton}`}
            aria-label="Ouvrir la recherche pour inscription"
          >
            S’inscrire
          </button>
        </li>
        <li className={styles["auth-connexion"]}>
          <a href="/login">
            <Icons.FaUser size={18} /> Se connecter
          </a>
        </li>
      </ul>
    </nav>
  );
}
