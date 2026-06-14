"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme, type Theme } from "@/app/providers/ThemeProvider";
import { useUserType } from "@/app/context/UserTypeContext";
import { useSearchPopup } from "../../../context/SearchPopupContext";
import styles from "./Navbar.module.scss";

const Icons = {
  FaUser: dynamic(() => import("react-icons/fa").then((mod) => mod.FaUser), { ssr: false }),
  FaSearch: dynamic(() => import("react-icons/fa").then((mod) => mod.FaSearch), { ssr: false }),
  FaTachometerAlt: dynamic(() => import("react-icons/fa").then((mod) => mod.FaTachometerAlt), { ssr: false }),
  FaPalette: dynamic(() => import("react-icons/fa").then((mod) => mod.FaPalette), { ssr: false }),
  FaExchangeAlt: dynamic(() => import("react-icons/fa").then((mod) => mod.FaExchangeAlt), { ssr: false }),
};

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000;

type WorkspaceOption = {
  id: "owner" | "concierge" | "provider" | "admin";
  profileId?: string | null;
  label: string;
  href: string;
  description: string;
  available?: boolean;
  current?: boolean;
};

function getWorkspaceFromRole(role: string | null | undefined): WorkspaceOption["id"] | null {
  const normalized = String(role ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .trim();

  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("concierge")) return "concierge";
  if (normalized.includes("owner") || normalized.includes("proprietaire")) return "owner";
  if (normalized.includes("provider") || normalized.includes("artisan")) return "provider";
  return null;
}

