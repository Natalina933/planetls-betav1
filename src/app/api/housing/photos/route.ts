import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getApiAuthContext } from "@/server/auth/apiAuth";
import { canAccessHousing } from "@/types/housing";
import { getHousingPhotoStoragePath } from "@/app/lib/housingPhotoUrl";

const HOUSING_PHOTOS_BUCKET = "housing-photos";
const ALLOWED_UPLOAD_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro", "owner", "owner_pro"]);
const SIGNED_URL_TTL_SECONDS = 5 * 60;

function getAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuration serveur manquante");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function sanitizeStoragePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
}

async function ensureHousingPhotosBucket() {
  const supabaseAdmin = getAdminClient();
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

  if (listError) throw listError;

  const exists = (buckets ?? []).some((bucket) => bucket.name === HOUSING_PHOTOS_BUCKET);
  if (!exists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(HOUSING_PHOTOS_BUCKET, {
      public: false,
      fileSizeLimit: 8 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    });

    if (createError && !String(createError.message ?? "").toLowerCase().includes("already exists")) {
      throw createError;
    }
  }

  const { error: updateError } = await supabaseAdmin.storage.updateBucket(HOUSING_PHOTOS_BUCKET, {
    public: false,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  });
  if (updateError) throw updateError;

  return supabaseAdmin;
}

function isSafeStoragePath(value: string) {
  return /^[A-Za-z0-9_-]+\/(?:draft|[1-9][0-9]*)\/[A-Za-z0-9_.-]+$/.test(value);
}

function housingReferencesPhoto(housing: { photo_principale?: unknown; infos?: unknown }, storagePath: string) {
  if (getHousingPhotoStoragePath(String(housing.photo_principale ?? "")) === storagePath) return true;
  const infos = housing.infos && typeof housing.infos === "object" ? housing.infos as Record<string, unknown> : {};
  return Array.isArray(infos.photos) && infos.photos.some((photo) =>
    typeof photo === "string" && getHousingPhotoStoragePath(photo) === storagePath,
  );
}

