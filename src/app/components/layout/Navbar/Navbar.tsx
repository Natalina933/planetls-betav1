"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import styles from "./Navbar.module.scss";

// Import dynamique de l'icône utilisateur
const Icons = {
  FaUser: dynamic(() => import("react-icons/fa").then(mod => mod.FaUser), { ssr: false }),
  FaSearch: dynamic(() => import("react-icons/fa").then(mod => mod.FaSearch), { ssr: false }),
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className={styles.navbar}>
      {/* Burger menu */}
      <button
        className={`${styles.burger} ${menuOpen ? styles.open : ""}`}
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Menu items */}
      <ul className={`${styles.menu} ${menuOpen ? styles.open : ""}`}>
        <li className={styles["nav-seach"]}>
          <Icons.FaSearch size={18} />
          <Link href="/recherche">Recherche</Link>
        </li>
        <li className={styles["auth-inscription"]}>
          <Link href="/inscription">S’inscrire</Link>
        </li>
        <li className={styles["auth-connexion"]}>
          <Link href="/connexion">
            <Icons.FaUser size={18} /> Se connecter
          </Link>
        </li>
      </ul>
    </nav>
  );
}
