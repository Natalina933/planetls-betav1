import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/dbServer";
import { getApiAuthContext } from "@/server/auth/apiAuth";
import { deriveServiceRequestStatus } from "@/server/service-requests/workflow";

interface SelectRequestBody {
  recipient_id?: string;
}

const OWNER_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!OWNER_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 400 });
    }

    const body = (await req.json()) as SelectRequestBody;
    const recipientId = typeof body.recipient_id === "string" ? body.recipient_id.trim() : "";
    if (!recipientId) {
      return NextResponse.json({ error: "recipient_id requis." }, { status: 400 });
    }

    const dbAny = db as any;

    const { data: requestRow, error: requestError } = await dbAny
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .eq("owner_profile_id", userId)
      .maybeSingle();

    if (requestError) {
      console.error("[service-requests/select] request error:", requestError);
      return NextResponse.json({ error: "Impossible de charger la demande." }, { status: 500 });
    }
    if (!requestRow) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    const { data: recipients, error: recipientsError } = await dbAny
      .from("service_request_recipients")
      .select("*")
      .eq("service_request_id", id);

    if (recipientsError) {
      console.error("[service-requests/select] recipients error:", recipientsError);
      return NextResponse.json({ error: "Impossible de charger les destinataires." }, { status: 500 });
    }

    const recipientRows = Array.isArray(recipients) ? recipients : [];
    const selectedRecipient = recipientRows.find((recipient: { id?: string }) => recipient.id === recipientId);

    if (!selectedRecipient) {
      return NextResponse.json({ error: "Destinataire introuvable pour cette demande." }, { status: 404 });
    }

    const recipientStatuses = new Map<string, string>();
    recipientRows.forEach((recipient: { id: string }) => {
      recipientStatuses.set(recipient.id, recipient.id === recipientId ? "selected" : "not_selected");
    });

    await Promise.all(
      recipientRows.map((recipient: { id: string }) =>
        dbAny
          .from("service_request_recipients")
          .update({
            status: recipientStatuses.get(recipient.id),
            responded_at: new Date().toISOString(),
          })
          .eq("id", recipient.id),
      ),
    );

    const nextRequestStatus = deriveServiceRequestStatus(
      Array.from(recipientStatuses.values()) as Array<
        "sent" | "viewed" | "interested" | "quoted" | "declined" | "selected" | "not_selected"
      >,
      selectedRecipient.concierge_profile_id ?? null,
    );

    const nextMetadata = isRecord(requestRow.metadata)
      ? { ...requestRow.metadata }
      : {};

    const existingMissionId =
      typeof nextMetadata.selected_mission_id === "string" ? nextMetadata.selected_mission_id : "";

    let missionRow = null;

    if (existingMissionId) {
      const { data: existingMission } = await db
        .from("missions")
        .select("id, title, status, concierge_profile_id, owner_profile_id")
        .eq("id", existingMissionId)
        .maybeSingle();
      missionRow = existingMission ?? null;
    }

    if (!missionRow) {
      const { data: createdMission, error: missionError } = await db
        .from("missions")
        .insert({
          concierge_profile_id: selectedRecipient.concierge_profile_id,
          owner_profile_id: requestRow.owner_profile_id ?? null,
          property_id: requestRow.property_id ?? null,
          service_id: null,
          title: requestRow.title ?? "Mission issue d'une demande",
          description: requestRow.description ?? null,
          status: "accepted",
          priority: requestRow.urgency ? "urgent" : "normal",
          amount: requestRow.budget_max ?? null,
          currency: requestRow.currency ?? "EUR",
          scheduled_start: requestRow.desired_date ?? null,
          scheduled_end: null,
          metadata: {
            source: "service_request",
            service_request_id: requestRow.id,
            service_request_recipient_id: selectedRecipient.id,
            requested_services: Array.isArray(requestRow.requested_services)
              ? requestRow.requested_services
              : [],
          },
        })
        .select("id, title, status, concierge_profile_id, owner_profile_id")
        .single();

      if (missionError || !createdMission) {
        console.error("[service-requests/select] mission create error:", missionError);
        return NextResponse.json({ error: "Impossible de creer la mission." }, { status: 500 });
      }

      missionRow = createdMission;

      const { error: eventError } = await db.from("mission_events").insert({
        mission_id: createdMission.id,
        actor_profile_id: userId,
        event_type: "created",
        payload: {
          source: "service_request",
          service_request_id: requestRow.id,
          service_request_recipient_id: selectedRecipient.id,
        },
      });

      if (eventError) {
        console.error("[service-requests/select] mission event error:", eventError);
      }
    }

    const updatedMetadata = {
      ...nextMetadata,
      selected_at: new Date().toISOString(),
      selected_recipient_id: selectedRecipient.id,
      selected_mission_id: missionRow?.id ?? null,
    };

    const { data: updatedRequest, error: updateRequestError } = await dbAny
      .from("service_requests")
      .update({
        selected_concierge_profile_id: selectedRecipient.concierge_profile_id,
        status: nextRequestStatus,
        metadata: updatedMetadata,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateRequestError || !updatedRequest) {
      console.error("[service-requests/select] request update error:", updateRequestError);
      return NextResponse.json({ error: "Impossible de finaliser la selection." }, { status: 500 });
    }

    return NextResponse.json(
      {
        request: updatedRequest,
        selected_recipient_id: selectedRecipient.id,
        mission: missionRow,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[service-requests/select] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
