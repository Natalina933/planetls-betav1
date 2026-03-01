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
      unread: 0,
    },
    note:
      "La messagerie provider n'est pas encore branchee au schema des conversations. Cette API reserve deja le contrat de donnees.",
  });
}
