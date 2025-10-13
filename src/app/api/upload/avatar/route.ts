import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { v4 as uuidv4 } from "uuid";

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_NAME = "avatars";

export async function POST(request: NextRequest) {
    try {
        // ✅ Récupération des clés Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: "Configuration Supabase manquante" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // ✅ Lecture du formulaire
        const formData = await request.formData();
        const file = formData.get("avatar") as File | null;
        const oldAvatarUrl = formData.get("oldAvatarUrl") as string | null; // URL de l’ancien avatar

        if (!file) {
            return NextResponse.json(
                { error: "Aucun fichier reçu" },
                { status: 400 }
            );
        }

        // ✅ Validation du fichier
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Type de fichier non autorisé" },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "Fichier trop volumineux (max 5MB)" },
                { status: 400 }
            );
        }

        // ✅ Génération d’un nom unique
        const uniqueName = `${randomUUID()}-${file.name}`;

        // Nettoyer le nom du fichier
        const safeName = file.name
            .normalize("NFD") // décompose les accents
            .replace(/[\u0300-\u036f]/g, "") // enlève les accents
            .replace(/[^a-zA-Z0-9._-]/g, "_"); // remplace tout le reste par _

        const filePath = `avatars/${uuidv4()}-${safeName}`;

        // ✅ Conversion en buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // ✅ Upload du nouveau fichier vers Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error("❌ Erreur upload Supabase:", error);
            return NextResponse.json(
                { error: "Erreur lors de l'upload Supabase" },
                { status: 500 }
            );
        }

        // ✅ Suppression de l’ancien avatar (si fourni)
        if (oldAvatarUrl) {
            try {
                const pathStart = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/`;
                const filePath = oldAvatarUrl.replace(pathStart, "");

                if (filePath && filePath !== uniqueName) {
                    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
                    console.log(`🗑️ Ancien avatar supprimé : ${filePath}`);
                }
            } catch (deleteErr) {
                console.warn("⚠️ Échec suppression ancien avatar :", deleteErr);
            }
        }

        // ✅ Création de l’URL publique
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${data.fullPath}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: data.fullPath,
        });
    } catch (err) {
        console.error("Erreur upload avatar:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
