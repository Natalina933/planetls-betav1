// src/app/api/profiles/avatar/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    const userId = formData.get("userId") as string | null; // facultatif pour non-connecté

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier reçu." },
        { status: 400 }
      );
    }

    if (file.size > 5_000_000) {
      return NextResponse.json(
        { success: false, error: "Le fichier dépasse 5 Mo." },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format non autorisé (JPEG, PNG, WEBP uniquement).",
        },
        { status: 400 }
      );
    }

    // Déterminer le bucket et le path
    const isConnected = !!userId;
    const bucket = isConnected ? "avatars" : "avatars-temp";

    const extension = file.name.split(".").pop();
    const path = isConnected
      ? `user_${userId}_${Date.now()}.${extension}`
      : `temp_${Date.now()}.${extension}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Erreur upload:", uploadError);
      return NextResponse.json(
        { success: false, error: "Upload échoué." },
        { status: 500 }
      );
    }

    // Générer URL publique
    const { data: publicURL } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    if (!publicURL?.publicUrl) {
      return NextResponse.json(
        { success: false, error: "Impossible de générer l'URL publique." },
        { status: 500 }
      );
    }

    // Si connecté, mettre à jour le profil
    if (isConnected) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicURL.publicUrl, avatar_scale: 1 })
        .eq("id", userId);

      if (updateError) {
        console.error("Erreur update profil:", updateError);
        return NextResponse.json(
          { success: false, error: "Erreur lors de la mise à jour du profil." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicURL.publicUrl,
      avatar_scale: 1,
      bucket,
    });
  } catch (err) {
    console.error("Erreur POST /profiles/avatar:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
