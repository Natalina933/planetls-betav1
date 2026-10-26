import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { requestCollaborationTermination, readCollaborationTermination } from "@/app/api/_shared/collaborationTermination";
import { requireApiRole } from "@/server/auth/roleGuards";

const roles = new Set(["owner", "owner_pro", "concierge", "concierge_pro"]);

async function handle(req: NextRequest, context: { params: Promise<{ id: string }> }, write: boolean) {
  const guard = await requireApiRole(req, roles);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Identifiant de collaboration invalide." }, { status: 400 });
  }
  try {
    if (write) {
      const body: unknown = req.body === null ? {} : await req.json();
      if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length) {
        return NextResponse.json({ error: "Le préavis et la date de fin sont calculés côté serveur ; aucun paramètre de modification n’est accepté." }, { status: 400 });
      }
    }
    const result = await (write ? requestCollaborationTermination : readCollaborationTermination)(asLooseSupabaseClient(db), id, guard.auth.userId);
    return NextResponse.json(result, { status: result.status, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Corps de demande invalide." }, { status: 400 });
    return NextResponse.json({ error: "Impossible de demander la fin de cette collaboration." }, { status: 500 });
  }
}

export const POST = (req: NextRequest, context: { params: Promise<{ id: string }> }) => handle(req, context, true);
export const GET = (req: NextRequest, context: { params: Promise<{ id: string }> }) => handle(req, context, false);
