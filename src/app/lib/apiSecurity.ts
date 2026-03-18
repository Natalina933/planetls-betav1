import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

export type ActorProfile = {
  id: string;
  role: string | null;
  status: string | null;
};

export type ActorContext = {
  userId: string;
  role: string;
  isAdmin: boolean;
  profile: ActorProfile;
};

export type ParticipantResource = {
  concierge_profile_id: string | null;
  owner_profile_id: string | null;
};

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export async function loadActorProfile(userId: string, logLabel: string): Promise<ActorProfile | null> {
  const { data, error } = await db
    .from("profiles")
    .select("id, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(`[${logLabel}] profile lookup error:`, error);
    throw new Error("PROFILE_LOOKUP_FAILED");
  }

  return data;
}

export async function requireActor(
  req: NextRequest,
  options: {
    logLabel: string;
    allowedRoles?: Set<string>;
    actionLabel?: string;
  },
): Promise<
  | { ok: true; actor: ActorContext }
  | { ok: false; response: NextResponse }
> {
  const authContext = await getApiAuthContext(req);
  if (!authContext.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentification requise." }, { status: 401 }),
    };
  }

  const actorProfile = await loadActorProfile(authContext.userId, options.logLabel);
  if (!actorProfile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profil utilisateur introuvable." }, { status: 404 }),
    };
  }

  if (actorProfile.status === "suspended" || actorProfile.status === "deleted") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Votre compte ne peut pas effectuer cette action." },
        { status: 403 },
      ),
    };
  }

  const role = typeof actorProfile.role === "string" ? actorProfile.role : authContext.role;
  const isAdmin = ADMIN_ROLES.has(role);

  if (options.allowedRoles && !isAdmin && !options.allowedRoles.has(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Le rôle '${role || "inconnu"}' n'est pas autorisé à ${
            options.actionLabel ?? "effectuer cette action"
          }.`,
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    actor: {
      userId: authContext.userId,
      role,
      isAdmin,
      profile: actorProfile,
    },
  };
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.has(role);
}

export function canAccessParticipantResource(
  actor: Pick<ActorContext, "userId" | "isAdmin">,
  resource: ParticipantResource,
): boolean {
  return (
    actor.isAdmin ||
    resource.concierge_profile_id === actor.userId ||
    resource.owner_profile_id === actor.userId
  );
}
