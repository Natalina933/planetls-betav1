//*app/api/categories/groups/route.js*/`
import { NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";

export async function GET() {
  try {
    const { data: rows, error } = await db
      .from("categories")
      .select("id, key, label, icon, image, description, group_key")
      .order("label");

    if (error) {
      console.error("Erreur BDD /api/categories/groups:", error);
      // Fallback non bloquant pour éviter de casser la page côté front.
      return NextResponse.json([]);
    }

    const categories = rows
      .filter((cat) => cat.key === cat.group_key)
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
    console.error("Erreur API /api/categories/groups :", error);
    // Fallback non bloquant
    return NextResponse.json([]);
  }
}
