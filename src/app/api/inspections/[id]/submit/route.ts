import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase";
import { canAccessInspection, dbAny, isUuidLike } from "../../shared";

const submitSchema = z.object({
  signatureName: z.string().trim().min(2).max(160),
  signatureAccepted: z.literal(true),
  clientTimestamp: z.string().datetime({ offset: true }).optional(),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

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

    const rawBody: unknown = await req.json();
    const parsedBody = submitSchema.safeParse(rawBody);
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
      console.error("[POST /api/inspections/:id/submit] load error:", inspectionError);
      return NextResponse.json({ error: "Erreur lecture inspection" }, { status: 500 });
    }

    if (!inspection) {
      return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
    }

    if (!isAdmin && !canAccessInspection(userId, inspection)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    if (!isAdmin && inspection.concierge_profile_id !== userId) {
      return NextResponse.json({ error: "Seul le concierge assigne peut soumettre." }, { status: 403 });
    }

    if (inspection.status !== "draft") {
      return NextResponse.json({ error: "Inspection deja soumise ou cloturee." }, { status: 409 });
    }

    const currentMetadata = isRecord(inspection.metadata) ? inspection.metadata : {};
    const submissionMetadata = {
      ...currentMetadata,
      submission: {
        clientTimestamp: body.clientTimestamp ?? null,
        submittedBy: userId,
      },
    } as Json;

    const { data: submitted, error: submitError } = await dbAny
      .from("checkout_inspections")
      .update({
        status: "submitted",
        submitted_by_profile_id: userId,
        signature_name: body.signatureName,
        metadata: submissionMetadata,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (submitError || !submitted) {
      console.error("[POST /api/inspections/:id/submit] submit error:", submitError);
      const message =
        typeof submitError?.message === "string"
          ? submitError.message
          : "Erreur soumission inspection";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await dbAny.from("inspection_events").insert({
      inspection_id: id,
      actor_profile_id: userId,
      event_type: "inspection_submitted",
      payload: {
        signatureName: body.signatureName,
        clientTimestamp: body.clientTimestamp ?? null,
      } as Json,
    });

    return NextResponse.json(submitted);
  } catch (err) {
    console.error("[POST /api/inspections/:id/submit] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
