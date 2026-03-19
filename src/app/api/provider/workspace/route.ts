import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireActor } from "@/app/lib/apiSecurity";

const PROVIDER_ROLES = new Set(["provider", "provider_pro", "artisan", "artisan_pro"]);

export async function GET(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "provider workspace auth",
      allowedRoles: PROVIDER_ROLES,
      actionLabel: "consulter votre espace prestataire",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { actor } = actorResult;
    const { data: profile, error } = await db
      .from("profiles")
      .select(
        "id, first_name, last_name, username, email, phone, city, postal_code, company_name, website, role, category",
      )
      .eq("id", actor.userId)
      .maybeSingle();

    if (error) {
      console.error("[provider/workspace] DB error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        profile,
        summary: {
          display_name:
            `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
            profile.company_name ||
            profile.username ||
            "Artisan",
          location: [profile.postal_code, profile.city].filter(Boolean).join(" ") || null,
          is_pro: profile.role === "provider_pro" || profile.role === "artisan_pro",
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[provider/workspace] ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
