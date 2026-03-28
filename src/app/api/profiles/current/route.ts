import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/server/auth/apiAuth";
import { fetchCurrentProfile } from "@/server/profiles/currentProfile";

export async function GET(req: NextRequest) {
  const { userId } = await getApiAuthContext(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await fetchCurrentProfile(userId);

  if (error) {
    console.error("[profiles/current] DB error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile, { status: 200 });
}
