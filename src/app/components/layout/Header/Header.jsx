"use client";

import Link from "next/link";
import Navbar from "../Navbar/Navbar";
import ThemeToggle from "@/app/components/ui/ThemeToggle/ThemeToggle";
import styles from "./Header.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoWrapper}>
            <img
              src="/icons/logoCompletv2.svg"
              alt="PlanetLs – Accueil"
            />
          </span>
        </Link>
      </div>

      <Navbar />

      {/* 🔆🌙 Toggle thème */}
      <div className={styles.themeZone}>
        <ThemeToggle />
      </div>
    </header>
  );
}
