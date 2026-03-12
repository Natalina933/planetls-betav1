import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase";
import { db } from "@/app/lib/dbServer";
import { dbAny, isUuidLike } from "../../../shared";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> },
) {
  try {
    const { userId, isAdmin } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id, mediaId } = await params;
    if (!isUuidLike(id) || !isUuidLike(mediaId)) {
      return NextResponse.json({ error: "Parametres invalides" }, { status: 400 });
    }

    const { data: inspection, error: inspectionError } = await dbAny
      .from("checkout_inspections")
      .select("id, concierge_profile_id, status")
      .eq("id", id)
      .maybeSingle();

    if (inspectionError) {
      console.error("[DELETE /api/inspections/:id/media/:mediaId] inspection load error:", inspectionError);
      return NextResponse.json({ error: "Erreur lecture inspection" }, { status: 500 });
    }

    if (!inspection) {
      return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
    }

    if (!isAdmin && inspection.concierge_profile_id !== userId) {
      return NextResponse.json(
        { error: "Seul le concierge assigne peut supprimer un media." },
        { status: 403 },
      );
    }

    if (!isAdmin && inspection.status !== "draft") {
      return NextResponse.json(
        { error: "Suppression non autorisee apres soumission." },
        { status: 409 },
      );
    }

    const { data: media, error: mediaError } = await dbAny
      .from("inspection_media")
      .select("id, storage_bucket, storage_path, media_type")
      .eq("id", mediaId)
      .eq("inspection_id", id)
      .maybeSingle();

    if (mediaError) {
      console.error("[DELETE /api/inspections/:id/media/:mediaId] media load error:", mediaError);
      return NextResponse.json({ error: "Erreur lecture media" }, { status: 500 });
    }

    if (!media) {
      return NextResponse.json({ error: "Media introuvable" }, { status: 404 });
    }

    const bucket =
      typeof media.storage_bucket === "string" && media.storage_bucket.trim().length > 0
        ? media.storage_bucket
        : "inspection-evidence";

    const path = typeof media.storage_path === "string" ? media.storage_path : "";

    if (path) {
      const { error: removeStorageError } = await db.storage.from(bucket).remove([path]);
      if (removeStorageError) {
        console.error(
          "[DELETE /api/inspections/:id/media/:mediaId] storage remove error:",
          removeStorageError,
        );
        return NextResponse.json({ error: "Impossible de supprimer le fichier stocke" }, { status: 500 });
      }
    }

    const { error: deleteError } = await dbAny
      .from("inspection_media")
      .delete()
      .eq("id", mediaId)
      .eq("inspection_id", id);

    if (deleteError) {
      console.error("[DELETE /api/inspections/:id/media/:mediaId] delete error:", deleteError);
      return NextResponse.json({ error: "Impossible de supprimer le media" }, { status: 500 });
    }

    await dbAny.from("inspection_events").insert({
      inspection_id: id,
      actor_profile_id: userId,
      event_type: "media_deleted",
      payload: {
        mediaId,
        mediaType: media.media_type,
      } as Json,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/inspections/:id/media/:mediaId] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
