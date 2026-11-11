import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "./authOptions";
import { ACTIVE_PROFILE_COOKIE, getApiAuthContext } from "./apiAuth";
import { resolvePrincipalRights } from "./principalRights";

export type CommercialAuthContext = { userId: string; role: string; isAdmin: boolean };

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token", "authjs.session-token",
  "__Secure-next-auth.session-token", "next-auth.session-token",
];
const isAdminRole = (role: unknown) => role === "admin" || role === "super_admin";

function denied(status: 401 | 403 | 503) {
  const error = status === 401 ? "Non authentifié" : status === 403 ? "Accès refusé" : "Vérification des droits indisponible.";
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Scoped to services/pricing. Never derives the principal from sub or selection. */
export async function resolveCommercialAccess(req: NextRequest): Promise<CommercialAuthContext | NextResponse> {
  try {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    let identity: { id?: unknown; role?: unknown } | null = null;
    for (const cookieName of SESSION_COOKIE_NAMES) {
      const token = await getToken({ req, secret, cookieName, secureCookie: cookieName.startsWith("__Secure-") });
      if (token) { identity = token; break; }
    }
    if (!identity) identity = (await auth())?.user ?? null;
    const rights = await resolvePrincipalRights(typeof identity?.id === "string" ? { principalProfileId: identity.id } : null);
    if (!rights.ok) return denied(rights.kind === "identity" ? 401 : rights.kind === "forbidden" ? 403 : 503);

    const principal = rights.context;
    // A revoked administrative claim cannot silently become an ordinary request.
    if (isAdminRole(identity?.role) && !isAdminRole(principal.role)) return denied(403);

    // Retain the existing server-verified account/profile linkage, not its roles.
    const selected = await getApiAuthContext(req);
    if (!selected.userId || !selected.sessionUserId) return denied(401);
    if (selected.sessionUserId.toLowerCase() !== principal.principalProfileId) return denied(403);
    const requestedProfile = req.cookies.get(ACTIVE_PROFILE_COOKIE)?.value;
    if (requestedProfile && requestedProfile.toLowerCase() !== selected.userId.toLowerCase()) return denied(403);
    if (selected.userId.toLowerCase() === principal.principalProfileId) {
      return { userId: principal.principalProfileId, role: principal.role, isAdmin: isAdminRole(principal.role) };
    }

    const profileRights = await resolvePrincipalRights({ principalProfileId: selected.userId });
    if (!profileRights.ok) return denied(profileRights.kind === "unavailable" ? 503 : 403);
    // Selection never grants admin: both the principal and selected profile
    // must currently qualify. Keep the principal's actual administrative level.
    if (isAdminRole(profileRights.context.role)) {
      if (!isAdminRole(principal.role)) return denied(403);
      return { userId: profileRights.context.principalProfileId, role: principal.role, isAdmin: true };
    }
    return { userId: profileRights.context.principalProfileId, role: profileRights.context.role, isAdmin: false };
  } catch {
    // Transport/authentication failures must not expose private diagnostics.
    return denied(503);
  }
}
