import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase";
import { DISPUTE_TYPES, dbAny, isMissingRelationError, isUuidLike, parseLimit } from "../inspections/shared";

const createDisputeSchema = z.object({
  inspectionId: z.string().uuid(),
  disputeType: z.enum(DISPUTE_TYPES),
  title: z.string().trim().min(3).max(180).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  estimatedAmount: z.coerce.number().nonnegative().max(100000000).optional().nullable(),
  currency: z.string().trim().min(3).max(8).optional().nullable(),
  evidence: z
    .object({
      mediaIds: z.array(z.string().uuid()).max(200).optional(),
      checklistItemIds: z.array(z.string().uuid()).max(200).optional(),
    })
    .optional(),
});

function toUnique(values: string[] | undefined): string[] {
  return Array.from(new Set(values ?? []));
}

export async function GET(req: NextRequest) {
  try {
    const { userId, isAdmin } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get("limit"), 30);
    const status = (url.searchParams.get("status") ?? "").trim();
    const housingIdRaw = (url.searchParams.get("housingId") ?? "").trim();

    const housingId = housingIdRaw ? Number(housingIdRaw) : null;
    if (housingIdRaw && (!Number.isFinite(housingId) || (housingId ?? 0) <= 0)) {
      return NextResponse.json({ error: "housingId invalide" }, { status: 400 });
    }

    let query = dbAny.from("damage_disputes").select("*").order("created_at", { ascending: false }).limit(limit);

    if (!isAdmin) {
      query = query.or(`owner_profile_id.eq.${userId},concierge_profile_id.eq.${userId}`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (housingId) {
      query = query.eq("housing_id", housingId);
    }

    const { data: disputes, error } = await query;
    if (error) {
      console.error("[GET /api/disputes] DB error:", error);
      if (isMissingRelationError(error)) {
        return NextResponse.json(
          {
            error:
              "Module litiges non actif: executez la migration 20260312_checkout_inspections_disputes_core.sql.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Erreur lecture litiges" }, { status: 500 });
    }

    const disputeRows = Array.isArray(disputes) ? disputes : [];
    if (disputeRows.length === 0) {
      return NextResponse.json([]);
    }

    const housingIds = Array.from(
      new Set(
        disputeRows
          .map((row: { housing_id?: number | null }) => row.housing_id)
          .filter((value: unknown): value is number => typeof value === "number" && Number.isFinite(value)),
      ),
    );

    const disputeIds = disputeRows.map((row: { id: string }) => row.id);

    const [housingResp, evidenceResp] = await Promise.all([
      dbAny
        .from("housing")
        .select("id, nom_logement, ville")
        .in("id", housingIds.length > 0 ? housingIds : [-1]),
      dbAny
        .from("dispute_evidence_links")
        .select("dispute_id")
        .in("dispute_id", disputeIds.length > 0 ? disputeIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const housingById = new Map<number, { nom_logement?: string | null; ville?: string | null }>();
    (housingResp.data ?? []).forEach(
      (row: { id: number; nom_logement?: string | null; ville?: string | null }) => {
        housingById.set(row.id, row);
      },
    );

    const evidenceCountByDisputeId = new Map<string, number>();
    (evidenceResp.data ?? []).forEach((row: { dispute_id: string }) => {
      evidenceCountByDisputeId.set(row.dispute_id, (evidenceCountByDisputeId.get(row.dispute_id) ?? 0) + 1);
    });

    const items = disputeRows.map((row: { id: string; housing_id?: number | null }) => {
      const housing = typeof row.housing_id === "number" ? housingById.get(row.housing_id) : null;

      return {
        ...row,
        housing_name: housing?.nom_logement ?? null,
        housing_city: housing?.ville ?? null,
        evidence_count: evidenceCountByDisputeId.get(row.id) ?? 0,
      };
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("[GET /api/disputes] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, isAdmin } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = createDisputeSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const body = parsedBody.data;

    const { data: inspection, error: inspectionError } = await dbAny
      .from("checkout_inspections")
      .select("*")
      .eq("id", body.inspectionId)
      .maybeSingle();

    if (inspectionError) {
      console.error("[POST /api/disputes] inspection load error:", inspectionError);
      if (isMissingRelationError(inspectionError)) {
        return NextResponse.json(
          {
            error:
              "Module litiges non actif: executez la migration 20260312_checkout_inspections_disputes_core.sql.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Erreur lecture inspection" }, { status: 500 });
    }

    if (!inspection) {
      return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
    }

    const isOwner = inspection.owner_profile_id === userId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Seul le proprietaire peut ouvrir un litige." }, { status: 403 });
    }

    const now = Date.now();
    const baseDateString = inspection.checkout_at || inspection.submitted_at || inspection.created_at;
    const baseDate = baseDateString ? new Date(baseDateString).getTime() : Number.NaN;
    const disputeWindowMs = 48 * 60 * 60 * 1000;

    if (!isAdmin && Number.isFinite(baseDate) && now > baseDate + disputeWindowMs) {
      return NextResponse.json(
        { error: "Delai depasse: litige autorise jusqu'a 48h apres le checkout." },
        { status: 400 },
      );
    }

    const mediaIds = toUnique(body.evidence?.mediaIds);
    const checklistItemIds = toUnique(body.evidence?.checklistItemIds);

    if (mediaIds.length > 0) {
      const { data: validMedia, error: mediaError } = await dbAny
        .from("inspection_media")
        .select("id")
        .eq("inspection_id", body.inspectionId)
        .in("id", mediaIds);

      if (mediaError) {
        console.error("[POST /api/disputes] media validation error:", mediaError);
        return NextResponse.json({ error: "Erreur validation medias" }, { status: 500 });
      }

      if ((validMedia ?? []).length !== mediaIds.length) {
        return NextResponse.json({ error: "Un ou plusieurs mediaIds sont invalides." }, { status: 400 });
      }
    }

    if (checklistItemIds.length > 0) {
      const { data: validChecklist, error: checklistError } = await dbAny
        .from("checkout_checklist_items")
        .select("id")
        .eq("inspection_id", body.inspectionId)
        .in("id", checklistItemIds);

      if (checklistError) {
        console.error("[POST /api/disputes] checklist validation error:", checklistError);
        return NextResponse.json({ error: "Erreur validation checklist" }, { status: 500 });
      }

      if ((validChecklist ?? []).length !== checklistItemIds.length) {
        return NextResponse.json(
          { error: "Un ou plusieurs checklistItemIds sont invalides." },
          { status: 400 },
        );
      }
    }

    const title = body.title?.trim() || `Litige ${body.disputeType} - inspection ${body.inspectionId.slice(0, 8)}`;
    const currency = (body.currency ?? "EUR").trim().toUpperCase();

    const { data: createdDispute, error: disputeError } = await dbAny
      .from("damage_disputes")
      .insert({
        inspection_id: body.inspectionId,
        housing_id: inspection.housing_id,
        owner_profile_id: inspection.owner_profile_id,
        concierge_profile_id: inspection.concierge_profile_id,
        opened_by_profile_id: userId,
        dispute_type: body.disputeType,
        title,
        description: body.description ?? null,
        estimated_amount: body.estimatedAmount ?? null,
        currency,
        status: "open",
        metadata: {
          source: "api",
        } as Json,
      })
      .select("*")
      .maybeSingle();

    if (disputeError || !createdDispute) {
      console.error("[POST /api/disputes] create dispute error:", disputeError);
      return NextResponse.json({ error: "Erreur creation litige" }, { status: 500 });
    }

    const evidenceRows = [
      ...mediaIds.map((mediaId) => ({
        dispute_id: createdDispute.id,
        media_id: mediaId,
      })),
      ...checklistItemIds.map((checklistItemId) => ({
        dispute_id: createdDispute.id,
        checklist_item_id: checklistItemId,
      })),
    ];

    if (evidenceRows.length > 0) {
      const { error: evidenceError } = await dbAny.from("dispute_evidence_links").insert(evidenceRows);
      if (evidenceError) {
        console.error("[POST /api/disputes] evidence insert error:", evidenceError);
        return NextResponse.json({ error: "Litige cree mais preuves non liees" }, { status: 500 });
      }
    }

    await dbAny
      .from("checkout_inspections")
      .update({ status: "dispute_opened" })
      .eq("id", body.inspectionId)
      .neq("status", "closed");

    await dbAny.from("inspection_events").insert({
      inspection_id: body.inspectionId,
      actor_profile_id: userId,
      event_type: "dispute_opened",
      payload: {
        disputeId: createdDispute.id,
        evidenceCount: evidenceRows.length,
      } as Json,
    });

    return NextResponse.json(
      {
        dispute: createdDispute,
        linkedEvidenceCount: evidenceRows.length,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/disputes] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
