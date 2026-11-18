import { z } from "zod";
import { SOLICITATION_EVENTS, solicitationStatusSchema, verifiedPlaceSchema } from "../contracts.ts";

const uuid = z.string().uuid();
const date = z.iso.datetime({ offset: true });
const common = z.object({
  ...verifiedPlaceSchema.shape, id: uuid, owner_profile_id: uuid, prospective_client_profile_id: uuid, provider_profile_id: uuid,
  service_slug: z.string(), service_label_snapshot: z.string(), description: z.string(),
  location_kind: z.enum(["property", "housing", "address"]), desired_at: date.nullable(),
  status: solicitationStatusSchema, response_message: z.string().nullable(), responded_at: date.nullable(),
  version: z.union([z.literal(1), z.literal(2)]), created_at: date, updated_at: date,
});
export const providerViewSchema = common;
export const ownerViewSchema = common.extend({ property_id: uuid.nullable(), housing_id: z.string().regex(/^[1-9][0-9]*$/).nullable(), reservation_id: uuid.nullable() });
export const eventViewSchema = z.object({ id: uuid, solicitation_id: uuid, event_type: z.enum(SOLICITATION_EVENTS), actor_profile_id: uuid,
  old_status: solicitationStatusSchema.nullable(), new_status: solicitationStatusSchema, version: z.union([z.literal(1), z.literal(2)]),
  message: z.string().nullable(), created_at: date,
});
export const commandResultSchema = z.object({ result: z.object({ solicitation_id: uuid, status: z.literal("sent"), version: z.literal(1) }),
  operation_id: uuid, replayed: z.boolean(),
});
export const responseResultSchema = z.object({
  result: z.object({ solicitation_id: uuid, status: z.enum(["interested", "declined"]), version: z.literal(2) }),
  operation_id: uuid, replayed: z.boolean(),
});
export const cursorSchema = z.object({ actor: uuid, role: z.string(), status: solicitationStatusSchema.nullable(), at: date, id: uuid }).strict();
export type SolicitationView = z.infer<typeof ownerViewSchema> | z.infer<typeof providerViewSchema>;
