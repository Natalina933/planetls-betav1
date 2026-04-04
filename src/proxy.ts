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

async function getProxyToken(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  for (const cookieName of SESSION_COOKIE_NAMES) {
    const token = await getToken({
      req,
      secret,
      cookieName,
      secureCookie: cookieName.startsWith("__Secure-"),
    });

    if (token) {
      console.info("[PROXY] token resolved", {
        pathname: req.nextUrl.pathname,
        cookieName,
        role: token.role ?? null,
      });
      return token;
    }
  }

  console.warn("[PROXY] token missing", {
    pathname: req.nextUrl.pathname,
    cookies: SESSION_COOKIE_NAMES.filter((name) => Boolean(req.cookies.get(name)?.value)),
  });
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getProxyToken(req);
  const sessionCookiePresent = hasSessionCookie(req);

  if (!token) {
    if (sessionCookiePresent) {
      console.warn("[PROXY] session cookie present but token unreadable", { pathname });
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/dashboard")) {
      console.warn("[PROXY] dashboard access denied without token", { pathname });
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  }

  const role = (token.role as string | undefined)?.toLowerCase();
  const targetFolder = role ? ROLE_FOLDER_MAP[role] : null;

  if (!targetFolder) {
    console.error("[PROXY] unknown role", { pathname, role });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const dashboardPrefix = `/dashboard/${targetFolder}`;

  if (pathname.startsWith("/dashboard") && !pathname.startsWith(dashboardPrefix)) {
    console.info("[PROXY] redirecting to role dashboard", {
      pathname,
      dashboardPrefix,
      role,
    });
    return NextResponse.redirect(new URL(dashboardPrefix, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
