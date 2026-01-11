// src/app/api/profiles/current/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/lib/dbServer";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  if (!token || typeof token.id !== "string") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = token.id;

  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[profiles/current]", error);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }

  return NextResponse.json(profile, { status: 200 });
}
