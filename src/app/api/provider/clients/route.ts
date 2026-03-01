import { NextRequest, NextResponse } from "next/server";
import { requireProviderAuth } from "../shared";

export async function GET(req: NextRequest) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  return NextResponse.json({
    items: [],
    summary: {
      total: 0,
      active: 0,
    },
    note:
      "Les clients artisan ne sont pas encore relies a une table dediee. Cette API servira de point d'entree des que le modele sera ajoute.",
  });
}
