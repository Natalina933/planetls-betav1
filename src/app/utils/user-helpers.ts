// utils/user-helpers.ts
export type KnownRole = "owner" | "owner_pro" | "concierge" | "concierge_pro" | "providence" | "providence_pro";

export const ROLE_LABELS: Record<KnownRole, string> = {
  owner: "Propriétaire",
  owner_pro: "Propriétaire PRO",
  concierge: "Conciergerie",
  concierge_pro: "Conciergerie PRO",
  providence: "Providence",
  providence_pro: "Providence PRO",
};

export const getRoleLabel = (role?: string | null): string => {
  if (!role) return "Invité";
  return ROLE_LABELS[role as KnownRole] || role.charAt(0).toUpperCase() + role.slice(1);
};

export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
};