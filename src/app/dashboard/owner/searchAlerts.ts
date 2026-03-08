export type OwnerConciergeSearchAlert = {
  id: string;
  city: string;
  region: string;
  budgetMax: string;
  radiusKm: string;
  createdAt: string;
  status: "active";
};

const STORAGE_KEY = "owner-concierge-search-alerts";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadOwnerConciergeSearchAlerts(): OwnerConciergeSearchAlert[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OwnerConciergeSearchAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOwnerConciergeSearchAlerts(alerts: OwnerConciergeSearchAlert[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function createOwnerConciergeSearchAlert(
  input: Omit<OwnerConciergeSearchAlert, "id" | "createdAt" | "status">,
) {
  const nextAlert: OwnerConciergeSearchAlert = {
    id: `search-alert-${Date.now()}`,
    city: input.city.trim(),
    region: input.region.trim(),
    budgetMax: input.budgetMax.trim(),
    radiusKm: input.radiusKm.trim(),
    createdAt: new Date().toISOString(),
    status: "active",
  };

  const current = loadOwnerConciergeSearchAlerts();
  saveOwnerConciergeSearchAlerts([nextAlert, ...current]);
  return nextAlert;
}
