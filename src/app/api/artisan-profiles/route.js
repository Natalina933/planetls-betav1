import { NextResponse } from "next/server";
import db from "../../lib/db";

const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
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

        const [categoryRows] = await db.execute(`
      SELECT id, \`key\`, label, icon, image, description
      FROM categories
      WHERE group_key = 'artisan' AND \`key\` != 'artisan'
      ORDER BY label
    `);

        const categories = [];

        for (const cat of categoryRows) {
            const [profileRows] = await db.execute(`
        SELECT id, name, latitude, longitude, photo
        FROM profiles
        WHERE type = ? AND available = 1
        LIMIT ? OFFSET ?
      `, [cat.key, limit, offset]);

            const profiles = [];

            for (const prof of profileRows) {
                const [serviceRows] = await db.execute(`
          SELECT service
          FROM profile_services
          WHERE profile_id = ?
        `, [prof.id]);

                const services = serviceRows.map(s => s.service);

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
                    ...(distance !== null ? { distance: Math.round(distance * 10) / 10 } : {})
                });
            }

            categories.push({
                key: cat.key,
                label: cat.label,
                icon: cat.icon,
                image: cat.image,
                description: cat.description,
                profiles
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
