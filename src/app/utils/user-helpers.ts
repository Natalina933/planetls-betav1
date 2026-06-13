export type KnownRole =
  | "owner"
  | "owner_pro"
  | "concierge"
  | "concierge_pro"
  | "provider"
  | "provider_pro"
  | "artisan"
  | "artisan_pro";

export const ROLE_LABELS: Record<KnownRole, string> = {
  owner: "Proprietaire",
  owner_pro: "Proprietaire PRO",
  concierge: "Conciergerie",
  concierge_pro: "Conciergerie PRO",
  provider: "Artisan",
  provider_pro: "Artisan PRO",
  artisan: "Artisan",
  artisan_pro: "Artisan PRO",
};

export const getRoleLabel = (role?: string | null): string => {
  if (!role) return "Invite";
  return ROLE_LABELS[role as KnownRole] || role.charAt(0).toUpperCase() + role.slice(1);
};

export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
};
