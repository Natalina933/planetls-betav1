import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/server/auth/adminAccess";
import { loadProjectAdvisorViewForAdmin } from "@/app/dashboard/admin/(product-tech)/developpement/workspaceData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdminApiAccess(req);
  if (!guard.ok) return guard.response;

  try {
    const payload = await loadProjectAdvisorViewForAdmin();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      {
        error: "Conseiller produit indisponible.",
      },
      { status: 500 },
    );
  }
}
