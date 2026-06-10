import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";

const OWNER_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getApiAuthContext(_req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!OWNER_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Devis invalide" }, { status: 400 });
    }

    const dbAny = asLooseSupabaseClient(db);
    const { data: quote, error } = await dbAny
      .from("quotes")
      .select("id, status, owner_profile_id, concierge_profile_id, service_request_id, service_request_recipient_id, metadata")
      .eq("id", id)
      .eq("owner_profile_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[POST /api/quotes/:id/view] read error:", error);
      return NextResponse.json({ error: "Erreur lecture devis" }, { status: 500 });
    }
    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const metadata = isRecord(quote.metadata) ? quote.metadata : {};
    const now = new Date().toISOString();
    const currentViewCount = typeof metadata.view_count === "number" ? metadata.view_count : 0;
    const nextMetadata = {
      ...metadata,
      first_viewed_at: typeof metadata.first_viewed_at === "string" ? metadata.first_viewed_at : now,
      last_viewed_at: now,
      view_count: currentViewCount + 1,
      viewed_by_owner: true,
    };

    const { error: updateError } = await dbAny
      .from("quotes")
      .update({ metadata: nextMetadata })
      .eq("id", id)
      .eq("owner_profile_id", userId);

    if (updateError) {
      console.error("[POST /api/quotes/:id/view] update error:", updateError);
      return NextResponse.json({ error: "Erreur mise a jour devis" }, { status: 500 });
    }

    const serviceRequestId =
      typeof quote.service_request_id === "string"
        ? quote.service_request_id
        : typeof metadata.service_request_id === "string"
          ? metadata.service_request_id
          : null;
    const serviceRequestRecipientId =
      typeof quote.service_request_recipient_id === "string"
        ? quote.service_request_recipient_id
        : typeof metadata.service_request_recipient_id === "string"
          ? metadata.service_request_recipient_id
          : null;

    const event = await recordWorkflowEvent(dbAny, {
      actorProfileId: userId,
      ownerProfileId: quote.owner_profile_id,
      conciergeProfileId: quote.concierge_profile_id,
      serviceRequestId,
      serviceRequestRecipientId,
      quoteId: id,
      eventType: "quote_viewed",
      title: "Devis consulté",
      body: "Le propriétaire a consulté le devis.",
      actionHref: `/dashboard/owner/devis?quote=${id}`,
      serviceRequestStatus: serviceRequestId ? "quoted" : null,
      quoteStatus: quote.status,
      metadata: {
        first_viewed_at: nextMetadata.first_viewed_at,
        last_viewed_at: nextMetadata.last_viewed_at,
        view_count: nextMetadata.view_count,
      },
    });

    return NextResponse.json({
      viewed: true,
      first_viewed_at: nextMetadata.first_viewed_at,
      last_viewed_at: nextMetadata.last_viewed_at,
      view_count: nextMetadata.view_count,
      workflow: event.workflow,
    });
  } catch (err) {
    console.error("[POST /api/quotes/:id/view] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
