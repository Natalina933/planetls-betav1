// src/utils/roles.ts
export const categoryToRole = (cat: string | null | undefined): string => {
  const c = (cat || "").trim().toLowerCase();
  if (c === "proprietaire_pro") return "owner_pro";
  if (c.startsWith("proprietaire")) return "owner";
  if (c === "concierge_pro") return "concierge_pro";
  if (c.startsWith("concierge")) return "concierge";
  if (c === "service_pro") return "provider_pro";
  if (c.startsWith("service")) return "provider";
  if (c === "admin") return "admin";
  if (c === "super_admin") return "super_admin";
  return "owner";
};
