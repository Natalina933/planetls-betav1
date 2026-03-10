"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import styles from "./Navbar.module.scss";
import { useTheme, type Theme } from "@/app/providers/ThemeProvider";
import { useSession, signOut } from "next-auth/react";
import { useUserType } from "@/app/context/UserTypeContext";

const Icons = {
  FaUser: dynamic(() => import("react-icons/fa").then((mod) => mod.FaUser), { ssr: false }),
  FaSearch: dynamic(() => import("react-icons/fa").then((mod) => mod.FaSearch), { ssr: false }),
  FaTachometerAlt: dynamic(() => import("react-icons/fa").then((mod) => mod.FaTachometerAlt), { ssr: false }),
  FaPalette: dynamic(() => import("react-icons/fa").then((mod) => mod.FaPalette), { ssr: false }),
};

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000;

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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
      if (role === "concierge" || role === "concierge_pro") return "/dashboard/concierge";
      if (role === "owner" || role === "owner_pro") return "/dashboard/owner";
      if (
        role === "provider" ||
        role === "provider_pro" ||
        role === "artisan" ||
        role === "artisan_pro"
      ) {
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

  const handleAutoLogout = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

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

  const extendSession = useCallback(() => {
    showWarningRef.current = false;
    setShowWarning(false);
    setWarningDeadline(null);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

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

  useEffect(() => {
    if (!isAuthenticated || !isDashboardRoute) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

    const handleActivity = () => {
      if (showWarningRef.current) return;
      resetInactivityTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInactivityTimers();
    };
  }, [isAuthenticated, isDashboardRoute, pathname, clearInactivityTimers, resetInactivityTimer]);

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
      const seconds = Math.max(0, Math.ceil((warningDeadline - Date.now()) / 1000));
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
        <div className={styles.themeSwitcher} ref={themeMenuRef}>
          <button
            className={styles.themeTrigger}
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            title="Changer de theme"
            aria-label="Changer de theme"
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
                    changeTheme(value as Theme);
                    setThemeMenuOpen(false);
                  }}
                  aria-label={`Selectionner theme ${labels[value as Theme]}`}
                >
                  {labels[value as Theme]}
                </button>
              ))}
            </div>
          )}
        </div>

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
          <li className={styles["nav-search"]}>
            <button
              onClick={() => {
                router.push("/map-list?filter=concierge");
                closeMenu();
              }}
              className={`${styles.searchBtn} ${styles.navButton}`}
              aria-label="Ouvrir la recherche de profils"
            >
              <Icons.FaSearch size={18} /> Recherche
            </button>
          </li>

          {!isAuthenticated && (
            <li className={styles["auth-inscription"]}>
              <button
                onClick={() => {
                  router.push("/complete-registration");
                  closeMenu();
                }}
                className={`${styles.searchBtn} ${styles.navButton}`}
                aria-label="Acceder a l'inscription"
              >
                S&apos;inscrire
              </button>
            </li>
          )}

          {isAuthenticated && !isDashboardRoute && (
            <li className={styles["auth-dashboard"]}>
              <button type="button" onClick={handleGoToDashboard} className={styles.dashboardButton}>
                <Icons.FaTachometerAlt size={18} /> Mon espace
              </button>
            </li>
          )}

          <li className={styles["auth-connexion"]}>
            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className={styles.logoutButton}>
                <Icons.FaUser size={18} /> Se deconnecter
              </button>
            ) : (
              <button type="button" onClick={handleLogin} className={styles.loginButton}>
                <Icons.FaUser size={18} /> Se connecter
              </button>
            )}
          </li>
        </ul>
      </nav>

      {showWarning && (
        <div className={styles.warningOverlay}>
          <div className={styles.warningModal} ref={warningModalRef}>
            <h3>Session bientot expiree</h3>
            <p>Vous serez déconnecté dans 2 minutes en raison d&apos;inactivité.</p>
            <p className={styles.warningSubtext}>
              Temps restant: <strong>{warningTimeLabel}</strong>. Cliquez sur
              &quot;Rester connecte&quot; pour continuer votre session.
            </p>
            <div className={styles.warningActions}>
              <button
                ref={extendButtonRef}
                onClick={extendSession}
                className={styles.extendButton}
              >
                Rester connecte
              </button>
              <button onClick={handleAutoLogout} className={styles.logoutNowButton}>
                Se deconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
