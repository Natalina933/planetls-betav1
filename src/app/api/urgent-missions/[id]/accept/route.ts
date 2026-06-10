import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
// Legacy Supabase typing is incomplete on urgent mission tables in this project.
const dbAny = asLooseSupabaseClient(db);

function toMetadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!CONCIERGE_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { id } = await params;
    const { data: mission, error: readError } = await dbAny
      .from("urgent_missions")
      .select("*")
      .eq("id", id)
      .single();

    if (readError || !mission) {
      return NextResponse.json({ error: "Mission urgente introuvable" }, { status: 404 });
    }
    if (mission.status !== "open") {
      return NextResponse.json({ error: "Cette mission est deja verrouillee" }, { status: 409 });
    }

    const acceptedAt = new Date().toISOString();
    const { data: updatedMission, error: updateError } = await dbAny
      .from("urgent_missions")
      .update({
        status: "accepted",
        accepted_by: auth.userId,
        accepted_at: acceptedAt,
        payment_status: mission.payment_status === "pending" ? "authorized" : mission.payment_status,
      })
      .eq("id", id)
      .eq("status", "open")
      .select("*")
      .single();

    if (updateError || !updatedMission) {
      return NextResponse.json(
        { error: "La mission vient d'etre prise par un autre concierge" },
        { status: 409 },
      );
    }

    const existingMetadata = toMetadataRecord(mission.metadata);
    let linkedMissionId =
      typeof existingMetadata.linked_mission_id === "string" ? existingMetadata.linked_mission_id : null;

    if (!linkedMissionId) {
      const { data: createdMission, error: missionCreateError } = await dbAny
        .from("missions")
        .insert({
          concierge_profile_id: auth.userId,
          owner_profile_id: typeof mission.owner_id === "string" ? mission.owner_id : null,
          property_id: null,
          service_id: null,
          title: mission.title || "Mission urgente",
          description: mission.special_instructions || null,
          status: "accepted",
          priority: "urgent",
          amount: typeof mission.price === "number" ? mission.price : null,
          currency: "EUR",
          scheduled_start: mission.scheduled_at || null,
          scheduled_end: null,
          metadata: {
            mission_kind: "urgent",
            urgent_mission_id: mission.id,
            mission_type: mission.mission_type,
            property_address: mission.property_address,
            traveler_count: mission.traveler_count,
            spoken_language: mission.spoken_language,
            key_handover_type: mission.key_handover_type,
            contact_phone: mission.contact_phone,
            contact_email: mission.contact_email,
            payment_status: updatedMission.payment_status,
          },
        })
        .select("id")
        .single<{ id: string }>();

      if (missionCreateError) {
        console.error("[urgent accept] linked mission create error:", missionCreateError);
      } else {
        linkedMissionId = createdMission?.id ?? null;
        if (linkedMissionId) {
          await dbAny
            .from("urgent_missions")
            .update({
              metadata: {
                ...existingMetadata,
                linked_mission_id: linkedMissionId,
                linked_at: acceptedAt,
              },
            })
            .eq("id", id);

          await dbAny.from("mission_events").insert({
            mission_id: linkedMissionId,
            actor_profile_id: auth.userId,
            event_type: "accepted",
            payload: {
              urgent_mission_id: mission.id,
              source: "urgent_missions",
            },
          });
        }
      }
    }

    if (mission.owner_id) {
      const { data: existingConversation } = await dbAny
        .from("contact_conversations")
        .select("id")
        .eq("owner_profile_id", mission.owner_id)
        .eq("concierge_profile_id", auth.userId)
        .eq("source", "mission")
        .eq("source_reference", linkedMissionId || mission.id)
        .limit(1);

      let conversationId = existingConversation?.[0]?.id ?? null;

      if (!conversationId) {
        const { data: conversation } = await dbAny
          .from("contact_conversations")
          .insert({
            owner_profile_id: mission.owner_id,
            concierge_profile_id: auth.userId,
            source: "mission",
            source_reference: linkedMissionId || mission.id,
            subject: mission.title,
            metadata: {
              urgent_mission: true,
              urgent_mission_id: mission.id,
              mission_id: linkedMissionId,
              payment_status: updatedMission.payment_status,
            },
          })
          .select("id")
          .single();

        conversationId = conversation?.id ?? null;
      }

      if (conversationId) {
        await dbAny.from("contact_messages").insert({
          conversation_id: conversationId,
          sender_profile_id: auth.userId,
          message_type: "text",
          body: "Mission urgente acceptee. Je suis disponible pour intervenir et echanger sur les details.",
          metadata: {
            urgent_mission: true,
            urgent_mission_id: mission.id,
            mission_id: linkedMissionId || mission.id,
          },
        });
      }
    }

    return NextResponse.json({ mission: updatedMission, linked_mission_id: linkedMissionId });
  } catch (err) {
    console.error("[POST /api/urgent-missions/[id]/accept] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
