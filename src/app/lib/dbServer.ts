// src/app/lib/dbServer.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Variables d'environnement Supabase manquantes");
}

// IMPORTANT: Typage explicite avec Database
export const db = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Type helper pour vérifier le typage
export type Tables = Database["public"]["Tables"];
export type ServicesCatalog = Tables["services_catalog"]["Row"];
export type ServicesPricing = Tables["services_pricing"]["Row"];
