// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { categoryToRole } from "@/app/utils/roles";

// Mapping interne rôle → dossier Next.js
const ROLE_FOLDER_MAP: Record<string, string> = {
  admin: "admin",
  super_admin: "admin",
  concierge: "concierge",
  concierge_pro: "concierge",
  owner: "propriétaire",
  owner_pro: "propriétaire",
  provider: "artisan",
  provider_pro: "artisan",
  // artisan: "artisan",
  // artisan_pro: "artisan",
};

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    console.warn("[MIDDLEWARE] No token found, redirect to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const normalizedRole = categoryToRole(token.role as string | null);
  if (!normalizedRole) {
    console.warn("[MIDDLEWARE] Unknown role:", token.role);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const targetFolder = ROLE_FOLDER_MAP[normalizedRole];
  if (!targetFolder) {
    console.warn("[MIDDLEWARE] Role not mapped:", normalizedRole);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!pathname.startsWith(`/dashboard/${targetFolder}`)) {
    console.log(`[MIDDLEWARE] Redirecting ${token.role} to /dashboard/${targetFolder}`);
    return NextResponse.redirect(new URL(`/dashboard/${targetFolder}`, req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/api/protected/:path*"] };
