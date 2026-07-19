import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "provider", "provider_pro", "artisan", "artisan_pro"]);
const PROVIDER_ROLES = new Set(["provider", "provider_pro", "artisan", "artisan_pro"]);
const TYPES = new Set(["insurance", "certification", "identity", "company", "portfolio", "other"]);
const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const BUCKET = "mission-evidence";
const MAX_SIZE = 10 * 1024 * 1024;

function extension(name: string) {
  const value = name.split(".").pop()?.toLowerCase() ?? "bin";
  return /^[a-z0-9]{2,8}$/.test(value) ? value : "bin";
}

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { userId, role } = guard.auth;
  const requestedProviderId = req.nextUrl.searchParams.get("providerId");
  const isAdmin = role === "admin" || role === "super_admin";
  const providerId = isAdmin && requestedProviderId ? requestedProviderId : userId;
  if (!isAdmin && !PROVIDER_ROLES.has(role)) return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const { data, error } = await dbAny
    .from("provider_profile_documents")
    .select("id, document_type, label, mime_type, file_size_bytes, sha256, verification_status, rejection_reason, expires_at, created_at, updated_at")
    .eq("provider_profile_id", providerId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Chargement des justificatifs impossible." }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { userId, role } = guard.auth;
  if (!PROVIDER_ROLES.has(role)) return NextResponse.json({ error: "Upload reserve aux artisans." }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  const documentType = form.get("documentType");
  const labelInput = form.get("label");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  if (typeof documentType !== "string" || !TYPES.has(documentType)) return NextResponse.json({ error: "Type de justificatif invalide." }, { status: 400 });
  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_MIME.has(mimeType)) return NextResponse.json({ error: "Format accepte : PDF, JPG, PNG ou WebP." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier vide ou superieur a 10 Mo." }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const storagePath = `provider-profiles/${userId}/${Date.now()}-${randomUUID()}.${extension(file.name)}`;
  const { data: upload, error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, buffer, { contentType: mimeType, cacheControl: "3600", upsert: false });
  if (uploadError || !upload) return NextResponse.json({ error: "Televersement impossible." }, { status: 500 });
  const label = typeof labelInput === "string" ? labelInput.trim().slice(0, 200) || file.name : file.name.slice(0, 200);
  const { data, error } = await dbAny.from("provider_profile_documents").insert({
    provider_profile_id: userId,
    uploaded_by: userId,
    document_type: documentType,
    label,
    storage_bucket: BUCKET,
    storage_path: upload.path,
    mime_type: mimeType,
    file_size_bytes: file.size,
    sha256,
    verification_status: "pending",
  }).select("id, document_type, label, mime_type, file_size_bytes, sha256, verification_status, rejection_reason, expires_at, created_at, updated_at").single<Record<string, unknown>>();
  if (error || !data) {
    await db.storage.from(BUCKET).remove([upload.path]);
    return NextResponse.json({ error: "Fichier charge mais rattachement impossible." }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}