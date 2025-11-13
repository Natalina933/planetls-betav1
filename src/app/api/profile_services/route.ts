import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import type { Database } from "@/app/lib/types";

// ---- Validation Zod ----
const updateProfileSchema = z.object({
  category: z.string().optional(),
  searchTarget: z.string().optional(),
  option: z.string().optional(),
  location: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  additionalInfo: z.string().optional(),
});

// ---- CamelCase -> SnakeCase & Typage ----
const mapToDbFields = (
  data: z.infer<typeof updateProfileSchema>
): Partial<Database["public"]["Tables"]["profiles"]["Update"]> => {
  const update: Partial<Database["public"]["Tables"]["profiles"]["Update"]> = {};
  if (data.firstName !== undefined) update.first_name = data.firstName;
  if (data.lastName !== undefined) update.last_name = data.lastName;
  if (data.email !== undefined) update.email = data.email;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.location !== undefined) update.location = data.location;
  if (data.option !== undefined) update.option = data.option;
  if (data.searchTarget !== undefined) update.search_target = data.searchTarget;
  if (data.category !== undefined) update.category = data.category;
  if (data.additionalInfo !== undefined) update.additional_info = data.additionalInfo;
  // Ajoute updated_at si la colonne est bien dans ta table/type !
  // update.updated_at = new Date().toISOString();
  return update;
};

// ---- Handler PATCH (et POST/futur compatible) ----
export async function PATCH(req: NextRequest) {
  try {
    // 1. Validation body
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 2. Authentification via Bearer token reçu dans Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const access_token = authHeader.replace("Bearer ", "").trim();

    // 3. Initialise Supabase server client et set la session utilisateur
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // Injection du token pour les requêtes authentifiées
    await supabase.auth.setSession({ access_token, refresh_token: "" });

    // 4. Récupère l'utilisateur courant (assuré par le token)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
    }

    // 5. Prépare et exécute l'update
    const updateData = mapToDbFields(parsed.data);
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// (Optionnel) Pour supporter POST aussi :
export const POST = PATCH;
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import type { Database } from "@/app/lib/types";
// ---- Validation Zod ----
const updateProfileSchema = z.object({
  category: z.string().optional(),
  searchTarget: z.string().optional(),
  option: z.string().optional(),
  location: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  additionalInfo: z.string().optional(),
});
// ---- CamelCase -> SnakeCase & Typage ----
const mapToDbFields = (
  data: z.infer<typeof updateProfileSchema> & { id: string }    
): Partial<Database["public"]["Tables"]["profiles"]["Update"]> => {
  const update: Partial<Database["public"]["Tables"]["profiles"]["Update"]> = {};
  if (data.firstName !== undefined) update.first_name = data.firstName;
  if (data.lastName !== undefined) update.last_name = data.lastName;
  if (data.email !== undefined) update.email = data.email;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.location !== undefined) update.location = data.location;
  if (data.option !== undefined) update.option = data.option;
  if (data.searchTarget !== undefined) update.search_target = data.searchTarget;    
  if (data.category !== undefined) update.category = data.category;    
  if (data.additionalInfo !== undefined) update.additional_info = data.additionalInfo;
  // Ajoute updated_at si la colonne est bien dans ta table/type !
  // update.updated_at = new Date().toISOString();
  return update;
};