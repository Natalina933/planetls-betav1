import type { UserRole } from "@/types/supabase";

const VALID_USER_ROLES: UserRole[] = [
  "owner",
  "owner_pro",
  "concierge",
  "concierge_pro",
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
  "admin",
  "super_admin",
];

export const isUserRole = (value: string | null | undefined): value is UserRole => {
  if (!value) {
    return false;
  }

  return VALID_USER_ROLES.includes(value.trim().toLowerCase() as UserRole);
};

export const categoryToRole = (cat: string | null | undefined): UserRole | null => {
  const c = (cat || "").trim().toLowerCase();

  if (c === "proprietaire_pro") return "owner_pro";
  if (c.startsWith("proprietaire")) return "owner";
  if (c === "concierge_pro") return "concierge_pro";
  if (c.startsWith("concierge")) return "concierge";
  if (c === "provider_pro") return "provider_pro";
  if (c === "provider") return "provider";
  if (c === "artisan_pro" || c === "service_pro") return "provider_pro";
  if (c.startsWith("artisan") || c.startsWith("service")) return "provider";
  if (c === "admin") return "admin";
  if (c === "super_admin") return "super_admin";

  return null;
};

export const resolveUserRole = (
  role: string | null | undefined,
  category?: string | null | undefined,
): UserRole | null => {
  if (isUserRole(role)) {
    return role.trim().toLowerCase() as UserRole;
  }

  return categoryToRole(role) ?? categoryToRole(category);
};
