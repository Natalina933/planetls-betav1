import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  findOwnedServicePackage,
  getServiceAuthContext,
  isAllowedServiceRole,
  serviceAuthError,
} from "@/app/api/services/_shared";

type PricingType = "hourly" | "fixed" | "monthly" | "custom";

interface PricingPackageBody {
  package_id: string;
  label: string;
  type: PricingType;
  amount: number;
  property_type?: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
    }

    const url = new URL(req.url);
    const packageId = url.searchParams.get("packageId");

    let query = db
      .from("pricing_packages")
      .select("id, profile_id, package_id, label, type, amount, property_type, created_at, package:services_packages(id, name)")
      .order("created_at", { ascending: false });

    if (!auth.isAdmin) {
      query = query.eq("profile_id", auth.userId);
    }

    if (packageId) {
      const ownedPackage = await findOwnedServicePackage(packageId, auth);
      if (ownedPackage.error) {
        return ownedPackage.error;
      }
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
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
    }

    const body: PricingPackageBody = await req.json();
    if (!body.package_id || !body.label || typeof body.amount !== "number") {
      return NextResponse.json(
        { error: "package_id, label et amount sont requis" },
        { status: 400 },
      );
    }

    const ownedPackage = await findOwnedServicePackage(body.package_id, auth);
    if (ownedPackage.error) {
      return ownedPackage.error;
    }

    const { data, error } = await db
      .from("pricing_packages")
      .insert({
        profile_id: auth.userId,
        package_id: body.package_id,
        label: body.label,
        type: body.type ?? "custom",
        amount: body.amount,
        property_type: body.property_type ?? null,
      })
      .select("id, profile_id, package_id, label, type, amount, property_type, created_at, package:services_packages(id, name)")
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
