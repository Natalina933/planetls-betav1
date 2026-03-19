import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireActor } from "@/app/lib/apiSecurity";

export { isAllowedServiceRole } from "@/app/api/services/pure";
import { isAllowedServiceRole } from "@/app/api/services/pure";

export type ServiceAuthContext = {
  userId: string;
  role: string;
  isAdmin: boolean;
};

const SERVICE_ALLOWED_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
]);

export async function getServiceAuthContext(req: NextRequest): Promise<ServiceAuthContext | null> {
  const result = await requireServiceAuthContext(req);
  if (!result.ok) {
    return null;
  }

  return result.auth;
}

export async function requireServiceAuthContext(
  req: NextRequest,
): Promise<{ ok: true; auth: ServiceAuthContext } | { ok: false; response: NextResponse }> {
  const actorResult = await requireActor(req, {
    logLabel: "services auth",
    allowedRoles: SERVICE_ALLOWED_ROLES,
    actionLabel: "gerer vos services",
  });

  if (!actorResult.ok) {
    return actorResult;
  }

  if (!isAllowedServiceRole(actorResult.actor.role) && !actorResult.actor.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non autorise" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    auth: {
      userId: actorResult.actor.userId,
      role: actorResult.actor.role,
      isAdmin: actorResult.actor.isAdmin,
    },
  };
}

export function serviceAuthError(status: 401 | 403) {
  return NextResponse.json(
    { error: status === 401 ? "Non authentifie" : "Non autorise" },
    { status },
  );
}

export async function findOwnedServicePackage(packageId: string, auth: ServiceAuthContext) {
  const { data, error } = await db
    .from("services_packages")
    .select("id, profile_id")
    .eq("id", packageId)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: "Erreur DB" }, { status: 500 }) };
  }

  if (!data) {
    return { error: NextResponse.json({ error: "Pack introuvable" }, { status: 404 }) };
  }

  if (!auth.isAdmin && data.profile_id !== auth.userId) {
    return { error: NextResponse.json({ error: "Non autorise" }, { status: 403 }) };
  }

  return { data };
}
