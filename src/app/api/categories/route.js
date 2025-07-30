import { NextResponse } from "next/server";
import db from "../../lib/db";

export async function GET() {
    try {
        const [rows] = await db.execute(`
        SELECT id, \`key\`, label, icon, image, description
        FROM categories
        ORDER BY label
    `);

        const categories = rows.map((cat) => ({
            id: cat.id,
            key: cat.key,
            label: cat.label,
            icon: cat.icon,
            image: cat.image,
            description: cat.description,
        }));

        return NextResponse.json(categories);
    } catch (error) {
        console.error("⛔ Erreur API /api/categories :", error);
        return NextResponse.json(
            { error: error.message || "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
