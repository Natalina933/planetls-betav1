"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useTheme } from "@/app/providers/ThemeProvider";

import Navbar from "../Navbar/Navbar";
import styles from "./Header.module.scss";

export default function Header() {
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);

  const pathname = usePathname();
  const isHome = pathname === "/home";

  const { theme } = useTheme();

  const logoSrc =
    !isHome && theme === "mucha-dark"
      ? "/icons/logoCompletv2-gold.svg"
      : "/icons/logoCompletv2.svg";

  return (
    <header
      data-home-heritage={isHome ? "" : undefined}
      className={`${styles.header} ${isHome ? styles.heritage : ""}`}
    >
      <div className={styles.logo}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="PlanetLS - Accueil"
        >
          <span className={styles.logoWrapper}>
            <Image
              src={logoSrc}
              alt="PlanetLs - Accueil"
              width={180}
              height={56}
              priority
            />
          </span>
        </Link>
      </div>

      {isHome && (
        <div className={styles.homeNavigation}>
          <button
            type="button"
            className={styles.homeMenuButton}
            aria-expanded={homeMenuOpen}
            aria-controls="home-navigation"
            onClick={() => setHomeMenuOpen((open) => !open)}
          >
            <span>Explorer PlanetLS</span>

            <span
              className={styles.homeMenuIcon}
              aria-hidden="true"
            >
              {homeMenuOpen ? "−" : "＋"}
            </span>
          </button>

          <nav
            id="home-navigation"
            className={[
              styles.homeLinks,
              homeMenuOpen ? styles.homeLinksOpen : "",
            ].join(" ")}
            aria-label="Découvrir PlanetLS"
            onClick={() => setHomeMenuOpen(false)}
          >
            <Link href="#proprietaires">Propriétaires</Link>
            <Link href="#conciergeries">Concierges</Link>
            <Link href="#artisans">Artisans</Link>
            <Link href="#fonctionnement">Comment ça marche ?</Link>
            <Link href="#services">Nos services</Link>
            <Link href="#conseils">Conseils</Link>
          </nav>
        </div>
      )}

      <div className={styles.actions}>
        <Navbar />
      </div>
    </header>
  );
}
