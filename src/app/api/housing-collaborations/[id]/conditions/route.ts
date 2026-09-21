import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { requireApiRole } from "@/server/auth/roleGuards";
import { saveContractDraftSchema, contractVersionActionSchema } from "@/features/housing-collaborations/contractConditions";

export const dynamic = "force-dynamic";
const roles = new Set(["owner", "owner_pro", "concierge", "concierge_pro"]);
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };
type SignatureRow = {
  id: string;
  contract_version_id: string;
  signer_profile_id: string;
  signer_role: "owner" | "concierge";
  signed_at: string;
  created_at: string;
};
type VersionRow = { id: string; conditions?: unknown };

function actorRole(role: string): "owner" | "concierge" {
  return role === "owner" || role === "owner_pro" ? "owner" : "concierge";
}

function effectiveStartFromConditions(conditions: unknown) {
  if (!conditions || typeof conditions !== "object" || Array.isArray(conditions)) return null;
  const duration = (conditions as Record<string, unknown>).duration;
  if (!duration || typeof duration !== "object" || Array.isArray(duration)) return null;
  const startsOn = (duration as Record<string, unknown>).startsOn;
  return typeof startsOn === "string" ? startsOn : null;
}

async function participant(req: NextRequest, context: Context) {
  const guard = await requireApiRole(req, roles);
  if (!guard.ok) return { response: guard.response };
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return { response: NextResponse.json({ error: "Collaboration invalide." }, { status: 400, headers }) };
  }
  const role = actorRole(guard.auth.role);
  const column = role === "owner" ? "owner_profile_id" : "concierge_profile_id";
  const { data, error } = await asLooseSupabaseClient(db).from("housing_collaborations")
    .select("id,status").eq("id", id).eq(column, guard.auth.userId).maybeSingle();
  if (error) throw error;
  if (!data) return { response: NextResponse.json({ error: "Collaboration introuvable." }, { status: 404, headers }) };
  return { id, actor: guard.auth.userId, actorRole: role, status: data.status as string };
}

async function signatureState(collaborationId: string, collaborationStatus: string, version: VersionRow | null, currentActor: string, currentActorRole: "owner" | "concierge") {
  if (!version) return null;
  const { data, error } = await asLooseSupabaseClient(db).from("contract_version_signatures")
    .select("*").eq("contract_version_id", version.id).order("signed_at", { ascending: true });
  if (error) throw error;
  const signatures = (data ?? []) as SignatureRow[];
  const ownerSigned = signatures.some(signature => signature.signer_role === "owner");
  const conciergeSigned = signatures.some(signature => signature.signer_role === "concierge");
  return {
    versionId: version.id,
    collaborationStatus,
    signatures,
    ownerSigned,
    conciergeSigned,
    signed: ownerSigned && conciergeSigned,
    currentActorSigned: signatures.some(signature => signature.signer_profile_id === currentActor && signature.signer_role === currentActorRole),
    currentActorRole,
    effectiveStart: effectiveStartFromConditions(version.conditions),
    collaborationId,
  };
}

export async function GET(req: NextRequest, context: Context) {
  try {
    const access = await participant(req, context);
    if (access.response) return access.response;
    const { data: envelope, error } = await db.from("services_contracts")
      .select("id").eq("collaboration_id", access.id).maybeSingle();
    if (error) throw error;
    if (!envelope) return NextResponse.json({ draft: null, currentVersion: null, versions: [], actorId: access.actor, signatureState: null }, { headers });
    const { data: versions, error: draftError } = await db.from("services_contract_versions")
      .select("*").eq("contract_id", envelope.id).order("version_number", { ascending: false });
    if (draftError) throw draftError;
    const currentVersion = versions?.[0] ?? null;
    return NextResponse.json({
      draft: currentVersion?.status === "draft" ? currentVersion : null,
      currentVersion,
      versions: versions ?? [],
      actorId: access.actor,
      signatureState: await signatureState(access.id, access.status, currentVersion as VersionRow | null, access.actor, access.actorRole),
    }, { headers });
  } catch (error) {
    console.error("[GET collaboration conditions]", error);
    return NextResponse.json({ error: "Impossible de charger le brouillon." }, { status: 500, headers });
  }
}

/** Both authenticated participants can edit, using revision-based conflict detection.
 * The RPC is service-role only and rechecks participants/state inside the transaction. */
export async function PUT(req: NextRequest, context: Context) {
  try {
    const access = await participant(req, context);
    if (access.response) return access.response;
    if (access.status !== "pending_handover") {
      return NextResponse.json({ error: "Cette collaboration n’est plus en attente de contractualisation." }, { status: 409, headers });
    }
    const body = await req.json().catch(() => null);
    const parsed = saveContractDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Conditions invalides.", issues: parsed.error.issues }, { status: 400, headers });
    }
    const { data, error } = await db.rpc("save_collaboration_contract_draft", {
      p_collaboration_id: access.id,
      p_actor_id: access.actor,
      p_expected_revision: parsed.data.expectedRevision,
      p_conditions: parsed.data.conditions,
      p_version_id: parsed.data.versionId,
    });
    if (error) {
      if (error.code === "40001") return NextResponse.json({ error: "Le brouillon a changé. Rechargez-le avant de modifier les conditions." }, { status: 409, headers });
      if (error.code === "42501") return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers });
      if (error.code === "23514") return NextResponse.json({ error: "Conditions ou références incompatibles avec la collaboration." }, { status: 400, headers });
      throw error;
    }
    return NextResponse.json({ draft: data }, { headers });
  } catch (error) {
    console.error("[PUT collaboration conditions]", error);
    return NextResponse.json({ error: "Impossible d’enregistrer le brouillon." }, { status: 500, headers });
  }
}

/** Propose, accept and request changes are distinct explicit actions, never signatures. */
export async function POST(req: NextRequest, context: Context) {
  try {
    const access = await participant(req, context);
    if (access.response) return access.response;
    if (access.status !== "pending_handover") {
      return NextResponse.json({ error: "Cette collaboration n’est plus en attente de contractualisation." }, { status: 409, headers });
    }
    const parsed = contractVersionActionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Action ou version invalide." }, { status: 400, headers });
    const action = parsed.data;
    const { data, error } = await db.rpc("transition_collaboration_contract_version", {
      p_collaboration_id: access.id, p_actor_id: access.actor, p_version_id: action.versionId,
      p_expected_revision: action.expectedRevision, p_action: action.action,
      p_reason: action.action === "request_changes" ? action.reason : null,
    });
    if (error) {
      if (error.code === "40001") return NextResponse.json({ error: "La version ou son état a changé. Rechargez les conditions avant de continuer." }, { status: 409, headers });
      if (error.code === "42501") return NextResponse.json({ error: "Cette action ne vous est pas autorisée." }, { status: 403, headers });
      if (error.code === "23514") return NextResponse.json({ error: "Conditions ou action invalides." }, { status: 400, headers });
      throw error;
    }
    return NextResponse.json({ version: data }, { headers });
  } catch (error) {
    console.error("[POST collaboration conditions]", error);
    return NextResponse.json({ error: "Impossible d’enregistrer cette action." }, { status: 500, headers });
  }
}
