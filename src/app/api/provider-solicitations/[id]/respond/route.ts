import { NextRequest } from "next/server";
import { respond } from "@/features/provider-solicitations/server/http";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) { return respond(req, context); }
