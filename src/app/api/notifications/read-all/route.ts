import { NextRequest, NextResponse } from "next/server";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

export async function PATCH(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "notifications read-all auth",
      actionLabel: "marquer toutes les notifications comme lues",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { error } = await dbAny
      .from("workflow_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_profile_id", actorResult.actor.userId)
      .is("read_at", null);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ error: "Module notifications non disponible." }, { status: 503 });
      }
      console.error("[PATCH /api/notifications/read-all] update error:", error);
      return NextResponse.json(
        { error: "Impossible de marquer les notifications comme lues." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/notifications/read-all] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
