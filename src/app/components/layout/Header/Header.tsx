"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useTheme } from "@/app/providers/ThemeProvider";

import Navbar from "../Navbar/Navbar";
import styles from "./Header.module.scss";
import {
  FiGrid,
  FiChevronDown,
  FiHome,
  FiBriefcase,
  FiTool,
  FiHelpCircle,
  FiLayers,
  FiBookOpen,
} from "react-icons/fi";

// Navigation items pour le dropdown Explorer PlanetLS
const exploreNavigationItems = [
  { icon: FiHome, label: "Propriétaires", href: "#proprietaires" },
  { icon: FiBriefcase, label: "Concierges", href: "#conciergeries" },
  { icon: FiTool, label: "Artisans", href: "#artisans" },
  { icon: FiHelpCircle, label: "Comment ça marche ?", href: "#fonctionnement" },
  { icon: FiLayers, label: "Nos services", href: "#services" },
  { icon: FiBookOpen, label: "Conseils", href: "#conseils" },
];

export default function Header() {
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);

  const pathname = usePathname();
  const isHome = pathname === "/home" || pathname === "/";

  const { theme } = useTheme();

  const logoSrc =
    !isHome && theme === "mucha-dark"
      ? "/logo/planetls-header-logo-dark.png"
      : "/logo/Embl%C3%A8me%20globe%20dor%C3%A9%20PlanetLS.png";

  const toggleHomeMenu = () => setHomeMenuOpen((open) => !open);

  return (
    <header
      data-home-heritage={isHome ? "" : undefined}
      className={`${styles.header} ${isHome ? styles.heritage : ""}`}
    >
      {/* LOGO */}
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
          {/* Bouton Explorer PlanetLS avec dropdown */}
          <div className={styles.homeMenuWrapper}>
            <button
              type="button"
              className={styles.homeMenuButton}
              aria-expanded={homeMenuOpen}
              aria-controls="home-navigation-dropdown"
              onClick={toggleHomeMenu}
            >
              <span>
                <FiGrid size={18} aria-hidden="true" />
                Explorer PlanetLS
              </span>
              <FiChevronDown
                size={16}
                className={styles.homeMenuIcon}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown Explorer PlanetLS */}
            <nav
              id="home-navigation-dropdown"
              className={`${styles.homeLinksDropdown} ${
                homeMenuOpen ? styles.homeMenuOpen : styles.homeLinksClosed
              }`}
              aria-label="Découvrir PlanetLS"
            >
              {exploreNavigationItems.map(({ icon: Icon, label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setHomeMenuOpen(false)}
                  aria-label={label}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Liens de navigation horizontaux (visibles sur desktop large) */}
          <nav
            className={styles.homeLinks}
            aria-label="Navigation principale"
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

      {/* ACTIONS / NAVBAR */}
      <div className={styles.actions}>
        {/* Séparateur vertical */}
        <div className={styles.actionsSeparator} aria-hidden="true" />
        <Navbar showThemeOnDesktop={true} />
      </div>
    </header>
  );
}
