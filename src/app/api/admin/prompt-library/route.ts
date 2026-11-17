import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/server/auth/adminAccess";
import { loadPromptLibrary } from "@/server/prompt-library";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdminApiAccess(req);
  if (!guard.ok) return guard.response;

  try {
    const payload = await loadPromptLibrary();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      {
        error: "Bibliotheque de prompts indisponible.",
      },
      { status: 500 },
    );
  }
}
