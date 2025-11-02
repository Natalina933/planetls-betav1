import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { categoryToRole } from "@/app/utils/roles";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
});

type LoginBody = z.infer<typeof loginSchema>;

// 💾 Stockage temporaire pour limiter le nombre de tentatives
const loginAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(t => now - t < 300_000); // 5 min
  if (recentAttempts.length >= 5) {
    const retryAfter = Math.ceil((300_000 - (now - recentAttempts[0])) / 1000);
    return { allowed: false, retryAfter };
  }
  loginAttempts.set(ip, [...recentAttempts, now]);
  return { allowed: true };
}

// Nettoyage périodique
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttempts.entries()) {
    const recent = attempts.filter(t => now - t < 300_000);
    if (recent.length === 0) loginAttempts.delete(ip);
    else loginAttempts.set(ip, recent);
  }
}, 60_000);

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]
    || request.headers.get("x-real-ip")
    || "unknown";
  console.log("[LOGIN API] Attempt from IP:", ip);

  // 🔹 Rate limit
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const retryAfterStr = rateLimit.retryAfter?.toString() ?? "300";
    console.warn("[LOGIN API] Rate limit exceeded for IP:", ip);
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${retryAfterStr} secondes.` },
      { status: 429, headers: { "Retry-After": retryAfterStr } }
    );
  }

  // 🔹 Lecture body
  let body: LoginBody;
  try {
    body = await request.json();
    console.log("[LOGIN API] Body received:", body);
  } catch (e) {
    console.error("[LOGIN API] Invalid JSON:", e);
    return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
  }

  // 🔹 Validation
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    console.warn("[LOGIN API] Validation errors:", result.error.issues);
    return NextResponse.json(
      { error: "Données invalides", details: result.error.issues.map(i => ({ field: i.path.join("."), message: i.message })) },
      { status: 400 }
    );
  }

  // 🔹 Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 🔹 Authentification
  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error || !data.user) {
    console.warn("[LOGIN API] Supabase auth error:", error?.message);
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

  console.log("[LOGIN API] Auth success:", data.user.id);

  // 🔹 Récupération profil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, email, avatar_url, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[LOGIN API] Profile fetch error:", profileError?.message);
    return NextResponse.json({ error: "Impossible de récupérer le profil" }, { status: 500 });
  }

  // 🔹 Vérification rôle
  const role = categoryToRole(profile.role);
  if (!role) {
    console.warn("[LOGIN API] Unknown role:", profile.role);
    return NextResponse.json({ error: "Rôle inconnu, accès refusé" }, { status: 403 });
  }

  const avatar = profile.avatar_url ?? null;

  console.log("[LOGIN API] User profile loaded:", { id: profile.id, role });

  // 🔹 Response avec infos utilisateur
  return NextResponse.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      username: profile.username,
      name: profile.first_name,
      role,
      avatar_url: avatar,
    }
  }, { status: 200 });
}
