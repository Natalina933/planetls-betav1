"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import styles from "./Navbar.module.scss";
import { useSearchPopup } from "../../../context/SearchPopupContext";
import { useSession, signOut } from "next-auth/react";
import { useUserType } from "@/app/context/UserTypeContext";

const Icons = {
  FaUser: dynamic(() => import("react-icons/fa").then(mod => mod.FaUser), { ssr: false }),
  FaSearch: dynamic(() => import("react-icons/fa").then(mod => mod.FaSearch), { ssr: false }),
  FaTachometerAlt: dynamic(() => import("react-icons/fa").then(mod => mod.FaTachometerAlt), { ssr: false }),
};

// ⏱️ Configuration du timeout d'inactivité (en millisecondes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000; // Avertir 2 minutes avant

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setSearchOpen } = useSearchPopup();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const { userType } = useUserType();

  const [showWarning, setShowWarning] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [warningTimeoutId, setWarningTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const extendButtonRef = useRef<HTMLButtonElement | null>(null);

  const isAuthenticated = status === "authenticated";
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const isHomePage = pathname === "/" || pathname === "/home";

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
  const resetInactivityTimer = useCallback(() => {
  if (timeoutId) clearTimeout(timeoutId);
  if (warningTimeoutId) clearTimeout(warningTimeoutId);
  setShowWarning(false);

  if (isAuthenticated && isDashboardRoute) {
    const warningId = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

    const logoutId = setTimeout(() => {
      handleAutoLogout();
    }, INACTIVITY_TIMEOUT);

    setWarningTimeoutId(warningId);
    setTimeoutId(logoutId);
  }
}, [timeoutId, warningTimeoutId, isAuthenticated, isDashboardRoute]);


  // 🚪 Déconnexion automatique
  const handleAutoLogout = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true
    });
  };

  // 🔄 Prolonger la session
const extendSession = useCallback(() => {
  setShowWarning(false);
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

  window.addEventListener("keydown", onKeyDown);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    document.body.style.overflow = prevOverflow;
  };
}, [showWarning, extendSession]);


  // 👂 Écouter les événements d'activité utilisateur
  useEffect(() => {
    if (!isAuthenticated || !isDashboardRoute) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

    const handleActivity = () => {
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
      if (timeoutId) clearTimeout(timeoutId);
      if (warningTimeoutId) clearTimeout(warningTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isDashboardRoute, pathname]);

  // 🚪 Arrêter les timers lors de la sortie du dashboard
  useEffect(() => {
    if (isAuthenticated && !isDashboardRoute) {
      if (timeoutId) clearTimeout(timeoutId);
      if (warningTimeoutId) clearTimeout(warningTimeoutId);
      setShowWarning(false);
    }
  }, [pathname, isDashboardRoute, isAuthenticated, timeoutId, warningTimeoutId]);

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

  return (
    <>
      <nav className={styles.navbar}>
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

          {/* 🏠 Bouton Retour Accueil (si connecté ET sur dashboard) */}
          {isAuthenticated && isDashboardRoute && !isHomePage && (
            <li className={styles["nav-home"]}>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  router.push("/");
                }}
                className={styles.homeButton}
              >
                🏠 Accueil
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
          <div className={styles.warningModal}>
            <h3>⏱️ Session bientôt expirée</h3>
            <p>
              Vous serez déconnecté dans 2 minutes en raison d&apos;inactivité.
            </p>
            <p className={styles.warningSubtext}>
              Cliquez sur &quot;Rester connecté&quot; pour continuer votre session.
            </p>
            <div className={styles.warningActions}>
              <button
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