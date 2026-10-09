import { NextRequest, NextResponse } from "next/server";

const CURRENT_LOGO_PATH =
  "/logo/Logo%20PlanetLS%20_%20globe%20dor%C3%A9%20et%20%C3%A9l%C3%A9gance%20verte.png";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(CURRENT_LOGO_PATH, request.url), 308);
}
