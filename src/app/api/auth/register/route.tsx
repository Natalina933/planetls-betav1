// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMA avec Zod
// ============================================================================

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Nom d'utilisateur : minimum 3 caractères")
    .max(30, "Nom d'utilisateur : maximum 30 caractères")
    .regex(/^[a-zA-Z0-9_-]+$/, "Nom d'utilisateur : caractères alphanumériques, - et _ uniquement"),
  
  password: z
    .string()
    .min(8, "Mot de passe : minimum 8 caractères")
    .regex(/[A-Z]/, "Mot de passe : au moins 1 majuscule")
    .regex(/[a-z]/, "Mot de passe : au moins 1 minuscule")
    .regex(/[0-9]/, "Mot de passe : au moins 1 chiffre")
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=]/, "Mot de passe : au moins 1 caractère spécial"),
  
  email: z
    .string()
    .email("Email invalide")
    .min(1, "Email requis")
    .toLowerCase()
    .transform(val => val.trim()),
  
  firstName: z.string().min(1, "Prénom requis").max(50).transform(val => val.trim()),
  lastName: z.string().min(1, "Nom requis").max(50).transform(val => val.trim()),
  
  phone: z.string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Téléphone invalide")
    .optional()
    .or(z.literal("")),
  
  avatar_url: z.string().url("URL avatar invalide").optional().nullable(),
  
  // Données additionnelles
  category: z.string().max(100).optional().or(z.literal("")),
  searchTarget: z.string().max(100).optional().or(z.literal("")),
  option: z.string().optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  additionalInfo: z.string().max(1000).optional().or(z.literal("")),
  
  role: z.enum(["user", "admin", "host"]).default("user"),
});

// ============================================================================
// RATE LIMITING
// ============================================================================

const registrationAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = registrationAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < 300000); // 5 minutes

  if (recentAttempts.length >= 3) {
    const oldestAttempt = recentAttempts[0];
    const retryAfter = Math.ceil((300000 - (now - oldestAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }

  registrationAttempts.set(ip, [...recentAttempts, now]);
  return { allowed: true };
}

// Nettoyage périodique des anciennes tentatives
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of registrationAttempts.entries()) {
    const recentAttempts = attempts.filter(time => now - time < 300000);
    if (recentAttempts.length === 0) {
      registrationAttempts.delete(ip);
    } else {
      registrationAttempts.set(ip, recentAttempts);
    }
  }
}, 60000); // Toutes les minutes

// ============================================================================
// SANITIZATION
// ============================================================================

function sanitizeString(str: string | null | undefined): string | null {
  if (!str) return null;
  // Supprimer les caractères dangereux et trim
  return str
    .replace(/[<>]/g, '') // Supprimer < et >
    .trim()
    .substring(0, 1000); // Limite de longueur
}

// ============================================================================
// ENDPOINT POST
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // ========== 1. VÉRIFICATION ENVIRONNEMENT ==========
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variables Supabase manquantes");
      return NextResponse.json(
        { error: "Configuration serveur invalide" },
        { status: 500 }
      );
    }

    // ========== 2. RATE LIMITING ==========
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      console.warn(`⚠️ Rate limit dépassé pour IP: ${ip}`);
      return NextResponse.json(
        { 
          error: `Trop de tentatives. Réessayez dans ${rateLimitCheck.retryAfter} secondes.` 
        },
        { 
          status: 429,
          headers: {
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "300"
          }
        }
      );
    }

    // ========== 3. PARSING & VALIDATION BODY ==========
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corps de requête JSON invalide" },
        { status: 400 }
      );
    }

    // Validation avec Zod
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join("."),
        message: err.message
      }));
      
      console.warn("⚠️ Validation échouée:", errors);
      
      return NextResponse.json(
        { 
          error: "Données invalides",
          details: errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // ========== 4. INITIALISATION SUPABASE ==========
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      },
    });

    // ========== 5. VÉRIFICATION UNICITÉ (Username & Email) ==========
    // Vérifier username
    const { data: existingUsername } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("username", data.username)
      .maybeSingle();

    if (existingUsername) {
      console.warn(`⚠️ Username déjà pris: ${data.username}`);
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà pris" },
        { status: 409 }
      );
    }

    // Vérifier email (dans auth.users)
    const { data: existingEmail } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingEmail.users.some(u => u.email === data.email);

    if (emailExists) {
      console.warn(`⚠️ Email déjà utilisé: ${data.email}`);
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // ========== 6. CRÉATION UTILISATEUR SUPABASE AUTH ==========
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirmer l'email (ou false si vous voulez envoyer un email)
      user_metadata: {
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });

    if (authError) {
      console.error("❌ Erreur création auth:", {
        message: authError.message,
        status: authError.status,
        code: authError.code,
      });

      // Messages d'erreur personnalisés
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "Cet email est déjà enregistré" },
          { status: 409 }
        );
      }

      if (authError.message.includes("password")) {
        return NextResponse.json(
          { error: "Mot de passe invalide (min. 8 caractères requis)" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Impossible de créer le compte utilisateur" },
        { status: authError.status || 500 }
      );
    }

    const userId = authData?.user?.id;
    if (!userId) {
      console.error("❌ Pas d'ID utilisateur retourné");
      return NextResponse.json(
        { error: "Création utilisateur échouée" },
        { status: 500 }
      );
    }

    console.log(`✅ Utilisateur auth créé: ${userId}`);

    // ========== 7. CRÉATION PROFIL EN BASE ==========
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: userId,
          username: data.username,
          first_name: sanitizeString(data.firstName),
          last_name: sanitizeString(data.lastName),
          email: data.email,
          phone: sanitizeString(data.phone) || null,
          avatar_url: data.avatar_url || null,
          category: sanitizeString(data.category) || null,
          search_target: sanitizeString(data.searchTarget) || null,
          option: sanitizeString(data.option) || null,
          location: sanitizeString(data.location) || null,
          additional_info: sanitizeString(data.additionalInfo) || null,
          role: data.role,
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      console.error("❌ Erreur insertion profil:", profileError);

      // ROLLBACK : Supprimer l'utilisateur auth créé
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log(`🔄 Rollback: utilisateur ${userId} supprimé`);
      } catch (deleteErr) {
        console.error("❌ Erreur rollback:", deleteErr);
      }

      // Messages d'erreur personnalisés
      if (profileError.message.includes("duplicate key")) {
        if (profileError.message.includes("username")) {
          return NextResponse.json(
            { error: "Ce nom d'utilisateur est déjà pris" },
            { status: 409 }
          );
        }
        if (profileError.message.includes("email")) {
          return NextResponse.json(
            { error: "Cet email est déjà utilisé" },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: "Erreur lors de la création du profil" },
        { status: 500 }
      );
    }

    console.log(`✅ Profil créé pour: ${data.username} (${userId})`);

    // ========== 8. RÉPONSE SUCCÈS ==========
    return NextResponse.json(
      {
        success: true,
        message: "Inscription réussie",
        user: {
          id: userId,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      },
      { status: 201 }
    );

  } catch (err) {
    console.error("❌ Erreur inattendue dans register:", err);
    return NextResponse.json(
      { error: "Erreur serveur inattendue" },
      { status: 500 }
    );
  }
}

// ============================================================================
// ENDPOINT GET (pour vérifier la disponibilité d'un username)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username manquant" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuration invalide" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    return NextResponse.json({ available: !data });

  } catch (err) {
    console.error("Erreur vérification username:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}