// src/app/api/profiles/current/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/lib/dbServer";

// 1) Définir le type ici
interface AuthToken {
  id?: string;
  email?: string;
  username?: string;
  name?: string;
  avatar_url?: string | null;
  role?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  location?: string | null;
  option?: string | null;
  search_target?: string | null;
  company_name?: string;
}

export async function GET(req: NextRequest) {
  const rawToken = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  const token = rawToken as AuthToken | null;

  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = token.id;

  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[profiles/current] DB error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(profile, { status: 200 });
}


