import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "@/server/auth/authOptions";

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

export interface ApiAuthContext {
  userId?: string;
  email?: string;
  role: string;
  isAdmin: boolean;
}

export async function getApiAuthContext(req: NextRequest): Promise<ApiAuthContext> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  let token = null;

  for (const cookieName of SESSION_COOKIE_NAMES) {
    token = await getToken({
      req,
      secret,
      cookieName,
      secureCookie: cookieName.startsWith("__Secure-"),
    });
    if (token) break;
  }

  if (token) {
    const userId =
      typeof token.id === "string"
        ? token.id
        : typeof token.sub === "string"
          ? token.sub
          : undefined;
    const email = typeof token.email === "string" ? token.email : undefined;
    const role = typeof token.role === "string" ? token.role : "";
    const isAdmin = role === "admin" || role === "super_admin";

    return { userId, email, role, isAdmin };
  }

  const session = await auth();
  const sessionUser = session?.user;

  if (sessionUser?.id) {
    const role = typeof sessionUser.role === "string" ? sessionUser.role : "";
    const isAdmin = role === "admin" || role === "super_admin";

    return {
      userId: sessionUser.id,
      email: typeof sessionUser.email === "string" ? sessionUser.email : undefined,
      role,
      isAdmin,
    };
  }

  return { userId: undefined, email: undefined, role: "", isAdmin: false };
}
