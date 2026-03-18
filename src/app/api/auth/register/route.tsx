import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { categoryToRole } from "@/app/utils/roles";
import { verifyCaptcha } from "@/app/lib/captcha";
import { consumePersistentRateLimit } from "@/app/lib/persistentRateLimit";

const REGISTER_RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const REGISTER_RATE_LIMIT_MAX_ATTEMPTS = 5;

const cleanString = (val?: string | null) =>
  val ? val.replace(/[<>]/g, "").trim().substring(0, 1000) : null;

const mapYearsToInt = (years?: string | null): number | null => {
  if (!years) return null;
  if (years.startsWith("0-1")) return 1;
  if (years.startsWith("1-3")) return 3;
  if (years.startsWith("+3")) return 4;
  return null;
};

const getClientIp = (req: NextRequest): string =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip")?.trim() ||
  "unknown";

const registerSchema = z.object({
  username: z.string().min(3).max(30).trim(),
  password: z.string().min(8),
  email: z.string().email().toLowerCase().trim(),
  firstName: z.string().min(1).max(50).transform(cleanString),
  lastName: z.string().min(1).max(50).transform(cleanString),
  phone: z.string().optional().nullable().transform(cleanString),
  avatar_url: z.string().url().optional().nullable(),
  category: z.string().optional().nullable().transform(cleanString),
  search_target: z.string().optional().nullable().transform(cleanString),
  option: z.string().optional().nullable().transform(cleanString),
  location: z.string().optional().nullable().transform(cleanString),
  additionalInfo: z.string().optional().nullable().transform(cleanString),
  experienceLevel: z.string().optional().nullable().transform(cleanString),
  yearsExperience: z.string().optional().nullable(),
  captchaToken: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const clientIp = getClientIp(req);
    const rateLimit = await consumePersistentRateLimit({
      action: "register",
      key: `register:${clientIp}`,
      ip: clientIp,
      windowMs: REGISTER_RATE_LIMIT_WINDOW_MS,
      maxAttempts: REGISTER_RATE_LIMIT_MAX_ATTEMPTS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives de creation de compte. Reessayez plus tard." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter ?? 60),
          },
        },
      );
    }

    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: result.error.format() },
        { status: 400 },
      );
    }

    const data = result.data;
    const captcha = await verifyCaptcha({
      token: data.captchaToken,
      ip: clientIp,
    });

    if (!captcha.ok) {
      return NextResponse.json(
        { error: captcha.error || "Captcha invalide." },
        { status: 400 },
      );
    }

    const role = categoryToRole(data.category || "");

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", data.username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "Nom d'utilisateur deja pris" }, { status: 409 });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: {
        username: data.username,
        role,
      },
    });

    if (authError) {
      const status = authError.message.includes("exists") ? 409 : 500;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const userId = authData.user?.id;
    if (!userId) throw new Error("Echec de la recuperation de l'ID utilisateur");

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      username: data.username,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatar_url,
      category: data.category,
      role,
      search_target: data.search_target,
      option: data.option,
      location: data.location,
      additional_info: data.additionalInfo,
      experience_level: data.experienceLevel,
      years_experience: mapYearsToInt(data.yearsExperience),
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    return NextResponse.json(
      {
        success: true,
        user: { id: userId, username: data.username, role },
        verification_required: true,
      },
      { status: 201 },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue";

    console.error("[REGISTER_ERROR]:", err);

    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
