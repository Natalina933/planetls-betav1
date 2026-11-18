import { NextRequest } from "next/server";
import { detail } from "@/features/provider-solicitations/server/http";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) { return detail(req, context); }
