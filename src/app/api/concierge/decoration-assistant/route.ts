import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { buildDecorationReport, type DecorationReport } from "@/app/lib/decorationAssistant";

const ALLOWED_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const REPORT_TABLE = "decoration_ai_reports";

const decorationInputSchema = z.object({
  roomName: z.string().trim().min(2).max(80),
  housingType: z.enum(["studio", "apartment", "house", "villa", "room"]),
  budget: z.number().min(150).max(10000),
  style: z.enum(["scandinavian", "mediterranean", "bohemian", "minimalist", "premium", "family"]),
  goal: z.enum(["more_bookings", "higher_price", "better_photos", "refresh", "family_friendly"]),
  ownerProfileId: z.string().uuid().optional().nullable(),
  ownerName: z.string().trim().max(120).optional().nullable(),
  ownerEmail: z.string().trim().email().optional().nullable().or(z.literal("")),
  propertyName: z.string().trim().max(120).optional().nullable(),
  constraints: z.string().trim().max(500).optional().nullable(),
  photoName: z.string().trim().max(160).optional().nullable(),
});

type DecorationReportRow = {
  id: string;
  report: DecorationReport;
  created_at: string;
};

function canUseDecorationAssistant(role: string) {
  return ALLOWED_ROLES.has(role);
}

function reportRowPayload(report: DecorationReport, conciergeProfileId: string, ownerProfileId?: string | null) {
  return {
    concierge_profile_id: conciergeProfileId,
    owner_profile_id: ownerProfileId ?? null,
    owner_name: report.input.ownerName || null,
    owner_email: report.input.ownerEmail || null,
    property_name: report.input.propertyName || null,
    room_name: report.input.roomName,
    housing_type: report.input.housingType,
    style: report.input.style,
    goal: report.input.goal,
    budget_requested: report.budget.requested,
    budget_estimated: report.budget.estimatedTotal,
    report,
    image_prompt: report.imagePrompt,
  };
}

async function persistReport(report: DecorationReport, conciergeProfileId: string, ownerProfileId?: string | null) {
  const dbAny = asLooseSupabaseClient(db);
  const { data, error } = await dbAny
    .from(REPORT_TABLE)
    .insert(reportRowPayload(report, conciergeProfileId, ownerProfileId))
    .select("id, report, created_at")
    .single<DecorationReportRow>();

  if (error) {
    console.warn("[decoration-assistant] persistence skipped:", error.message);
    return { persisted: false, report };
  }

  const persistedReport = data?.report ? { ...data.report, id: data.id, createdAt: data.created_at ?? data.report.createdAt } : report;
  return { persisted: true, report: persistedReport };
}

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!canUseDecorationAssistant(role)) {
      return NextResponse.json({ error: "Accès réservé aux concierges." }, { status: 403 });
    }

    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;
    const dbAny = asLooseSupabaseClient(db);
    const { data, error } = await dbAny
      .from(REPORT_TABLE)
      .select("id, report, created_at")
      .eq("concierge_profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[GET /api/concierge/decoration-assistant] history unavailable:", error.message);
      return NextResponse.json({ items: [], persisted: false });
    }

    const items = ((data ?? []) as DecorationReportRow[])
      .map((row) => (row.report ? { ...row.report, id: row.id, createdAt: row.created_at ?? row.report.createdAt } : null))
      .filter(Boolean) as DecorationReport[];

    return NextResponse.json({ items, persisted: true });
  } catch (error) {
    console.error("[GET /api/concierge/decoration-assistant] ERROR:", error);
    return NextResponse.json({ error: "Impossible de charger l'historique décoration." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!canUseDecorationAssistant(role)) {
      return NextResponse.json({ error: "Accès réservé aux concierges." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = decorationInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Formulaire incomplet ou invalide.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const report = buildDecorationReport({
      ...parsed.data,
      ownerEmail: parsed.data.ownerEmail || null,
    });
    const persisted = await persistReport(report, userId, parsed.data.ownerProfileId);

    return NextResponse.json(persisted);
  } catch (error) {
    console.error("[POST /api/concierge/decoration-assistant] ERROR:", error);
    return NextResponse.json({ error: "Impossible de générer le rapport décoration." }, { status: 500 });
  }
}