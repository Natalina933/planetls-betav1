import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const categoryToRole = (cat: string | null | undefined): string => {
  const c = (cat || "").trim().toLowerCase();
  if (c === "proprietaire_pro") return "owner_pro";
  if (c.startsWith("proprietaire")) return "owner";
  if (c === "concierge_pro") return "concierge_pro";
  if (c.startsWith("concierge")) return "concierge";
  if (c === "service_pro") return "provider_pro";
  if (c.startsWith("service")) return "provider";
  if (c === "admin") return "admin";
  if (c === "super_admin") return "super_admin";
  return "owner";
};

export async function middleware(req: NextRequest) {
  console.log("[MIDDLEWARE] Start request:", req.nextUrl.pathname);

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("[MIDDLEWARE] Token:", token);

  if (!token) {
    console.log("[MIDDLEWARE] No token found, redirect to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

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
      console.log(`[MIDDLEWARE] Role mismatch: trying to access ${requestedRole}, user has role ${folderName}`);
      return NextResponse.redirect(new URL(`/dashboard/${folderName}`, req.url));
    }
    console.log("[MIDDLEWARE] Access allowed to", req.nextUrl.pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
