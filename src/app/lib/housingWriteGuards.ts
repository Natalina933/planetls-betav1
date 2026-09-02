import { extractHousingAccessProfileIds, resolveHousingAccessRole } from "../../types/housing.ts";

type HousingWriteGuardInput = {
  proprietaire: unknown;
  userId: string;
  role: string;
  isAdmin?: boolean;
};

type HousingWriteGuardResult =
  | { ok: true; proprietaire: Record<string, unknown> }
  | { ok: false; error: string };

const OWNER_ID_KEYS = [
  "id",
  "userId",
  "profile_id",
  "owner_id",
  "owner_profile_id",
  "proprietaire_id",
] as const;

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPendingOwnerPlaceholder(proprietaire: Record<string, unknown>) {
  const email = cleanString(proprietaire.email).toLowerCase();
  const fullName = cleanString(proprietaire.full_name || proprietaire.fullName).toLowerCase();
  return email.endsWith("@pending.local") || fullName.includes("a confirmer");
}

function clearOwnerAliases(proprietaire: Record<string, unknown>, userId: string) {
  for (const key of OWNER_ID_KEYS) {
    if (cleanString(proprietaire[key]) === userId) {
      proprietaire[key] = null;
    }
  }
}

export function guardHousingWriteAccess(input: HousingWriteGuardInput): HousingWriteGuardResult {
  const proprietaire = asRecord(input.proprietaire);
  if (input.isAdmin) {
    return { ok: true, proprietaire };
  }

  const accessRole = resolveHousingAccessRole(input.role);
  if (accessRole === "unknown") {
    return { ok: false, error: "Acces refuse" };
  }

  const { ownerId, managerId } = extractHousingAccessProfileIds(proprietaire);

  if (accessRole === "owner") {
    if (ownerId && ownerId !== input.userId) {
      return { ok: false, error: "Un proprietaire ne peut enregistrer un logement que pour son propre profil." };
    }

    proprietaire.owner_profile_id = input.userId;
    if (!cleanString(proprietaire.id)) {
      proprietaire.id = input.userId;
    }
    return { ok: true, proprietaire };
  }

  if (accessRole === "concierge") {
    if (managerId && managerId !== input.userId) {
      return { ok: false, error: "La concierge connectee doit rester la gestionnaire du logement qu'elle modifie." };
    }

    proprietaire.manager_profile_id = input.userId;
    if (ownerId === input.userId && isPendingOwnerPlaceholder(proprietaire)) {
      clearOwnerAliases(proprietaire, input.userId);
    }

    return { ok: true, proprietaire };
  }

  return { ok: false, error: "Acces refuse" };
}
