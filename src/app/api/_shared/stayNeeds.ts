// Canonical stay-need vocabulary shared by stay mission assignments and
// one-off stay service requests. Keep a single catalog for both usages.
import { resolveCommonServiceValue, type CommonServiceReference } from "../../lib/commonServiceCatalog.ts";

export const SERVICE_CODES = {
  checkin: "CHECK_IN",
  checkout: "CHECK_OUT",
  cleaning: "MENAGE",
  linen: "LINGE",
  courses: "COURSES",
} as const;

export type NeedKey = keyof typeof SERVICE_CODES;

export const STAY_NEED_KEYS: NeedKey[] = ["checkin", "checkout", "cleaning", "linen", "courses"];

export const STAY_NEED_SERVICE_SLUGS: Record<NeedKey, string> = {
  checkin: "guest_checkin",
  checkout: "guest_checkout",
  cleaning: "cleaning_turnover",
  linen: "linen_change",
  courses: "groceries_arrival",
};

export type StayNeedCatalogResolution =
  | {
      kind: "service";
      need: NeedKey;
      historicalCode: (typeof SERVICE_CODES)[NeedKey];
      slug: string;
      service: CommonServiceReference;
    }
  | { kind: "unknown"; value: unknown };

export function normalizeStayNeed(value: unknown): NeedKey | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[_\s-]+/g, "");
  if (normalized === "checkin" || normalized === "arrival") return "checkin";
  if (normalized === "checkout" || normalized === "departure") return "checkout";
  if (normalized === "cleaning" || normalized === "menage" || normalized === "ménage") return "cleaning";
  if (normalized === "linen" || normalized === "linge") return "linen";
  if (normalized === "courses" || normalized === "groceries") return "courses";
  return null;
}

export function getStayNeedServiceSlug(need: NeedKey) {
  return STAY_NEED_SERVICE_SLUGS[need];
}

export function resolveStayNeedCatalogService(value: unknown): StayNeedCatalogResolution {
  const need = normalizeStayNeed(value);
  if (!need) return { kind: "unknown", value };

  const slug = getStayNeedServiceSlug(need);
  const resolved = resolveCommonServiceValue(slug);
  if (resolved.kind !== "service") {
    return { kind: "unknown", value };
  }

  return {
    kind: "service",
    need,
    historicalCode: SERVICE_CODES[need],
    slug,
    service: resolved.service,
  };
}
