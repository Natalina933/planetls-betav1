import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { requireApiRole } from "@/server/auth/roleGuards";

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
type VersionRow = { id: string; status: string; revision: number; conditions?: unknown };

const signSchema = z.object({
  versionId: z.string().uuid(),
  expectedRevision: z.number().int().positive(),
}).strict();

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
    .select("id,status,owner_profile_id,concierge_profile_id").eq("id", id).eq(column, guard.auth.userId).maybeSingle();
  if (error) throw error;
  if (!data) return { response: NextResponse.json({ error: "Collaboration introuvable." }, { status: 404, headers }) };
  return { id, actor: guard.auth.userId, actorRole: role, collaboration: data as { id: string; status: string } };
}

async function loadSignatureState(collaborationId: string, currentActor: string, currentActorRole: "owner" | "concierge") {
  const client = asLooseSupabaseClient(db);
  const { data: envelope, error: envelopeError } = await client.from("services_contracts")
    .select("id").eq("collaboration_id", collaborationId).maybeSingle();
  if (envelopeError) throw envelopeError;
  if (!envelope) return null;
  const { data: versions, error: versionError } = await client.from("services_contract_versions")
    .select("*").eq("contract_id", (envelope as { id: string }).id).order("version_number", { ascending: false });
  if (versionError) throw versionError;
  const version = ((versions ?? []) as VersionRow[])[0] ?? null;
  if (!version) return null;
  const { data: collaboration, error: collaborationError } = await client.from("housing_collaborations")
    .select("status").eq("id", collaborationId).maybeSingle();
  if (collaborationError) throw collaborationError;
  const { data: signatures, error: signatureError } = await client.from("contract_version_signatures")
    .select("*").eq("contract_version_id", version.id).order("signed_at", { ascending: true });
  if (signatureError) throw signatureError;
  const rows = (signatures ?? []) as SignatureRow[];
  const ownerSigned = rows.some((signature) => signature.signer_role === "owner");
  const conciergeSigned = rows.some((signature) => signature.signer_role === "concierge");
  return {
    versionId: version.id,
    collaborationStatus: String((collaboration as { status?: string } | null)?.status ?? ""),
    signatures: rows,
    ownerSigned,
    conciergeSigned,
    signed: ownerSigned && conciergeSigned,
    currentActorSigned: rows.some((signature) => signature.signer_profile_id === currentActor && signature.signer_role === currentActorRole),
    currentActorRole,
    effectiveStart: effectiveStartFromConditions(version.conditions),
  };
}

export async function GET(req: NextRequest, context: Context) {
  try {
    const access = await participant(req, context);
    if (access.response) return access.response;
    return NextResponse.json({ signatureState: await loadSignatureState(access.id, access.actor, access.actorRole) }, { headers });
  } catch (error) {
    console.error("[GET collaboration signatures]", error);
    return NextResponse.json({ error: "Impossible de charger les signatures." }, { status: 500, headers });
  }
}

export async function POST(req: NextRequest, context: Context) {
  try {
    const access = await participant(req, context);
    if (access.response) return access.response;
    const parsed = signSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Version de signature invalide." }, { status: 400, headers });

    const { data, error } = await asLooseSupabaseClient(db).rpc("sign_collaboration_contract_version", {
      p_collaboration_id: access.id,
      p_actor_id: access.actor,
      p_version_id: parsed.data.versionId,
      p_expected_revision: parsed.data.expectedRevision,
    });
    if (error) {
      if (error.code === "40001") return NextResponse.json({ error: "La version ou son état a changé. Rechargez avant de signer." }, { status: 409, headers });
      if (error.code === "42501") return NextResponse.json({ error: "Signature non autorisée." }, { status: 403, headers });
      if (error.code === "23514") return NextResponse.json({ error: "Conditions contractuelles invalides pour signature." }, { status: 400, headers });
      throw error;
    }
    return NextResponse.json({ result: data }, { headers });
  } catch (error) {
    console.error("[POST collaboration signatures]", error);
    return NextResponse.json({ error: "Impossible de signer le contrat." }, { status: 500, headers });
  }
}
