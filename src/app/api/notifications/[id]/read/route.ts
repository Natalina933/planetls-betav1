import { NextRequest, NextResponse } from "next/server";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "notifications read auth",
      actionLabel: "marquer une notification comme lue",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Notification introuvable." }, { status: 400 });
    }

    const { data: notification, error: readError } = await dbAny
      .from("workflow_notifications")
      .select("id, recipient_profile_id, read_at")
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      if (readError.code === "42P01") {
        return NextResponse.json({ error: "Module notifications non disponible." }, { status: 503 });
      }
      console.error("[PATCH /api/notifications/:id/read] read error:", readError);
      return NextResponse.json({ error: "Impossible de charger la notification." }, { status: 500 });
    }

    if (!notification) {
      return NextResponse.json({ error: "Notification introuvable." }, { status: 404 });
    }

    if (!actorResult.actor.isAdmin && notification.recipient_profile_id !== actorResult.actor.userId) {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    const { data: updated, error: updateError } = await dbAny
      .from("workflow_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("[PATCH /api/notifications/:id/read] update error:", updateError);
      return NextResponse.json({ error: "Impossible de marquer la notification." }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/notifications/:id/read] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
