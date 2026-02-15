import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

// Schéma de validation pour éviter les noms tronqués ou invalides
const serviceSchema = z.object({
  category: z.string().min(2).max(100).trim(),
  service: z.string().min(2).max(100).trim(),
  description: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("id");

    const query = db.from("services_catalog").select("*");

    if (serviceId) {
      const { data, error } = await query
        .eq("id", Number(serviceId))
        .maybeSingle();
      if (error) throw error;
      if (!data)
        return NextResponse.json(
          { error: "Service non trouvé" },
          { status: 404 },
        );
      return NextResponse.json(data);
    }

    const { data, error } = await query.order("service", { ascending: true });
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[CATALOG_GET_ERROR]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const result = serviceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.format() },
        { status: 400 },
      );
    }

    const { data, error } = await db
      .from("services_catalog")
      .insert([result.data])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[CATALOG_POST_ERROR]:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 },
    );
  }
}
