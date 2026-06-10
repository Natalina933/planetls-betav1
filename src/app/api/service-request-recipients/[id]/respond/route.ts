import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import {
  deriveServiceRequestStatus,
  type ServiceRequestRecipientStatus,
} from "@/server/service-requests/workflow";

type RecipientStatus =
  | "viewed"
  | "interested"
  | "information_requested"
  | "date_proposed"
  | "quoted"
  | "declined";

interface RespondBody {
  status?: RecipientStatus;
  response_message?: string | null;
  proposed_date?: string | null;
}

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
const VALID_STATUSES: RecipientStatus[] = [
  "viewed",
  "interested",
  "information_requested",
  "date_proposed",
  "quoted",
  "declined",
];
// Legacy Supabase typing is incomplete on these tables in this project.
const dbAny = asLooseSupabaseClient(db);

async function notifyOwnerAboutResponse(input: {
  ownerProfileId?: string | null;
  conciergeProfileId: string;
  serviceRequestId: string;
  recipientId: string;
  actorProfileId: string;
  status: RecipientStatus;
  message?: string | null;
}) {
  if (!input.ownerProfileId) return null;

  const subject =
    input.status === "interested"
      ? "Conciergerie intéressée"
      : input.status === "information_requested"
        ? "Précision demandée"
        : input.status === "date_proposed"
          ? "Date proposée"
          : "Réponse à votre demande";
  const body =
    input.message ||
    (input.status === "interested"
      ? "Une conciergerie est intéressée par votre demande. Vous pouvez échanger ou attendre son devis."
      : input.status === "information_requested"
        ? "Une conciergerie demande une précision avant de finaliser sa réponse."
        : input.status === "date_proposed"
          ? "Une conciergerie propose une date alternative pour votre demande."
      : input.status === "declined"
        ? "Une conciergerie a décliné votre demande. Elle sort de votre comparaison active."
        : "Votre demande a été consultée.");

  const { data: existingConversation } = await dbAny
    .from("contact_conversations")
    .select("id")
    .eq("owner_profile_id", input.ownerProfileId)
    .eq("concierge_profile_id", input.conciergeProfileId)
    .eq("source", "service_request")
    .eq("source_reference", input.serviceRequestId)
    .limit(1);

  let conversationId = existingConversation?.[0]?.id ?? null;
  if (!conversationId) {
    const { data: createdConversation, error: conversationError } = await dbAny
      .from("contact_conversations")
      .insert({
        owner_profile_id: input.ownerProfileId,
        concierge_profile_id: input.conciergeProfileId,
        source: "service_request",
        source_reference: input.serviceRequestId,
        subject,
        metadata: {
          service_request_id: input.serviceRequestId,
          service_request_recipient_id: input.recipientId,
          recipient_status: input.status,
        },
      })
      .select("id")
      .single();

    if (conversationError) {
      console.error("[respond] conversation create error:", conversationError);
      return null;
    }
    conversationId = createdConversation?.id ?? null;
  }

  if (!conversationId || input.status === "viewed") return conversationId;

  await dbAny.from("contact_messages").insert({
    conversation_id: conversationId,
    sender_profile_id: input.actorProfileId,
    message_type: "text",
    body,
    metadata: {
      service_request_id: input.serviceRequestId,
      service_request_recipient_id: input.recipientId,
      recipient_status: input.status,
      system_context: "service_request_response",
    },
  });

  return conversationId;
}

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
      proposed_date:
        nextStatus === "date_proposed" && typeof body.proposed_date === "string" && body.proposed_date.trim()
          ? body.proposed_date.trim()
          : null,
      responded_at: nextStatus !== "viewed" ? nowIso : recipient.responded_at,
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
        .select("id, owner_profile_id, selected_concierge_profile_id")
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

        await notifyOwnerAboutResponse({
          ownerProfileId: requestRow.owner_profile_id,
          conciergeProfileId: userId,
          serviceRequestId: updatedRecipient.service_request_id,
          recipientId: updatedRecipient.id,
          actorProfileId: userId,
          status: nextStatus,
          message: updatePayload.response_message as string | null,
        });

        await recordWorkflowEvent(dbAny, {
          actorProfileId: userId,
          ownerProfileId: requestRow.owner_profile_id,
          conciergeProfileId: userId,
          serviceRequestId: updatedRecipient.service_request_id,
          serviceRequestRecipientId: updatedRecipient.id,
          eventType: `service_request_${nextStatus}`,
          title:
            nextStatus === "viewed"
              ? "Demande consultée"
              : nextStatus === "interested"
                ? "Conciergerie intéressée"
                : nextStatus === "information_requested"
                  ? "Précision demandée"
                  : nextStatus === "date_proposed"
                    ? "Date proposée"
                : nextStatus === "declined"
                  ? "Demande refusée"
                  : "Réponse à la demande",
          body:
            (updatePayload.response_message as string | null) ??
            (updatePayload.proposed_date ? `Date proposée : ${String(updatePayload.proposed_date)}` : null),
          actionHref: `/dashboard/concierge/demandes?request=${updatedRecipient.service_request_id}`,
          serviceRequestStatus: requestStatus,
          recipientStatus: nextStatus,
          metadata: {
            response_message_present: Boolean(updatePayload.response_message),
            proposed_date: typeof updatePayload.proposed_date === "string" ? updatePayload.proposed_date : null,
          },
        });
      }
    }

    return NextResponse.json({
      recipient: updatedRecipient,
      completed_action: {
        request_status: nextStatus,
        visible_in: nextStatus === "declined" ? ["demandes_cloturees", "messages"] : ["demandes", "messages"],
      },
    });
  } catch (err) {
    console.error("[POST /api/service-request-recipients/[id]/respond] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
