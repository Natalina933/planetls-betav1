import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";

export const INSPECTION_STATUSES = [
  "draft",
  "submitted",
  "reviewed",
  "dispute_opened",
  "closed",
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const DISPUTE_TYPES = ["damage", "missing_item", "cleaning", "other"] as const;

export type DisputeType = (typeof DISPUTE_TYPES)[number];

// Legacy Supabase typing is incomplete on new inspection/dispute tables.
export const dbAny = asLooseSupabaseClient(db);

export const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeMessage = "message" in error ? error.message : null;

  return (
    typeof maybeMessage === "string" &&
    (maybeMessage.includes("relation") ||
      maybeMessage.includes("does not exist") ||
      maybeMessage.includes("schema cache"))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function extractOwnerIdFromHousingProprietaire(value: unknown): string | null {
  if (!isRecord(value)) return null;

  const candidates = [
    value.id,
    value.userId,
    value.profile_id,
    value.owner_id,
    value.proprietaire_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && isUuidLike(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function parseLimit(raw: string | null, fallback = 20) {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), 1), 100);
}

export function canAccessInspection(
  userId: string,
  inspection: { owner_profile_id?: string | null; concierge_profile_id?: string | null },
) {
  return (
    inspection.owner_profile_id === userId || inspection.concierge_profile_id === userId
  );
}
