import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase";

export const PROVIDER_ROLES = new Set(["provider", "provider_pro", "artisan", "artisan_pro"]);

export async function requireProviderAuth(req: NextRequest) {
  const auth = await getApiAuthContext(req);

  if (!auth.userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!PROVIDER_ROLES.has(auth.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    auth,
  };
}

export function isProviderSchemaMissing(error: { code?: string } | null | undefined) {
  return error?.code === "42P01";
}

export function providerSchemaMissingResponse(tableName: string) {
  return NextResponse.json(
    {
      error: `Table ${tableName} introuvable. Appliquez la migration provider.`,
    },
    { status: 500 },
  );
}

export function toProviderJsonRecord(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}
