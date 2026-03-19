import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor } from "@/app/lib/apiSecurity";
import type { Json } from "@/types/supabase";
import { canAccessInspection, dbAny, isMissingRelationError, isUuidLike } from "../shared";

const patchInspectionSchema = z.object({
  bookingReference: z.string().trim().max(200).optional().nullable(),
  checkoutAt: z.string().datetime({ offset: true }).optional().nullable(),
  completedAt: z.string().datetime({ offset: true }).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  status: z.enum(["draft", "reviewed", "dispute_opened", "closed"]).optional(),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "inspection detail auth",
      actionLabel: "consulter une inspection",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }
    const { userId, isAdmin } = actorResult.actor;

    const { id } = await params;
    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Inspection invalide" }, { status: 400 });
    }

    const { data: inspection, error: inspectionError } = await dbAny
      .from("checkout_inspections")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (inspectionError) {
      console.error("[GET /api/inspections/:id] inspection error:", inspectionError);
      if (isMissingRelationError(inspectionError)) {
        return NextResponse.json(
          {
            error:
              "Module inspections non active: executez la migration 20260312_checkout_inspections_disputes_core.sql.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Erreur lecture inspection" }, { status: 500 });
    }

    if (!inspection) {
      return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
    }

    if (!isAdmin && !canAccessInspection(userId, inspection)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const [checklistResp, mediaResp, disputesResp, eventsResp] = await Promise.all([
      dbAny
        .from("checkout_checklist_items")
        .select("*")
        .eq("inspection_id", id)
        .order("created_at", { ascending: true }),
      dbAny
        .from("inspection_media")
        .select("*")
        .eq("inspection_id", id)
        .order("created_at", { ascending: true }),
      dbAny
        .from("damage_disputes")
        .select("*")
        .eq("inspection_id", id)
        .order("created_at", { ascending: false }),
      dbAny
        .from("inspection_events")
        .select("*")
        .eq("inspection_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (checklistResp.error || mediaResp.error || disputesResp.error || eventsResp.error) {
      console.error("[GET /api/inspections/:id] child load error:", {
        checklist: checklistResp.error,
        media: mediaResp.error,
        disputes: disputesResp.error,
        events: eventsResp.error,
      });
      return NextResponse.json({ error: "Erreur lecture detail inspection" }, { status: 500 });
    }

    return NextResponse.json({
      inspection,
      checklist: checklistResp.data ?? [],
      media: mediaResp.data ?? [],
      disputes: disputesResp.data ?? [],
      events: eventsResp.data ?? [],
    });
  } catch (err) {
    console.error("[GET /api/inspections/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "inspection update auth",
      actionLabel: "modifier une inspection",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }
    const { userId, isAdmin } = actorResult.actor;

    const { id } = await params;
    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Inspection invalide" }, { status: 400 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = patchInspectionSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const body = parsedBody.data;

    const { data: inspection, error: inspectionError } = await dbAny
      .from("checkout_inspections")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (inspectionError) {
      console.error("[PATCH /api/inspections/:id] load error:", inspectionError);
      return NextResponse.json({ error: "Erreur lecture inspection" }, { status: 500 });
    }

    if (!inspection) {
      return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
    }

    if (!isAdmin && !canAccessInspection(userId, inspection)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const isOwner = inspection.owner_profile_id === userId;
    const isConcierge = inspection.concierge_profile_id === userId;

    if (!isAdmin && isConcierge && inspection.status !== "draft") {
      return NextResponse.json(
        { error: "Inspection non modifiable par le concierge apres soumission." },
        { status: 409 },
      );
    }

    if (!isAdmin && isOwner && body.status && !["reviewed", "dispute_opened", "closed"].includes(body.status)) {
      return NextResponse.json({ error: "Transition de statut non autorisee." }, { status: 400 });
    }

    if (!isAdmin && isOwner && (body.bookingReference !== undefined || body.checkoutAt !== undefined)) {
      return NextResponse.json(
        { error: "Le proprietaire ne peut pas modifier les donnees de collecte concierge." },
        { status: 403 },
      );
    }

    const metadataPatch =
      body.metadata && isRecord(body.metadata) ? (body.metadata as Record<string, unknown>) : null;

    const currentMetadata = isRecord(inspection.metadata) ? inspection.metadata : {};
    const nextMetadata = metadataPatch
      ? ({ ...currentMetadata, ...metadataPatch } as Json)
      : (currentMetadata as Json);

    const updatePayload: Record<string, unknown> = {
      metadata: nextMetadata,
    };

    if (body.bookingReference !== undefined) {
      updatePayload.booking_reference = body.bookingReference;
    }
    if (body.checkoutAt !== undefined) {
      updatePayload.checkout_at = body.checkoutAt;
    }
    if (body.completedAt !== undefined) {
      updatePayload.completed_at = body.completedAt;
    }
    if (body.status !== undefined) {
      updatePayload.status = body.status;
    }

    const { data: updated, error: updateError } = await dbAny
      .from("checkout_inspections")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("[PATCH /api/inspections/:id] update error:", updateError);
      return NextResponse.json({ error: "Erreur mise a jour inspection" }, { status: 500 });
    }

    await dbAny.from("inspection_events").insert({
      inspection_id: id,
      actor_profile_id: userId,
      event_type: "inspection_updated",
      payload: {
        fields: Object.keys(updatePayload),
      } as Json,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/inspections/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
