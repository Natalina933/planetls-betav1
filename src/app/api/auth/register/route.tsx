// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { categoryToRole } from "@/app/utils/roles";

const sanitize = (str?: string | null) =>
  str ? str.replace(/[<>]/g, "").trim().substring(0, 1000) : null;
const mapYearsToInt = (years?: string | null): number | null => {
  if (!years) return null;
  if (years.startsWith("0-1")) return 1;
  if (years.startsWith("1-3")) return 3;
  if (years.startsWith("+3")) return 4; // ou 10, comme tu veux
  return null;
};

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  searchTarget: z.string().optional().nullable(),
  option: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  experienceLevel: z.string().optional().nullable(),
  yearsExperience: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parseResult.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const data = parseResult.data;
    const role = categoryToRole(data.category || "");

    // Debug éventuel
    console.log("🧪 experienceLevel / yearsExperience:", data.experienceLevel, data.yearsExperience);

    // Vérifier username existant
    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", data.username)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        { error: "Nom d'utilisateur déjà pris" },
        { status: 409 },
      );
    }

    // Vérifier email existant
    const { data: usersList, error: usersError } =
      await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    if (usersList?.users?.some((u) => u.email === data.email)) {
      return NextResponse.json(
        { error: "Email déjà utilisé" },
        { status: 409 },
      );
    }

    // Création utilisateur Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          username: data.username,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          category: data.category,
          search_target: data.searchTarget,
          option: data.option,
          location: data.location,
          additional_info: data.additionalInfo,
          experience_level: data.experienceLevel,
          years_experience: mapYearsToInt(data.yearsExperience),
          role,
        },
      });

    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) throw new Error("Utilisateur introuvable");

    // Création profil
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: userId,
          username: data.username,
          first_name: sanitize(data.firstName),
          last_name: sanitize(data.lastName),
          email: data.email,
          phone: sanitize(data.phone),
          avatar_url: data.avatar_url || null,
          category: sanitize(data.category),
          role,
          search_target: sanitize(data.searchTarget),
          option: sanitize(data.option),
          location: sanitize(data.location),
          additional_info: sanitize(data.additionalInfo),
          experience_level: sanitize(data.experienceLevel),
          years_experience: mapYearsToInt(data.yearsExperience),
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId).catch(() => { });
      throw profileError;
    }

    return NextResponse.json(
      { success: true, user: { id: userId, ...data, role } },
      { status: 201 },
    );
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 },
    );
  }
}
