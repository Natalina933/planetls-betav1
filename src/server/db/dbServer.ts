import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fallbackSupabaseUrl = "http://127.0.0.1:54321";
const fallbackSupabaseKey = "build-time-placeholder-service-role-key";

export const db = createClient<Database>(
  supabaseUrl ?? fallbackSupabaseUrl,
  supabaseKey ?? fallbackSupabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export const isSupabaseServerConfigured = Boolean(supabaseUrl && supabaseKey);

export type Tables = Database["public"]["Tables"];
export type ServicesCatalog = Tables["services_catalog"]["Row"];
export type ServicesPricing = Tables["services_pricing"]["Row"];
