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

  console.log("[LOGIN API] Requete recue", {
    ip,
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
  });

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const retryAfterStr = rateLimit.retryAfter?.toString() ?? "300";
    console.warn("[LOGIN API] Blocage rate limit", { ip, retryAfter: retryAfterStr });
    return NextResponse.json(
      { error: `Trop de tentatives. Reessayez dans ${retryAfterStr} secondes.` },
      { status: 429, headers: { "Retry-After": retryAfterStr } },
    );
  }

  let body: LoginBody;
  try {
    body = await request.json();
    console.log("[LOGIN API] Payload recu", {
      hasEmail: Boolean(body.email),
      hasPassword: Boolean(body.password),
    });
  } catch {
    console.warn("[LOGIN API] Payload JSON invalide");
    return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    console.warn("[LOGIN API] Validation zod echouee", {
      issues: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
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
    console.warn("[LOGIN API] Echec signInWithPassword", {
      message: error?.message ?? null,
      code: error?.code ?? null,
    });
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

  console.log("[LOGIN API] Utilisateur Supabase authentifie", {
    userId: data.user.id,
    email: data.user.email ?? null,
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, first_name, last_name, email, avatar_url, role, category, phone, location, option, search_target",
    )
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[LOGIN API] Profile fetch error", {
      message: profileError?.message ?? null,
      userId: data.user.id,
    });
    return NextResponse.json({ error: "Impossible de recuperer le profil" }, { status: 500 });
  }

  console.log("[LOGIN API] Profil charge", {
    profileId: profile.id,
    rawRole: profile.role ?? null,
    category: profile.category ?? null,
  });

  const role = resolveUserRole(profile.role, profile.category);
  if (!role) {
    console.warn("[LOGIN API] Role non mappe", {
      rawRole: profile.role ?? null,
      category: profile.category ?? null,
      profileId: profile.id,
    });
    return NextResponse.json({ error: "Role inconnu, acces refuse" }, { status: 403 });
  }

  console.log("[LOGIN API] Reponse finale", {
    profileId: profile.id,
    mappedRole: role,
  });

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
