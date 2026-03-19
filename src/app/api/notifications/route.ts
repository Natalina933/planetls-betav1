import { NextRequest, NextResponse } from "next/server";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

function parseLimit(raw: string | null, fallback = 20) {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), 1), 100);
}

export async function GET(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "notifications auth",
      actionLabel: "consulter vos notifications",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get("limit"), 20);
    const unreadOnly = ["1", "true"].includes(
      (url.searchParams.get("unreadOnly") ?? "").trim().toLowerCase(),
    );

    let query = dbAny
      .from("workflow_notifications")
      .select("*")
      .eq("recipient_profile_id", actorResult.actor.userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.is("read_at", null);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ items: [], summary: { total: 0, unread: 0 } });
      }
      console.error("[GET /api/notifications] DB error:", error);
      return NextResponse.json({ error: "Impossible de charger les notifications." }, { status: 500 });
    }

    const items = Array.isArray(data) ? data : [];
    return NextResponse.json({
      items,
      summary: {
        total: items.length,
        unread: items.filter((item: { read_at?: string | null }) => !item.read_at).length,
      },
    });
  } catch (err) {
    console.error("[GET /api/notifications] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
