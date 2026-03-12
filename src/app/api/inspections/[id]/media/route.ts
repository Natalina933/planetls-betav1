import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";
import type { Json } from "@/types/supabase";
import { dbAny, isUuidLike } from "../../shared";

const MAX_MEDIA_SIZE_BYTES = 120 * 1024 * 1024;
const ALLOWED_MEDIA_PREFIXES = ["image/", "video/"];

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalJsonObject(value: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore malformed JSON and fallback to empty object.
  }
  return {};
}

function guessMediaType(mimeType: string): "photo" | "video" | null {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  return null;
}

function sanitizeFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  return /^[a-z0-9]{2,8}$/.test(ext) ? ext : "bin";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, isAdmin } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Inspection invalide" }, { status: 400 });
    }

    const { data: inspection, error: inspectionError } = await dbAny
      .from("checkout_inspections")
      .select("id, concierge_profile_id, status")
      .eq("id", id)
      .maybeSingle();

    if (inspectionError) {
      console.error("[POST /api/inspections/:id/media] inspection load error:", inspectionError);
      return NextResponse.json({ error: "Erreur lecture inspection" }, { status: 500 });
    }

    if (!inspection) {
      return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
    }

    if (!isAdmin && inspection.concierge_profile_id !== userId) {
      return NextResponse.json({ error: "Seul le concierge assigne peut envoyer des medias." }, { status: 403 });
    }

    if (!isAdmin && inspection.status !== "draft") {
      return NextResponse.json({ error: "Upload non autorise apres soumission." }, { status: 409 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
    }

    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_MEDIA_SIZE_BYTES / (1024 * 1024)}MB).` },
        { status: 400 },
      );
    }

    const mimeType = typeof file.type === "string" ? file.type.toLowerCase() : "";
    if (!ALLOWED_MEDIA_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
      return NextResponse.json({ error: "Type de fichier non supporte (image/video uniquement)." }, { status: 400 });
    }

    const mediaType = guessMediaType(mimeType);
    if (!mediaType) {
      return NextResponse.json({ error: "Type media invalide." }, { status: 400 });
    }

    const checklistItemIdRaw = formData.get("checklistItemId");
    const checklistItemId =
      typeof checklistItemIdRaw === "string" && checklistItemIdRaw.trim().length > 0
        ? checklistItemIdRaw.trim()
        : null;

    if (checklistItemId && !isUuidLike(checklistItemId)) {
      return NextResponse.json({ error: "checklistItemId invalide." }, { status: 400 });
    }

    if (checklistItemId) {
      const { data: checklistItem, error: checklistError } = await dbAny
        .from("checkout_checklist_items")
        .select("id")
        .eq("id", checklistItemId)
        .eq("inspection_id", id)
        .maybeSingle();

      if (checklistError) {
        console.error("[POST /api/inspections/:id/media] checklist load error:", checklistError);
        return NextResponse.json({ error: "Erreur validation checklist" }, { status: 500 });
      }

      if (!checklistItem) {
        return NextResponse.json({ error: "checklistItemId introuvable pour cette inspection." }, { status: 400 });
      }
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(fileBuffer).digest("hex");

    const extension = sanitizeFileExtension(file.name || "media.bin");
    const filePath = `inspections/${id}/${Date.now()}-${randomUUID()}.${extension}`;

    const { data: uploadData, error: uploadError } = await db.storage
      .from("inspection-evidence")
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error("[POST /api/inspections/:id/media] upload error:", uploadError);
      return NextResponse.json({ error: "Echec upload media" }, { status: 500 });
    }

    const capturedAtDeviceRaw = formData.get("capturedAtDevice");
    const capturedAtDevice =
      typeof capturedAtDeviceRaw === "string" && capturedAtDeviceRaw.trim().length > 0
        ? capturedAtDeviceRaw.trim()
        : null;

    const geoLat = parseOptionalNumber(formData.get("geoLat"));
    const geoLng = parseOptionalNumber(formData.get("geoLng"));
    const geoAccuracyM = parseOptionalNumber(formData.get("geoAccuracyM"));
    const exifMetadata = parseOptionalJsonObject(formData.get("exifMetadata"));
    const deviceMetadata = parseOptionalJsonObject(formData.get("deviceMetadata"));

    const { data: insertedMedia, error: insertError } = await dbAny
      .from("inspection_media")
      .insert({
        inspection_id: id,
        checklist_item_id: checklistItemId,
        media_type: mediaType,
        storage_bucket: "inspection-evidence",
        storage_path: uploadData.path,
        mime_type: mimeType,
        file_size_bytes: file.size,
        sha256,
        captured_at_device: capturedAtDevice,
        geo_lat: geoLat,
        geo_lng: geoLng,
        geo_accuracy_m: geoAccuracyM,
        exif_metadata: exifMetadata as Json,
        device_metadata: deviceMetadata as Json,
        created_by_profile_id: userId,
      })
      .select("*")
      .maybeSingle();

    if (insertError || !insertedMedia) {
      console.error("[POST /api/inspections/:id/media] insert error:", insertError);
      await db.storage.from("inspection-evidence").remove([uploadData.path]);
      return NextResponse.json({ error: "Media uploade mais non enregistre" }, { status: 500 });
    }

    await dbAny.from("inspection_events").insert({
      inspection_id: id,
      actor_profile_id: userId,
      event_type: "media_added",
      payload: {
        mediaId: insertedMedia.id,
        mediaType,
        checklistItemId,
      } as Json,
    });

    return NextResponse.json(insertedMedia, { status: 201 });
  } catch (err) {
    console.error("[POST /api/inspections/:id/media] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
