"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import styles from "./Navbar.module.scss";
import { useSearchPopup } from "../../../context/SearchPopupContext";
import { useTheme } from "../../../context/ThemeContext";
import { useSession, signOut } from "next-auth/react";
import { useUserType } from "@/app/context/UserTypeContext";

const Icons = {
  FaUser: dynamic(() => import("react-icons/fa").then((mod) => mod.FaUser), {
    ssr: false,
  }),
  FaSearch: dynamic(() => import("react-icons/fa").then((mod) => mod.FaSearch), {
    ssr: false,
  }),
  FaTachometerAlt: dynamic(
    () => import("react-icons/fa").then((mod) => mod.FaTachometerAlt),
    { ssr: false },
  ),
  FaPalette: dynamic(() => import("react-icons/fa").then((mod) => mod.FaPalette), {
    ssr: false,
  }),
};

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000;

const publicLinks = [
  { href: "/home", label: "Accueil" },
  { href: "/home#how-it-works", label: "Fonctionnement" },
  { href: "/dashboard/owner/concierges", label: "Trouver un concierge" },
  { href: "/abonnement/concierge-pro", label: "Offre PRO" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setSearchOpen } = useSearchPopup();
  const { theme, changeTheme, themes, labels, getCurrentLabel } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const { userType } = useUserType();

  const [showWarning, setShowWarning] = useState(false);
  const [warningDeadline, setWarningDeadline] = useState<number | null>(null);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(
    Math.floor(WARNING_BEFORE_LOGOUT / 1000),
  );
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showWarningRef = useRef(false);
  const extendButtonRef = useRef<HTMLButtonElement | null>(null);
  const warningModalRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  const isAuthenticated = status === "authenticated";
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  const getDashboardPath = () => {
    if (!userType) {
      const role = session?.user?.role;
      if (role === "concierge" || role === "concierge_pro") {
        return "/dashboard/concierge";
      }
      if (role === "owner" || role === "owner_pro") {
        return "/dashboard/owner";
      }
      if (role === "provider" || role === "provider_pro") {
        return "/dashboard/provider";
      }
      return "/dashboard";
    }

    return `/dashboard/${userType}`;
  };

  const clearInactivityTimers = useCallback(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
    timeoutIdRef.current = null;
    warningTimeoutIdRef.current = null;
  }, []);

  const handleAutoLogout = useCallback(async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimers();

    if (showWarningRef.current) {
      return;
    }

    if (isAuthenticated && isDashboardRoute) {
      warningTimeoutIdRef.current = setTimeout(() => {
        showWarningRef.current = true;
        setShowWarning(true);
        setWarningDeadline(Date.now() + WARNING_BEFORE_LOGOUT);
        setWarningSecondsLeft(Math.floor(WARNING_BEFORE_LOGOUT / 1000));
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

      timeoutIdRef.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [clearInactivityTimers, handleAutoLogout, isAuthenticated, isDashboardRoute]);

  const extendSession = useCallback(() => {
    showWarningRef.current = false;
    setShowWarning(false);
    setWarningDeadline(null);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    if (!showWarning) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    extendButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        extendSession();
      }
    };

    const onMouseDownCapture = (event: MouseEvent) => {
      const target = event.target as Node;
      if (warningModalRef.current?.contains(target)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDownCapture, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDownCapture, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [extendSession, showWarning]);

  useEffect(() => {
    if (!isAuthenticated || !isDashboardRoute) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

    const handleActivity = () => {
      if (showWarningRef.current) return;
      resetInactivityTimer();
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity);
    });

    resetInactivityTimer();

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      clearInactivityTimers();
    };
  }, [
    clearInactivityTimers,
    isAuthenticated,
    isDashboardRoute,
    pathname,
    resetInactivityTimer,
  ]);

  useEffect(() => {
    if (isAuthenticated && !isDashboardRoute) {
      clearInactivityTimers();
      showWarningRef.current = false;
      setShowWarning(false);
      setWarningDeadline(null);
    }
  }, [clearInactivityTimers, isAuthenticated, isDashboardRoute, pathname]);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  useEffect(() => {
    if (!showWarning || !warningDeadline) return;

    const tick = () => {
      const seconds = Math.max(
        0,
        Math.ceil((warningDeadline - Date.now()) / 1000),
      );
      setWarningSecondsLeft(seconds);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(intervalId);
  }, [showWarning, warningDeadline]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setThemeMenuOpen(false);
      }
    };

    if (themeMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [themeMenuOpen]);

  const warningTimeLabel = `${Math.floor(warningSecondsLeft / 60)
    .toString()
    .padStart(2, "0")}:${(warningSecondsLeft % 60).toString().padStart(2, "0")}`;

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await signOut({ callbackUrl: "/" });
  };

  const handleGoToDashboard = () => {
    closeMenu();
    router.push(getDashboardPath());
  };

  const handleLogin = () => {
    closeMenu();
    router.push("/login");
  };

  const handleOpenSearch = () => {
    setSearchOpen(true);
    closeMenu();
  };

  const handleOpenRegistration = () => {
    closeMenu();
    router.push("/login");
  };

  return (
    <>
      <nav className={styles.navbar} aria-label="Navigation principale">
        <Link href="/home" className={styles.brand} onClick={closeMenu}>
          <span className={styles.brandMark}>PlanetLS</span>
          <span className={styles.brandTagline}>Conciergerie saisonniere premium</span>
        </Link>

        <div className={styles.navActions}>
          <div className={styles.themeSwitcher} ref={themeMenuRef}>
            <button
              type="button"
              className={styles.themeTrigger}
              onClick={() => setThemeMenuOpen((open) => !open)}
              title="Changer de theme"
              aria-label="Changer de theme"
            >
              <Icons.FaPalette size={16} />
              <span className={styles.themeLabel}>{getCurrentLabel()}</span>
            </button>

            {themeMenuOpen && (
              <div className={styles.themeDropdown}>
                {Object.entries(themes).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.themeOption} ${theme === value ? styles.active : ""}`}
                    onClick={() => {
                      changeTheme(value as string);
                      setThemeMenuOpen(false);
                    }}
                    aria-label={`Selectionner le theme ${labels[value as string]}`}
                  >
                    {labels[value as string]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className={`${styles.burger} ${menuOpen ? styles.open : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`${styles.menuShell} ${menuOpen ? styles.open : ""}`}>
          <ul className={styles.menu}>
            {publicLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={styles.navLink}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li>
              <button
                type="button"
                onClick={handleOpenSearch}
                className={styles.secondaryButton}
                aria-label="Ouvrir la recherche"
              >
                <Icons.FaSearch size={16} />
                Recherche
              </button>
            </li>

            {!isAuthenticated && (
              <li>
                <button
                  type="button"
                  onClick={handleOpenRegistration}
                  className={styles.secondaryButton}
                >
                  S&apos;inscrire
                </button>
              </li>
            )}

            {isAuthenticated && !isDashboardRoute && (
              <li>
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className={styles.primaryButton}
                >
                  <Icons.FaTachometerAlt size={16} />
                  Mon dashboard
                </button>
              </li>
            )}

            <li>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.secondaryButton}
                >
                  <Icons.FaUser size={16} />
                  Se deconnecter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className={styles.primaryButton}
                >
                  <Icons.FaUser size={16} />
                  Se connecter
                </button>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {showWarning && (
        <div className={styles.warningOverlay}>
          <div className={styles.warningModal} ref={warningModalRef}>
            <h3>Session bientot expiree</h3>
            <p>Vous serez deconnecte dans 2 minutes en raison d&apos;inactivite.</p>
            <p className={styles.warningSubtext}>
              Temps restant : <strong>{warningTimeLabel}</strong>. Cliquez sur
              &quot;Rester connecte&quot; pour continuer votre session.
            </p>
            <div className={styles.warningActions}>
              <button
                ref={extendButtonRef}
                type="button"
                onClick={extendSession}
                className={styles.extendButton}
              >
                Rester connecte
              </button>
              <button
                type="button"
                onClick={handleAutoLogout}
                className={styles.logoutNowButton}
              >
                Se deconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
