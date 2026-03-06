"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export type UserType = "admin" | "concierge" | "owner" | "provider";

interface UserTypeContextType {
  userType: UserType | null;
  changeUserType: (type: UserType) => void;
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

function normalizeSidebarUserType(value: string | null | undefined): UserType | null {
  const normalized = (value ?? "").trim().toLowerCase();

  if (
    normalized === "owner" ||
    normalized === "owner_pro" ||
    normalized === "proprietaire" ||
    normalized === "proprietaire_pro"
  ) {
    return "owner";
  }

  if (normalized === "concierge" || normalized === "concierge_pro") {
    return "concierge";
  }

  if (
    normalized === "artisan" ||
    normalized === "artisan_pro" ||
    normalized === "provider" ||
    normalized === "provider_pro"
  ) {
    return "provider";
  }

  if (normalized === "admin" || normalized === "super_admin") {
    return "admin";
  }

  return null;
}

function inferSidebarUserTypeFromPath(pathname: string | null | undefined): UserType | null {
  if (!pathname?.startsWith("/dashboard/")) return null;
  if (pathname.startsWith("/dashboard/owner")) return "owner";
  if (pathname.startsWith("/dashboard/concierge")) return "concierge";
  if (pathname.startsWith("/dashboard/provider")) return "provider";
  if (pathname.startsWith("/dashboard/admin")) return "admin";
  return null;
}

export function UserTypeProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType | null>(null);
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    const routeUserType = inferSidebarUserTypeFromPath(pathname);
    if (!routeUserType) return;

    setUserType(routeUserType);
    localStorage.setItem("userType", routeUserType);
  }, [pathname]);

  useEffect(() => {
    const isDashboardRoute = Boolean(pathname?.startsWith("/dashboard/"));
    if (!isDashboardRoute) return;
    if (status !== "authenticated") return;

    async function fetchUserType() {
      try {
        const res = await fetch("/api/profiles/current");
        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        const mappedType =
          inferSidebarUserTypeFromPath(pathname) ??
          normalizeSidebarUserType(data?.role) ??
          normalizeSidebarUserType(data?.categories?.group_key) ??
          normalizeSidebarUserType(data?.category) ??
          "owner";

        setUserType(mappedType);
        localStorage.setItem("userType", mappedType);
      } catch {
        const storedType = normalizeSidebarUserType(localStorage.getItem("userType"));
        setUserType(storedType ?? "owner");
      }
    }

    fetchUserType();
  }, [pathname, status]);

  const changeUserType = (type: UserType) => {
    setUserType(type);
    localStorage.setItem("userType", type);
  };

  return (
    <UserTypeContext.Provider value={{ userType, changeUserType }}>
      {children}
    </UserTypeContext.Provider>
  );
}

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (!context) throw new Error("useUserType must be used within UserTypeProvider");
  return context;
}
