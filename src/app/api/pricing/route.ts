import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

type PricingType = "hourly" | "fixed" | "monthly" | "custom";

interface PricingInsertBody {
  service_id?: number | null;
  label: string;
  type?: PricingType;
  amount: number;
  unit?: string;
  is_default?: boolean;
}

// GET /api/pricing -> Liste des tarifs (avec filtres optionnels)
export async function GET(req: NextRequest) {
  try {
    // Vérification auth
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Filtres optionnels (en + du filtre userId automatique)
    const profileId = searchParams.get("profileId");
    const serviceId = searchParams.get("serviceId");
    const type = searchParams.get("type");

    let query = db
      .from("services_pricing")
      .select(`
        *,
        service:services_catalog(id, category, service, description)
      `)
      .eq("profile_id", userId); // ✅ Toujours filtré par user connecté

    // Filtres supplémentaires OPTIONNELS
    if (profileId && profileId === userId) {
      // OK si même user
    }
    if (serviceId) {
      query = query.eq("service_id", Number(serviceId));
    }
    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("[GET /api/pricing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[GET /api/pricing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST reste IDENTIQUE (parfait)
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const rawBody = await req.json();

    const body: PricingInsertBody = {
      service_id:
        rawBody.service_id !== undefined &&
        rawBody.service_id !== null &&
        rawBody.service_id !== ""
          ? Number(rawBody.service_id)
          : null,
      label: rawBody.label,
      type: rawBody.type,
      amount: rawBody.amount,
      unit: rawBody.unit,
      is_default: rawBody.is_default,
    };

    if (!body.label || body.amount === undefined) {
      return NextResponse.json(
        { error: "Label et montant requis" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("services_pricing")
      .insert({
        profile_id: userId,
        service_id: body.service_id ?? null,
        label: body.label,
        type: body.type ?? "custom",
        amount: body.amount,
        unit: body.unit ?? "€",
        is_default: body.is_default ?? false,
      })
      .select(`
        *,
        service:services_catalog(id, category, service, description)
      `)
      .single();

    if (error) {
      console.error("[POST /api/pricing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/pricing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
