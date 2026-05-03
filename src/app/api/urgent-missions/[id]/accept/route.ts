import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
// Legacy Supabase typing is incomplete on urgent mission tables in this project.
const dbAny = asLooseSupabaseClient(db);

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

    if (mission.owner_id) {
      const { data: existingConversation } = await dbAny
        .from("contact_conversations")
        .select("id")
        .eq("owner_profile_id", mission.owner_id)
        .eq("concierge_profile_id", auth.userId)
        .eq("source", "mission")
        .eq("source_reference", mission.id)
        .limit(1);

      let conversationId = existingConversation?.[0]?.id ?? null;

      if (!conversationId) {
        const { data: conversation } = await dbAny
          .from("contact_conversations")
          .insert({
            owner_profile_id: mission.owner_id,
            concierge_profile_id: auth.userId,
            source: "mission",
            source_reference: mission.id,
            subject: mission.title,
            metadata: {
              urgent_mission: true,
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
            mission_id: mission.id,
          },
        });
      }
    }

    return NextResponse.json({ mission: updatedMission });
  } catch (err) {
    console.error("[POST /api/urgent-missions/[id]/accept] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
