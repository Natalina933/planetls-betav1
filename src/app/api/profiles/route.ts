// src/app/api/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// PATCH /api/profiles
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;
    if (!userId)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();

    const { error } = await db
      .from("profiles")
      .update({
        username: body.username,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        avatar_url: body.avatar_url,
        avatar_scale: body.avatar_scale, //  ✅ CORRECTION ICI
        additional_info: body.additional_info,
        category: body.category,
        location: body.location,
        option: body.option,
        search_target: body.search_target,
        role: body.role,
        company_name: body.company_name,
        legal_form: body.legal_form,
        siret: body.siret,
        siren: body.siren,
        vat_number: body.vat_number,
        street_address: body.street_address,
        postal_code: body.postal_code,
        city: body.city,
        country: body.country,
        website: body.website,
        linkedin: body.linkedin,
        insurance_number: body.insurance_number,
        insurance_company: body.insurance_company,
        service_area: body.service_area,
        service_radius_km: body.service_radius_km,
        hourly_rate: body.hourly_rate,
        monthly_rate: body.monthly_rate,
        availability_hours: body.availability_hours,
        emergency_service: body.emergency_service,
        years_experience: body.years_experience,
        iban: body.iban,
        bic: body.bic,
      })
      .eq("id", userId);

    if (error)
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });

    const { data: updatedProfile } = await db
      .from("profiles")
      .select(
        "id, username, first_name, last_name, email, phone, avatar_url, avatar_scale, additional_info, category, role, created_at, location, option, search_target, company_name, legal_form, siret, siren, vat_number, street_address, postal_code, city, country, website, linkedin, insurance_number, insurance_company, service_area,   service_radius_km, hourly_rate, monthly_rate, availability_hours, emergency_service, certifications, years_experience, iban, bic"
      )
      .eq("id", userId)
      .maybeSingle();

    return NextResponse.json(updatedProfile);
  } catch (err) {
    console.error("[PATCH /api/profiles] ERREUR :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
