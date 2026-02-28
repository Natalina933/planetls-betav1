import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import type { Json, TablesInsert } from "@/types/supabase";
import {
  findOwnedServicePackage,
  getServiceAuthContext,
  isAllowedServiceRole,
  serviceAuthError,
} from "@/app/api/services/_shared";

interface ContractTemplateBody {
  package_id: string;
  title: string;
  content: string;
  variables?: Json;
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
      .from("contract_templates")
      .select("id, profile_id, package_id, title, content, variables, created_at")
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
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
    }

    const body: ContractTemplateBody = await req.json();
    if (!body.package_id || !body.title || !body.content) {
      return NextResponse.json(
        { error: "package_id, title et content sont requis" },
        { status: 400 },
      );
    }

    const ownedPackage = await findOwnedServicePackage(body.package_id, auth);
    if (ownedPackage.error) {
      return ownedPackage.error;
    }

    const insertPayload: TablesInsert<"contract_templates"> = {
      profile_id: auth.userId,
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
