import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor } from "@/app/lib/apiSecurity";
import type { Json } from "@/types/supabase";
import {
  INSPECTION_STATUSES,
  dbAny,
  extractOwnerIdFromHousingProprietaire,
  isMissingRelationError,
  parseLimit,
} from "./shared";

const createInspectionSchema = z.object({
  housingId: z.coerce.number().int().positive(),
  ownerProfileId: z.string().uuid().optional(),
  conciergeProfileId: z.string().uuid(),
  checkoutAt: z.string().datetime({ offset: true }).optional(),
  bookingReference: z.string().trim().max(200).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const allowedStatusValues = new Set<string>(INSPECTION_STATUSES);

export async function GET(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "inspections collection auth",
      actionLabel: "consulter les inspections",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }
    const { userId, isAdmin } = actorResult.actor;

    const url = new URL(req.url);
    const housingIdRaw = url.searchParams.get("housingId");
    const status = (url.searchParams.get("status") ?? "").trim();
    const limit = parseLimit(url.searchParams.get("limit"), 30);

    const housingId = housingIdRaw ? Number(housingIdRaw) : null;
    if (housingIdRaw && (housingId === null || !Number.isFinite(housingId) || housingId <= 0)) {
      return NextResponse.json({ error: "housingId invalide" }, { status: 400 });
    }

    if (status && !allowedStatusValues.has(status)) {
      return NextResponse.json({ error: "status invalide" }, { status: 400 });
    }

    let query = dbAny
      .from("checkout_inspections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!isAdmin) {
      query = query.or(`owner_profile_id.eq.${userId},concierge_profile_id.eq.${userId}`);
    }

    if (housingId) {
      query = query.eq("housing_id", housingId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/inspections] DB error:", error);
      if (isMissingRelationError(error)) {
        return NextResponse.json(
          {
            error:
              "Module inspections non active: executez la migration 20260312_checkout_inspections_disputes_core.sql.",
          },
          { status: 503 },
        );
      }

      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/inspections] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "inspections create auth",
      actionLabel: "creer une inspection",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }
    const { userId, isAdmin } = actorResult.actor;

    const rawBody: unknown = await req.json();
    const parsed = createInspectionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const body = parsed.data;
    if (!isAdmin && body.conciergeProfileId !== userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { data: housing, error: housingError } = await dbAny
      .from("housing")
      .select("id, proprietaire")
      .eq("id", body.housingId)
      .maybeSingle();

    if (housingError) {
      console.error("[POST /api/inspections] housing read error:", housingError);
      return NextResponse.json({ error: "Erreur lecture logement" }, { status: 500 });
    }

    if (!housing) {
      return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
    }

    const ownerFromHousing = extractOwnerIdFromHousingProprietaire(housing.proprietaire);
    const resolvedOwnerProfileId = body.ownerProfileId ?? ownerFromHousing;

    if (!resolvedOwnerProfileId) {
      return NextResponse.json(
        { error: "ownerProfileId manquant (aucun proprietaire detecte sur le logement)." },
        { status: 400 },
      );
    }

    if (ownerFromHousing && body.ownerProfileId && ownerFromHousing !== body.ownerProfileId) {
      return NextResponse.json(
        { error: "ownerProfileId ne correspond pas au proprietaire du logement." },
        { status: 400 },
      );
    }

    const metadata: Json =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Json)
        : {};

    const { data: created, error: createError } = await dbAny
      .from("checkout_inspections")
      .insert({
        housing_id: body.housingId,
        owner_profile_id: resolvedOwnerProfileId,
        concierge_profile_id: body.conciergeProfileId,
        booking_reference: body.bookingReference ?? null,
        checkout_at: body.checkoutAt ?? null,
        status: "draft",
        metadata,
        started_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();

    if (createError || !created) {
      console.error("[POST /api/inspections] create error:", createError);
      if (isMissingRelationError(createError)) {
        return NextResponse.json(
          {
            error:
              "Module inspections non active: executez la migration 20260312_checkout_inspections_disputes_core.sql.",
          },
          { status: 503 },
        );
      }

      return NextResponse.json({ error: "Erreur creation inspection" }, { status: 500 });
    }

    await dbAny.from("inspection_events").insert({
      inspection_id: created.id,
      actor_profile_id: userId,
      event_type: "inspection_created",
      payload: { source: "api" } as Json,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/inspections] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
