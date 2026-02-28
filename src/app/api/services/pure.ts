export const ALLOWED_SERVICE_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
]);

export const isAllowedServiceRole = (role: string | null | undefined): boolean =>
  typeof role === "string" && ALLOWED_SERVICE_ROLES.has(role);
