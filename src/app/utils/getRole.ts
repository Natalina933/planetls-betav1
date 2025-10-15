import { cookies } from "next/headers";

export async function getUserRole(): Promise<string | null> {
    const cookieStore = await cookies(); // faire await ici
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    // Logique pour décoder token et récupérer le rôle
    return "admin"; // exemple statique
}
