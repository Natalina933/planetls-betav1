import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Date invalide");
const currency = z.string().regex(/^[A-Z]{3}$/, "Devise attendue sur trois lettres majuscules");
const amount = z.number().finite().min(0).max(999999999.99)
  .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, "Deux décimales maximum");

export const pricingSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("FORFAIT_MISSION"), amount, currency }).strict(),
  z.object({ type: z.literal("HORAIRE"), amount, currency }).strict(),
  z.object({ type: z.literal("POURCENTAGE"), rate: z.number().finite().gt(0).max(100), basis: z.string().trim().min(1).max(500) }).strict(),
  z.object({ type: z.literal("INCLUS") }).strict(),
  z.object({ type: z.literal("SUR_DEVIS") }).strict(),
]);

export const contractConditionsSchema = z.object({
  mode: z.enum(["A_LA_CARTE", "FULL_MANAGEMENT"]),
  duration: z.object({
    kind: z.enum(["DETERMINEE", "INDETERMINEE"]),
    startsOn: date,
    endsOn: date.nullable(),
    noticeDays: z.number().int().min(0).max(3650),
  }).strict().superRefine((value, ctx) => {
    if (value.kind === "DETERMINEE" && (!value.endsOn || value.endsOn < value.startsOn)) {
      ctx.addIssue({ code: "custom", path: ["endsOn"], message: "Une fin valide, après le début, est requise" });
    }
    if (value.kind === "INDETERMINEE" && value.endsOn !== null) {
      ctx.addIssue({ code: "custom", path: ["endsOn"], message: "Une durée indéterminée ne comporte pas de date de fin" });
    }
  }),
  services: z.array(z.object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/),
    state: z.enum(["AUTOMATIQUE", "SUR_DEMANDE", "NON_INCLUSE"]),
    pricing: pricingSchema.nullable(),
  }).strict().superRefine((value, ctx) => {
    if ((value.state === "NON_INCLUSE") !== (value.pricing === null)) {
      ctx.addIssue({ code: "custom", path: ["pricing"], message: "Tarification requise uniquement pour une prestation convenue" });
    }
  })).min(1).max(100).refine(values => new Set(values.map(value => value.code)).size === values.length, "Codes de prestation dupliqués"),
}).strict();

export const saveContractDraftSchema = z.object({
  versionId: z.string().uuid().nullable().default(null),
  expectedRevision: z.number().int().min(0).max(2147483646),
  conditions: contractConditionsSchema,
}).strict();

export type ContractConditions = z.infer<typeof contractConditionsSchema>;
export const contractVersionActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("propose"), versionId: z.string().uuid(), expectedRevision: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("accept"), versionId: z.string().uuid(), expectedRevision: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("request_changes"), versionId: z.string().uuid(), expectedRevision: z.number().int().positive(), reason: z.string().trim().min(1).max(2000) }).strict(),
]);
export type ContractVersionAction = z.infer<typeof contractVersionActionSchema>;
export type ContractVersion = {
  id: string;
  contract_id: string;
  version_number: number;
  status: "draft" | "proposed" | "ready_to_sign" | "superseded";
  revision: number;
  conditions: ContractConditions;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  proposed_by: string | null;
  proposed_at: string | null;
  proposed_owner_id: string | null;
  proposed_concierge_id: string | null;
  owner_accepted_by: string | null;
  owner_accepted_at: string | null;
  concierge_accepted_by: string | null;
  concierge_accepted_at: string | null;
  change_requested_by: string | null;
  change_requested_at: string | null;
  change_request_reason: string | null;
  previous_version_id: string | null;
};
export type ContractDraft = ContractVersion;
export type ContractConditionsResponse = {
  draft: ContractVersion | null;
  currentVersion: ContractVersion | null;
  versions: ContractVersion[];
  actorId: string;
};
