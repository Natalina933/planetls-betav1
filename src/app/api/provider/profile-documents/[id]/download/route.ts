import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "provider", "provider_pro", "artisan", "artisan_pro"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TTL_SECONDS = 10 * 60;

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Justificatif invalide." }, { status: 400 });
  const { data: document, error } = await dbAny.from("provider_profile_documents")
    .select("id, provider_profile_id, label, storage_bucket, storage_path")
    .eq("id", id).maybeSingle<Record<string, unknown>>();
  if (error) return NextResponse.json({ error: "Lecture du justificatif impossible." }, { status: 500 });
  if (!document) return NextResponse.json({ error: "Justificatif introuvable." }, { status: 404 });
  const { userId, role } = guard.auth;
  const isAdmin = role === "admin" || role === "super_admin";
  if (!isAdmin && document.provider_profile_id !== userId) return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const { data: signed, error: signError } = await db.storage.from(String(document.storage_bucket ?? "mission-evidence"))
    .createSignedUrl(String(document.storage_path), TTL_SECONDS, { download: String(document.label ?? "justificatif") });
  if (signError || !signed?.signedUrl) return NextResponse.json({ error: "Signature du lien impossible." }, { status: 500 });
  if (req.nextUrl.searchParams.get("format") === "json") return NextResponse.json({ signed_url: signed.signedUrl, expires_in: TTL_SECONDS });
  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}