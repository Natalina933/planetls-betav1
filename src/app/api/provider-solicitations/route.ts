import { NextRequest } from "next/server";
import { create, list } from "@/features/provider-solicitations/server/http";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) { return create(req); }
export async function GET(req: NextRequest) { return list(req); }
