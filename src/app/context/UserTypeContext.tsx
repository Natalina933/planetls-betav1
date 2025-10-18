"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

// Types autorisés pour la sidebar
export type UserType = "admin" | "concierge" | "owner" | "providence";

// Structure du contexte
interface UserTypeContextType {
  userType: UserType | null;
  changeUserType: (type: UserType) => void;
}

// Création du contexte
const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

// Mapping centralisé entre Supabase et sidebarConfig
const mapCategoryToSidebarKey: Record<string, UserType> = {
  proprietaire: "owner",
  concierge: "concierge",
  artisan: "providence",
  admin: "admin",
};

export function UserTypeProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType | null>(null);

  useEffect(() => {
    async function fetchUserType() {
      try {
        const res = await fetch("/api/profiles/current");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        const groupKey: string | null =
          data?.categories?.group_key || data?.category || null;

        const mappedType: UserType =
          mapCategoryToSidebarKey[groupKey ?? ""] ?? "owner";

        setUserType(mappedType);
        localStorage.setItem("userType", mappedType);
      } catch {
        const storedType = localStorage.getItem("userType") as UserType | null;
        if (storedType && Object.values(mapCategoryToSidebarKey).includes(storedType)) {
          setUserType(storedType);
        } else {
          setUserType("owner"); // fallback par défaut
        }
      }
    }

    fetchUserType();
  }, []);

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
