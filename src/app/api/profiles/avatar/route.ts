// src/app/api/profiles/avatar/route.ts
import { NextResponse } from "next/server";
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("[API] Utilisateur non authentifié !");
      return NextResponse.json(
        { success: false, error: "Utilisateur non authentifié." },
        { status: 401 }
      );
    }
    console.log("[API] Utilisateur authentifié :", user.id);

    console.log("Début de la requête POST /api/profiles/avatar");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null; // facultatif pour non-connecté
    console.log("[API] Fichier reçu :", file?.name, file?.type, file?.size);
    console.log("[API] userId reçu :", userId);
    console.log("[API] Type de userId :", typeof userId);
    if (!file) {
      console.log("[API] Aucun fichier reçu dans la requête.");
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
    if (!userId && isConnected) {
      return NextResponse.json(
        { success: false, error: "ID utilisateur manquant." },
        { status: 400 }
      );
    }
    const path = isConnected
      ? `${userId}/${Date.now()}.${extension}`
      : `temp_${Date.now()}.${extension}`;
    console.log("Bucket utilisé :", bucket);
    console.log("Chemin généré :", path);
    // Upload

    console.log("Début de l'upload vers Supabase...");
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Erreur détaillée lors de l'upload :", uploadError);
      return NextResponse.json(
        { success: false, error: "Upload échoué." },
        { status: 500 }
      );
    }

    // Générer URL publique
    const { data: publicURL } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    console.log("URL publique générée :", publicURL?.publicUrl);
    if (!publicURL?.publicUrl) {
      return NextResponse.json(
        { success: false, error: "Impossible de générer l'URL publique." },
        { status: 500 }
      );
    }

    // Si connecté, mettre à jour le profil
    if (isConnected) {
      console.log(
        "Mise à jour du profil avec avatar_url :",
        publicURL.publicUrl
      );
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicURL.publicUrl, avatar_scale: 1 })
        .eq("id", userId);

      if (updateError) {
        console.error(
          "Erreur détaillée lors de la mise à jour du profil :",
          updateError
        );
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
    console.error("[API] Erreur globale dans POST /api/profiles/avatar:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
