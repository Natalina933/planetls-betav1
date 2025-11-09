import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { categoryToRole } from "@/app/utils/roles";

/* -------------------------------------------------
 * 🔹 UTILITAIRES
 * ------------------------------------------------- */
function logStep(step: string, details?: unknown) {
  console.log(`[REGISTER][${step}]`, details ?? "");
}

function errorToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

function sanitizeString(str?: string | null): string | null {
  return str ? str.replace(/[<>]/g, "").trim().substring(0, 1000) : null;
}

/* -------------------------------------------------
 * 🔹 VALIDATION ZOD
 * ------------------------------------------------- */
const registerSchema = z.object({
  username: z.string()
    .min(3, "Nom d'utilisateur : minimum 3 caractères")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Caractères autorisés : lettres, chiffres, tirets, underscores"),
  password: z.string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins 1 majuscule")
    .regex(/[a-z]/, "Au moins 1 minuscule")
    .regex(/[0-9]/, "Au moins 1 chiffre")
    .regex(/[!@#$%^&*(),.?\":{}|<>_\-+=]/, "Au moins 1 caractère spécial"),
  email: z.string().email("Email invalide").toLowerCase().trim(),
  firstName: z.string().min(1, "Prénom requis").max(50).trim(),
  lastName: z.string().min(1, "Nom requis").max(50).trim(),
  phone: z.string().optional().or(z.literal("")),
  avatar_url: z.string().url("URL avatar invalide").optional().nullable(),
  category: z.string().max(100).optional().or(z.literal("")),
  searchTarget: z.string().max(100).optional().or(z.literal("")),
  option: z.string().optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  additionalInfo: z.string().max(1000).optional().or(z.literal("")),
});

/* -------------------------------------------------
 * 🔹 RATE LIMIT (3 tentatives / 5 min)
 * ------------------------------------------------- */
const registrationAttempts = new Map<string, number[]>();
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const attempts = registrationAttempts.get(ip) || [];
  const recent = attempts.filter(t => now - t < windowMs);

  if (recent.length >= 3) {
    const retryAfter = Math.ceil((windowMs - (now - recent[0])) / 1000);
    return { allowed: false, retryAfter };
  }

  registrationAttempts.set(ip, [...recent, now]);
  return { allowed: true };
}

// Nettoyage périodique des IP inactives
setInterval(() => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  for (const [ip, times] of registrationAttempts.entries()) {
    const recent = times.filter(t => now - t < windowMs);
    if (recent.length === 0) registrationAttempts.delete(ip);
    else registrationAttempts.set(ip, recent);
  }
}, 60 * 1000);

/* -------------------------------------------------
 * 🔹 HANDLER PRINCIPAL
 * ------------------------------------------------- */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Configuration serveur invalide" },
      { status: 500 }
    );
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    /* ---- Étape 1 : Anti-spam / rate-limit ---- */
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]
      || req.headers.get("x-real-ip")
      || "unknown";

    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${rate.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 300) } }
      );
    }

    /* ---- Étape 2 : Lecture et validation du body ---- */
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: result.error.issues.map(i => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const role = categoryToRole(data.category);

    /* ---- Étape 3 : Vérification username/email ---- */
    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", data.username)
      .maybeSingle();

    if (existingUsername)
      return NextResponse.json({ error: "Nom d'utilisateur déjà pris" }, { status: 409 });

    const { data: usersList, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    if (usersList?.users?.some(u => u.email === data.email))
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });

    /* ---- Étape 4 : Création du compte auth ---- */
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        role,
      },
    });

    if (authError) throw authError;
    const userId = authData?.user?.id;
    if (!userId) throw new Error("ID utilisateur introuvable");

    /* ---- Étape 5 : Création du profil ---- */
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: userId,
          username: data.username,
          first_name: sanitizeString(data.firstName),
          last_name: sanitizeString(data.lastName),
          email: data.email,
          phone: sanitizeString(data.phone),
          avatar_url: data.avatar_url || null,
          category: sanitizeString(data.category),
          role,
          search_target: sanitizeString(data.searchTarget),
          option: sanitizeString(data.option),
          location: sanitizeString(data.location),
          additional_info: sanitizeString(data.additionalInfo),
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      // Rollback user Supabase Auth
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      throw profileError;
    }

    /* ---- Étape 6 : Succès ---- */
    return NextResponse.json(
      {
        success: true,
        message: "Inscription réussie 🎉",
        user: {
          id: userId,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logStep("Error", errorToString(err));
    return NextResponse.json(
      { error: "Erreur serveur", details: errorToString(err) },
      { status: 500 }
    );
  }
}
