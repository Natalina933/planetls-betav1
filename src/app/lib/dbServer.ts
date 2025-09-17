import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// On typpe le client avec <Database>
export const db = createClient<Database>(supabaseUrl, supabaseAnonKey);
