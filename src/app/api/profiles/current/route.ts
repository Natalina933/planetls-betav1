// src/app/api/profiles/current/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// GET /api/profiles/current
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: profile, error } = await db
      .from("profiles")
      .select(`
        id, username, first_name, last_name, email, phone, 
        avatar_url, avatar_scale, additional_info, category, 
        role, created_at, location, option, search_target,
        company_name, legal_form, siret, siren, vat_number,
        street_address, postal_code, city, country,
        website, linkedin, insurance_number, insurance_company,
        service_area, service_radius_km, hourly_rate, monthly_rate,
        availability_hours, emergency_service, certifications,
        years_experience, iban, bic, travel_fee
      `)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/profiles/current] Erreur DB:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }
    
    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    return NextResponse.json(profile);

  } catch (error) {
    console.error("[GET /api/profiles/current] Erreur serveur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}