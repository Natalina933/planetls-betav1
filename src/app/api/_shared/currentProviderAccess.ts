import { NextRequest, NextResponse } from "next/server";
import { resolveCommercialAccess } from "@/server/auth/commercialAccess";
import { PROVIDER_ROLES } from "@/app/lib/missionPermissions";

export async function requireCurrentProviderAccess(req: NextRequest) {
  const auth = await resolveCommercialAccess(req);
  if (auth instanceof NextResponse) return { ok: false as const, response: auth };
  if (!PROVIDER_ROLES.has(auth.role)) {
    return { ok: false as const, response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { ok: true as const, auth };
}
