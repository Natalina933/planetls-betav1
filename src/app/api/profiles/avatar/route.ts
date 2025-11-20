// src/app/api/upload-avatar/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";

export async function POST(req: Request) {
    try {
        const supabase = db;

        // Auth
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Utilisateur non authentifié." },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

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

        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Format non autorisé." },
                { status: 400 }
            );
        }

        // Upload Supabase
        const ext = file.name.split(".").pop();
        const path = `avatars/${user.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
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

        const { data: publicURL } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);

        if (!publicURL) {
            return NextResponse.json(
                { success: false, error: "Impossible de générer l'URL publique." },
                { status: 500 }
            );
        }

        // Update DB
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                avatar_url: publicURL.publicUrl,
                avatar_scale: 1,
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Erreur update profil:", updateError);
            return NextResponse.json(
                { success: false, error: "Erreur à la mise à jour du profil." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            avatar_url: publicURL.publicUrl,
            avatar_scale: 1,
        });
    } catch (err) {
        console.error("Erreur POST /upload-avatar:", err);
        return NextResponse.json(
            { success: false, error: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
}
