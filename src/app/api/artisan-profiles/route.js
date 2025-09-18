import { NextResponse } from "next/server";
import { db } from "../../lib/dbServer";

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceFilter = searchParams.get("service");
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    const limit = parseInt(searchParams.get("limit")) || 100;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // Récupérer les catégories du groupe 'artisan' sauf 'artisan' lui-même
    const { data: categoryRows, error: catError } = await db
      .from("categories")
      .select("id, key, label, icon, image, description")
      .eq("group_key", "artisan")
      .neq("key", "artisan")
      .order("label");

    if (catError) throw catError;

    const categories = [];

    // Pour chaque catégorie, récupérer les profils associés
    for (const cat of categoryRows) {
      const { data: profileRows, error: profError } = await db
        .from("profiles")
        .select("id, name, latitude, longitude, photo")
        .eq("type", cat.key)
        .eq("available", true)
        .range(offset, offset + limit - 1);

      if (profError) throw profError;

      const profiles = [];

      for (const prof of profileRows) {
        const { data: serviceRows, error: servError } = await db
          .from("profile_services")
          .select("service")
          .eq("profile_id", prof.id);

        if (servError) throw servError;

        const services = serviceRows.map((s) => s.service);

        // Filtrer sur service si demandé
        if (serviceFilter && !services.includes(serviceFilter)) {
          continue;
        }

        let distance = null;
        if (!isNaN(lat) && !isNaN(lng)) {
          distance = haversineDistance(lat, lng, prof.latitude, prof.longitude);
        }

        profiles.push({
          id: prof.id,
          name: prof.name,
          latitude: prof.latitude,
          longitude: prof.longitude,
          photo: prof.photo,
          services,
          ...(distance !== null
            ? { distance: Math.round(distance * 10) / 10 }
            : {}),
        });
      }

      categories.push({
        key: cat.key,
        label: cat.label,
        icon: cat.icon,
        image: cat.image,
        description: cat.description,
        profiles,
      });
    }

    return NextResponse.json({ group: "artisan", categories });
  } catch (error) {
    console.error("⛔ Erreur API /api/artisan-profiles :", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
