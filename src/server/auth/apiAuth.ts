import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "@/server/auth/authOptions";
import { db } from "@/app/lib/dbServer";
import { resolveUserRole } from "@/app/utils/roles";

export const ACTIVE_PROFILE_COOKIE = "planetls_active_profile_id";

function buildWorkspaceLinkMarker(email: string) {
  return `workspace_parent_email:${email.toLowerCase()}`;
}

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
  sessionUserId?: string;
  activeProfileId?: string;
}

async function resolveActiveProfile(req: NextRequest, context: Omit<ApiAuthContext, "isAdmin">) {
  const requestedProfileId = req.cookies.get(ACTIVE_PROFILE_COOKIE)?.value;
  if (!requestedProfileId || !context.email) return context;
  if (requestedProfileId === context.userId) return { ...context, activeProfileId: requestedProfileId };

  const { data: profile, error } = await db
    .from("profiles")
    .select("id,email,role,category,additional_info")
    .eq("id", requestedProfileId)
    .maybeSingle();

  if (error || !profile) {
    return context;
  }

  const isSameEmail = profile.email?.toLowerCase() === context.email.toLowerCase();
  const isLinkedProfile =
    typeof profile.additional_info === "string" &&
    profile.additional_info.toLowerCase().includes(buildWorkspaceLinkMarker(context.email));

  if (!isSameEmail && !isLinkedProfile) {
    return context;
  }

  const role = resolveUserRole(profile.role, profile.category) ?? context.role;
  return {
    ...context,
    userId: profile.id,
    role,
    activeProfileId: profile.id,
    sessionUserId: context.sessionUserId ?? context.userId,
  };
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

    const resolved = await resolveActiveProfile(req, {
      userId,
      email,
      role,
      sessionUserId: userId,
    });
    const isAdmin = resolved.role === "admin" || resolved.role === "super_admin";

    return { ...resolved, isAdmin };
  }

  const session = await auth();
  const sessionUser = session?.user;

  if (sessionUser?.id) {
    const role = typeof sessionUser.role === "string" ? sessionUser.role : "";
    const resolved = await resolveActiveProfile(req, {
      userId: sessionUser.id,
      email: typeof sessionUser.email === "string" ? sessionUser.email : undefined,
      role,
      sessionUserId: sessionUser.id,
    });
    const isAdmin = resolved.role === "admin" || resolved.role === "super_admin";

    return {
      ...resolved,
      isAdmin,
    };
  }

  return { userId: undefined, email: undefined, role: "", isAdmin: false };
}
