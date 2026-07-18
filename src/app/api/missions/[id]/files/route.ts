import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  canAccessMissionForRole,
  CONCIERGE_MISSION_ROLES,
  PROVIDER_ROLES,
} from "@/app/lib/missionPermissions";
import { requireApiRole } from "@/server/auth/roleGuards";
import type { Json } from "@/types/supabase";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";

const dbAny = asLooseSupabaseClient(db);
const MISSION_FILE_ROLES = new Set([
  "admin", "super_admin", "concierge", "concierge_pro", "owner", "owner_pro",
  "provider", "provider_pro", "artisan", "artisan_pro",
]);
const BUCKET = "mission-evidence";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_PREFIXES = ["image/", "video/", "application/pdf"];

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function extensionFromName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "bin";
  return /^[a-z0-9]{2,8}$/.test(extension) ? extension : "bin";
}

function isAllowedFileType(type: string) {
  return ALLOWED_PREFIXES.some((prefix) => type.startsWith(prefix));
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

async function ensureBucket() {
  const { data: buckets, error: listError } = await db.storage.listBuckets();
  if (listError) throw listError;
  const exists = (buckets ?? []).some((bucket) => bucket.name === BUCKET);
  if (!exists) {
    const { error } = await db.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "video/mp4", "application/pdf"],
    });
    if (error && !String(error.message ?? "").toLowerCase().includes("already exists")) throw error;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, MISSION_FILE_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const { id } = await params;

    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Mission invalide" }, { status: 400 });
    }
    const providerUpload = PROVIDER_ROLES.has(role);
    if (!providerUpload && !CONCIERGE_MISSION_ROLES.has(role)) {
      return NextResponse.json({ error: "Upload reserve aux intervenants de la mission" }, { status: 403 });
    }

    const { data: mission, error: missionError } = await dbAny
      .from("missions")
      .select("id, owner_profile_id, concierge_profile_id, metadata")
      .eq("id", id)
      .maybeSingle();

    if (missionError) {
      console.error("[POST /api/missions/:id/files] mission error:", missionError);
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
    const providerAccess = providerUpload && (await isAssignedProvider(userId, id));
    if (!directAccess && !providerAccess) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Fichier vide ou trop volumineux" }, { status: 400 });
    }
    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (!isAllowedFileType(mimeType)) {
      return NextResponse.json({ error: "Type de fichier non supporte" }, { status: 400 });
    }

    await ensureBucket();
    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const kind = typeof formData.get("kind") === "string"
      ? String(formData.get("kind"))
      : providerUpload
        ? "provider_evidence"
        : "document";
    const label =
      typeof formData.get("label") === "string" && String(formData.get("label")).trim()
        ? String(formData.get("label")).trim()
        : file.name;
    const path = `missions/${id}/${Date.now()}-${randomUUID()}.${extensionFromName(file.name)}`;

    const { data: upload, error: uploadError } = await db.storage.from(BUCKET).upload(path, buffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError || !upload) {
      console.error("[POST /api/missions/:id/files] upload error:", uploadError);
      return NextResponse.json({ error: "Echec upload fichier" }, { status: 500 });
    }

    const metadata = toRecord(mission.metadata);
    const proof = {
      id: randomUUID(),
      label,
      kind,
      storage_bucket: BUCKET,
      storage_path: upload.path,
      mime_type: mimeType,
      file_size_bytes: file.size,
      sha256,
      created_at: new Date().toISOString(),
      created_by: userId,
      source: providerUpload ? "provider_intervention" : "mission",
    };

    const { data: updatedMission, error: updateError } = await dbAny
      .from("missions")
      .update({
        metadata: {
          ...metadata,
          proof_links: [...(Array.isArray(metadata.proof_links) ? metadata.proof_links : []), proof],
        } as Json,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedMission) {
      console.error("[POST /api/missions/:id/files] metadata error:", updateError);
      await db.storage.from(BUCKET).remove([upload.path]);
      return NextResponse.json({ error: "Fichier uploade mais non rattache" }, { status: 500 });
    }

    await dbAny.from("mission_events").insert({
      mission_id: id,
      actor_profile_id: userId,
      event_type: "updated",
      payload: {
        action: "file_uploaded",
        label,
        storage_path: upload.path,
      },
    });

    return NextResponse.json(proof, { status: 201 });
  } catch (err) {
    console.error("[POST /api/missions/:id/files] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
