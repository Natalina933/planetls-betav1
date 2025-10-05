// app/api/auth/register/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  console.log("Données reçues :", body);
  return NextResponse.json({
    message: "Utilisateur créé avec succès (simulation)",
    user: { ...body, id: "123" },
  });
}

