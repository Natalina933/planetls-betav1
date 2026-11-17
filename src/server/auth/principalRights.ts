import "server-only";

import { isUserRole } from "../../app/utils/roles";
import type { UserRole } from "../../types/supabase";

/**
 * Precondition: the caller has authenticated this PlanetLS profile ID.
 * authOptions.ts writes it to token.id; neither token.sub nor a request body
 * establishes this identity. This resolver does not authenticate a JWT.
 */
export type AuthenticatedPrincipalIdentity = Readonly<{
  principalProfileId: string;
}>;

export type PrincipalRightsContext = Readonly<{
  principalProfileId: string;
  role: UserRole;
  status: "active";
}>;

export type PrincipalRightsResult =
  | { ok: true; context: PrincipalRightsContext }
  | { ok: false; kind: "identity"; reason: "invalid_identity" | "profile_not_found" }
  | { ok: false; kind: "forbidden"; reason: "inactive_profile" | "invalid_role" }
  | { ok: false; kind: "unavailable"; reason: "profile_read_failed" | "invalid_profile_data" };

/** Unknown data is validated even when the transport's compile-time types exist. */
export type PrincipalProfileReader = (principalProfileId: string) => Promise<{
  data: unknown;
  error: unknown;
}>;

const PROFILE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function readPrincipalProfile(principalProfileId: string) {
  // Keep client/configuration loading inside the resolver's error boundary.
  const { db, isSupabaseServerConfigured } = await import("../db/dbServer");
  if (!isSupabaseServerConfigured) {
    return { data: null, error: true };
  }

  return db.from("profiles").select("id,role,status").eq("id", principalProfileId).maybeSingle();
}

/**
 * Server-only construction seam for synthetic tests. The production export
 * below binds the real reader; no request parameter can replace it.
 * No memoization: every invocation reads current persisted rights.
 */
export function createPrincipalRightsResolver(readProfile: PrincipalProfileReader) {
  return async function resolve(identity: AuthenticatedPrincipalIdentity | null | undefined): Promise<PrincipalRightsResult> {
    const id = identity?.principalProfileId;
    if (typeof id !== "string" || !PROFILE_ID_PATTERN.test(id)) {
      return { ok: false, kind: "identity", reason: "invalid_identity" };
    }
    const principalProfileId = id.toLowerCase();

    try {
      const result = await readProfile(principalProfileId);
      if (!result || typeof result !== "object" || !("data" in result) || !("error" in result)) {
        return { ok: false, kind: "unavailable", reason: "invalid_profile_data" };
      }
      if (result.error !== null) {
        return { ok: false, kind: "unavailable", reason: "profile_read_failed" };
      }
      if (result.data === null) {
        return { ok: false, kind: "identity", reason: "profile_not_found" };
      }
      const profile = result.data;
      if (!profile || typeof profile !== "object" || Array.isArray(profile)
        || !("id" in profile) || profile.id !== principalProfileId) {
        return { ok: false, kind: "unavailable", reason: "invalid_profile_data" };
      }
      if (!("status" in profile) || profile.status !== "active") {
        return { ok: false, kind: "forbidden", reason: "inactive_profile" };
      }
      const role = "role" in profile && typeof profile.role === "string" ? profile.role.trim().toLowerCase() : null;
      if (!isUserRole(role)) {
        return { ok: false, kind: "forbidden", reason: "invalid_role" };
      }

      return { ok: true, context: { principalProfileId, role, status: "active" } };
    } catch {
      // Transport errors can contain credentials or private data: never project them.
      return { ok: false, kind: "unavailable", reason: "profile_read_failed" };
    }
  };
}

export const resolvePrincipalRights = createPrincipalRightsResolver(readPrincipalProfile);
