import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/server/auth/apiAuth";
import { loadPromptLibrary } from "@/server/prompt-library";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  try {
    const payload = await loadPromptLibrary();
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Bibliotheque de prompts indisponible.",
        detail: error instanceof Error ? error.message : "Erreur inconnue.",
      },
      { status: 500 },
    );
  }
}
