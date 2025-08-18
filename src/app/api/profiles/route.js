import { NextResponse } from "next/server";
import db from "../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // Récupération des profils avec filtre sur type, si besoin
    let query = db.from('profiles').select('id, name, type, photo, latitude, longitude, available');

    if (category && category !== "all") {
      query = query.eq('type', category);
    }

    const { data: profiles, error: profilesError } = await query.order('name');

    if (profilesError) throw profilesError;

    // Récupérer les services de tous les profils en une requête (pour optimisation)
    const profileIds = profiles.map(p => p.id);
    let services = [];
    if (profileIds.length > 0) {
      const { data: serviceRows, error: servicesError } = await db
        .from('profile_services')
        .select('profile_id, service')
        .in('profile_id', profileIds);

      if (servicesError) throw servicesError;
      services = serviceRows;
    }

    // Regroupe les services par profil
    const servicesByProfile = {};
    services.forEach(({ profile_id, service }) => {
      if (!servicesByProfile[profile_id]) {
        servicesByProfile[profile_id] = [];
      }
      servicesByProfile[profile_id].push(service);
    });

    // Compose la réponse finale
    const result = profiles.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      photo: p.photo,
      latitude: p.latitude,
      longitude: p.longitude,
      available: Boolean(p.available),
      services: servicesByProfile[p.id] || []
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("⛔ Erreur API /api/profiles :", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
