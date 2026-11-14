import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "./authOptions";
import { resolvePrincipalRights } from "./principalRights";

type AdminFailure = { ok: false; status: 401 | 403 | 503 };
type AdminContext = {
  userId: string;
  sessionUserId: string;
  role: "admin" | "super_admin";
  isAdmin: true;
};

// Read the existing authentication cookies, never the active-profile selector.
const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

async function checkAdminPrincipal(principalProfileId: string | undefined): Promise<
  { ok: true; auth: AdminContext } | AdminFailure
> {
  const rights = await resolvePrincipalRights(principalProfileId ? { principalProfileId } : null);
  if (!rights.ok) {
    return { ok: false, status: rights.kind === "identity" ? 401 : rights.kind === "forbidden" ? 403 : 503 };
  }
  const { role } = rights.context;
  if (role !== "admin" && role !== "super_admin") return { ok: false, status: 403 };
  return {
    ok: true,
    auth: { userId: rights.context.principalProfileId, sessionUserId: rights.context.principalProfileId, role, isAdmin: true },
  };
}

/** auth() supplies the application ID written by PlanetLS's session callback. */
export async function resolveAdminSessionAccess() {
  try {
    const session = await auth();
    const checked = await checkAdminPrincipal(session?.user?.id);
    if (!checked.ok) return checked;
    if (!session?.user) return { ok: false, status: 401 } as const;
    return {
      ...checked,
      session: {
        ...session,
        user: { ...session.user, id: checked.auth.userId, role: checked.auth.role, status: "active" },
      },
    };
  } catch {
    return { ok: false, status: 503 } as const;
  }
}

function denied(status: AdminFailure["status"]) {
  const error = status === 401 ? "Non authentifié" : status === 403 ? "Accès refusé" : "Vérification des droits indisponible.";
  return { ok: false as const, response: NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } }) };
}

/** No JWT role, sub, request parameter, or selected profile grants admin rights. */
export async function requireAdminApiAccess(req: NextRequest) {
  try {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    for (const cookieName of SESSION_COOKIE_NAMES) {
      const token = await getToken({ req, secret, cookieName, secureCookie: cookieName.startsWith("__Secure-") });
      if (!token) continue;
      // token.id is set by applyCustomUserToToken after PlanetLS authentication.
      const checked = await checkAdminPrincipal(typeof token.id === "string" ? token.id : undefined);
      return checked.ok ? { ok: true as const, auth: checked.auth } : denied(checked.status);
    }
    const checked = await resolveAdminSessionAccess();
    return checked.ok ? { ok: true as const, auth: checked.auth } : denied(checked.status);
  } catch {
    // Never return or log raw authentication/transport errors.
    return denied(503);
  }
}
