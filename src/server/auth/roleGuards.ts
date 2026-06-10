import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext, type ApiAuthContext } from "./apiAuth";

type RoleGuardResult =
  | {
      ok: true;
      auth: ApiAuthContext & { userId: string };
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireApiRole(req: NextRequest, allowedRoles: ReadonlySet<string>): Promise<RoleGuardResult> {
  const auth = await getApiAuthContext(req);

  if (!auth.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  if (!allowedRoles.has(auth.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    auth: {
      ...auth,
      userId: auth.userId,
    },
  };
}
