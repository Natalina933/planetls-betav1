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

const mapMissionInsertError = (error: { code?: string; message?: string; details?: string } | null) => {
  const code = error?.code ?? "";

  if (code === "23503") {
    return "Impossible de créer la mission car un lien associé n'est plus valide. Vérifiez le logement ou recréez la demande.";
  }

  if (code === "22P02") {
    return "Impossible de créer la mission car une date ou un identifiant est invalide.";
  }

  if (code === "23514") {
    return "Impossible de créer la mission car un statut ou une priorité est invalide.";
  }

  if (process.env.NODE_ENV !== "production" && error?.message) {
    return `Impossible de créer la mission. ${error.message}`;
  }

  return "Impossible de créer la mission.";
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!OWNER_ROLES.has(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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

    if (
      typeof selectedRecipient.concierge_profile_id !== "string" ||
      !selectedRecipient.concierge_profile_id.trim()
    ) {
      return NextResponse.json(
        { error: "Impossible de sélectionner ce concierge car son profil est incomplet." },
        { status: 400 },
      );
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

    const nextMetadata = isRecord(requestRow.metadata) ? { ...requestRow.metadata } : {};
    const existingMissionId =
      typeof nextMetadata.selected_mission_id === "string" ? nextMetadata.selected_mission_id : "";

    let missionRow = null;
    let safePropertyId: string | null = null;

    if (typeof requestRow.property_id === "string" && requestRow.property_id.trim()) {
      const { data: propertyRow, error: propertyError } = await db
        .from("properties")
        .select("id")
        .eq("id", requestRow.property_id)
        .eq("owner_id", requestRow.owner_profile_id ?? userId)
        .maybeSingle();

      if (propertyError) {
        console.error("[service-requests/select] property lookup error:", propertyError);
      } else if (propertyRow?.id) {
        safePropertyId = propertyRow.id;
      } else {
        console.warn(
          "[service-requests/select] property missing for mission creation, fallback to null:",
          requestRow.property_id,
        );
      }
    }

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
          property_id: safePropertyId,
          service_id: null,
          title: requestRow.title ?? "Mission issue d'une demande",
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
            request_description: requestRow.description ?? null,
          },
        })
        .select("id, title, status, concierge_profile_id, owner_profile_id")
        .single();

      if (missionError || !createdMission) {
        console.error("[service-requests/select] mission create error:", missionError);
        return NextResponse.json({ error: mapMissionInsertError(missionError) }, { status: 500 });
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
      return NextResponse.json({ error: "Impossible de finaliser la sélection." }, { status: 500 });
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
