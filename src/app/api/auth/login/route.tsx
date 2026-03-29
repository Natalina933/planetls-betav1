import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { resolveUserRole } from "@/app/utils/roles";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
});

type LoginBody = z.infer<typeof loginSchema>;

const loginAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter((t) => now - t < 300_000);
  if (recentAttempts.length >= 5) {
    const retryAfter = Math.ceil((300_000 - (now - recentAttempts[0])) / 1000);
    return { allowed: false, retryAfter };
  }
  loginAttempts.set(ip, [...recentAttempts, now]);
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttempts.entries()) {
    const recent = attempts.filter((t) => now - t < 300_000);
    if (recent.length === 0) loginAttempts.delete(ip);
    else loginAttempts.set(ip, recent);
  }
}, 60_000);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const retryAfterStr = rateLimit.retryAfter?.toString() ?? "300";
    return NextResponse.json(
      { error: `Trop de tentatives. Reessayez dans ${retryAfterStr} secondes.` },
      { status: 429, headers: { "Retry-After": retryAfterStr } },
    );
  }

  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Donnees invalides",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, first_name, last_name, email, avatar_url, role, category, phone, location, option, search_target",
    )
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Impossible de recuperer le profil" }, { status: 500 });
  }

  const role = resolveUserRole(profile.role, profile.category);
  if (!role) {
    return NextResponse.json({ error: "Role inconnu, acces refuse" }, { status: 403 });
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile.username,
        name: profile.first_name,
        role,
        avatar_url: profile.avatar_url ?? null,
        firstName: profile.first_name,
        lastName: profile.last_name,
        category: profile.category,
        phone: profile.phone,
        location: profile.location,
        option: profile.option,
        searchTarget: profile.search_target,
      },
    },
    { status: 200 },
  );
}
