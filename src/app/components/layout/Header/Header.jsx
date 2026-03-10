"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/app/providers/ThemeProvider";
import Navbar from "../Navbar/Navbar";
import styles from "./Header.module.scss";

export default function Header() {
  const { theme } = useTheme();
  const logoSrc =
    theme === "mucha-dark" ? "/icons/logoCompletv2-gold.svg" : "/icons/logoCompletv2.svg";

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoWrapper}>
            <Image src={logoSrc} alt="PlanetLs - Accueil" width={180} height={56} priority />
          </span>
        </Link>
      </div>

      <Navbar />
    </header>
  );
}
