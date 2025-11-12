// src/app/lib/dbClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL ou ANON KEY manquante dans les variables d'environnement.");
}

export const supabaseBrowser = (): SupabaseClient<Database> => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};
