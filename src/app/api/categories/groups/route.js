import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
    try {
        // On récupère toutes les catégories, y compris la colonne group_key
        const { data: rows, error } = await db
            .from('categories')
            .select('id, key, label, icon, image, description, group_key')
            .order('label');

        if (error) throw error;

        // On filtre en JS pour ne garder que les lignes où key === group_key
        const categories = rows
            .filter(cat => cat.key === cat.group_key)
            .map((cat) => ({
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
