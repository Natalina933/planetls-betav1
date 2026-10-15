import { normalizePlanetLSSelection } from "./planetlsServiceSelection.ts";

export const GUEST_CHECKIN_CHECKOUT_BUNDLE = "guest_checkin_checkout";
export const GUEST_CHECKIN_SLUG = "guest_checkin";
export const GUEST_CHECKOUT_SLUG = "guest_checkout";

export const GUEST_CHECKIN_CHECKOUT_MODES = [
  "arrival_departure",
  "arrival_only",
  "departure_only",
] as const;

export type GuestCheckinCheckoutMode =
  (typeof GUEST_CHECKIN_CHECKOUT_MODES)[number];

export const DEFAULT_GUEST_CHECKIN_CHECKOUT_MODE: GuestCheckinCheckoutMode =
  "arrival_departure";

const OPERATIONAL_SLUGS = [GUEST_CHECKIN_SLUG, GUEST_CHECKOUT_SLUG] as const;

export function getGuestCheckinCheckoutOperationalSlugs(
  mode: GuestCheckinCheckoutMode = DEFAULT_GUEST_CHECKIN_CHECKOUT_MODE,
): string[] {
  if (mode === "arrival_only") return [GUEST_CHECKIN_SLUG];
  if (mode === "departure_only") return [GUEST_CHECKOUT_SLUG];
  return [...OPERATIONAL_SLUGS];
}

export function getGuestCheckinCheckoutModeLabel(
  mode: GuestCheckinCheckoutMode,
): string {
  if (mode === "arrival_only") return "Arrivée uniquement";
  if (mode === "departure_only") return "Départ uniquement";
  return "Arrivée + départ";
}

export function normalizeGuestCheckinCheckoutMode(
  value: unknown,
): GuestCheckinCheckoutMode | null {
  return GUEST_CHECKIN_CHECKOUT_MODES.find((mode) => mode === value) ?? null;
}

export function inferGuestCheckinCheckoutMode(
  services: readonly string[],
): GuestCheckinCheckoutMode | null {
  const selected = new Set(services);
  const hasArrival = selected.has(GUEST_CHECKIN_SLUG);
  const hasDeparture = selected.has(GUEST_CHECKOUT_SLUG);
  if (hasArrival && hasDeparture) return "arrival_departure";
  if (hasArrival) return "arrival_only";
  if (hasDeparture) return "departure_only";
  return null;
}

export function getGuestCheckinCheckoutDisplaySelections(
  services: readonly string[],
): string[] {
  const normalized = normalizePlanetLSSelection(services);
  if (!hasGuestCheckinCheckoutSelection(normalized)) return normalized;
  return [
    ...normalized.filter(
      (slug) =>
        slug !== GUEST_CHECKIN_SLUG && slug !== GUEST_CHECKOUT_SLUG,
    ),
    GUEST_CHECKIN_CHECKOUT_BUNDLE,
  ];
}

export function toggleGuestCheckinCheckoutSelection(
  services: readonly string[],
): string[] {
  const normalized = normalizePlanetLSSelection(services);
  return hasGuestCheckinCheckoutSelection(normalized)
    ? normalized.filter(
        (slug) =>
          slug !== GUEST_CHECKIN_SLUG && slug !== GUEST_CHECKOUT_SLUG,
      )
    : [
        ...normalized,
        ...getGuestCheckinCheckoutOperationalSlugs(
          DEFAULT_GUEST_CHECKIN_CHECKOUT_MODE,
        ),
      ];
}

export function replaceGuestCheckinCheckoutServices(
  services: readonly string[],
  mode: GuestCheckinCheckoutMode,
): string[] {
  const normalized = normalizePlanetLSSelection(services).filter(
    (slug) => !OPERATIONAL_SLUGS.includes(slug as (typeof OPERATIONAL_SLUGS)[number]),
  );
  return [...normalized, ...getGuestCheckinCheckoutOperationalSlugs(mode)];
}

export function getGuestCheckinCheckoutRequestMetadata(
  services: readonly string[],
): { guest_checkin_checkout: GuestCheckinCheckoutMode } | null {
  const mode = inferGuestCheckinCheckoutMode(services);
  return mode ? { guest_checkin_checkout: mode } : null;
}

export function getGuestCheckinCheckoutModeFromMetadata(
  metadata: unknown,
): GuestCheckinCheckoutMode | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const serviceModalities = (metadata as Record<string, unknown>)
    .service_modalities;
  if (
    !serviceModalities ||
    typeof serviceModalities !== "object" ||
    Array.isArray(serviceModalities)
  ) {
    return null;
  }
  return normalizeGuestCheckinCheckoutMode(
    (serviceModalities as Record<string, unknown>).guest_checkin_checkout,
  );
}

export function getGuestCheckinCheckoutSummaryLabel(input: {
  services: readonly string[];
  metadata?: unknown;
}): string | null {
  const mode =
    getGuestCheckinCheckoutModeFromMetadata(input.metadata) ??
    inferGuestCheckinCheckoutMode(input.services);
  return mode
    ? `Check-in & Check-out — ${getGuestCheckinCheckoutModeLabel(mode)}`
    : null;
}

export function hasGuestCheckinCheckoutSelection(
  services: readonly string[],
): boolean {
  return services.some((slug) => OPERATIONAL_SLUGS.includes(slug as (typeof OPERATIONAL_SLUGS)[number]));
}

export function isGuestCheckinCheckoutOperationalSlug(
  slug: string,
): boolean {
  return OPERATIONAL_SLUGS.includes(slug as (typeof OPERATIONAL_SLUGS)[number]);
}
