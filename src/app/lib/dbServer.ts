// src/app/lib/dbServer.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// ✅ Récupération des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 🧠 Vérification des variables — message lisible dans les logs
if (!supabaseUrl) {
  console.error(
    "❌ Erreur : la variable NEXT_PUBLIC_SUPABASE_URL est manquante !"
  );
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL manquante (vérifie Vercel → Settings → Environment Variables)"
  );
}

if (!supabaseServiceRoleKey) {
  console.error(
    "❌ Erreur : la variable SUPABASE_SERVICE_ROLE_KEY est manquante !"
  );
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY manquante (vérifie Vercel → Settings → Environment Variables)"
  );
}

// 🕵️ Log non sensible (on masque la clé)
console.log("✅ Supabase configuré :", {
  url: supabaseUrl,
  key: supabaseServiceRoleKey
    ? `••••••${supabaseServiceRoleKey.slice(-4)}`
    : "❌ absente",
});

// ⚙️ Création du client typé Supabase (backend)
export const db = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
