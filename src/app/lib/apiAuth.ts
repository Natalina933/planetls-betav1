import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export interface ApiAuthContext {
  userId?: string;
  role: string;
  isAdmin: boolean;
}

export async function getApiAuthContext(req: NextRequest): Promise<ApiAuthContext> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  const userId = typeof token?.sub === "string" ? token.sub : undefined;
  const role = typeof token?.role === "string" ? token.role : "";
  const isAdmin = role === "admin" || role === "super_admin";

  return { userId, role, isAdmin };
}
