import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

const CURRENT_PROFILE_SELECT = [
  "id",
  "created_at",
  "updated_at",
  "email",
  "username",
  "first_name",
  "last_name",
  "phone",
  "avatar_url",
  "avatar_scale",
  "avatar_offset_x",
  "avatar_offset_y",
  "avatar_rotation",
  "role",
  "status",
  "category",
  "company_name",
  "location",
  "street_address",
  "postal_code",
  "city",
  "country",
  "website",
  "linkedin",
  "facebook",
  "instagram",
  "additional_info",
  "option",
  "search_target",
].join(", ");

export async function GET(req: NextRequest) {
  const { userId } = await getApiAuthContext(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select(CURRENT_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profiles/current] DB error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile, { status: 200 });
}
