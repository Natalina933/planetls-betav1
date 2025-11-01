// src/app/lib/dbServer.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/supabase";

// ⚠️ Utilise la clé de service pour le backend uniquement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client Supabase typé avec Database
export const db = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
