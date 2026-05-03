import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/dbServer";
import { getApiAuthContext } from "@/server/auth/apiAuth";

const onboardingEventSchema = z.object({
  step: z.number().int().min(1).max(20),
  category: z.string().max(80).optional(),
  action: z.string().min(1).max(120),
  metadata: z.record(z.string(), z.unknown()).optional(),
  experiments: z.record(z.string(), z.string()).optional(),
  personaHint: z.string().max(80).optional(),
  path: z.string().max(500).optional(),
  occurredAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  let payload: z.infer<typeof onboardingEventSchema>;

  try {
    const rawPayload = await req.json();
    const result = onboardingEventSchema.safeParse(rawPayload);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: "Payload invalide" }, { status: 400 });
    }

    payload = result.data;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const dbAny = db as unknown as {
      from: (table: string) => {
        insert: (value: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>;
      };
    };

    const { error } = await dbAny.from("onboarding_events").insert({
      event_name: payload.action,
      step_index: payload.step,
      category: payload.category ?? null,
      persona_hint: payload.personaHint ?? null,
      path: payload.path ?? null,
      metadata: {
        ...(payload.metadata ?? {}),
        experiments: payload.experiments ?? {},
      },
      occurred_at: payload.occurredAt ?? new Date().toISOString(),
      user_agent: req.headers.get("user-agent"),
    });

    if (error) {
      console.info("[onboarding-event:fallback]", { reason: error.code ?? error.message, payload });
    }
  } catch (error) {
    console.info("[onboarding-event:fallback]", { error, payload });
  }

  return new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const { userId, isAdmin } = await getApiAuthContext(req);

  if (!userId || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = req.nextUrl.searchParams.get("since") ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const dbAny = db as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          gte: (column: string, value: string) => {
            order: (
              column: string,
              options: { ascending: boolean },
            ) => {
              limit: (count: number) => Promise<{
                data: Array<{
                  event_name: string;
                  step_index: number;
                  category: string | null;
                  persona_hint: string | null;
                  metadata: Record<string, unknown> | null;
                  occurred_at: string;
                }> | null;
                error: { message?: string } | null;
              }>;
            };
          };
        };
      };
    };

    const { data, error } = await dbAny
      .from("onboarding_events")
      .select("event_name, step_index, category, persona_hint, metadata, occurred_at")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ error: "Analytics unavailable" }, { status: 503 });
    }

    const rows = data ?? [];
    const started = rows.filter((row) => row.event_name.endsWith("_started")).length;
    const completed = rows.filter(
      (row) =>
        row.event_name === "onboarding_account_created" ||
        (row.event_name === "concierge_onboarding_step_completed" && row.step_index === 5),
    ).length;
    const byStep = new Map<number, number>();
    const byEvent = new Map<string, number>();
    const byVariant = new Map<string, number>();

    rows.forEach((row) => {
      byStep.set(row.step_index, (byStep.get(row.step_index) ?? 0) + 1);
      byEvent.set(row.event_name, (byEvent.get(row.event_name) ?? 0) + 1);
      const experiments = row.metadata?.experiments;
      if (experiments && typeof experiments === "object" && !Array.isArray(experiments)) {
        Object.entries(experiments as Record<string, unknown>).forEach(([name, variant]) => {
          if (typeof variant === "string") {
            const key = `${name}:${variant}`;
            byVariant.set(key, (byVariant.get(key) ?? 0) + 1);
          }
        });
      }
    });

    return NextResponse.json({
      since,
      totalEvents: rows.length,
      started,
      completed,
      completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
      byStep: Object.fromEntries([...byStep.entries()].sort(([a], [b]) => a - b)),
      byEvent: Object.fromEntries([...byEvent.entries()].sort()),
      byVariant: Object.fromEntries([...byVariant.entries()].sort()),
    });
  } catch (error) {
    console.error("[GET /api/onboarding-events] error:", error);
    return NextResponse.json({ error: "Analytics unavailable" }, { status: 503 });
  }
}
