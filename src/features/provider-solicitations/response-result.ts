import { z } from "zod";

const responseResultSchema = z.object({
  result: z.object({
    solicitation_id: z.string().uuid(),
    status: z.enum(["interested", "declined"]),
    version: z.literal(2),
  }),
  operation_id: z.string().uuid(),
  replayed: z.boolean(),
});

export function parseSolicitationResponseResult(
  value: unknown,
  solicitationId: string,
  status: "interested" | "declined",
) {
  const parsed = responseResultSchema.safeParse(value);
  if (!parsed.success || parsed.data.result.solicitation_id !== solicitationId
    || parsed.data.result.status !== status) return null;
  return parsed.data;
}
