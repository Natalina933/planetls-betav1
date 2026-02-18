// src/app/components/hooks/useCurrentUser.ts
"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  email?: string | null;
  username?: string | null;
  firstName?: string | null;
  role?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
}
// même fichier route.ts
export interface AuthToken extends CurrentUser {
  name?: string | null;
  lastName?: string | null;
  phone?: string | null;
  location?: string | null;
  option?: string | null;
  search_target?: string | null;
  status?: string | null;
}

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    // pas de session => pas d'appel API
    if (!session?.user?.id) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profiles/current", {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(
          "Erreur chargement profil:",
          res.status,
          res.statusText,
          text
        );
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

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
