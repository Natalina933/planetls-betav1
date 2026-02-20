"use client";

import Link from "next/link";
import { useTheme } from "@/app/context/ThemeContext";
import Navbar from "../Navbar/Navbar";
import ThemeToggle from "@/app/components/ui/ThemeToggle/ThemeToggle";
import styles from "./Header.module.scss";

export default function Header() {
  const { theme } = useTheme();
  const logoSrc = theme === 'mucha-dark'
    ? '/icons/logoCompletv2-gold.svg'
    : '/icons/logoCompletv2.svg';

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoWrapper}>
            <img
              src={logoSrc}
              alt="PlanetLs – Accueil"
            />
          </span>
        </Link>
      </div>

      <Navbar />

    </header>
  );
}
