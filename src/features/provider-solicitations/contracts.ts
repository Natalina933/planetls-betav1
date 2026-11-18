import { z } from "zod";
import { PLANETLS_SERVICE_TARGET } from "../../app/lib/planetlsServiceCatalogTarget.ts";

/** An expression of interest is never a contractual acceptance. */
export const SOLICITATION_STATUSES = ["sent", "interested", "declined"] as const;
export const solicitationStatusSchema = z.enum(SOLICITATION_STATUSES);
export type SolicitationStatus = z.infer<typeof solicitationStatusSchema>;
export const SOLICITATION_EVENTS = ["solicitation_sent", "provider_interested", "provider_declined"] as const;
export type SolicitationEventType = (typeof SOLICITATION_EVENTS)[number];
export const SOLICITATION_ERRORS = [
  "INVALID_INPUT", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "INELIGIBLE_PROVIDER",
  "INVALID_LOCATION", "INVALID_RESERVATION", "IDEMPOTENCY_CONFLICT", "DUPLICATE_OPEN_SOLICITATION",
  "ALREADY_RESPONDED", "VERSION_CONFLICT", "DECLARATION_CHANGED", "UNAVAILABLE",
] as const;
export type SolicitationErrorCode = (typeof SOLICITATION_ERRORS)[number];
export type SolicitationError = { code: SolicitationErrorCode; message: string };

const uuid = z.string().uuid().transform((value) => value.toLowerCase());
const text = (max: number) => z.string().trim().min(1).max(max);
const service = text(100).refine((slug) => PLANETLS_SERVICE_TARGET.some(
  (entry) => entry.slug === slug && entry.kind === "service",
), "Une prestation canonique précise est requise.");
const date = z.iso.datetime({ offset: true });
export const idempotencyKeySchema = uuid;
export const solicitationLocationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("property"), property_id: uuid }).strict(),
  z.object({ kind: z.literal("housing"), housing_id: z.string().regex(/^[1-9][0-9]*$/).refine(
    (value) => /^[1-9][0-9]*$/.test(value) && BigInt(value) <= BigInt("9223372036854775807"), "Identifiant BIGINT invalide.",
  ) }).strict(),
  z.object({ kind: z.literal("address"), address: text(500), city: text(200),
    postal_code: text(20), country_code: z.string().regex(/^[A-Z]{2}$/) }).strict(),
]);
export const createSolicitationSchema = z.object({
  provider_profile_id: uuid, service_slug: service, description: text(5000),
  location: solicitationLocationSchema,
  reservation_id: uuid.nullable().default(null), desired_at: date.nullable().default(null),
}).strict();
export type CreateSolicitationInput = z.infer<typeof createSolicitationSchema>;
export const respondSolicitationSchema = z.object({
  status: z.enum(["interested", "declined"]),
  message: z.string().trim().max(2000).transform((value) => value || null).nullable().default(null),
  expected_version: z.number().int().min(1).max(2147483647),
}).strict();
export type RespondSolicitationInput = z.infer<typeof respondSolicitationSchema>;
export const solicitationListSchema = z.object({
  status: solicitationStatusSchema.optional(), limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(500).optional(),
}).strict();

export const verifiedPlaceSchema = z.object({
  location_label: text(700), city: text(200), postal_code: text(20),
  country_code: z.string().regex(/^[A-Z]{2}$/), latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180), geocoded_at: date,
  geocoding_source: text(100),
}).strict();
export type VerifiedPlace = z.infer<typeof verifiedPlaceSchema>;
/** Internal RPC arguments only: never accept this attestation from an HTTP body.
 * Lot B must qualify the place, declared coverage and service before constructing it.
 * SQL compares this snapshot to the locked provider declarations, not a free metadata flag.
 */
export const createSolicitationCommandSchema = z.object({
  ...createSolicitationSchema.shape, ...verifiedPlaceSchema.shape,
  service_label_snapshot: text(200),
  provider_declaration: z.object({ option: z.string().nullable(), availability_hours: z.string().nullable(),
    service_radius_km: z.number().nullable(), latitude: z.number().nullable(), longitude: z.number().nullable(),
  }).strict(),
  location_declaration: z.object({ city: z.string().nullable(), address: z.string().nullable() }).strict(),
}).strict().superRefine((command, ctx) => {
  const entry = PLANETLS_SERVICE_TARGET.find((candidate) => candidate.slug === command.service_slug);
  if (entry?.label !== command.service_label_snapshot) ctx.addIssue({ code: "custom", message: "Libellé canonique incohérent." });
  if (command.reservation_id !== null && command.location.kind !== "property") {
    ctx.addIssue({ code: "custom", message: "Un séjour doit être relié à sa propriété canonique." });
  }
});
export type CreateSolicitationCommand = z.infer<typeof createSolicitationCommandSchema>;
export type SolicitationActor = { principal_profile_id: string; actor_profile_id: string };

