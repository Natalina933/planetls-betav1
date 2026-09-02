import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiRole } from "@/server/auth/roleGuards";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const BUCKET = "housing-photos";
const DEFAULT_MAX_AGE_HOURS = 24;
const MAX_FILES_PER_RUN = 100;

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configuration serveur manquante");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function parseOptions(req: NextRequest) {
  const maxAgeHours = Number(req.nextUrl.searchParams.get("maxAgeHours") ?? DEFAULT_MAX_AGE_HOURS);
  if (!Number.isInteger(maxAgeHours) || maxAgeHours < 1 || maxAgeHours > 24 * 30) {
    throw new Error("maxAgeHours doit etre compris entre 1 et 720.");
  }
  return {
    dryRun: req.nextUrl.searchParams.get("dryRun") !== "false",
    maxAgeHours,
  };
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(req, ADMIN_ROLES);
  if (!guard.ok) return guard.response;

  try {
    const { dryRun, maxAgeHours } = parseOptions(req);
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const storage = getAdminClient().storage.from(BUCKET);
    const { data: userFolders, error: foldersError } = await storage.list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (foldersError) throw foldersError;

    const candidates: string[] = [];
    for (const folder of userFolders ?? []) {
      if (candidates.length >= MAX_FILES_PER_RUN || !/^[A-Za-z0-9_-]+$/.test(folder.name)) continue;
      const { data: drafts, error: draftsError } = await storage.list(`${folder.name}/draft`, { limit: MAX_FILES_PER_RUN, sortBy: { column: "created_at", order: "asc" } });
      if (draftsError) throw draftsError;
      for (const draft of drafts ?? []) {
        const createdAt = Date.parse(draft.created_at ?? "");
        if (Number.isFinite(createdAt) && createdAt < cutoff) candidates.push(`${folder.name}/draft/${draft.name}`);
        if (candidates.length >= MAX_FILES_PER_RUN) break;
      }
    }

    if (!dryRun && candidates.length > 0) {
      const { error: removeError } = await storage.remove(candidates);
      if (removeError) throw removeError;
    }

    return NextResponse.json({
      dryRun,
      maxAgeHours,
      candidates: candidates.length,
      removed: dryRun ? 0 : candidates.length,
      capped: candidates.length === MAX_FILES_PER_RUN,
    });
  } catch (error) {
    console.error("[Housing photos cleanup]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nettoyage impossible" }, { status: 500 });
  }
}
