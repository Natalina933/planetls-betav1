import type { Database as ProviderDatabase } from "./supabase.generated";

export type ProviderSchemaSnapshot = typeof import("./supabase.generated");
export type ProviderTables = ProviderDatabase["public"]["Tables"];
export type ProviderTableName = keyof ProviderTables;
export type ProviderRow<T extends ProviderTableName> = ProviderTables[T]["Row"];
export type ProviderInsert<T extends ProviderTableName> = ProviderTables[T]["Insert"];
export type ProviderUpdate<T extends ProviderTableName> = ProviderTables[T]["Update"];

// Bridge file to adopt generated provider types module by module
// without replacing the legacy app-wide supabase types in one step.
