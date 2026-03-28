import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import {
  deriveServiceRequestStatus,
  type ServiceRequestRecipientStatus,
} from "@/server/service-requests/workflow";

type RecipientStatus =
  | "viewed"
  | "interested"
  | "quoted"
  | "declined";

interface RespondBody {
  status?: RecipientStatus;
  response_message?: string | null;
}

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
const VALID_STATUSES: RecipientStatus[] = ["viewed", "interested", "quoted", "declined"];
// Legacy Supabase typing is incomplete on these tables in this project.
// Keep the cast local instead of spreading `any` through the whole handler.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!CONCIERGE_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

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
      .select("*")
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .maybeSingle();

    if (recipientError) {
      console.error("[POST /api/service-request-recipients/[id]/respond] read error:", recipientError);
      return NextResponse.json({ error: "Impossible de charger cette demande." }, { status: 500 });
    }

    if (!recipient) {
      return NextResponse.json({ error: "Demande destinataire introuvable." }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      response_message:
        typeof body.response_message === "string" ? body.response_message.trim() || null : null,
      responded_at: nextStatus === "interested" || nextStatus === "quoted" || nextStatus === "declined" ? nowIso : recipient.responded_at,
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

    const { data: relatedRecipients, error: relatedRecipientsError } = await dbAny
      .from("service_request_recipients")
      .select("status")
      .eq("service_request_id", updatedRecipient.service_request_id);

    if (relatedRecipientsError) {
      console.error(
        "[POST /api/service-request-recipients/[id]/respond] related recipients error:",
        relatedRecipientsError,
      );
    } else {
      const { data: requestRow, error: requestRowError } = await dbAny
        .from("service_requests")
        .select("id, selected_concierge_profile_id")
        .eq("id", updatedRecipient.service_request_id)
        .maybeSingle();

      if (requestRowError) {
        console.error(
          "[POST /api/service-request-recipients/[id]/respond] request read error:",
          requestRowError,
        );
      } else if (requestRow) {
        const requestStatus = deriveServiceRequestStatus(
          Array.isArray(relatedRecipients)
            ? relatedRecipients
                .map((row: { status?: string | null }) => row.status)
                .filter((status): status is ServiceRequestRecipientStatus => typeof status === "string")
            : [],
          typeof requestRow.selected_concierge_profile_id === "string"
            ? requestRow.selected_concierge_profile_id
            : null,
        );

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
    }

    return NextResponse.json({ recipient: updatedRecipient });
  } catch (err) {
    console.error("[POST /api/service-request-recipients/[id]/respond] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
