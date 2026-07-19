import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro", "owner", "owner_pro", "provider", "provider_pro", "artisan", "artisan_pro"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TTL_SECONDS = 10 * 60;

export async function GET(req: NextRequest, context: { params: Promise<{ id: string; mediaId: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { id, mediaId } = await context.params;
  if (!UUID.test(id) || !UUID.test(mediaId)) return NextResponse.json({ error: "Preuve invalide." }, { status: 400 });
  const { data: incident, error: incidentError } = await dbAny
    .from("maintenance_incidents")
    .select("id, concierge_profile_id, owner_profile_id, provider_profile_id")
    .eq("id", id)
    .maybeSingle<Record<string, unknown>>();
  if (incidentError) return NextResponse.json({ error: "Lecture incident impossible." }, { status: 500 });
  if (!incident) return NextResponse.json({ error: "Incident introuvable." }, { status: 404 });
  const { userId, role } = guard.auth;
  const allowed = role === "admin" || role === "super_admin" || incident.concierge_profile_id === userId || incident.owner_profile_id === userId || incident.provider_profile_id === userId;
  if (!allowed) return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const { data: media, error } = await dbAny
    .from("maintenance_incident_media")
    .select("id, label, storage_bucket, storage_path")
    .eq("id", mediaId)
    .eq("incident_id", id)
    .maybeSingle<Record<string, unknown>>();
  if (error) return NextResponse.json({ error: "Lecture preuve impossible." }, { status: 500 });
  if (!media) return NextResponse.json({ error: "Preuve introuvable." }, { status: 404 });
  const { data: signed, error: signError } = await db.storage
    .from(String(media.storage_bucket ?? "mission-evidence"))
    .createSignedUrl(String(media.storage_path), TTL_SECONDS, { download: String(media.label ?? "preuve") });
  if (signError || !signed?.signedUrl) return NextResponse.json({ error: "Signature preuve impossible." }, { status: 500 });
  if (req.nextUrl.searchParams.get("format") === "json") {
    return NextResponse.json({ signed_url: signed.signedUrl, expires_in: TTL_SECONDS });
  }
  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}