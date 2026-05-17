import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  getServiceAuthContext,
  isAllowedServiceRole,
  serviceAuthError,
} from "@/app/api/services/_shared";

interface ServicePackageBody {
  name: string;
  description?: string;
  service_ids: string[];
  category: string;
  accent?: "teal" | "sand" | "gold" | "slate";
}

interface DbErrorLike {
  code?: string;
  message?: string;
}

const PACKAGE_SELECT: string =
  "id, profile_id, name, description, category, accent, created_at, services_package_items(service_id)";

const normalizePackageName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^pack\s+/, "")
    .trim();

const getDbErrorMessage = (error: DbErrorLike): string => {
  if (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST204") {
    return "Tables packs introuvables. Executez la migration SQL 20260220_services_packages_contract_templates.sql dans Supabase.";
  }
  if (error.code === "42P17") {
    return "Relation invalide entre tables packs. Verifiez les cles et contraintes SQL.";
  }
  return error.message ?? "Erreur DB";
};

export async function GET(req: NextRequest) {
  try {
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
    }

    let query = db
      .from("services_packages")
      .select(PACKAGE_SELECT)
      .order("created_at", { ascending: false });

    if (!auth.isAdmin) {
      query = query.eq("profile_id", auth.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/services/packages] DB error:", error);
      return NextResponse.json({ error: getDbErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/services/packages] ERROR:", err);
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

    const body: ServicePackageBody = await req.json();
    if (!body.name || !body.category || !Array.isArray(body.service_ids) || body.service_ids.length === 0) {
      return NextResponse.json(
        { error: "name, category et service_ids sont requis" },
        { status: 400 },
      );
    }

    const normalizedIncomingName = normalizePackageName(body.name);

    const { data: existingPackages, error: existingPackagesError } = await db
      .from("services_packages")
      .select("id, name")
      .eq("profile_id", auth.userId);

    if (existingPackagesError) {
      console.error("[POST /api/services/packages] load existing packages error:", existingPackagesError);
      return NextResponse.json(
        { error: getDbErrorMessage(existingPackagesError) },
        { status: 500 },
      );
    }

    const duplicatedPackage = (existingPackages ?? []).find(
      (pkg) => normalizePackageName(pkg.name ?? "") === normalizedIncomingName,
    );

    if (duplicatedPackage) {
      return NextResponse.json(
        { error: "Un pack avec ce nom existe déjà." },
        { status: 409 },
      );
    }

    const { data: createdPackage, error: packageError } = await db
      .from("services_packages")
      .insert({
        profile_id: auth.userId,
        name: body.name.trim(),
        description: body.description ?? null,
        category: body.category,
        accent: body.accent ?? "teal",
      })
      .select("id, profile_id, name, description, category, accent, created_at")
      .single();

    if (packageError || !createdPackage) {
      console.error("[POST /api/services/packages] create package error:", packageError);
      return NextResponse.json(
        { error: getDbErrorMessage(packageError ?? { message: "Erreur creation pack" }) },
        { status: 500 },
      );
    }

    const itemsToInsert = body.service_ids.map((serviceId) => ({
      package_id: createdPackage.id,
      service_id: serviceId,
    }));

    const { error: itemsError } = await db.from("services_package_items").insert(itemsToInsert);
    if (itemsError) {
      console.error("[POST /api/services/packages] create items error:", itemsError);
      return NextResponse.json(
        { error: getDbErrorMessage(itemsError) },
        { status: 500 },
      );
    }

    const { data: hydrated, error: hydratedError } = await db
      .from("services_packages")
      .select(PACKAGE_SELECT)
      .eq("id", createdPackage.id)
      .single();

    if (hydratedError) {
      console.error("[POST /api/services/packages] hydrate error:", hydratedError);
      return NextResponse.json(createdPackage, { status: 201 });
    }

    return NextResponse.json(hydrated, { status: 201 });
  } catch (err) {
    console.error("[POST /api/services/packages] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
