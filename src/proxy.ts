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
  artisan: "provider",
  artisan_pro: "provider",
};

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];
const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const hasSessionCookie = (req: NextRequest): boolean =>
  SESSION_COOKIE_NAMES.some((name) => Boolean(req.cookies.get(name)?.value));

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

const token = await getToken({
  req,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
});
const sessionCookiePresent = hasSessionCookie(req);

if (!token) {
  // Cookie présent mais token invalide → on nettoie / on force login
  if (sessionCookiePresent) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    // Exemple : nettoyage éventuel (si tu gères des cookies custom)
    // res.cookies.set("next-auth.session-token", "", { maxAge: 0 });
    return res;
  }

  // Pas de token et pas de cookie → juste non connecté
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}


  const role = (token.role as string | undefined)?.toLowerCase();
  const targetFolder = role ? ROLE_FOLDER_MAP[role] : null;

  if (!targetFolder) {
    console.error("[PROXY] Role inconnu:", role);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const dashboardPrefix = `/dashboard/${targetFolder}`;

  if (pathname.startsWith("/dashboard") && !pathname.startsWith(dashboardPrefix)) {
    return NextResponse.redirect(new URL(dashboardPrefix, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
