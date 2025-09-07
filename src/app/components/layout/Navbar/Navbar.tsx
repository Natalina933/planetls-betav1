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
  const [menuOpen, setMenuOpen] = useState(false);
  const { openSearchPopup } = useSearchPopup();

  return (
    <nav className={styles.navbar}>
      <button
        className={`${styles.burger} ${menuOpen ? styles.open : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul className={`${styles.menu} ${menuOpen ? styles.open : ""}`}>
        <li className={styles["nav-seach"]}>
          <button onClick={openSearchPopup} className={styles.searchBtn}>
            <Icons.FaSearch size={18} /> Recherche
          </button>
        </li>
        <li className={styles["auth-inscription"]}><a href="/inscription">S’inscrire</a></li>
        <li className={styles["auth-connexion"]}>
          <a href="/connexion"><Icons.FaUser size={18} /> Se connecter</a>
        </li>
      </ul>
    </nav>
  );
}
