// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
// import { categoryToRole } from "@/app/utils/roles";

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
};

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔓 Autoriser les chemins publics
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 🔑 Vérification du token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    console.warn("[MIDDLEWARE] Aucun token trouvé → redirection vers /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🎭 Normalisation du rôle
  // 🎭 Rôle déjà normalisé dans le token
  const tokenRole = (token.role as string | undefined)?.toLowerCase();
  if (!tokenRole) {
    console.error("[MIDDLEWARE] Rôle absent dans le token");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 📂 Mapping vers le dossier cible
  const targetFolder = ROLE_FOLDER_MAP[tokenRole];
  if (!targetFolder) {
    console.error("[MIDDLEWARE] Rôle non mappé :", tokenRole);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🚦 Redirection si l’utilisateur n’est pas déjà dans son dashboard
  if (!pathname.startsWith(`/dashboard/${targetFolder}`)) {
    console.log(
      `[MIDDLEWARE] Redirection de ${token.role} → /dashboard/${targetFolder}`
    );
    return NextResponse.redirect(
      new URL(`/dashboard/${targetFolder}`, req.url)
    );
  }

  // ✅ Autoriser la requête
  return NextResponse.next();
}

// ⚙️ Config : matcher uniquement les routes protégées
export const config = {
  matcher: ["/dashboard/:path*", "/api/protected/:path*"],
};
