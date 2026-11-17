import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "./untypedSupabase";

/** Enable only after the C1A schema, RPCs and effective ACLs have been validated. */
export function missionAssignmentSchemaReady(): boolean {
  return process.env.PLANETLS_MISSION_ASSIGNMENTS_READY === "true";
}

/** No legacy fallback: missing schema or query failure must deny Storage access. */
export async function isAssignedMissionProvider(providerId: string, missionId: string): Promise<boolean> {
  if (!missionAssignmentSchemaReady()) throw new Error("Affectations sécurisées non activées.");
  const { data, error } = await asLooseSupabaseClient(db)
    .from("mission_provider_assignments")
    .select("id")
    .eq("mission_id", missionId)
    .eq("provider_profile_id", providerId)
    .eq("state", "active")
    .is("revoked_at", null)
    .limit(1);
  if (error) throw new Error("Vérification de l’affectation indisponible.");
  return Array.isArray(data) && data.length > 0;
}
