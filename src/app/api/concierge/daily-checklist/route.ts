import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { LooseSupabaseQuery } from "@/app/api/_shared/untypedSupabase";

type ChecklistRow = {
  id: string;
  task_key: string;
  completed: boolean;
  completed_at: string | null;
  updated_at: string | null;
};

const conciergeDb = db as unknown as {
  // The migration adds this table; generated Supabase types can be refreshed later.
  from(table: "concierge_daily_checklist"): LooseSupabaseQuery<ChecklistRow[]>;
};

const checklistQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const checklistPatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskKey: z.string().trim().min(1).max(80),
  completed: z.boolean(),
});

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isConciergeRole(role: string) {
  return role === "concierge" || role === "concierge_pro" || role === "admin" || role === "super_admin";
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!isConciergeRole(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = checklistQuerySchema.safeParse({ date: searchParams.get("date") ?? undefined });
    if (!parsed.success) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }

    const taskDate = parsed.data.date ?? getTodayIsoDate();
    const { data, error } = await conciergeDb
      .from("concierge_daily_checklist")
      .select("id, task_key, completed, completed_at, updated_at")
      .eq("profile_id", auth.userId)
      .eq("task_date", taskDate);

    if (error) {
      console.error("[GET /api/concierge/daily-checklist] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json({ date: taskDate, items: data ?? [] });
  } catch (error) {
    console.error("[GET /api/concierge/daily-checklist] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!isConciergeRole(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const parsed = checklistPatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const { date, taskKey, completed } = parsed.data;
    const now = new Date().toISOString();
    const { data, error } = await conciergeDb
      .from("concierge_daily_checklist")
      .upsert(
        {
          profile_id: auth.userId,
          task_date: date,
          task_key: taskKey,
          completed,
          completed_at: completed ? now : null,
          updated_at: now,
        },
        { onConflict: "profile_id,task_date,task_key" },
      )
      .select("id, task_key, completed, completed_at, updated_at")
      .single<ChecklistRow>();

    if (error) {
      console.error("[PATCH /api/concierge/daily-checklist] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("[PATCH /api/concierge/daily-checklist] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
