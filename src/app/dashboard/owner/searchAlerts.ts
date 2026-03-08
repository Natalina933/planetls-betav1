export type OwnerConciergeSearchAlert = {
  id: string;
  city: string;
  postalCode: string;
  budgetMax: string;
  radiusKm: string;
  createdAt: string;
  status: "active";
};

export type OwnerConciergeSearchAlertInput = Omit<
  OwnerConciergeSearchAlert,
  "id" | "createdAt" | "status"
>;

export type CreateOwnerConciergeSearchAlertResult = {
  alert: OwnerConciergeSearchAlert;
  created: boolean;
};

const STORAGE_KEY = "owner-concierge-search-alerts";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeIdentityPart(value: string) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function normalizeAlertInput(input: OwnerConciergeSearchAlertInput): OwnerConciergeSearchAlertInput {
  return {
    city: normalizeText(input.city),
    postalCode: normalizeText(input.postalCode),
    budgetMax: normalizeText(input.budgetMax),
    radiusKm: normalizeText(input.radiusKm),
  };
}

function isOwnerConciergeSearchAlert(value: unknown): value is OwnerConciergeSearchAlert {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.city === "string" &&
    typeof candidate.postalCode === "string" &&
    typeof candidate.budgetMax === "string" &&
    typeof candidate.radiusKm === "string" &&
    typeof candidate.createdAt === "string" &&
    candidate.status === "active"
  );
}

function sanitizeAlert(alert: OwnerConciergeSearchAlert): OwnerConciergeSearchAlert {
  return {
    ...alert,
    city: normalizeText(alert.city),
    postalCode: normalizeText(alert.postalCode),
    budgetMax: normalizeText(alert.budgetMax),
    radiusKm: normalizeText(alert.radiusKm),
  };
}

function buildAlertIdentityKey(input: OwnerConciergeSearchAlertInput) {
  if (input.city) {
    return `city::${normalizeIdentityPart(input.city)}`;
  }

  return `postal::${normalizeIdentityPart(input.postalCode)}`;
}

export function loadOwnerConciergeSearchAlerts(): OwnerConciergeSearchAlert[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isOwnerConciergeSearchAlert)
      .map(sanitizeAlert)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch {
    return [];
  }
}

export function saveOwnerConciergeSearchAlerts(alerts: OwnerConciergeSearchAlert[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function deleteOwnerConciergeSearchAlert(alertId: string) {
  const nextAlerts = loadOwnerConciergeSearchAlerts().filter((alert) => alert.id !== alertId);
  saveOwnerConciergeSearchAlerts(nextAlerts);
  return nextAlerts;
}

export function createOwnerConciergeSearchAlert(
  input: OwnerConciergeSearchAlertInput,
): CreateOwnerConciergeSearchAlertResult {
  const normalizedInput = normalizeAlertInput(input);

  if (!normalizedInput.city && !normalizedInput.postalCode) {
    throw new Error("Ville ou code postal requis pour créer une alerte.");
  }

  const current = loadOwnerConciergeSearchAlerts();
  const nextIdentityKey = buildAlertIdentityKey(normalizedInput);
  const existingAlert = current.find(
    (alert) =>
      buildAlertIdentityKey({
        city: alert.city,
        postalCode: alert.postalCode,
        budgetMax: alert.budgetMax,
        radiusKm: alert.radiusKm,
      }) === nextIdentityKey,
  );

  if (existingAlert) {
    return { alert: existingAlert, created: false };
  }

  const nextAlert: OwnerConciergeSearchAlert = {
    id: `search-alert-${Date.now()}`,
    city: normalizedInput.city,
    postalCode: normalizedInput.postalCode,
    budgetMax: normalizedInput.budgetMax,
    radiusKm: normalizedInput.radiusKm,
    createdAt: new Date().toISOString(),
    status: "active",
  };

  saveOwnerConciergeSearchAlerts([nextAlert, ...current]);
  return { alert: nextAlert, created: true };
}

export function upsertOwnerConciergeSearchAlert(
  alertId: string | null,
  input: OwnerConciergeSearchAlertInput,
): CreateOwnerConciergeSearchAlertResult {
  if (!alertId) {
    return createOwnerConciergeSearchAlert(input);
  }

  const normalizedInput = normalizeAlertInput(input);

  if (!normalizedInput.city && !normalizedInput.postalCode) {
    throw new Error("Ville ou code postal requis pour créer une alerte.");
  }

  const current = loadOwnerConciergeSearchAlerts();
  const alertToUpdate = current.find((alert) => alert.id === alertId);

  if (!alertToUpdate) {
    return createOwnerConciergeSearchAlert(normalizedInput);
  }

  const nextIdentityKey = buildAlertIdentityKey(normalizedInput);
  const conflictingAlert = current.find(
    (alert) =>
      alert.id !== alertId &&
      buildAlertIdentityKey({
        city: alert.city,
        postalCode: alert.postalCode,
        budgetMax: alert.budgetMax,
        radiusKm: alert.radiusKm,
      }) === nextIdentityKey,
  );

  if (conflictingAlert) {
    return { alert: conflictingAlert, created: false };
  }

  const updatedAlert: OwnerConciergeSearchAlert = {
    ...alertToUpdate,
    ...normalizedInput,
  };

  saveOwnerConciergeSearchAlerts(
    current
      .map((alert) => (alert.id === alertId ? updatedAlert : alert))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  );

  return { alert: updatedAlert, created: true };
}
