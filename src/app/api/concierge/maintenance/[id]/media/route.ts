import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro", "owner", "owner_pro", "provider", "provider_pro", "artisan", "artisan_pro"]);
const UPLOAD_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro", "provider", "provider_pro", "artisan", "artisan_pro"]);
const BUCKET = "mission-evidence";
const MAX_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function canAccess(incident: Record<string, unknown>, userId: string, role: string) {
  return role === "admin" || role === "super_admin" ||
    incident.concierge_profile_id === userId || incident.owner_profile_id === userId || incident.provider_profile_id === userId;
}

function canUpload(incident: Record<string, unknown>, userId: string, role: string) {
  return UPLOAD_ROLES.has(role) && (role === "admin" || role === "super_admin" || incident.concierge_profile_id === userId || incident.provider_profile_id === userId);
}

function extension(name: string) {
  const value = name.split(".").pop()?.toLowerCase() ?? "bin";
  return /^[a-z0-9]{2,8}$/.test(value) ? value : "bin";
}

async function loadIncident(id: string) {
  return dbAny.from("maintenance_incidents").select("id, concierge_profile_id, owner_profile_id, provider_profile_id").eq("id", id).maybeSingle<Record<string, unknown>>();
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Incident invalide." }, { status: 400 });
  const { data: incident, error: incidentError } = await loadIncident(id);
  if (incidentError) return NextResponse.json({ error: "Lecture incident impossible." }, { status: 500 });
  if (!incident) return NextResponse.json({ error: "Incident introuvable." }, { status: 404 });
  if (!canAccess(incident, guard.auth.userId, guard.auth.role)) return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const { data, error } = await dbAny.from("maintenance_incident_media").select("id, label, mime_type, file_size_bytes, sha256, created_at, uploaded_by").eq("incident_id", id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Chargement preuves impossible." }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Incident invalide." }, { status: 400 });
  const { data: incident, error: incidentError } = await loadIncident(id);
  if (incidentError) return NextResponse.json({ error: "Lecture incident impossible." }, { status: 500 });
  if (!incident) return NextResponse.json({ error: "Incident introuvable." }, { status: 404 });
  if (!canUpload(incident, guard.auth.userId, guard.auth.role)) return NextResponse.json({ error: "Upload reserve aux intervenants." }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  const mimeType = file.type.toLowerCase();
  if (file.size <= 0 || file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier vide ou trop volumineux." }, { status: 400 });
  if (!ALLOWED_TYPES.has(mimeType)) return NextResponse.json({ error: "Type de fichier non supporte." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const storagePath = `maintenance/${id}/${Date.now()}-${randomUUID()}.${extension(file.name)}`;
  const { data: upload, error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, buffer, { contentType: mimeType, cacheControl: "3600", upsert: false });
  if (uploadError || !upload) return NextResponse.json({ error: "Upload preuve impossible." }, { status: 500 });
  const labelInput = form.get("label");
  const { data, error } = await dbAny.from("maintenance_incident_media").insert({
    incident_id: id,
    uploaded_by: guard.auth.userId,
    label: typeof labelInput === "string" ? labelInput.trim().slice(0, 200) || file.name : file.name,
    storage_bucket: BUCKET,
    storage_path: upload.path,
    mime_type: mimeType,
    file_size_bytes: file.size,
    sha256,
  }).select("id, label, mime_type, file_size_bytes, sha256, created_at, uploaded_by").single<Record<string, unknown>>();
  if (error || !data) {
    await db.storage.from(BUCKET).remove([upload.path]);
    return NextResponse.json({ error: "Preuve uploadee mais non rattachee." }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}