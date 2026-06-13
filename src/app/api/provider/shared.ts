import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiRole } from "@/server/auth/roleGuards";
import type { Json } from "@/types/supabase";
import type { Database as ProviderDatabase } from "@/types/supabase.generated";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "build-time-placeholder-service-role-key";

export const providerDb = createClient<ProviderDatabase>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export const PROVIDER_ROLES = new Set([
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
]);

export async function requireProviderAuth(req: NextRequest) {
  return requireApiRole(req, PROVIDER_ROLES);
}

export function isProviderSchemaMissing(
  error: { code?: string } | null | undefined,
) {
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
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : {};
}
