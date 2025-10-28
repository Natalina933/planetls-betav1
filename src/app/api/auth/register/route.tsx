// src/app/api/auth/register/route.tsx
import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// Logger universel
function logStep(step: string, details?: unknown) {
  console.log(`[REGISTER][${step}]`, details ?? "");
}

// Utilitaire erreur (unknown)
function errorToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

// Mapping category ➔ role (doit matcher user_roles.code)
const categoryToRole = (cat: string | null | undefined): string => {
  const c = (cat || "").trim().toLowerCase();
  if (c === "proprietaire_pro") return "owner_pro";
  if (c.startsWith("proprietaire")) return "owner";
  if (c === "concierge_pro") return "concierge_pro";
  if (c.startsWith("concierge")) return "concierge";
  if (c === "service_pro") return "provider_pro";
  if (c.startsWith("service")) return "provider";
  if (c === "admin") return "admin";
  if (c === "super_admin") return "super_admin";
  return "owner"; // fallback safe value
}

// Schema Zod
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

function sanitizeString(str: string | null | undefined): string | null {
  if (!str) return null;
  return str.replace(/[<>]/g, '').trim().substring(0, 1000);
}

// Rate limit
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
    logStep("ENV", { supabaseUrl, supabaseServiceKey });
    if (!supabaseUrl || !supabaseServiceKey)
      return NextResponse.json({ error: "Configuration serveur invalide" }, { status: 500 });
    
    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]
      || request.headers.get("x-real-ip") || "unknown";
    logStep("IP", ip);
    const rateStatus = checkRateLimit(ip);
    logStep("RateLimit", rateStatus);
    if (!rateStatus.allowed)
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${rateStatus.retryAfter} sec.` },
        { status: 429, headers: { "Retry-After": rateStatus.retryAfter?.toString() || "300" } }
      );

    // Parse/validate body
    let body: unknown;
    try {
      body = await request.json();
      logStep("Body", body);
    } catch (err: unknown) {
      logStep("InvalidJSON", errorToString(err));
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
    }
    const validation = registerSchema.safeParse(body);
    logStep("ValidationResult", validation);
    if (!validation.success)
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validation.error.issues.map(issue => ({
            field: issue.path.join("."), message: issue.message
          })),
        },
        { status: 400 }
      );
    const data = validation.data;
    const role = categoryToRole(data.category);
    logStep("Role", role);

    // Init Supabase
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Username unique ?
    try {
      const { data: usernameUsed, error: usernameError } = await supabase
        .from("profiles")
        .select("username").eq("username", data.username).maybeSingle();
      logStep("UsernameUsed", { usernameUsed, usernameError });
      if (usernameError) throw usernameError;
      if (usernameUsed)
        return NextResponse.json(
          { error: "Ce nom d'utilisateur est déjà pris" }, { status: 409 }
        );
    } catch (err: unknown) {
      logStep("SupabaseUsernameCheckError", errorToString(err));
      return NextResponse.json({ error: "Erreur vérification username" }, { status: 500 });
    }

    // Email unique ?
    try {
      const { data: usersList, error: usersError } = await supabase.auth.admin.listUsers();
      type UserEmail = { email: string };
      const users = (usersList?.users ?? []) as UserEmail[];
      logStep("UsersList", { users: users.length, usersError });
      if (usersError) throw usersError;
      if (users.some(u => u.email === data.email))
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" }, { status: 409 }
        );
    } catch (err: unknown) {
      logStep("SupabaseEmailCheckError", errorToString(err));
      return NextResponse.json({ error: "Erreur vérification email" }, { status: 500 });
    }

    // Création utilisateur authentication
    let userId: string | undefined;
    try {
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
      logStep("SupabaseCreateUser", { authData, authError });
      if (authError) throw authError;
      userId = authData?.user?.id;
      if (!userId) throw new Error('User ID missing after Supabase createUser');
    } catch (err: unknown) {
      logStep("SupabaseCreateUserError", errorToString(err));
      return NextResponse.json(
        { error: errorToString(err) || "Erreur création compte" },
        { status: 400 }
      );
    }

    // Création du profil
    try {
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
          role, // <-- clé étrangère, doit matcher user_roles.code
          search_target: sanitizeString(data.searchTarget) || null,
          option: sanitizeString(data.option) || null,
          location: sanitizeString(data.location) || null,
          additional_info: sanitizeString(data.additionalInfo) || null,
          created_at: new Date().toISOString(),
        }]);
      logStep("SupabaseInsertProfile", { profileError });

      if (profileError) {
        try { await supabase.auth.admin.deleteUser(userId); } catch { }
        logStep("SupabaseInsertProfileError", errorToString(profileError));
        return NextResponse.json(
          { error: "Erreur lors de la création du profil" }, { status: 500 }
        );
      }

      logStep("RegisterSuccess", { userId });
      return NextResponse.json({
        success: true,
        message: "Inscription réussie",
        user: {
          id: userId, username: data.username, email: data.email,
          firstName: data.firstName, lastName: data.lastName, role
        },
      }, { status: 201 });

    } catch (err: unknown) {
      logStep("UnexpectedServerError", errorToString(err));
      return NextResponse.json(
        { error: "Erreur serveur inattendue" }, { status: 500 }
      );
    }
  } catch (err: unknown) {
    logStep("UnexpectedServerError", errorToString(err));
    return NextResponse.json(
      { error: "Erreur serveur inattendue" }, { status: 500 }
    );
  }
}
