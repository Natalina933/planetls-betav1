import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { requireApiRole } from "@/server/auth/roleGuards";
import { saveContractDraftSchema } from "@/features/housing-collaborations/contractConditions";

export const dynamic = "force-dynamic";
const roles = new Set(["owner", "owner_pro", "concierge", "concierge_pro"]);
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };

async function participant(req: NextRequest, context: Context) {
  const guard = await requireApiRole(req, roles);
  if (!guard.ok) return { response: guard.response };
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return { response: NextResponse.json({ error: "Collaboration invalide." }, { status: 400, headers }) };
  }
  const column = guard.auth.role === "owner" || guard.auth.role === "owner_pro" ? "owner_profile_id" : "concierge_profile_id";
  const { data, error } = await asLooseSupabaseClient(db).from("housing_collaborations")
    .select("id,status").eq("id", id).eq(column, guard.auth.userId).maybeSingle();
  if (error) throw error;
  if (!data) return { response: NextResponse.json({ error: "Collaboration introuvable." }, { status: 404, headers }) };
  return { id, actor: guard.auth.userId, status: data.status as string };
}

export async function GET(req: NextRequest, context: Context) {
  try {
    const access = await participant(req, context);
    if (access.response) return access.response;
    const { data: envelope, error } = await db.from("services_contracts")
      .select("id").eq("collaboration_id", access.id).maybeSingle();
    if (error) throw error;
    if (!envelope) return NextResponse.json({ draft: null }, { headers });
    const { data: draft, error: draftError } = await db.from("services_contract_versions")
      .select("*").eq("contract_id", envelope.id).eq("status", "draft").maybeSingle();
    if (draftError) throw draftError;
    return NextResponse.json({ draft }, { headers });
  } catch (error) {
    console.error("[GET collaboration conditions]", error);
    return NextResponse.json({ error: "Impossible de charger le brouillon." }, { status: 500, headers });
  }
}

/** Both authenticated participants can edit, using revision-based conflict detection.
 * The RPC is service-role only and rechecks participants/state inside the transaction. */
export async function PUT(req: NextRequest, context: Context) {
  try {
    const access = await participant(req, context);
    if (access.response) return access.response;
    if (access.status !== "pending_handover") {
      return NextResponse.json({ error: "Cette collaboration n’est plus en attente de contractualisation." }, { status: 409, headers });
    }
    const body = await req.json().catch(() => null);
    const parsed = saveContractDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Conditions invalides.", issues: parsed.error.issues }, { status: 400, headers });
    }
    const { data, error } = await db.rpc("save_collaboration_contract_draft", {
      p_collaboration_id: access.id,
      p_actor_id: access.actor,
      p_expected_revision: parsed.data.expectedRevision,
      p_conditions: parsed.data.conditions,
    });
    if (error) {
      if (error.code === "40001") return NextResponse.json({ error: "Le brouillon a changé. Rechargez-le avant de modifier les conditions." }, { status: 409, headers });
      if (error.code === "42501") return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers });
      if (error.code === "23514") return NextResponse.json({ error: "Conditions ou références incompatibles avec la collaboration." }, { status: 400, headers });
      throw error;
    }
    return NextResponse.json({ draft: data }, { headers });
  } catch (error) {
    console.error("[PUT collaboration conditions]", error);
    return NextResponse.json({ error: "Impossible d’enregistrer le brouillon." }, { status: 500, headers });
  }
}
