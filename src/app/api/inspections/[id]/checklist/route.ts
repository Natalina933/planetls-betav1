import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase";
import { dbAny, isUuidLike } from "../../shared";

const checklistItemSchema = z.object({
  zoneKey: z.string().trim().min(1).max(120),
  itemKey: z.string().trim().min(1).max(160),
  itemLabel: z.string().trim().min(1).max(180),
  itemStatus: z.enum(["ok", "issue", "na"]),
  severity: z.enum(["minor", "major", "critical"]).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const putChecklistSchema = z.object({
  items: z.array(checklistItemSchema).min(1).max(400),
  replace: z.boolean().optional().default(false),
});

export async function PUT(
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

    const rawBody: unknown = await req.json();
    const parsedBody = putChecklistSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const body = parsedBody.data;

    const { data: inspection, error: inspectionError } = await dbAny
      .from("checkout_inspections")
      .select("id, concierge_profile_id, status")
      .eq("id", id)
      .maybeSingle();

    if (inspectionError) {
      console.error("[PUT /api/inspections/:id/checklist] inspection load error:", inspectionError);
      return NextResponse.json({ error: "Erreur lecture inspection" }, { status: 500 });
    }

    if (!inspection) {
      return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
    }

    if (!isAdmin && inspection.concierge_profile_id !== userId) {
      return NextResponse.json(
        { error: "Seul le concierge assigne peut modifier la checklist." },
        { status: 403 },
      );
    }

    if (!isAdmin && inspection.status !== "draft") {
      return NextResponse.json(
        { error: "Checklist non modifiable apres soumission." },
        { status: 409 },
      );
    }

    const itemKeys = body.items.map((item) => item.itemKey);
    const uniqueItemKeys = new Set(itemKeys);
    if (uniqueItemKeys.size !== itemKeys.length) {
      return NextResponse.json({ error: "itemKey duplique dans la requete." }, { status: 400 });
    }

    const upsertRows = body.items.map((item) => ({
      inspection_id: id,
      zone_key: item.zoneKey,
      item_key: item.itemKey,
      item_label: item.itemLabel,
      item_status: item.itemStatus,
      severity: item.severity ?? null,
      notes: item.notes ?? null,
      metadata:
        item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
          ? (item.metadata as Json)
          : ({} as Json),
    }));

    const { data: upserted, error: upsertError } = await dbAny
      .from("checkout_checklist_items")
      .upsert(upsertRows, { onConflict: "inspection_id,item_key" })
      .select("*");

    if (upsertError) {
      console.error("[PUT /api/inspections/:id/checklist] upsert error:", upsertError);
      return NextResponse.json({ error: "Erreur mise a jour checklist" }, { status: 500 });
    }

    if (body.replace) {
      const { data: existingRows, error: existingError } = await dbAny
        .from("checkout_checklist_items")
        .select("id, item_key")
        .eq("inspection_id", id);

      if (existingError) {
        console.error("[PUT /api/inspections/:id/checklist] replace load error:", existingError);
      } else {
        const idsToDelete = (existingRows ?? [])
          .filter((row: { id: string; item_key: string }) => !uniqueItemKeys.has(row.item_key))
          .map((row: { id: string }) => row.id);

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await dbAny
            .from("checkout_checklist_items")
            .delete()
            .in("id", idsToDelete);

          if (deleteError) {
            console.error("[PUT /api/inspections/:id/checklist] replace delete error:", deleteError);
          }
        }
      }
    }

    await dbAny.from("inspection_events").insert({
      inspection_id: id,
      actor_profile_id: userId,
      event_type: "checklist_upserted",
      payload: {
        count: body.items.length,
        replace: body.replace,
      } as Json,
    });

    return NextResponse.json({
      items: upserted ?? [],
      count: (upserted ?? []).length,
    });
  } catch (err) {
    console.error("[PUT /api/inspections/:id/checklist] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
