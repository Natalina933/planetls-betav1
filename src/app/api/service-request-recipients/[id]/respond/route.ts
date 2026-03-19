import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireActor } from "@/app/lib/apiSecurity";

type RecipientStatus =
  | "viewed"
  | "interested"
  | "quoted"
  | "declined";

type RequestStatus =
  | "sent"
  | "in_review"
  | "quoted"
  | "accepted"
  | "closed"
  | "cancelled";

interface RespondBody {
  status?: RecipientStatus;
  response_message?: string | null;
}

type ServiceRequestRow = {
  id: string;
  owner_profile_id: string | null;
  selected_concierge_profile_id: string | null;
  status: string | null;
};

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
const VALID_STATUSES: RecipientStatus[] = ["viewed", "interested", "quoted", "declined"];
// Legacy Supabase typing is incomplete on these tables in this project.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

function mapRequestStatus(status: RecipientStatus): RequestStatus | null {
  if (status === "quoted") return "quoted";
  if (status === "interested" || status === "viewed") return "in_review";
  return null;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "service request recipient respond auth",
      allowedRoles: CONCIERGE_ROLES,
      actionLabel: "repondre a une demande de service",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { actor } = actorResult;
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Recipient introuvable." }, { status: 400 });
    }

    const body = (await req.json()) as RespondBody;
    const nextStatus = VALID_STATUSES.includes(body.status as RecipientStatus)
      ? (body.status as RecipientStatus)
      : null;

    if (!nextStatus) {
      return NextResponse.json({ error: "Statut de reponse invalide." }, { status: 400 });
    }

    const { data: recipient, error: recipientError } = await dbAny
      .from("service_request_recipients")
      .select("id, service_request_id, concierge_profile_id, status, viewed_at, responded_at")
      .eq("id", id)
      .maybeSingle();

    if (recipientError) {
      console.error("[POST /api/service-request-recipients/[id]/respond] read error:", recipientError);
      return NextResponse.json({ error: "Impossible de charger cette demande." }, { status: 500 });
    }

    if (!recipient) {
      return NextResponse.json({ error: "Demande destinataire introuvable." }, { status: 404 });
    }

    if (!actor.isAdmin && recipient.concierge_profile_id !== actor.userId) {
      return NextResponse.json(
        { error: "Vous n'etes pas autorise a repondre a cette demande." },
        { status: 403 },
      );
    }

    const { data: serviceRequest, error: requestError } = await dbAny
      .from("service_requests")
      .select("id, owner_profile_id, selected_concierge_profile_id, status")
      .eq("id", recipient.service_request_id)
      .maybeSingle();

    if (requestError) {
      console.error(
        "[POST /api/service-request-recipients/[id]/respond] request lookup error:",
        requestError,
      );
      return NextResponse.json({ error: "Impossible de charger la demande source." }, { status: 500 });
    }

    if (!serviceRequest) {
      return NextResponse.json({ error: "Demande source introuvable." }, { status: 404 });
    }

    if (serviceRequest.status === "closed" || serviceRequest.status === "cancelled") {
      return NextResponse.json(
        { error: "Cette demande n'accepte plus de reponse." },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      response_message:
        typeof body.response_message === "string" ? body.response_message.trim() || null : null,
      responded_at:
        nextStatus === "interested" || nextStatus === "quoted" || nextStatus === "declined"
          ? nowIso
          : recipient.responded_at,
      viewed_at: nextStatus === "viewed" || recipient.viewed_at ? recipient.viewed_at ?? nowIso : null,
    };

    if (nextStatus === "viewed" && !recipient.viewed_at) {
      updatePayload.viewed_at = nowIso;
    }

    const { data: updatedRecipient, error: updateError } = await dbAny
      .from("service_request_recipients")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updatedRecipient) {
      console.error("[POST /api/service-request-recipients/[id]/respond] update error:", updateError);
      return NextResponse.json({ error: "Impossible de mettre a jour la reponse." }, { status: 500 });
    }

    const requestStatus = mapRequestStatus(nextStatus);
    if (requestStatus) {
      const { error: requestUpdateError } = await dbAny
        .from("service_requests")
        .update({ status: requestStatus })
        .eq("id", updatedRecipient.service_request_id);

      if (requestUpdateError) {
        console.error(
          "[POST /api/service-request-recipients/[id]/respond] request update error:",
          requestUpdateError,
        );
      }
    }

    return NextResponse.json({
      recipient: updatedRecipient,
      request: serviceRequest as ServiceRequestRow,
    });
  } catch (err) {
    console.error("[POST /api/service-request-recipients/[id]/respond] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