export type Solicitation = VerifiedPlace & {
  id: string; owner_profile_id: string; prospective_client_profile_id: string; provider_profile_id: string;
  service_slug: string; service_label_snapshot: string; description: string;
  location_kind: "property" | "housing" | "address"; property_id: string | null;
  housing_id: string | null; reservation_id: string | null; desired_at: string | null;
  status: SolicitationStatus; response_message: string | null; responded_at: string | null;
  version: 1 | 2; creation_operation_id: string; business_fingerprint: string;
  created_at: string; updated_at: string;
};
export type SolicitationEvent = {
  id: string; solicitation_id: string; event_type: SolicitationEventType;
  actor_principal_id: string; actor_profile_id: string;
  old_status: SolicitationStatus | null; new_status: SolicitationStatus;
  version: 1 | 2; message: string | null; operation_id: string; created_at: string;
};
export type SolicitationEventView = Omit<SolicitationEvent, "actor_principal_id" | "operation_id">;
export type SolicitationCommandResult = {
  result: { solicitation_id: string; status: SolicitationStatus; version: 1 | 2 };
  operation_id: string; replayed: boolean;
};
export type CreateSolicitationRpc = {
  p_principal_id: string; p_actor_id: string; p_idempotency_key: string; p_parameters: CreateSolicitationCommand;
};
export type RespondSolicitationRpc = {
  p_principal_id: string; p_actor_id: string; p_idempotency_key: string; p_solicitation_id: string;
  p_status: RespondSolicitationInput["status"]; p_message: string | null; p_expected_version: number;
};
export type ReadSolicitationsRpc = {
  p_principal_id: string; p_actor_id: string; p_solicitation_id?: string | null;
  p_status?: SolicitationStatus | null; p_limit?: number;
  p_before_at?: string | null; p_before_id?: string | null;
};
export type SolicitationDetail<View extends OwnerSolicitationView | ProviderSolicitationView> = {
  solicitation: View; events: SolicitationEventView[];
};
export type SolicitationOperation = SolicitationActor & {
  id: string; command: "create" | "respond"; idempotency_key: string; request_fingerprint: string;
  solicitation_id: string; result: { solicitation_id: string; status: SolicitationStatus; version: 1 | 2 };
  created_at: string;
};
export type OwnerSolicitationView = Omit<Solicitation, "creation_operation_id" | "business_fingerprint">;
export type ProviderSolicitationView = Omit<OwnerSolicitationView, "property_id" | "housing_id" | "reservation_id">;
/** Explicit allowlist: storage provenance and stay identifiers never leak to the artisan. */
export function projectOwnerSolicitation(row: Solicitation): OwnerSolicitationView {
  return {
    id: row.id, owner_profile_id: row.owner_profile_id, prospective_client_profile_id: row.prospective_client_profile_id,
    provider_profile_id: row.provider_profile_id, service_slug: row.service_slug, service_label_snapshot: row.service_label_snapshot,
    description: row.description, location_kind: row.location_kind, property_id: row.property_id,
    housing_id: row.housing_id, reservation_id: row.reservation_id, desired_at: row.desired_at,
    location_label: row.location_label, city: row.city, postal_code: row.postal_code, country_code: row.country_code,
    latitude: row.latitude, longitude: row.longitude, geocoded_at: row.geocoded_at, geocoding_source: row.geocoding_source,
    status: row.status, response_message: row.response_message, responded_at: row.responded_at,
    version: row.version, created_at: row.created_at, updated_at: row.updated_at,
  };
}
export function projectProviderSolicitation(row: Solicitation): ProviderSolicitationView {
  const result = projectOwnerSolicitation(row);
  const { property_id: _property, housing_id: _housing, reservation_id: _reservation, ...view } = result;
  void _property; void _housing; void _reservation;
  return view;
}

/** State hint only; current identity, role and ownership must still be authorized. */
export function canRespond(status: SolicitationStatus, version: number): boolean {
  return status === "sent" && version === 1;
}