const fallbackWorkspaces: Record<WorkspaceOption["id"], WorkspaceOption> = {
  owner: {
    id: "owner",
    label: "Proprietaire",
    href: "/dashboard/owner",
    description: "Logements, demandes et missions.",
  },
  concierge: {
    id: "concierge",
    label: "Conciergerie",
    href: "/dashboard/concierge",
    description: "Demandes recues, planning et devis.",
  },
  provider: {
    id: "provider",
    label: "Artisan",
    href: "/dashboard/provider",
    description: "Interventions, clients et devis.",
  },
  admin: {
    id: "admin",
    label: "Administrateur",
    href: "/dashboard/admin",
    description: "Controle global de la plateforme.",
  },
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, changeTheme, themes, labels, getCurrentLabel } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [workspaceLoadingId, setWorkspaceLoadingId] = useState<WorkspaceOption["id"] | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningDeadline, setWarningDeadline] = useState<number | null>(null);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(
    Math.floor(WARNING_BEFORE_LOGOUT / 1000),
  );

  const { data: session, status } = useSession();
  const { userType } = useUserType();
  const { setSearchOpen } = useSearchPopup();

  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showWarningRef = useRef(false);
  const extendButtonRef = useRef<HTMLButtonElement | null>(null);
  const warningModalRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);

  const isAuthenticated = status === "authenticated";
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const currentWorkspace =
    workspaces.find((workspace) => workspace.current) ??
    (getWorkspaceFromRole(session?.user?.role)
      ? fallbackWorkspaces[getWorkspaceFromRole(session?.user?.role) as WorkspaceOption["id"]]
      : fallbackWorkspaces.owner);
  const visibleWorkspaces = workspaces.length ? workspaces : Object.values(fallbackWorkspaces);

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
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    };

    if (themeMenuOpen || workspaceMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [themeMenuOpen, workspaceMenuOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      return;
    }

    let cancelled = false;

    async function loadWorkspaces() {
      const roleWorkspace = getWorkspaceFromRole(session?.user?.role);
      const fallback = roleWorkspace ? [fallbackWorkspaces[roleWorkspace]] : [];

      try {
        const response = await fetch("/api/profiles/workspaces", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setWorkspaces(fallback);
          return;
        }

        const payload = (await response.json()) as { workspaces?: WorkspaceOption[] };
        const nextWorkspaces = Array.isArray(payload.workspaces) ? payload.workspaces : fallback;
        if (!cancelled) setWorkspaces(nextWorkspaces.length ? nextWorkspaces : fallback);
      } catch {
        if (!cancelled) setWorkspaces(fallback);
      }
    }

    void loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, session?.user?.role]);

  const handleLogout = async () => {
    closeMenu();
    await signOut({ callbackUrl: "/" });
  };

  const handleGoToDashboard = () => {
    closeMenu();
    router.push(currentWorkspace?.href ?? getDashboardPath());
  };

  const handleWorkspaceSelect = async (workspace: WorkspaceOption) => {
    closeMenu();
    setWorkspaceMenuOpen(false);

    if (!isAuthenticated) {
      setWorkspaceLoadingId(workspace.id);

      try {
        const response = await fetch("/api/auth/dev-workspace-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace: workspace.id }),
        });

        if (!response.ok) {
          router.push(`/login?workspace=${workspace.id}`);
          return;
        }

        const payload = (await response.json()) as {
          email?: string;
          password?: string;
          href?: string;
        };

        if (!payload.email || !payload.password) {
          router.push(`/login?workspace=${workspace.id}`);
          return;
        }

        const result = await signIn("credentials", {
          redirect: false,
          email: payload.email,
          password: payload.password,
        });

        if (result?.error) {
          router.push(`/login?workspace=${workspace.id}`);
          return;
        }

        window.location.assign(payload.href || workspace.href);
        return;
      } catch {
        router.push(`/login?workspace=${workspace.id}`);
        return;
      } finally {
        setWorkspaceLoadingId(null);
      }
    }

    if (isAuthenticated && workspace.profileId) {
      const response = await fetch("/api/profiles/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: workspace.profileId }),
      }).catch(() => null);

      if (response?.ok) {
        const payload = (await response.json().catch(() => ({}))) as { href?: string };
        router.push(payload.href || workspace.href);
        router.refresh();
        return;
      }
    }

    router.push(workspace.href);
  };

  const handleLogin = () => {
    closeMenu();
    router.push("/login");
  };

  const handleRegister = () => {
    closeMenu();
    setSearchOpen(true);
    if (pathname !== "/home") {
      router.push("/home");
    }
  };

  const canSelectWorkspace = (workspace: WorkspaceOption) =>
    isAuthenticated ? Boolean(workspace.profileId) : true;

  const workspaceHeaderText = isAuthenticated
    ? "Profils rattaches a votre compte"
    : "Acces rapide aux espaces en cours de test";

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

        {/* <div className={styles.workspaceSwitcher} ref={workspaceMenuRef}>
          <button
            type="button"
            className={styles.workspaceTrigger}
            onClick={() => setWorkspaceMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={workspaceMenuOpen}
          >
            <Icons.FaExchangeAlt size={17} />
            <span>Espaces</span>
            <strong>{currentWorkspace?.label ?? "Profil"}</strong>
          </button>

          {workspaceMenuOpen ? (
            <div className={styles.workspaceDropdown} role="menu">
              <div className={styles.workspaceDropdownHeader}>
                <strong>Changer d'espace</strong>
                <span>{workspaceHeaderText}</span>
              </div>
              {visibleWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  className={`${styles.workspaceOption} ${workspace.current ? styles.workspaceOptionActive : ""} ${
                    !canSelectWorkspace(workspace) ? styles.workspaceOptionDisabled : ""
                  }`}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  disabled={!canSelectWorkspace(workspace) || workspaceLoadingId !== null}
                  aria-busy={workspaceLoadingId === workspace.id}
                  role="menuitem"
                >
                  <span>
                    <strong>{workspace.label}</strong>
                    <small>{workspace.description}</small>
                  </span>
                  {workspaceLoadingId === workspace.id ? <em>Connexion...</em> : null}
                  {workspace.current ? <em>Actuel</em> : null}
                  {!canSelectWorkspace(workspace) ? (
                    <em className={styles.workspaceUnavailable}>Non rattache</em>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div> */}

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
              className={styles.navButton}
              aria-label="Ouvrir la recherche de profils"
            >
              <Icons.FaSearch size={18} /> Recherche
            </button>
          </li>

          {!isAuthenticated && (
            <li className={styles["auth-inscription"]}>
              <button
                onClick={handleRegister}
                className={styles.navButton}
                aria-label="Acceder a l'inscription"
              >
                S&apos;inscrire
              </button>
            </li>
          )}

          {!isDashboardRoute && (
            <li className={styles.workspaceSwitcher}>
              <button
                type="button"
                className={styles.workspaceTrigger}
                onClick={() => setWorkspaceMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={workspaceMenuOpen}
              >
                <Icons.FaExchangeAlt size={17} />
                <span>{currentWorkspace?.label ?? "Changer d'espace"}</span>
              </button>

              {workspaceMenuOpen ? (
                <div className={styles.workspaceDropdown} role="menu">
                  <div className={styles.workspaceDropdownHeader}>
                    <strong>Changer d'espace</strong>
                    <span>{workspaceHeaderText}</span>
                  </div>
                  {visibleWorkspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      className={`${styles.workspaceOption} ${workspace.current ? styles.workspaceOptionActive : ""} ${
                        !canSelectWorkspace(workspace) ? styles.workspaceOptionDisabled : ""
                      }`}
                      onClick={() => handleWorkspaceSelect(workspace)}
                      disabled={!canSelectWorkspace(workspace) || workspaceLoadingId !== null}
                      aria-busy={workspaceLoadingId === workspace.id}
                      role="menuitem"
                    >
                      <span>
                        <strong>{workspace.label}</strong>
                        <small>{workspace.description}</small>
                      </span>
                      {workspaceLoadingId === workspace.id ? <em>Connexion...</em> : null}
                      {workspace.current ? <em>Actuel</em> : null}
                      {!canSelectWorkspace(workspace) ? (
                        <em className={styles.workspaceUnavailable}>Non rattache</em>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
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
            <p>Vous serez deconnecte dans 2 minutes en raison d&apos;inactivite.</p>
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
