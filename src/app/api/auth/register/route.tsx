import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";

// --- Types ---
type RegisterBody = {
    username: string;
    email: string;
    password: string;
    avatar_url?: string;
};

type User = {
    id: string;
    username: string;
    email: string;
    avatar_url?: string | null;
    role?: string;
    created_at?: string;
};

type ResponseBody = { message?: string; user?: User; error?: string };

// Handler POST
export async function POST(req: NextRequest) {
    
    // --- 1. Vérification et Initialisation Sécurisée ---
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error("ERREUR CRITIQUE : Les clés Supabase sont manquantes !");
        return NextResponse.json(
            { error: "Configuration serveur manquante (Vérifiez les variables d'environnement)" }, 
            { status: 500 }
        );
    }
    
    // Initialisation du client DANS le handler (plus sûr)
    const supabase: SupabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const body: RegisterBody = await req.json();
        const { username, email, password, avatar_url } = body;

        if (!username || !email || !password) {
            return NextResponse.json<ResponseBody>(
                { error: "Champs requis manquants" },
                { status: 400 }
            );
        }

        // --- 2. Vérification si l’email existe déjà ---
        // Note: La déstructuration avec ': existingUser' est correcte.
        const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .maybeSingle(); // Utilisez maybeSingle() pour gérer le cas 0 ou 1 sans erreur PGRST116

        // Si fetchError existe (et n'est pas "Not found"), ou si un utilisateur est trouvé
        if (fetchError) {
             console.error("Erreur BDD vérification email:", fetchError.message);
             return NextResponse.json<ResponseBody>({ error: "Erreur lors de la vérification de l'email" }, { status: 500 });
        }
        if (existingUser) {
            return NextResponse.json<ResponseBody>(
                { error: "Cet email est déjà utilisé" },
                { status: 400 }
            );
        }

        // --- 3. Hash du mot de passe et Création ---
        const hashedPassword: string = await hash(password, 10);

        const { data, error } = await supabase
            .from("users")
            .insert([{
                username,
                email,
                password: hashedPassword,
                avatar_url: avatar_url || null,
                role: "user",
            }])
            .select("id, username, email, avatar_url, role, created_at")
            .single<User>(); // Récupère l'utilisateur créé

        if (error || !data) {
            return NextResponse.json<ResponseBody>(
                { error: error?.message ?? "Erreur création utilisateur" },
                { status: 500 }
            );
        }

        // --- 4. Succès ---
        return NextResponse.json<ResponseBody>({
            message: "Utilisateur créé avec succès",
            user: data,
        });
    } catch (err) {
        console.error("Erreur serveur générale:", err);
        const errorMessage = (err instanceof Error) ? err.message : "Erreur serveur";
        return NextResponse.json<ResponseBody>(
            { error: errorMessage },
            { status: 500 }
        );
    }
}