async function removeHousingPhotoReference(housing: { id: number; photo_principale?: unknown; infos?: unknown }, storagePath: string) {
  const infos = housing.infos && typeof housing.infos === "object" ? housing.infos as Record<string, unknown> : {};
  const currentPhotos = Array.isArray(infos.photos) ? infos.photos.filter((photo): photo is string => typeof photo === "string") : [];
  const nextPhotos = currentPhotos.filter((photo) => getHousingPhotoStoragePath(photo) !== storagePath);
  const currentPrimary = String(housing.photo_principale ?? "");
  const nextPrimary = getHousingPhotoStoragePath(currentPrimary) === storagePath ? nextPhotos[0] ?? null : housing.photo_principale ?? null;

  if (nextPhotos.length === currentPhotos.length && nextPrimary === housing.photo_principale) return;

  const { error } = await getAdminClient().from("housing").update({
    infos: { ...infos, photos: nextPhotos },
    photo_principale: nextPrimary,
    updated_at: new Date().toISOString(),
  }).eq("id", housing.id);
  if (error) throw error;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    const userId = auth.userId ?? null;
    if (!userId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const housingId = req.nextUrl.searchParams.get("housingId")?.trim() ?? "";
    const storagePath = req.nextUrl.searchParams.get("path")?.trim() ?? "";
    if (!isSafeStoragePath(storagePath)) {
      return NextResponse.json({ error: "Chemin photo invalide" }, { status: 400 });
    }

    if (housingId === "draft") {
      if (!ALLOWED_UPLOAD_ROLES.has(auth.role) || !storagePath.startsWith(`${userId}/draft/`)) {
        return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
      }
    } else {
      const numericHousingId = Number(housingId);
      if (!Number.isInteger(numericHousingId) || numericHousingId <= 0) {
        return NextResponse.json({ error: "housingId invalide" }, { status: 400 });
      }

      const { data: housing, error: housingError } = await getAdminClient()
        .from("housing")
        .select("id, proprietaire, photo_principale, infos")
        .eq("id", numericHousingId)
        .maybeSingle();
      if (housingError) return NextResponse.json({ error: "Impossible de verifier le logement cible." }, { status: 500 });
      if (!housing) return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
      if (!canAccessHousing(housing.proprietaire, userId, auth.role, auth.isAdmin)) {
        return NextResponse.json({ error: "Acces refuse a ce logement" }, { status: 403 });
      }
      // A valid housing reader must not turn an arbitrary bucket path into a signed URL.
      if (!storagePath.includes(`/${housingId}/`) && !housingReferencesPhoto(housing, storagePath)) {
        return NextResponse.json({ error: "Photo absente de ce logement" }, { status: 404 });
      }
    }

    const { data: signed, error: signError } = await getAdminClient()
      .storage.from(HOUSING_PHOTOS_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: "Signature de la photo impossible" }, { status: 500 });
    }

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch (err) {
    console.error("[API Housing Photo Download] Erreur serveur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    const userId = auth.userId ?? null;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_UPLOAD_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawHousingId = String(formData.get("housingId") ?? "draft").trim() || "draft";
    const housingId = sanitizeStoragePathSegment(rawHousingId) || "draft";

    if (!file) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier doit etre une image" }, { status: 400 });
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Image trop volumineuse (max 8MB)" }, { status: 400 });
    }

    if (housingId !== "draft") {
      const numericHousingId = Number(housingId);
      if (!Number.isInteger(numericHousingId) || numericHousingId <= 0) {
        return NextResponse.json({ error: "housingId invalide" }, { status: 400 });
      }

      const { data: housing, error: housingError } = await getAdminClient()
        .from("housing")
        .select("id, proprietaire")
        .eq("id", numericHousingId)
        .maybeSingle();

      if (housingError) {
        console.error("[API Housing Photo Upload] housing lookup error:", housingError);
        return NextResponse.json({ error: "Impossible de verifier le logement cible." }, { status: 500 });
      }
      if (!housing) {
        return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
      }
      if (!canAccessHousing(housing.proprietaire, userId, auth.role, auth.isAdmin)) {
        return NextResponse.json({ error: "Acces refuse a ce logement" }, { status: 403 });
      }
    }

    const supabaseAdmin = await ensureHousingPhotosBucket();

    const fileExt = sanitizeStoragePathSegment(file.name.split(".").pop() || "bin") || "bin";
    const filePath = `${userId}/${housingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const { data, error } = await supabaseAdmin.storage.from(HOUSING_PHOTOS_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("[API Housing Photo Upload] Supabase upload error:", error);
      return NextResponse.json({ error: "Echec upload photo logement" }, { status: 500 });
    }

    return NextResponse.json({
      path: data.path,
      success: true,
    });
  } catch (err) {
    console.error("[API Housing Photo Upload] Erreur serveur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    const userId = auth.userId ?? null;
    if (!userId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const housingId = req.nextUrl.searchParams.get("housingId")?.trim() ?? "";
    const storagePath = req.nextUrl.searchParams.get("path")?.trim() ?? "";
    if (!isSafeStoragePath(storagePath)) {
      return NextResponse.json({ error: "Chemin photo invalide" }, { status: 400 });
    }

    if (housingId === "draft") {
      if (!ALLOWED_UPLOAD_ROLES.has(auth.role) || !storagePath.startsWith(`${userId}/draft/`)) {
        return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
      }
    } else {
      const numericHousingId = Number(housingId);
      if (!Number.isInteger(numericHousingId) || numericHousingId <= 0) {
        return NextResponse.json({ error: "housingId invalide" }, { status: 400 });
      }

      const { data: housing, error: housingError } = await getAdminClient()
        .from("housing")
        .select("id, proprietaire, photo_principale, infos")
        .eq("id", numericHousingId)
        .maybeSingle();
      if (housingError) return NextResponse.json({ error: "Impossible de verifier le logement cible." }, { status: 500 });
      if (!housing) return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
      if (!canAccessHousing(housing.proprietaire, userId, auth.role, auth.isAdmin)) {
        return NextResponse.json({ error: "Acces refuse a ce logement" }, { status: 403 });
      }
      if (!storagePath.includes(`/${housingId}/`) && !housingReferencesPhoto(housing, storagePath)) {
        return NextResponse.json({ error: "Photo absente de ce logement" }, { status: 404 });
      }
      await removeHousingPhotoReference(housing, storagePath);
    }

    const { error } = await getAdminClient().storage.from(HOUSING_PHOTOS_BUCKET).remove([storagePath]);
    if (error) return NextResponse.json({ error: "Suppression de la photo impossible" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API Housing Photo Delete] Erreur serveur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
