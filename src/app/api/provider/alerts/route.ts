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
      urgent: 0,
    },
    note:
      "Les alertes provider seront alimentees quand les interventions et messages provider auront une source de donnees reliee.",
  });
}
