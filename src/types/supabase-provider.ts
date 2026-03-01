export type ProviderSchemaSnapshot = typeof import("./supabase.generated");

// Bridge file to adopt generated provider types module by module
// without replacing the legacy app-wide supabase types in one step.
