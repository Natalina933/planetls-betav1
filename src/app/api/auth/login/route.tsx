// src/app/api/auth/login/route.tsx
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
});

const loginAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(t => now - t < 300000);
  if (recentAttempts.length >= 5) {
    const retryAfter = Math.ceil((300000 - (now - recentAttempts[0])) / 1000);
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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
  console.log("[LOGIN API] Attempt from IP:", ip);

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const retryAfterStr = rateLimit.retryAfter !== undefined ? rateLimit.retryAfter.toString() : "300";
    console.log("[LOGIN API] Rate limit exceeded for IP:", ip);
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${retryAfterStr} secondes.` },
      { status: 429, headers: { "Retry-After": retryAfterStr } }
    );
  }

  let body;
  try {
    body = await request.json();
    console.log("[LOGIN API] Request body:", body);
  } catch (e) {
    console.error("[LOGIN API] Invalid JSON format:", e);
    return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    console.log("[LOGIN API] Validation errors:", result.error);
    return NextResponse.json(
      { error: "Données invalides", details: result.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })) },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[LOGIN API] Supabase environment variables missing");
    return NextResponse.json({ error: "Configuration serveur invalide" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    console.log("[LOGIN API] Supabase auth error:", error.message);
    const message = error.message.toLowerCase().includes("invalid") ? "Email ou mot de passe incorrect" : "Impossible de se connecter";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  console.log("[LOGIN API] User logged in:", data.user);

  return NextResponse.json({ success: true, user: data.user }, { status: 200 });
}
