import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);

const bodySchema = z.object({
  action: z.enum(["archive", "activate"]),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "concierge owner mutation auth",
      allowedRoles: CONCIERGE_ROLES,
      actionLabel: "mettre a jour une relation proprietaire",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { id } = await params;
    const parsedBody = bodySchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const { action } = parsedBody.data;
    const actorId = actorResult.actor.userId;

    if (id.startsWith("prospect-")) {
      const conversationId = id.slice("prospect-".length);
      const nextStatus = action === "archive" ? "closed" : "open";

      const { data, error } = await db
        .from("contact_conversations")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("concierge_profile_id", actorId)
        .select("id, status, owner_profile_id")
        .maybeSingle();

      if (error) {
        console.error("[PATCH /api/concierge/owners/:id] conversation update error:", error);
        return NextResponse.json({ error: "Impossible de mettre a jour ce prospect." }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
      }

      return NextResponse.json({
        id,
        source: "conversation",
        status: data.status,
        owner_profile_id: data.owner_profile_id ?? null,
      });
    }

    const nextStatus = action === "archive" ? "archived" : "active";

    const { data, error } = await dbAny
      .from("provider_clients")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("provider_profile_id", actorId)
      .select("id, status, owner_profile_id")
      .maybeSingle();

    if (error) {
      console.error("[PATCH /api/concierge/owners/:id] client update error:", error);
      return NextResponse.json({ error: "Impossible de mettre a jour cette relation." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Relation introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      source: "client",
      status: data.status,
      owner_profile_id: data.owner_profile_id ?? null,
    });
  } catch (err) {
    console.error("[PATCH /api/concierge/owners/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
