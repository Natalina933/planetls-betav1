import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

/**
 * 🔍 Récupère le rôle de l'utilisateur connecté côté serveur
 * (utilisable dans un composant Server Component ou un loader)
 */
export async function getUserRole(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.role ?? null;
}
