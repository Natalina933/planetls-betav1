import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildWorkspaceEmail,
  getTargetWorkspaceEmail,
  isDevWorkspaceAuthEnabled,
} from "@/server/auth/devWorkspace";

const workspaces = {
  owner: { key: "owner", label: "Propri?taire", href: "/dashboard/owner" },
  concierge: { key: "concierge", label: "Conciergerie", href: "/dashboard/concierge" },
  provider: { key: "provider", label: "Artisan", href: "/dashboard/provider" },
  admin: { key: "admin", label: "Administrateur", href: "/dashboard/admin" },
} as const;

function localSupabaseUrl(req: NextRequest) {
  if (!isDevWorkspaceAuthEnabled() || !["localhost", "127.0.0.1"].includes(req.nextUrl.hostname)) {
    return null;
  }
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const localUrls = ["http://127.0.0.1:54321", "http://localhost:54321"];
  return configured && localUrls.includes(configured.replace(/\/$/, "")) ? configured : null;
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  if (!localSupabaseUrl(req)) return json({ error: "Introuvable" }, 404);
  return json({ enabled: true, workspaces: Object.values(workspaces) });
}

export async function POST(req: NextRequest) {
  const url = localSupabaseUrl(req);
  if (!url) return json({ error: "Introuvable" }, 404);

  const body = await req.json().catch(() => null);
  const key = body?.workspace;
  if (typeof key !== "string" || !Object.hasOwn(workspaces, key)) {
    return json({ error: "S?lectionnez un espace valide." }, 400);
  }
  const workspace = workspaces[key as keyof typeof workspaces];
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return json({ error: "Configuration Supabase locale indisponible." }, 503);

  try {
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const targetEmail = getTargetWorkspaceEmail().toLowerCase();
    const expectedEmail = key === "admin" ? targetEmail : buildWorkspaceEmail(targetEmail, workspace.key);
    const { data, error } = await supabase.from("profiles")
      .select("email")
      .eq("role", workspace.key)
      .eq("status", "active")
      .eq("email", expectedEmail)
      .maybeSingle();

    if (error) return json({ error: "Impossible de lire le profil de recette." }, 503);
    if (!data?.email) return json({ error: "Compte de recette local introuvable." }, 404);
    return json({ workspace: workspace.key, email: data.email, href: workspace.href, label: workspace.label });
  } catch {
    return json({ error: "Impossible de lire le profil de recette." }, 503);
  }
}
