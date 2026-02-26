import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/lib/dbServer";

export type PricingType = "hourly" | "fixed" | "monthly" | "custom";

export interface AuthContext {
  userId: string;
  isAdmin: boolean;
}

const normalizeRole = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  const userId = typeof token?.sub === "string" ? token.sub : "";
  if (!userId) return null;

  const tokenRole = normalizeRole((token as Record<string, unknown> | null)?.role);
  if (tokenRole === "admin") {
    return { userId, isAdmin: true };
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const profileRole = normalizeRole(profile?.role);

  return {
    userId,
    isAdmin: profileRole === "admin",
  };
}

export function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

