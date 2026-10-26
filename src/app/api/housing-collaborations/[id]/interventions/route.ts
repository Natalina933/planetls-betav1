import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { addCollaborationIntervention, CollaborationInterventionError } from "@/app/api/_shared/collaborationInterventions";
import { requireApiRole } from "@/server/auth/roleGuards";

const roles = new Set(["owner", "owner_pro"]);
const schema = z.object({ operation_id: z.string().uuid(), service_slug: z.string().min(1),
  start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }) }).strict();

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, roles);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Prestation, dates et clé de reprise obligatoires." }, { status: 400 });
  try {
    const mission = await addCollaborationIntervention(asLooseSupabaseClient(db), {
      collaborationId: id, actorId: guard.auth.userId, operationId: parsed.data.operation_id,
      serviceSlug: parsed.data.service_slug, start: parsed.data.start, end: parsed.data.end,
    });
    return NextResponse.json({ mission }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof CollaborationInterventionError ? error.message : "Création d’intervention impossible." },
      { status: error instanceof CollaborationInterventionError ? error.status : 500 });
  }
}
