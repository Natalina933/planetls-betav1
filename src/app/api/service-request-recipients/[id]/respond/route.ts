import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { assertRequestOpen, OPEN_REQUEST_STATUSES, RequestCommercialError, commercialObjectId } from "@/features/concierge-commercial/server/requestCommercialGuard";
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

async function syncResponseState(requestId: string) {
  const { data, error } = await dbAny.from("service_request_recipients").select("status").eq("service_request_id", requestId);
  if (error) throw new Error("Synchronisation indisponible");
  const status = deriveServiceRequestStatus((data ?? []).map((row: { status: ServiceRequestRecipientStatus }) => row.status), null);
  const { error: updateError } = await dbAny.from("service_requests").update({ status }).eq("id", requestId)
    .is("selected_concierge_profile_id", null).in("status", OPEN_REQUEST_STATUSES);
  if (updateError) throw new Error("Synchronisation indisponible");
}

async function notifyOwnerAboutResponse(input: {
  ownerProfileId?: string | null;
  conciergeProfileId: string;
  serviceRequestId: string;
  recipientId: string;
  actorProfileId: string;
  status: RecipientStatus;
  message?: string | null;
  responseKey: string;
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

  const { data: existingConversation, error: readError } = await dbAny
    .from("contact_conversations")
    .select("id")
    .eq("owner_profile_id", input.ownerProfileId)
    .eq("concierge_profile_id", input.conciergeProfileId)
    .in("source", ["service_request", "search"])
    .eq("source_reference", input.serviceRequestId)
    .limit(1);
  if (readError) throw new Error("Impossible de vérifier la conversation.");

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
      throw new Error("Impossible de créer la conversation.");
    }
    conversationId = createdConversation?.id ?? null;
  }

  if (!conversationId || input.status === "viewed") return conversationId;

  const { error: messageError } = await dbAny.from("contact_messages").insert({
    id: commercialObjectId(`response/${input.responseKey}`),
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
  if (messageError && messageError.code !== "23505") throw new Error("Impossible d'enregistrer le message de réponse.");

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
    const { data: parent, error: parentError } = await dbAny.from("service_requests").select("*")
      .eq("id", recipient.service_request_id).maybeSingle();
    if (parentError) return NextResponse.json({ error: "Impossible de vérifier la demande." }, { status: 500 });
    if (!parent) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    // A terminal decline can only be replayed; it can never reopen the invitation.
    const message = typeof body.response_message === "string" ? body.response_message.trim() || null : null;
    const date = typeof body.proposed_date === "string" ? body.proposed_date.trim() || null : null;
    const sameResponse = recipient.status === nextStatus &&
      (recipient.response_message ?? null) === message && (recipient.proposed_date ?? null) === (nextStatus === "date_proposed" ? date : null);
    if (!(sameResponse && nextStatus === "declined")) assertRequestOpen(parent, recipient);
    if (sameResponse || (nextStatus === "viewed" && recipient.status !== "sent")) {
      try {
        await syncResponseState(recipient.service_request_id);
        await notifyOwnerAboutResponse({ ownerProfileId: parent.owner_profile_id, conciergeProfileId: userId,
          serviceRequestId: recipient.service_request_id, recipientId: recipient.id, actorProfileId: userId,
          status: nextStatus, message, responseKey: `${recipient.id}/${recipient.responded_at ?? recipient.viewed_at ?? "viewed"}` });
      } catch {
        return NextResponse.json({ recipient, reused: true, delivery_pending: true,
          error: "La réponse est conservée mais sa transmission reste à reprendre." }, { status: 202 });
      }
      return NextResponse.json({ recipient, reused: true });
    }
    if (nextStatus === "quoted") return NextResponse.json({ error: "Envoyez un devis pour déclarer une proposition chiffrée." }, { status: 400 });
    if (recipient.status === "quoted") return NextResponse.json({ error: "Un devis est déjà envoyé. Utilisez le parcours du devis pour le modifier ou le retirer." }, { status: 409 });
    if (nextStatus === "date_proposed" && (!date || !Number.isFinite(Date.parse(date)))) {
      return NextResponse.json({ error: "Indiquez une date valide." }, { status: 400 });
    }
    if (nextStatus === "information_requested" && !message) return NextResponse.json({ error: "Précisez les informations demandées." }, { status: 400 });

    const previousTime = Date.parse(recipient.responded_at ?? "");
    const nowIso = new Date(Math.max(Date.now(), Number.isFinite(previousTime) ? previousTime + 1 : 0)).toISOString();
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
      metadata: { ...(recipient.metadata ?? {}), response_history: [
        ...(Array.isArray(recipient.metadata?.response_history) ? recipient.metadata.response_history : []),
        { status: nextStatus, response_message: message, proposed_date: nextStatus === "date_proposed" ? date : null, at: nowIso },
      ] },
    };

    if (nextStatus === "viewed" && !recipient.viewed_at) {
      updatePayload.viewed_at = nowIso;
    }

    let recipientUpdate = dbAny
      .from("service_request_recipients")
      .update(updatePayload)
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .eq("status", recipient.status);
    recipientUpdate = recipient.responded_at ? recipientUpdate.eq("responded_at", recipient.responded_at) : recipientUpdate.is("responded_at", null);
    const { data: updatedRecipient, error: updateError } = await recipientUpdate.select("*").maybeSingle();

    if (!updateError && !updatedRecipient) return NextResponse.json({ error: "L'invitation a changé. Rechargez la demande." }, { status: 409 });
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
      return NextResponse.json({ recipient: updatedRecipient, synchronization_pending: true,
        error: "La réponse est enregistrée mais la demande doit être resynchronisée. Répétez la même réponse." }, { status: 202 });
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
        return NextResponse.json({ recipient: updatedRecipient, synchronization_pending: true,
          error: "La réponse est enregistrée mais son suivi reste incomplet. Répétez la même réponse." }, { status: 202 });
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
          .eq("id", updatedRecipient.service_request_id)
          .is("selected_concierge_profile_id", null)
          .in("status", OPEN_REQUEST_STATUSES);

        if (requestUpdateError) {
          console.error(
            "[POST /api/service-request-recipients/[id]/respond] request update error:",
            requestUpdateError,
          );
          return NextResponse.json({ recipient: updatedRecipient, synchronization_pending: true,
            error: "La réponse est enregistrée mais la demande doit être resynchronisée. Répétez la même réponse." }, { status: 202 });
        }

        try { await notifyOwnerAboutResponse({
          ownerProfileId: requestRow.owner_profile_id,
          conciergeProfileId: userId,
          serviceRequestId: updatedRecipient.service_request_id,
          recipientId: updatedRecipient.id,
          actorProfileId: userId,
          status: nextStatus,
          message: updatePayload.response_message as string | null,
          responseKey: `${updatedRecipient.id}/${updatedRecipient.responded_at ?? updatedRecipient.viewed_at}`,
        }); } catch {
          return NextResponse.json({ recipient: updatedRecipient, delivery_pending: true,
            error: "La réponse est enregistrée mais son message reste à transmettre. Répétez la même réponse pour reprendre." }, { status: 202 });
        }

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
    if (err instanceof RequestCommercialError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/service-request-recipients/[id]/respond] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
