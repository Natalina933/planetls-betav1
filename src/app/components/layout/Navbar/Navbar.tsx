"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import styles from "./Navbar.module.scss";
import { useSearchPopup } from "../../../context/SearchPopupContext";
import { useTheme } from "../../../context/ThemeContext";
import { useSession, signOut } from "next-auth/react";
import { useUserType } from "@/app/context/UserTypeContext";

const Icons = {
  FaUser: dynamic(() => import("react-icons/fa").then(mod => mod.FaUser), { ssr: false }),
  FaSearch: dynamic(() => import("react-icons/fa").then(mod => mod.FaSearch), { ssr: false }),
  FaTachometerAlt: dynamic(() => import("react-icons/fa").then(mod => mod.FaTachometerAlt), { ssr: false }),
  FaPalette: dynamic(() => import("react-icons/fa").then(mod => mod.FaPalette), { ssr: false }),
};

// ⏱️ Configuration du timeout d'inactivité (en millisecondes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000; // Avertir 2 minutes avant

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
  // const isHomePage = pathname === "/" || pathname === "/home";

  // 🎯 Fonction pour obtenir le chemin du dashboard selon le rôle
  const getDashboardPath = () => {
    if (!userType) {
      // Fallback si le contexte n'est pas encore chargé
      const role = session?.user?.role;
      if (role === "concierge") return "/dashboard/concierge";
      if (role === "owner") return "/dashboard/owner";
      if (role === "provider") return "/dashboard/provider";
      return "/dashboard";
    }
    return `/dashboard/${userType}`;
  };

  // 🔄 Réinitialiser le timer d'inactivité
  const clearInactivityTimers = useCallback(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
    timeoutIdRef.current = null;
    warningTimeoutIdRef.current = null;
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimers();

    if (showWarningRef.current) {
      return;
    }

    if (isAuthenticated && isDashboardRoute) {
      const warningId = setTimeout(() => {
        showWarningRef.current = true;
        setShowWarning(true);
        setWarningDeadline(Date.now() + WARNING_BEFORE_LOGOUT);
        setWarningSecondsLeft(Math.floor(WARNING_BEFORE_LOGOUT / 1000));
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

      const logoutId = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_TIMEOUT);

      warningTimeoutIdRef.current = warningId;
      timeoutIdRef.current = logoutId;
    }
  }, [clearInactivityTimers, isAuthenticated, isDashboardRoute]);


  // 🚪 Déconnexion automatique
  const handleAutoLogout = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true
    });
  };

  // 🔄 Prolonger la session
  const extendSession = useCallback(() => {
    showWarningRef.current = false;
    setShowWarning(false);
    setWarningDeadline(null);
    resetInactivityTimer();
  }, [resetInactivityTimer]);


  // Focus clavier, gestion Escape et blocage du scroll quand la modale est ouverte
  useEffect(() => {
    if (!showWarning) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    extendButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        extendSession();
      }
    };

    const onMouseDownCapture = (e: MouseEvent) => {
      const target = e.target as Node;
      if (warningModalRef.current?.contains(target)) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDownCapture, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDownCapture, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [showWarning, extendSession]);


  // 👂 Écouter les événements d'activité utilisateur
  useEffect(() => {
    if (!isAuthenticated || !isDashboardRoute) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

    const handleActivity = () => {
      if (showWarningRef.current) return;
      resetInactivityTimer();
    };

    // Ajouter les écouteurs
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Timer initial
    resetInactivityTimer();

    // Nettoyage
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInactivityTimers();
    };
  }, [isAuthenticated, isDashboardRoute, pathname, clearInactivityTimers, resetInactivityTimer]);

  // 🚪 Arrêter les timers lors de la sortie du dashboard
  useEffect(() => {
    if (isAuthenticated && !isDashboardRoute) {
      clearInactivityTimers();
      showWarningRef.current = false;
      setShowWarning(false);
      setWarningDeadline(null);
    }
  }, [pathname, isDashboardRoute, isAuthenticated, clearInactivityTimers]);

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

    return () => {
      window.clearInterval(intervalId);
    };
  }, [showWarning, warningDeadline]);

  const warningTimeLabel = `${Math.floor(warningSecondsLeft / 60)
    .toString()
    .padStart(2, "0")}:${(warningSecondsLeft % 60)
    .toString()
    .padStart(2, "0")}`;

  const closeMenu = () => setMenuOpen(false);

  // 🎨 Fermer le menu thème quand on clique en dehors
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };

    if (themeMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [themeMenuOpen]);

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

  return (
    <>
      <nav className={styles.navbar}>
        {/* 🎨 Sélecteur de Thèmes */}
        <div className={styles.themeSwitcher} ref={themeMenuRef}>
          <button
            className={styles.themeTrigger}
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            title="Changer de thème"
            aria-label="Changer de thème"
          >
            <Icons.FaPalette size={18} />
            <span className={styles.themeLabel}>{getCurrentLabel()}</span>
          </button>

          {themeMenuOpen && (
            <div className={styles.themeDropdown}>
              {Object.entries(themes).map(([key, value]) => (
                <button
                  key={key}
                  className={`${styles.themeOption} ${theme === value ? styles.active : ""}`}
                  onClick={() => {
                    changeTheme(value as string);
                    setThemeMenuOpen(false);
                  }}
                  aria-label={`Sélectionner thème ${labels[value as string]}`}
                >
                  {labels[value as string]}
                </button>
              ))}
            </div>
          )}
        </div>

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
        <ul className={`${styles.menu} ${menuOpen ? styles.open : ""}`}>
          <li className={styles["nav-search"]}>
            <button
              onClick={() => {
                setSearchOpen(true);
                closeMenu();
              }}
              className={`${styles.searchBtn} ${styles.navButton}`}
              aria-label="Ouvrir la recherche"
            >
              <Icons.FaSearch size={18} /> Recherche
            </button>
          </li>

          {!isAuthenticated && (
            <li className={styles["auth-inscription"]}>
              <button
                onClick={() => {
                  setSearchOpen(true);
                  closeMenu();
                }}
                className={`${styles.searchBtn} ${styles.navButton}`}
                aria-label="Ouvrir la recherche pour inscription"
              >
                S&apos;inscrire
              </button>
            </li>
          )}

          {/* 🎯 Bouton Dashboard (uniquement si connecté ET pas déjà sur dashboard) */}
          {isAuthenticated && !isDashboardRoute && (
            <li className={styles["auth-dashboard"]}>
              <button
                type="button"
                onClick={handleGoToDashboard}
                className={styles.dashboardButton}
              >
                <Icons.FaTachometerAlt size={18} /> Mon Dashboard
              </button>
            </li>
          )}

          <li className={styles["auth-connexion"]}>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                <Icons.FaUser size={18} /> Se déconnecter
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className={styles.loginButton}
              >
                <Icons.FaUser size={18} /> Se connecter
              </button>
            )}
          </li>
        </ul>
      </nav>

      {/* ⚠️ Modal d'avertissement d'inactivité */}
      {showWarning && (
        <div className={styles.warningOverlay}>
          <div className={styles.warningModal} ref={warningModalRef}>
            <h3>⏱️ Session bientôt expirée</h3>
            <p>
              Vous serez déconnecté dans 2 minutes en raison d&apos;inactivité.
            </p>
            <p className={styles.warningSubtext}>
              Temps restant: <strong>{warningTimeLabel}</strong>. Cliquez sur
              &quot;Rester connecté&quot; pour continuer votre session.
            </p>
            <div className={styles.warningActions}>
              <button
                ref={extendButtonRef}
                onClick={extendSession}
                className={styles.extendButton}
              >
                ✓ Rester connecté
              </button>
              <button
                onClick={handleAutoLogout}
                className={styles.logoutNowButton}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
