import { NextRequest, NextResponse } from "next/server";
import { resolveCommercialAccess } from "@/server/auth/commercialAccess";
import { db } from "@/app/lib/dbServer";
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

export async function getAuthContext(req: NextRequest): Promise<AuthContext | NextResponse> {
  return resolveCommercialAccess(req);
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

