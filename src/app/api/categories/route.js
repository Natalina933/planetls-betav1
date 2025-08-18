// /app/api/categories/route.js
import { NextResponse } from "next/server";
import db from "../../lib/db";

export async function GET() {
    try {
        const { data: rows, error } = await db
            .from('categories')
            .select('id, key, label, icon, image, description')
            .order('label');

        if (error) {
            throw error;
        }

        return NextResponse.json(rows);
    } catch (error) {
        console.error("⛔ Erreur API /api/categories :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
