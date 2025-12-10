import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";
import { Database } from "@/types/supabase";

type ServicePricingInsert =
  Database["public"]["Tables"]["services_pricing"]["Insert"];

// -----------------------------------------------------
// GET
// -----------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const serviceIdParam = searchParams.get("service_id");
    const type = searchParams.get("type");
    const isDefault = searchParams.get("is_default");

    let query = db.from("services_pricing").select("*");

    if (serviceIdParam) {
      const serviceId = Number(serviceIdParam);

      if (isNaN(serviceId)) {
        return NextResponse.json(
          { error: "service_id doit être un nombre" },
          { status: 400 }
        );
      }

      query = query.eq("service_id", serviceId);
    }

    if (type) query = query.eq("type", type);
    if (isDefault === "true") query = query.eq("is_default", true);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/service-pricing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    console.error("[GET /api/service-pricing] ERROR");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// -----------------------------------------------------
// POST
// -----------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Auth
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.service_id || !body.label || body.amount === undefined) {
      return NextResponse.json(
        { error: "Champs requis manquants (service_id, label, amount)" },
        { status: 400 }
      );
    }

    const serviceId = Number(body.service_id);
    const amount = Number(body.amount);

    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: "service_id doit être un nombre" },
        { status: 400 }
      );
    }

    if (isNaN(amount)) {
      return NextResponse.json(
        { error: "amount doit être un nombre" },
        { status: 400 }
      );
    }

    // Construction typesafe
    const insertData: ServicePricingInsert = {
      profile_id: userId,  // ✔ obligatoire
      service_id: serviceId,
      label: body.label,
      type: body.type ?? null,
      amount: amount,
      unit: body.unit ?? null,
      is_default: body.is_default ?? false,
    };

    const { data, error } = await db
      .from("services_pricing") // ✔ nom corrigé
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[POST /api/service-pricing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    console.error("[POST /api/service-pricing] ERROR");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
