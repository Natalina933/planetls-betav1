import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getApiAuthContext } from "@/server/auth/apiAuth";

const HOUSING_PHOTOS_BUCKET = "housing-photos";

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
      public: true,
      fileSizeLimit: 8 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    });

    if (createError && !String(createError.message ?? "").toLowerCase().includes("already exists")) {
      throw createError;
    }
  }

  return supabaseAdmin;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    const userId = auth.userId ?? null;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const supabaseAdmin = await ensureHousingPhotosBucket();
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

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(HOUSING_PHOTOS_BUCKET)
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data.path,
      success: true,
    });
  } catch (err) {
    console.error("[API Housing Photo Upload] Erreur serveur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
