import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

const PROVIDER_ROLES = new Set(["provider", "provider_pro", "artisan", "artisan_pro"]);

export async function GET(req: NextRequest) {
  const { userId, role } = await getApiAuthContext(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!PROVIDER_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("id, first_name, last_name, username, email, phone, city, postal_code, company_name, website, availability_hours, service_area, service_radius_km, role, category")
    .eq("id", userId)
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
        location: [profile.postal_code, profile.city].filter(Boolean).join(" ") || profile.service_area || null,
        is_pro: profile.role === "provider_pro" || profile.role === "artisan_pro",
      },
    },
    { status: 200 },
  );
}
