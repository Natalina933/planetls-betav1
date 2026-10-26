import type { LooseSupabaseClient } from "./untypedSupabase.ts";
import { HOUSING_OWNER_KEYS } from "../profiles/housing/quoteHousingValidation.ts";

type LocationInput = { housingId: string | null; propertyId?: string | null;
  city?: string | null; address?: string | null; postalCode?: string | null };

/** Persisted location takes precedence over any client-supplied address. */
export async function requestInterventionLocation(db: LooseSupabaseClient, ownerId: string, input: LocationInput) {
  let propertyCity: string | null = null;
  if (input.propertyId) {
    const { data, error } = await db.from("properties").select("id, city, owner_id")
      .eq("id", input.propertyId).eq("owner_id", ownerId).maybeSingle();
    if (error) return { ok: false, status: 500, error: "Impossible de vérifier la propriété." } as const;
    if (!data) return { ok: false, status: 403, error: "Accès à la propriété refusé." } as const;
    propertyCity = data.city;
  }
  if (input.housingId) {
    const { data, error } = await db.from("housing").select("id, adresse, ville, proprietaire")
      .eq("id", input.housingId).maybeSingle();
    if (error) return { ok: false, status: 500, error: "Impossible de vérifier le logement." } as const;
    const ownership = data?.proprietaire;
    const ids = ownership && typeof ownership === "object" && !Array.isArray(ownership)
      ? HOUSING_OWNER_KEYS.map((key) => ownership[key]).filter((id) => id != null && id !== "") : [];
    if (!data || !ids.length || ids.some((id) => id !== ownerId)) {
      return { ok: false, status: 403, error: "Accès au logement refusé." } as const;
    }
    return { ok: true, location: [data.adresse, data.ville].filter(Boolean).join(", "),
      city: data.ville as string | null, address: data.adresse as string | null } as const;
  }
  if (input.propertyId) {
    return { ok: true, location: propertyCity, city: propertyCity, address: null } as const;
  }
  return { ok: true, location: [input.address, input.city, input.postalCode].filter(Boolean).join(", "),
    city: input.city ?? null, address: input.address ?? null } as const;
}
