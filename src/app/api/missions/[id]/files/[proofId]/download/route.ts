import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { canAccessMissionForRole, PROVIDER_ROLES } from "@/app/lib/missionPermissions";
import { resolveCommercialAccess as resolveMissionAccess } from "@/server/auth/commercialAccess";
import { MISSION_PROOF_BUCKET, MissionProofVerificationError, missionProofs, missionProofObjectExists } from "@/app/api/_shared/missionProofAccess";

const dbAny = asLooseSupabaseClient(db);
const MISSION_FILE_ROLES = new Set([
  "admin", "super_admin", "concierge", "concierge_pro", "owner", "owner_pro",
  "provider", "provider_pro", "artisan", "artisan_pro",
]);
const SIGNED_URL_TTL_SECONDS = 10 * 60;

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function wantsJson(req: NextRequest) {
  return req.nextUrl.searchParams.get("format") === "json" || req.headers.get("accept")?.includes("application/json");
}

async function isAssignedProvider(userId: string, missionId: string) {
  const { data, error } = await dbAny
    .from("provider_interventions")
    .select("id")
    .eq("provider_profile_id", userId)
    .contains("metadata", { mission_id: missionId })
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string }> },
) {
  try {
    const auth = await resolveMissionAccess(req);
    if (auth instanceof NextResponse) return auth;
    if (!MISSION_FILE_ROLES.has(auth.role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const { userId, role } = auth;
    const { id, proofId } = await params;

    if (!isUuidLike(id) || !proofId.trim()) {
      return NextResponse.json({ error: "Piece jointe invalide" }, { status: 400 });
    }

    const { data: mission, error: missionError } = await dbAny
      .from("missions")
      .select("id, owner_profile_id, concierge_profile_id, metadata")
      .eq("id", id)
      .maybeSingle();

    if (missionError) {
      console.error("[GET /api/missions/:id/files/:proofId/download] mission error:", missionError);
      return NextResponse.json({ error: "Erreur lecture mission" }, { status: 500 });
    }
    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }
    const directAccess = canAccessMissionForRole({
      role,
      userId,
      ownerProfileId: mission.owner_profile_id,
      conciergeProfileId: mission.concierge_profile_id,
    });
    const providerAccess = PROVIDER_ROLES.has(role) && (await isAssignedProvider(userId, id));
    if (!directAccess && !providerAccess) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const metadata = toRecord(mission.metadata);
    const proof = missionProofs(mission.id, metadata).find(entry => entry.id === proofId);

    if (!proof) {
      return NextResponse.json({ error: "Piece jointe introuvable" }, { status: 404 });
    }

    if (proof.storage_path) {
      if (!await missionProofObjectExists(db.storage, proof)) {
        return NextResponse.json({ error: "Pièce jointe introuvable" }, { status: 404 });
      }
      const bucket = MISSION_PROOF_BUCKET;
      const { data, error } = await db.storage
        .from(bucket)
        .createSignedUrl(proof.storage_path, SIGNED_URL_TTL_SECONDS, {
          download: proof.label || true,
        });

      if (error || !data?.signedUrl) {
        console.error("[GET /api/missions/:id/files/:proofId/download] signing error:", error);
        return NextResponse.json({ error: "Signature fichier impossible" }, { status: 500 });
      }

      if (wantsJson(req)) {
        return NextResponse.json({
          signed_url: data.signedUrl,
          expires_in: SIGNED_URL_TTL_SECONDS,
          storage_bucket: bucket,
          storage_path: proof.storage_path,
        });
      }

      return NextResponse.redirect(data.signedUrl, { status: 302 });
    }

    if (proof.url) {
      if (wantsJson(req)) {
        return NextResponse.json({ url: proof.url, external: true });
      }
      return NextResponse.redirect(proof.url, { status: 302 });
    }

    return NextResponse.json({ error: "Aucun fichier rattache" }, { status: 404 });
  } catch (err) {
    if (err instanceof MissionProofVerificationError) {
      return NextResponse.json({ error: err.message }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[GET /api/missions/:id/files/:proofId/download] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
