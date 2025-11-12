// src/app/lib/dbServer.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/lib/types";

// ✅ Récupération des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 🧠 Vérification des variables 
if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL manquante !");
}
if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante !");
}

// ⚙️ Création du client typé Supabase (backend)
export const db: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
);
