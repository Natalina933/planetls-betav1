import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { createHousingFromQuote, loadQuotePreview } from "@/app/api/profiles/housing/shared";

const ALLOWED_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const quoteId = (url.searchParams.get("quoteId") ?? "").trim();
    if (!quoteId) {
      return NextResponse.json({ error: "quoteId requis" }, { status: 400 });
    }

    const preview = await loadQuotePreview(quoteId, userId);
    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const quoteId = typeof body.quoteId === "string" ? body.quoteId.trim() : "";
    if (!quoteId) {
      return NextResponse.json({ error: "quoteId requis" }, { status: 400 });
    }

    const result = await createHousingFromQuote(quoteId, userId);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
