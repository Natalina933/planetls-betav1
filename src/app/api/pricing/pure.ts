export const ALLOWED_PRICING_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
]);

export function isAllowedPricingRole(role: string): boolean {
  return ALLOWED_PRICING_ROLES.has(role);
}

export function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}
