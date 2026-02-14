// src/app/components/hooks/useCurrentUser.ts
"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

/**
 * À adapter selon ton modèle User / Profile
 * (tu peux l'importer depuis /types si tu en as un)
 */
// src/app/components/hooks/useCurrentUser.ts

export interface CurrentUser {
  id: string;

  email?: string | null;
  username?: string | null;
  firstName?: string | null;

  role?: string | null;

  company_name?: string | null;

  avatar_url?: string | null;
}

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);

    try {
      const res = await fetch("/api/profiles/current", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erreur chargement profil");
      }

      const data: CurrentUser = await res.json();
      setUser(data);
    } catch (error) {
      console.error("useCurrentUser:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Chargement initial
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Écoute les updates globaux
  useEffect(() => {
    const handleUpdate = () => {
      fetchUser();
    };

    window.addEventListener("user-profile-updated", handleUpdate);

    return () => {
      window.removeEventListener("user-profile-updated", handleUpdate);
    };
  }, [fetchUser]);

  return {
    user,
    loading: status === "loading" || loading,
    isAuthenticated: status === "authenticated",
  };
}
