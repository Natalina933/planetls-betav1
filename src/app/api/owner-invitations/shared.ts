import crypto from "node:crypto";
import type { Json } from "@/types/supabase";
import { db } from "@/app/lib/dbServer";
import { canAccessHousing } from "@/types/housing";
import {
  type CreateOwnerInvitationPayload,
  type OwnerInvitationContext,
  type OwnerInvitationListItem,
  type OwnerInvitationRecord,
  type OwnerInvitationStatus,
  normalizeInvitationEmail,
  normalizeInvitationStatus,
} from "@/types/ownerInvitations";

const dbAny = db as any;

type HousingAccessRow = {
  id: number;
  nom_logement: string | null;
  proprietaire: unknown;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
};

type InvitationRow = {
  id: string;
  concierge_profile_id: string;
  housing_id: number | null;
  quote_id: string | null;
  mission_id: string | null;
  invited_email: string;
  invited_email_normalized: string;
  invited_owner_name: string | null;
  personal_note: string | null;
  status: string;
  token_hash: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  expires_at: string | null;
  relaunch_count: number | null;
  relanced_at: string | null;
  cancelled_at: string | null;
  claimed_owner_profile_id: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildConciergeLabel(profile: ProfileRow | null) {
  if (!profile) return null;
  const fullName = [cleanString(profile.first_name), cleanString(profile.last_name)].filter(Boolean).join(" ");
  return fullName || cleanString(profile.company_name) || cleanString(profile.email) || "Concierge";
}

function parseInvitationContext(row: InvitationRow): OwnerInvitationContext {
  const metadata = asRecord(row.metadata);
  return {
    housingId: row.housing_id != null ? String(row.housing_id) : null,
    quoteId: cleanString(row.quote_id) || null,
    missionId: cleanString(row.mission_id) || null,
    ownerNameHint: cleanString(row.invited_owner_name || metadata.owner_name_hint) || null,
  };
}

export function hashInvitationToken(token: string) {
  const secret =
    process.env.OWNER_INVITATION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "planetls-owner-invitation-fallback";

  return crypto.createHash("sha256").update(`${token}:${secret}`).digest("hex");
}

export function createInvitationToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function buildInvitationClaimUrl(origin: string, token: string) {
  const url = new URL("/invitation/proprietaire", origin);
  url.searchParams.set("token", token);
  return url.toString();
}

export function buildInvitationExpiry(days = 7) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

export function mapInvitationRow(
  row: InvitationRow,
  options?: { conciergeLabel?: string | null; housingLabel?: string | null },
): OwnerInvitationListItem {
  return {
    id: row.id,
    conciergeProfileId: row.concierge_profile_id,
    housingId: row.housing_id != null ? String(row.housing_id) : null,
    invitedEmail: row.invited_email,
    invitedEmailNormalized: row.invited_email_normalized,
    invitedOwnerName: row.invited_owner_name,
    personalNote: row.personal_note,
    status: normalizeInvitationStatus(row.status),
    sentAt: row.sent_at,
    viewedAt: row.viewed_at,
    acceptedAt: row.accepted_at,
    expiresAt: row.expires_at,
    relaunchCount: Number(row.relaunch_count ?? 0),
    relancedAt: row.relanced_at,
    cancelledAt: row.cancelled_at,
    claimedOwnerProfileId: row.claimed_owner_profile_id,
    lastEventAt: row.accepted_at || row.relanced_at || row.viewed_at || row.sent_at || row.updated_at,
    context: parseInvitationContext(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    conciergeLabel: options?.conciergeLabel ?? null,
    housingLabel: options?.housingLabel ?? null,
  };
}

export async function loadHousingForInvitation(
  housingId: string,
  userId: string,
  role: string,
  isAdmin: boolean,
) {
  const housingNumericId = Number(housingId);
  if (!Number.isFinite(housingNumericId)) {
    throw new Error("Identifiant logement invalide.");
  }

  const { data, error } = await db
    .from("housing")
    .select("id, nom_logement, proprietaire")
    .eq("id", housingNumericId)
    .maybeSingle<HousingAccessRow>();

  if (error) {
    console.error("[owner-invitations] housing lookup error:", error);
    throw new Error("Impossible de charger ce logement.");
  }

  if (!data) {
    throw new Error("Logement introuvable.");
  }

  if (!canAccessHousing(data.proprietaire, userId, role, isAdmin)) {
    throw new Error("Acces refuse a ce logement.");
  }

  return data;
}

export async function loadConciergeProfile(profileId: string) {
  const { data, error } = await db
    .from("profiles")
    .select("id, first_name, last_name, company_name, email")
    .eq("id", profileId)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error("[owner-invitations] concierge profile error:", error);
    return null;
  }

  return data ?? null;
}

export async function loadHousingInvitations(housingId: string | number, conciergeProfileId?: string) {
  let query = dbAny
    .from("owner_invitations")
    .select("*")
    .eq("housing_id", Number(housingId))
    .is("cancelled_at", null)
    .order("created_at", { ascending: false });

  if (conciergeProfileId) {
    query = query.eq("concierge_profile_id", conciergeProfileId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[owner-invitations] list error:", error);
    throw new Error("Impossible de charger les invitations.");
  }

  return (data ?? []) as InvitationRow[];
}

export async function loadInvitationById(id: string) {
  const { data, error } = await dbAny.from("owner_invitations").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[owner-invitations] invitation lookup error:", error);
    throw new Error("Impossible de charger l'invitation.");
  }

  return (data ?? null) as InvitationRow | null;
}

export async function findReusableInvitation(
  conciergeProfileId: string,
  housingId: string,
  emailNormalized: string,
) {
  const { data, error } = await dbAny
    .from("owner_invitations")
    .select("*")
    .eq("concierge_profile_id", conciergeProfileId)
    .eq("housing_id", housingId)
    .eq("invited_email_normalized", emailNormalized)
    .in("status", ["sent", "viewed", "relanced", "expired"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[owner-invitations] reusable invitation error:", error);
    return null;
  }

  return (data ?? null) as InvitationRow | null;
}

export async function insertInvitationEvent(
  invitationId: string,
  eventType: string,
  actorProfileId: string | null,
  payload?: Record<string, unknown>,
) {
  const { error } = await dbAny.from("owner_invitation_events").insert({
    invitation_id: invitationId,
    event_type: eventType,
    actor_profile_id: actorProfileId,
    payload: payload ?? null,
  });

  if (error) {
    console.error("[owner-invitations] event insert error:", error);
  }
}

export async function createOrRefreshInvitation(
  input: CreateOwnerInvitationPayload & {
    conciergeProfileId: string;
    origin: string;
  },
) {
  const normalizedEmail = normalizeInvitationEmail(input.email);
  const { token, tokenHash } = createInvitationToken();
  const expiresAt = buildInvitationExpiry(7);
  const metadata: Json = {
    owner_name_hint: input.ownerNameHint?.trim() || null,
    created_from: "housing_owner_panel",
  };

  const existing = await findReusableInvitation(input.conciergeProfileId, input.housingId, normalizedEmail);

  let invitationRow: InvitationRow;
  let eventType = "sent";

  if (existing) {
    const { data, error } = await dbAny
      .from("owner_invitations")
      .update({
        invited_owner_name: input.ownerNameHint?.trim() || null,
        personal_note: input.personalNote?.trim() || null,
        quote_id: input.quoteId ?? null,
        mission_id: input.missionId ?? null,
        token_hash: tokenHash,
        status: "relanced",
        expires_at: expiresAt,
        sent_at: new Date().toISOString(),
        relanced_at: new Date().toISOString(),
        relaunch_count: Number(existing.relaunch_count ?? 0) + 1,
        cancelled_at: null,
        metadata,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      console.error("[owner-invitations] update invitation error:", error);
      throw new Error("Impossible de relancer l'invitation.");
    }

    invitationRow = data as InvitationRow;
    eventType = "relanced";
  } else {
    const { data, error } = await dbAny
      .from("owner_invitations")
      .insert({
        concierge_profile_id: input.conciergeProfileId,
        housing_id: Number(input.housingId),
        quote_id: input.quoteId ?? null,
        mission_id: input.missionId ?? null,
        invited_email: input.email.trim(),
        invited_email_normalized: normalizedEmail,
        invited_owner_name: input.ownerNameHint?.trim() || null,
        personal_note: input.personalNote?.trim() || null,
        status: "sent",
        token_hash: tokenHash,
        sent_at: new Date().toISOString(),
        expires_at: expiresAt,
        relaunch_count: 0,
        metadata,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[owner-invitations] create invitation error:", error);
      throw new Error("Impossible de creer l'invitation.");
    }

    invitationRow = data as InvitationRow;
  }

  await insertInvitationEvent(invitationRow.id, eventType, input.conciergeProfileId, {
    housing_id: input.housingId,
    email: normalizedEmail,
  });

  return {
    invitation: mapInvitationRow(invitationRow),
    claimUrl: buildInvitationClaimUrl(input.origin, token),
  };
}

export async function dispatchOwnerInvitationEmail(params: {
  claimUrl: string;
  invitation: OwnerInvitationRecord;
  conciergeLabel: string | null;
  housingLabel: string | null;
}) {
  const subject = "Invitation a rejoindre PlanetLS";
  const text = [
    "Bonjour,",
    "",
    `${params.conciergeLabel || "Votre concierge"} vous invite a rejoindre PlanetLS.`,
    params.housingLabel ? `Logement concerne : ${params.housingLabel}` : null,
    "",
    "Depuis votre espace, vous pourrez retrouver vos missions a venir, vos devis acceptes et les informations utiles a transmettre a votre concierge.",
    "",
    `Lien securise : ${params.claimUrl}`,
    "Ce lien reste valable 7 jours.",
    params.invitation.personalNote ? "" : null,
    params.invitation.personalNote ? `Message du concierge : ${params.invitation.personalNote}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  console.info("[owner-invitations] email preview", {
    subject,
    to: params.invitation.invitedEmail,
    claimUrl: params.claimUrl,
    text,
  });

  return {
    deliveryMode: "preview",
    subject,
  };
}

export function getInvitationStatusForList(row: InvitationRow): OwnerInvitationStatus {
  if (row.accepted_at) return "accepted";
  if (row.cancelled_at) return "cancelled";
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return "expired";
  return normalizeInvitationStatus(row.status);
}

export function buildConciergeInvitationSummary(
  invitations: InvitationRow[],
  conciergeLabel: string | null,
  housingLabel: string | null,
) {
  return invitations.map((row) =>
    mapInvitationRow(
      {
        ...row,
        status: getInvitationStatusForList(row),
      },
      { conciergeLabel, housingLabel },
    ),
  );
}

export function getProfileLabel(profile: ProfileRow | null) {
  return buildConciergeLabel(profile);
}
