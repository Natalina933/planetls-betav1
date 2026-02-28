import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_FOLDER_MAP: Record<string, string> = {
  admin: "admin",
  super_admin: "admin",
  concierge: "concierge",
  concierge_pro: "concierge",
  owner: "owner",
  owner_pro: "owner",
  provider: "provider",
  provider_pro: "provider",
};

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* --------------------------------------------------
   * 1. 🔓 Routes publiques
   * -------------------------------------------------- */
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  /* --------------------------------------------------
   * 2. 🔑 Token
   * -------------------------------------------------- */
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  /* --------------------------------------------------
   * 3. 🚫 Pas connecté → login
   * -------------------------------------------------- */
  if (!token) {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  /* --------------------------------------------------
   * 4. 🎭 Rôle utilisateur
   * -------------------------------------------------- */
  const role = (token.role as string | undefined)?.toLowerCase();
  const targetFolder = role ? ROLE_FOLDER_MAP[role] : null;

  if (!targetFolder) {
    console.error("[PROXY] Rôle inconnu :", role);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  /* --------------------------------------------------
   * 5. 🚦 Protection dashboard
   * -------------------------------------------------- */
  const dashboardPrefix = `/dashboard/${targetFolder}`;

  if (
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith(dashboardPrefix)
  ) {
    return NextResponse.redirect(new URL(dashboardPrefix, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};


