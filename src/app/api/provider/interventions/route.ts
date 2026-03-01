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
      in_progress: 0,
      pending: 0,
      completed: 0,
    },
    note:
      "Le schema actuel ne relie pas encore les interventions a un provider. L'API est prete pour ce branchement.",
  });
}
