// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { categoryToRole } from "@/app/utils/roles";

// --- Utilitaires ---

const cleanString = (val?: string | null) =>
  val ? val.replace(/[<>]/g, "").trim().substring(0, 1000) : null;

const mapYearsToInt = (years?: string | null): number | null => {
  if (!years) return null;
  if (years.startsWith("0-1")) return 1;
  if (years.startsWith("1-3")) return 3;
  if (years.startsWith("+3")) return 4;
  return null;
};

// --- Schéma de Validation ---

const registerSchema = z.object({
  username: z.string().min(3).max(30).trim(),
  password: z.string().min(8),
  email: z.string().email().toLowerCase().trim(),
  firstName: z.string().min(1).max(50).transform(cleanString),
  lastName: z.string().min(1).max(50).transform(cleanString),
  phone: z.string().optional().nullable().transform(cleanString),
  avatar_url: z.string().url().optional().nullable(),
  category: z.string().optional().nullable().transform(cleanString),
  search_target: z.string().optional().nullable().transform(cleanString),
  option: z.string().optional().nullable().transform(cleanString),
  location: z.string().optional().nullable().transform(cleanString),
  additionalInfo: z.string().optional().nullable().transform(cleanString),
  experienceLevel: z.string().optional().nullable().transform(cleanString),
  yearsExperience: z.string().optional().nullable(),
});

// --- Handler API ---

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;
    const role = categoryToRole(data.category || "");

    // 1. Vérification unique de l'username (la DB s'occupe de l'email)
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", data.username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Nom d'utilisateur déjà pris" },
        { status: 409 }
      );
    }

    // 2. Création du compte Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        username: data.username,
        role: role,
      },
    });

    if (authError) {
      // Supabase renvoie souvent une erreur 422 si l'utilisateur existe déjà
      const status = authError.message.includes("exists") ? 409 : 500;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const userId = authData.user?.id;
    if (!userId) throw new Error("Échec de la récupération de l'ID utilisateur");

    // 3. Création du profil en base de données
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        avatar_url: data.avatar_url,
        category: data.category,
        role: role,
        search_target: data.search_target,
        option: data.option,
        location: data.location,
        additional_info: data.additionalInfo,
        experience_level: data.experienceLevel,
        years_experience: mapYearsToInt(data.yearsExperience),
      });

    if (profileError) {
      // Rollback : On supprime le compte auth si le profil échoue
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // Succès
    return NextResponse.json(
      { success: true, user: { id: userId, username: data.username, role } },
      { status: 201 }
    );

  } catch (err) {
    // On vérifie si l'erreur est une instance de Error pour accéder à .message en toute sécurité
    const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue";

    console.error("[REGISTER_ERROR]:", err);

    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}