import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { ACTIVE_PROFILE_COOKIE, getApiAuthContext } from "@/server/auth/apiAuth";

type WorkspaceKey = "owner" | "concierge" | "provider" | "admin";
const WORKSPACE_ORDER: WorkspaceKey[] = ["owner", "concierge", "provider", "admin"];

const WORKSPACES: Record<WorkspaceKey, { label: string; href: string; description: string }> = {
  owner: {
    label: "Propriétaire",
    href: "/dashboard/owner",
    description: "Logements, demandes, missions et finances.",
  },
  concierge: {
    label: "Conciergerie",
    href: "/dashboard/concierge",
    description: "Demandes reçues, planning, logements et devis.",
  },
  provider: {
    label: "Artisan",
    href: "/dashboard/provider",
    description: "Interventions, clients, devis et alertes.",
  },
  admin: {
    label: "Administrateur",
    href: "/dashboard/admin",
    description: "Contrôle des demandes, missions et blocages.",
  },
};

function roleToWorkspace(role: string | null | undefined): WorkspaceKey | null {
  const normalized = String(role ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .trim();

  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("concierge")) return "concierge";
  if (normalized.includes("owner") || normalized.includes("proprietaire")) return "owner";
  if (normalized.includes("provider") || normalized.includes("artisan")) return "provider";
  return null;
}

function buildWorkspace(key: WorkspaceKey, currentProfileId?: string | null, profileId?: string | null) {
  return {
    id: key,
    profileId: profileId ?? null,
    available: Boolean(profileId),
    current: Boolean(profileId && currentProfileId && profileId === currentProfileId),
    ...WORKSPACES[key],
  };
}

export async function GET(req: NextRequest) {
  const { userId, email, role, activeProfileId } = await getApiAuthContext(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceMap = new Map<WorkspaceKey, ReturnType<typeof buildWorkspace>>();
  const currentWorkspace = roleToWorkspace(role);
  const currentProfileId = activeProfileId ?? userId;

  if (email) {
    const { data, error } = await db
      .from("profiles")
      .select("id,email,role,category,option,search_target")
      .eq("email", email);

    if (error) {
      console.error("[profiles/workspaces] DB error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    for (const profile of data ?? []) {
      const detected =
        roleToWorkspace(profile.role) ||
        roleToWorkspace(profile.category) ||
        roleToWorkspace(profile.option) ||
        roleToWorkspace(profile.search_target);
      if (detected && !workspaceMap.has(detected)) {
        workspaceMap.set(detected, buildWorkspace(detected, currentProfileId, profile.id));
      }
    }
  }

  if (currentWorkspace && !workspaceMap.has(currentWorkspace)) {
    workspaceMap.set(currentWorkspace, buildWorkspace(currentWorkspace, currentProfileId, userId));
  }

  for (const key of WORKSPACE_ORDER) {
    if (!workspaceMap.has(key)) {
      workspaceMap.set(key, buildWorkspace(key, currentProfileId, null));
    }
  }

  return NextResponse.json(
    {
      current: currentWorkspace,
      workspaces: WORKSPACE_ORDER.map((key) => workspaceMap.get(key)).filter(Boolean),
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  const { email, userId } = await getApiAuthContext(req);

  if (!userId || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { profileId?: string };
  const profileId = body.profileId?.trim();

  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("id,email,role,category")
    .eq("id", profileId)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[profiles/workspaces] switch DB error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not available" }, { status: 404 });
  }

  const workspace = roleToWorkspace(profile.role) || roleToWorkspace(profile.category);
  const response = NextResponse.json(
    {
      activeProfileId: profile.id,
      workspace,
      href: workspace ? WORKSPACES[workspace].href : "/dashboard",
    },
    { status: 200 },
  );

  response.cookies.set(ACTIVE_PROFILE_COOKIE, profile.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
