import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

type PricingType = "hourly" | "fixed" | "monthly" | "custom";

interface PricingPackageBody {
  package_id: string;
  label: string;
  type: PricingType;
  amount: number;
  property_type?: string | null;
}

const getUserId = async (req: NextRequest): Promise<string | null> => {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  return typeof token?.sub === "string" ? token.sub : null;
};

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const packageId = url.searchParams.get("packageId");

    let query = db
      .from("pricing_packages")
      .select("id, profile_id, package_id, label, type, amount, property_type, created_at")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false });

    if (packageId) {
      query = query.eq("package_id", packageId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[GET /api/services/pricing-packages] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/services/pricing-packages] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body: PricingPackageBody = await req.json();
    if (!body.package_id || !body.label || typeof body.amount !== "number") {
      return NextResponse.json(
        { error: "package_id, label et amount sont requis" },
        { status: 400 },
      );
    }

    const { data, error } = await db
      .from("pricing_packages")
      .insert({
        profile_id: userId,
        package_id: body.package_id,
        label: body.label,
        type: body.type ?? "custom",
        amount: body.amount,
        property_type: body.property_type ?? null,
      })
      .select("id, profile_id, package_id, label, type, amount, property_type, created_at")
      .single();

    if (error) {
      console.error("[POST /api/services/pricing-packages] DB error:", error);
      return NextResponse.json({ error: "Erreur creation tarif lie" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/services/pricing-packages] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
