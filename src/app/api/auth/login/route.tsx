// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Schéma de validation
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
});

// Rate limiting
const loginAttempts = new Map<string, number[]>();
function checkRateLimit(ip: string) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(t => now - t < 300000);
  if (recentAttempts.length >= 5) {
    const oldest = recentAttempts[0];
    const retryAfter = Math.ceil((300000 - (now - oldest)) / 1000);
    return { allowed: false, retryAfter };
  }
  loginAttempts.set(ip, [...recentAttempts, now]);
  return { allowed: true };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttempts.entries()) {
    const recent = attempts.filter(t => now - t < 300000);
    if (recent.length === 0) loginAttempts.delete(ip);
    else loginAttempts.set(ip, recent);
  }
}, 60000);

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]
    || request.headers.get("x-real-ip") || "unknown";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const retryAfterStr = rateLimit.retryAfter !== undefined ? rateLimit.retryAfter.toString() : "300";
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans " + retryAfterStr + " secondes." },
      { status: 429, headers: { "Retry-After": retryAfterStr } }
    );
  }
  // Validation du body
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 }); }
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join("."),
      message: issue.message
    }));
    return NextResponse.json(
      { error: "Données invalides", details: errors },
      { status: 400 }
    );
  }
  // Authentification Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey)
    return NextResponse.json({ error: "Configuration serveur invalide" }, { status: 500 });

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    let message = "Impossible de se connecter";
    if (error.message.includes("invalid")) message = "Email ou mot de passe incorrect";
    return NextResponse.json({ error: message }, { status: 401 });
  }
  // Optionnel : placer le token en cookie sécurisé
  // NextResponse.cookies.set("sb-access-token", data.session.access_token, {
  //   httpOnly: true, secure: true, maxAge: ..., path: "/"
  // });

  return NextResponse.json({ success: true, user: data.user }, { status: 200 });
}
