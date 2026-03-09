// src/app/components/hooks/useCurrentUser.ts
"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  email?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
}

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    if (!session?.user?.id) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Expose session data immediately so the navbar doesn't flash fallback labels.
    setUser((current) => ({
      id: session.user.id,
      email: session.user.email ?? current?.email ?? null,
      username: session.user.username ?? current?.username ?? null,
      firstName: session.user.firstName ?? current?.firstName ?? null,
      lastName: session.user.lastName ?? current?.lastName ?? null,
      role: session.user.role ?? current?.role ?? null,
      company_name: session.user.company_name ?? current?.company_name ?? null,
      avatar_url: session.user.avatar_url ?? current?.avatar_url ?? null,
    }));
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

  const resolvedUser: CurrentUser | null = session?.user?.id
    ? {
        id: user?.id || session.user.id,
        email: user?.email ?? session.user.email ?? null,
        username: user?.username ?? session.user.username ?? null,
        firstName: user?.firstName ?? session.user.firstName ?? null,
        lastName: user?.lastName ?? session.user.lastName ?? null,
        role: user?.role ?? session.user.role ?? null,
        company_name: user?.company_name ?? session.user.company_name ?? null,
        avatar_url: user?.avatar_url ?? session.user.avatar_url ?? null,
      }
    : user;

  return {
    user: resolvedUser,
    loading: status === "loading" || loading,
    isAuthenticated: status === "authenticated",
  };
}
