// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Validation Zod
const registerSchema = z.object({
  username: z.string()
    .min(3, "Nom d'utilisateur : minimum 3 caractères")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Caractères autorisés : lettres, chiffres, tirets, underscores"),
  password: z.string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins 1 majuscule")
    .regex(/[a-z]/, "Au moins 1 minuscule")
    .regex(/[0-9]/, "Au moins 1 chiffre")
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=]/, "Au moins 1 caractère spécial"),
  email: z.string().email("Email invalide").min(1).toLowerCase().transform(val => val.trim()),
  firstName: z.string().min(1, "Prénom requis").max(50).transform(val => val.trim()),
  lastName: z.string().min(1, "Nom requis").max(50).transform(val => val.trim()),
  phone: z.string().optional().or(z.literal("")),
  avatar_url: z.string().url("URL avatar invalide").optional().nullable(),
  category: z.string().max(100).optional().or(z.literal("")),
  searchTarget: z.string().max(100).optional().or(z.literal("")),
  option: z.string().optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  additionalInfo: z.string().max(1000).optional().or(z.literal("")),
});

// Mapping category ➔ role (ENUM Supabase user_role)
const categoryToRole = (cat: string | null | undefined): string => {
  const c = (cat || "").trim().toLowerCase();
  if (c.startsWith("proprietaire")) return "proprietaire";
  if (c.startsWith("concierge")) return "concierge";
  if (c.startsWith("service")) return "service";
  if (c === "admin") return "admin";
  if (c === "proprietaire_pro") return "proprietaire_pro";
  if (c === "concierge_pro") return "concierge_pro";
  if (c === "service_pro") return "service_pro";
  return "proprietaire";
};

// Sanitize helpers
function sanitizeString(str: string | null | undefined): string | null {
  if (!str) return null;
  return str.replace(/[<>]/g, '').trim().substring(0, 1000);
}

// Rate Limiting
const registrationAttempts = new Map<string, number[]>();
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = registrationAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < 300000);
  if (recentAttempts.length >= 3) {
    const oldest = recentAttempts[0];
    const retryAfter = Math.ceil((300000 - (now - oldest)) / 1000);
    return { allowed: false, retryAfter };
  }
  registrationAttempts.set(ip, [...recentAttempts, now]);
  return { allowed: true };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of registrationAttempts.entries()) {
    const recent = attempts.filter(time => now - time < 300000);
    if (recent.length === 0) registrationAttempts.delete(ip);
    else registrationAttempts.set(ip, recent);
  }
}, 60000);

export async function POST(request: NextRequest) {
  try {
    // ENV
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey)
      return NextResponse.json({ error: "Configuration serveur invalide" }, { status: 500 });

    // Rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]
      || request.headers.get("x-real-ip") || "unknown";
    const rateStatus = checkRateLimit(ip);
    if (!rateStatus.allowed)
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${rateStatus.retryAfter} sec.` },
        { status: 429, headers: { "Retry-After": rateStatus.retryAfter?.toString() || "300" } }
      );

    // Parse / Validate input
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 }); }
    const validation = registerSchema.safeParse(body);
    if (!validation.success)
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validation.error.issues.map(err => ({
            field: err.path.join("."), message: err.message
          })),
        },
        { status: 400 }
      );
    const data = validation.data;
    const role = categoryToRole(data.category);

    // Initialise Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Check username unique profile
    const { data: usernameUsed } = await supabase
      .from("profiles")
      .select("username").eq("username", data.username).maybeSingle();
    if (usernameUsed)
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà pris" }, { status: 409 }
      );

    // Check email unique auth
    const { data: usersList } = await supabase.auth.admin.listUsers();
    if (usersList.users.some(u => u.email === data.email))
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" }, { status: 409 }
      );

    // Création utilisateur authentication
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        role
      },
    });
    if (authError)
      return NextResponse.json(
        { error: authError.message || "Erreur création compte" },
        { status: 400 }
      );
    const userId = authData?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "Création utilisateur échouée" }, { status: 500 });

    // Création du profil (avec champ role correctement typé)
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([{
        id: userId,
        username: data.username,
        first_name: sanitizeString(data.firstName),
        last_name: sanitizeString(data.lastName),
        email: data.email,
        phone: sanitizeString(data.phone) || null,
        avatar_url: data.avatar_url || null,
        category: sanitizeString(data.category) || null,
        role, // Champ role typé selon enum Supabase (⚡️ CORRECTION CRITIQUE)
        search_target: sanitizeString(data.searchTarget) || null,
        option: sanitizeString(data.option) || null,
        location: sanitizeString(data.location) || null,
        additional_info: sanitizeString(data.additionalInfo) || null,
        created_at: new Date().toISOString(),
      }]);
    if (profileError) {
      // Rollback auth user
      try { await supabase.auth.admin.deleteUser(userId); } catch { } // silent
      return NextResponse.json(
        { error: "Erreur lors de la création du profil" }, { status: 500 }
      );
    }

    // Succès
    return NextResponse.json({
      success: true,
      message: "Inscription réussie",
      user: {
        id: userId, username: data.username, email: data.email,
        firstName: data.firstName, lastName: data.lastName, role
      },
    }, { status: 201 });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur serveur inattendue" }, { status: 500 }
    );
  }
}

// ENDPOINT GET (vérification username dispo)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    if (!username)
      return NextResponse.json({ error: "Username manquant" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey)
      return NextResponse.json({ error: "Configuration invalide" }, { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase
      .from("profiles")
      .select("username").eq("username", username).maybeSingle();

    return NextResponse.json({ available: !data });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
