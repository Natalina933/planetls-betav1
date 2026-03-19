// hooks/useInactivityLogout.ts
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface UseInactivityLogoutOptions {
  timeout?: number; // Durée d'inactivité en ms
  warningTime?: number; // Temps d'avertissement avant déconnexion en ms
  enableOnlyOnDashboard?: boolean; // Activer uniquement sur le dashboard
  onWarning?: () => void; // Callback quand l'avertissement s'affiche
  onLogout?: () => void; // Callback avant la déconnexion
}

export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes par défaut
    warningTime = 2 * 60 * 1000, // 2 minutes avant
    enableOnlyOnDashboard = true,
    onWarning,
    onLogout,
  } = options;

  const { status } = useSession();
  const pathname = usePathname();

  const [showWarning, setShowWarning] = useState(false);

  // IDs des timers stockés dans des refs (pas dans le state)
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const isAuthenticated = status === "authenticated";
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const shouldMonitor = enableOnlyOnDashboard
    ? isAuthenticated && isDashboardRoute
    : isAuthenticated;

  // 🚪 Déconnexion automatique
  const handleAutoLogout = useCallback(async () => {
    if (onLogout) onLogout();

    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  }, [onLogout]);

  // 🔄 Réinitialiser les timers
  const resetTimer = useCallback(() => {
    // Clear des timers précédents
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);

    setShowWarning(false);

    if (!shouldMonitor) return;

    // Timer pour l'avertissement
    const warnId = setTimeout(() => {
      setShowWarning(true);
      if (onWarning) onWarning();
    }, timeout - warningTime);

    // Timer pour la déconnexion
    const logoutId = setTimeout(() => {
      handleAutoLogout();
    }, timeout);

    warningTimeoutIdRef.current = warnId;
    timeoutIdRef.current = logoutId;
  }, [shouldMonitor, timeout, warningTime, onWarning, handleAutoLogout]);

  // 🔄 Prolonger la session (clic sur "Rester connecté")
  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  // 👂 Écouter les événements d'activité
  useEffect(() => {
    if (!shouldMonitor) {
      // Nettoyer les timers si on ne monitore plus
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningTimeoutIdRef.current)
        clearTimeout(warningTimeoutIdRef.current);
      setShowWarning(false);
      return;
    }

    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Ajouter les écouteurs
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Timer initial
    resetTimer();

    // Nettoyage
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningTimeoutIdRef.current)
        clearTimeout(warningTimeoutIdRef.current);
    };
  }, [shouldMonitor, resetTimer]);

  return {
    showWarning,
    extendSession,
    handleAutoLogout,
    isMonitoring: shouldMonitor,
  };
}
