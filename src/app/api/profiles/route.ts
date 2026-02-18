// src/app/api/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/lib/dbServer";

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;
    const role = typeof token?.role === "string" ? token.role : "";
    const isAdmin = role === "admin" || role === "super_admin";

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const updateData: Partial<Record<string, string | number | boolean | null>> = {};

    if (body.username !== undefined) updateData.username = body.username;
    if (body.first_name !== undefined) updateData.first_name = body.first_name;
    if (body.last_name !== undefined) updateData.last_name = body.last_name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
    if (body.avatar_scale !== undefined) updateData.avatar_scale = body.avatar_scale;
    if (body.additional_info !== undefined) updateData.additional_info = body.additional_info;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.option !== undefined) updateData.option = body.option;
    if (body.search_target !== undefined) updateData.search_target = body.search_target;
    if (body.travel_fee !== undefined) updateData.travel_fee = body.travel_fee;

    if (body.role !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      updateData.role = body.role;
    }

    if (body.company_name !== undefined) updateData.company_name = body.company_name;
    if (body.legal_form !== undefined) updateData.legal_form = body.legal_form;
    if (body.siret !== undefined) updateData.siret = body.siret;
    if (body.siren !== undefined) updateData.siren = body.siren;
    if (body.vat_number !== undefined) updateData.vat_number = body.vat_number;
    if (body.street_address !== undefined) updateData.street_address = body.street_address;
    if (body.postal_code !== undefined) updateData.postal_code = body.postal_code;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin;
    if (body.instagram !== undefined) updateData.instagram = body.instagram;
    if (body.facebook !== undefined) updateData.facebook = body.facebook;
    if (body.insurance_number !== undefined) updateData.insurance_number = body.insurance_number;
    if (body.insurance_company !== undefined) updateData.insurance_company = body.insurance_company;
    if (body.certifications !== undefined) updateData.certifications = body.certifications;
    if (body.service_area !== undefined) updateData.service_area = body.service_area;
    if (body.service_radius_km !== undefined) updateData.service_radius_km = body.service_radius_km;
    if (body.hourly_rate !== undefined) updateData.hourly_rate = body.hourly_rate;
    if (body.monthly_rate !== undefined) updateData.monthly_rate = body.monthly_rate;
    if (body.availability_hours !== undefined) updateData.availability_hours = body.availability_hours;
    if (body.emergency_service !== undefined) updateData.emergency_service = body.emergency_service;
    if (body.years_experience !== undefined) updateData.years_experience = body.years_experience;

    if (body.experience_level !== undefined) {
      const validLevels = ["debutant", "intermediaire", "experimente"];
      if (body.experience_level === null || validLevels.includes(body.experience_level)) {
        updateData.experience_level = body.experience_level;
      }
    }

    if (body.iban !== undefined) updateData.iban = body.iban;
    if (body.bic !== undefined) updateData.bic = body.bic;

    updateData.updated_at = new Date().toISOString();

    const { error } = await db.from("profiles").update(updateData).eq("id", userId);
    if (error) {
      console.error("[PATCH /api/profiles] update error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    const { data: updatedProfile, error: selectError } = await db
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (selectError) {
      console.error("[PATCH /api/profiles] select error:", selectError);
      return NextResponse.json({ error: "Erreur récupération profil" }, { status: 500 });
    }

    return NextResponse.json(updatedProfile);
  } catch (err) {
    console.error("[PATCH /api/profiles] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
