// /app/api/categories/route.js
import { NextResponse } from "next/server";
import db from "../../lib/db";

export async function GET() {
    try {
        const [rows] = await db.execute(`
            SELECT id, \`key\`, label, icon, image, description
            FROM categories
            ORDER BY label
        `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("⛔ Erreur API /api/categories :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
