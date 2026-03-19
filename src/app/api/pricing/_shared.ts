import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireActor } from "@/app/lib/apiSecurity";
import {
  ALLOWED_PRICING_ROLES,
  isAllowedPricingRole,
  toOptionalNumber,
} from "@/app/api/pricing/pure";

export { ALLOWED_PRICING_ROLES, isAllowedPricingRole, toOptionalNumber };

export type PricingType = "hourly" | "fixed" | "monthly" | "custom";

export interface AuthContext {
  userId: string;
  role: string;
  isAdmin: boolean;
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const result = await requirePricingAuthContext(req);
  if (!result.ok) {
    return null;
  }

  return result.auth;
}

export async function requirePricingAuthContext(
  req: NextRequest,
): Promise<{ ok: true; auth: AuthContext } | { ok: false; response: NextResponse }> {
  const actorResult = await requireActor(req, {
    logLabel: "pricing auth",
    allowedRoles: ALLOWED_PRICING_ROLES,
    actionLabel: "gerer votre configuration tarifaire",
  });

  if (!actorResult.ok) {
    return actorResult;
  }

  if (!isAllowedPricingRole(actorResult.actor.role) && !actorResult.actor.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acces refuse" }, { status: 403 }),
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

interface PricingListOptions {
  profileId?: string | null;
  serviceId?: string | null;
  type?: string | null;
  isAdmin: boolean;
  userId: string;
}

export async function fetchPricingList(options: PricingListOptions) {
  const { profileId, serviceId, type, isAdmin, userId } = options;

  let query = db.from("services_pricing").select(`
    *,
    service:services_catalog(id, category, service, description)
  `);

  if (isAdmin && profileId) {
    query = query.eq("profile_id", profileId);
  } else {
    query = query.eq("profile_id", userId);
  }

  if (serviceId) {
    const parsedServiceId = Number(serviceId);
    if (!Number.isFinite(parsedServiceId)) {
      return { data: null, error: "serviceId invalide" as const, status: 400 as const };
    }
    query = query.eq("service_id", parsedServiceId);
  }

  if (type) {
    query = query.eq("type", type);
  }

  const result = await query.order("created_at", { ascending: false });
  return { data: result.data ?? [], error: result.error, status: 200 as const };
}
