// Canonical stay-need vocabulary shared by stay mission assignments and
// one-off stay service requests. Keep a single catalog for both usages.
export const SERVICE_CODES = {
  checkin: "CHECK_IN",
  checkout: "CHECK_OUT",
  cleaning: "MENAGE",
  linen: "LINGE",
  courses: "COURSES",
} as const;

export type NeedKey = keyof typeof SERVICE_CODES;

export const STAY_NEED_KEYS: NeedKey[] = ["checkin", "checkout", "cleaning", "linen", "courses"];

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
