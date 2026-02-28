import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { isAllowedServiceRole } from "@/app/api/services/pure";

export { isAllowedServiceRole } from "@/app/api/services/pure";

export type ServiceAuthContext = {
  userId: string;
  role: string;
  isAdmin: boolean;
};

export async function getServiceAuthContext(req: NextRequest): Promise<ServiceAuthContext | null> {
  const auth = await getApiAuthContext(req);
  if (!auth.userId) {
    return null;
  }

  return {
    userId: auth.userId,
    role: auth.role,
    isAdmin: auth.isAdmin,
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
