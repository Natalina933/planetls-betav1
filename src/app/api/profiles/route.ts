// src/app/api/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// PATCH /api/profiles
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    
    console.log("📝 Mise à jour du profil pour userId:", userId);
    console.log("📦 Données reçues:", Object.keys(body));

    // Préparer les données de mise à jour
    const updateData: Record<string, string | number | boolean | null> = {
      username: body.username,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      avatar_url: body.avatar_url,
      avatar_scale: body.avatar_scale,
      additional_info: body.additional_info,
      category: body.category,
      location: body.location,
      option: body.option,
      search_target: body.search_target,
      role: body.role,
      travel_fee: body.travel_fee,
      // Champs professionnels
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
      certifications: body.certifications,
      years_experience: body.years_experience,
      experience_level: body.experience_level,
      iban: body.iban,
      bic: body.bic,
      updated_at: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    };

    // Supprimer les valeurs undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { error } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error("❌ Erreur lors de la mise à jour:", error);
      return NextResponse.json(
        { error: `Erreur DB: ${error.message}` }, 
        { status: 500 }
      );
    }

    // Récupérer le profil mis à jour avec TOUS les champs
    const { data: updatedProfile, error: selectError } = await db
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
        years_experience, experience_level, iban, bic, travel_fee
      `)
      .eq("id", userId)
      .maybeSingle();

    if (selectError) {
      console.error("❌ Erreur lors de la récupération:", selectError);
      return NextResponse.json(
        { error: `Erreur récupération: ${selectError.message}` }, 
        { status: 500 }
      );
    }

    console.log("✅ Profil mis à jour avec succès");
    return NextResponse.json(updatedProfile);

  } catch (err) {
    console.error("[PATCH /api/profiles] ERREUR :", err);
    return NextResponse.json(
      { error: "Erreur serveur" }, 
      { status: 500 }
    );
  }
}