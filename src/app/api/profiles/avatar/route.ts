// src/app/api/profiles/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // ✅ Utilisation de SUPABASE_URL (sans NEXT_PUBLIC_) pour les routes API
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error(
        "[API Avatar Upload] ❌ Variables d'environnement manquantes"
      );
      console.error("SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
      console.error("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_KEY ? "✓" : "✗");

      return NextResponse.json(
        { error: "Configuration serveur manquante" },
        { status: 500 }
      );
    }

    // ✅ Créer le client APRÈS vérification
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Récupération des données du formulaire
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    console.log("[API Avatar Upload] File:", file?.name, file?.size, "bytes");
    console.log("[API Avatar Upload] User ID:", userId);

    // Validation
    if (!file || !userId) {
      return NextResponse.json(
        { error: "Fichier ou userId manquant" },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }

    // Validation de la taille (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image trop volumineuse (max 5MB)" },
        { status: 400 }
      );
    }

    // Génération du chemin unique
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    console.log("[API Avatar Upload] Uploading to:", filePath);

    // Upload vers Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false, // Évite les conflits
      });

    if (error) {
      console.error("[API Avatar Upload] ❌ Supabase upload error:", error);
      return NextResponse.json(
        { error: `Échec upload: ${error.message}` },
        { status: 500 }
      );
    }

    // Récupération de l'URL publique
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData.publicUrl;

    console.log("[API Avatar Upload] ✅ Success! URL:", publicUrl);

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
      success: true,
    });
  } catch (err) {
    console.error("[API Avatar Upload] ❌ Erreur serveur:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur inconnue" },
      { status: 500 }
    );
  }
}

// ✅ Optionnel : Route DELETE pour supprimer les anciens avatars
export async function DELETE(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { error: "Configuration serveur manquante" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Path manquant" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage
      .from("avatars")
      .remove([path]);

    if (error) {
      console.error("[API Avatar Delete] ❌ Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API Avatar Delete] ✅ Deleted:", path);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API Avatar Delete] ❌ Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
