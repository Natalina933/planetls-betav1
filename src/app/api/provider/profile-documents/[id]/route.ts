import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ADMIN_ROLES);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Justificatif invalide." }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { status?: unknown; rejectionReason?: unknown } | null;
  const status = body?.status;
  if (status !== "verified" && status !== "rejected") {
    return NextResponse.json({ error: "Decision de verification invalide." }, { status: 400 });
  }
  const rejectionReason = typeof body?.rejectionReason === "string" ? body.rejectionReason.trim().slice(0, 500) : "";
  if (status === "rejected" && rejectionReason.length < 3) {
    return NextResponse.json({ error: "Le motif de rejet est obligatoire." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await dbAny
    .from("provider_profile_documents")
    .update({
      verification_status: status,
      verified_by: guard.auth.userId,
      verified_at: now,
      rejection_reason: status === "rejected" ? rejectionReason : null,
      updated_at: now,
    })
    .eq("id", id)
    .select("id,provider_profile_id,document_type,label,verification_status,rejection_reason,verified_at,expires_at,updated_at")
    .maybeSingle<Record<string, unknown>>();

  if (error) return NextResponse.json({ error: "Decision de verification impossible." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Justificatif introuvable." }, { status: 404 });
  return NextResponse.json(data);
}
