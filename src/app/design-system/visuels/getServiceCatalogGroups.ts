// src/app/design-system/visuels/getServiceCatalogGroups.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "build-time-placeholder-anon-key";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceCatalogItem {
  id: number;
  category: string;
  service: string;
  description: string;
}

export interface ServiceCatalogGroup {
  category: string;
  services: ServiceCatalogItem[];
}

// ─── Function ────────────────────────────────────────────────────────────────

export async function getServiceCatalogGroups(): Promise<ServiceCatalogGroup[]> {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("categories")
    .select("id, key, label, description, group_key")
    .order("group_key", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    console.error("[getServiceCatalogGroups] Supabase error:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Regroupe les catégories par group_key (ou "Autre" si absent)
  const groupMap = new Map<string, ServiceCatalogItem[]>();

  for (const row of data) {
    const groupKey = row.group_key ?? "Autre";

    const item: ServiceCatalogItem = {
      id: Number(row.id),
      category: groupKey,
      service: row.label,
      description: row.description ?? "",
    };

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey)!.push(item);
  }

  return Array.from(groupMap.entries()).map(([category, services]) => ({
    category,
    services,
  }));
}
