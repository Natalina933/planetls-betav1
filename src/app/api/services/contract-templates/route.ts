import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";
import type { Json, TablesInsert } from "@/types/supabase";

interface ContractTemplateBody {
  package_id: string;
  title: string;
  content: string;
  variables?: Json;
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
      .from("contract_templates")
      .select("id, profile_id, package_id, title, content, variables, created_at")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false });

    if (packageId) {
      query = query.eq("package_id", packageId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[GET /api/services/contract-templates] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/services/contract-templates] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body: ContractTemplateBody = await req.json();
    if (!body.package_id || !body.title || !body.content) {
      return NextResponse.json(
        { error: "package_id, title et content sont requis" },
        { status: 400 },
      );
    }

    const insertPayload: TablesInsert<"contract_templates"> = {
      profile_id: userId,
      package_id: body.package_id,
      title: body.title,
      content: body.content,
      variables: body.variables ?? ({} as Json),
    };

    const { data, error } = await db
      .from("contract_templates")
      .insert(insertPayload)
      .select("id, profile_id, package_id, title, content, variables, created_at")
      .single();

    if (error) {
      console.error("[POST /api/services/contract-templates] DB error:", error);
      return NextResponse.json({ error: "Erreur creation modele" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/services/contract-templates] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
