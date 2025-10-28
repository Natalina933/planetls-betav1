// src/middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { categoryToRole } from "@/app/utils/roles";

export async function middleware(req: NextRequest) {
  console.log("[MIDDLEWARE] Start request:", req.nextUrl.pathname);

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("[MIDDLEWARE] Token:", token);

  if (!token) {
    console.log("[MIDDLEWARE] No token found, redirect to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Ici, token.role est déjà la valeur code (ex: "concierge", "owner")
  // On prévoit le mapping au cas où on aurait stocké un label UX par erreur
  const folderName = categoryToRole(token.role as string);
  console.log("[MIDDLEWARE] Resolved folderName:", folderName);

  if (!folderName) {
    console.log("[MIDDLEWARE] Invalid role, redirect to /unauthorized");
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (req.nextUrl.pathname === "/dashboard") {
    console.log("[MIDDLEWARE] Redirect /dashboard to /dashboard/" + folderName);
    return NextResponse.redirect(new URL(`/dashboard/${folderName}`, req.url));
  }

  if (req.nextUrl.pathname.startsWith("/dashboard/")) {
    const requestedRole = req.nextUrl.pathname.split("/")[2];
    if (requestedRole !== folderName) {
      console.log(
        `[MIDDLEWARE] Role mismatch: trying to access ${requestedRole}, user has role ${folderName}`
      );
      return NextResponse.redirect(
        new URL(`/dashboard/${folderName}`, req.url)
      );
    }
    console.log("[MIDDLEWARE] Access allowed to", req.nextUrl.pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
