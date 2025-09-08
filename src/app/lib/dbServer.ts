import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types"; // optionnel

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const db = createClient<Database>(supabaseUrl, supabaseAnonKey);
