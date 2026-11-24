import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, isSupabaseServerConfigured } from "@/server/db/dbServer";
import { resolveCommercialPrincipalAccess } from "@/server/auth/commercialAccess";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { HOUSING_OWNER_KEYS } from "@/app/api/profiles/housing/quoteHousingValidation";
import { PLANETLS_SERVICE_TARGET } from "@/app/lib/planetlsServiceCatalogTarget";
import { professionalMatchesServices } from "@/app/lib/professionalSearchMatching";
import { readProviderSkills } from "@/app/lib/providerSkills";
import { evaluateProfessionalCoverage } from "@/app/api/search/professionals/coverage";
import { canRespond, createSolicitationCommandSchema, createSolicitationSchema, idempotencyKeySchema, respondSolicitationSchema, solicitationListSchema } from "../contracts.ts";
import type { CreateSolicitationInput, SolicitationErrorCode } from "../contracts.ts";
import { commandResultSchema, cursorSchema, eventViewSchema, ownerViewSchema, providerViewSchema } from "./responses.ts";
import { parseSolicitationResponseResult } from "../response-result.ts";
import type { SolicitationView } from "./responses.ts";
import { geocodeSolicitationPlace, hasPreciseAddress } from "./place.ts";
import type { PlaceInput } from "./place.ts";

const database = asLooseSupabaseClient(db);
const owners = new Set(["owner", "owner_pro"]);
const providers = new Set(["provider", "provider_pro", "artisan", "artisan_pro"]);
const uuid = z.string().uuid().transform((value) => value.toLowerCase());
const record = z.record(z.string(), z.unknown());
const providerSchema = z.object({ id: uuid, role: z.string(), status: z.string().nullable(),
  option: z.string().nullable(), availability_hours: z.string().nullable(),
  service_radius_km: z.number().nullable(), latitude: z.number().nullable(), longitude: z.number().nullable() });
type Actor = { userId: string; role: string; principalProfileId: string };
class Failure extends Error {
  constructor(readonly code: SolicitationErrorCode, readonly status: number) { super(code); }
}
const messages: Record<SolicitationErrorCode, string> = {
  INVALID_INPUT: "Paramètres invalides.", UNAUTHENTICATED: "Non authentifié.", FORBIDDEN: "Accès refusé.",
  NOT_FOUND: "Demande introuvable.", INELIGIBLE_PROVIDER: "Cet artisan n’est pas éligible pour cette prestation et ce lieu.",
  INVALID_LOCATION: "Le lieu d’intervention doit correspondre à une adresse précise et vérifiable.",
  INVALID_RESERVATION: "Le séjour ne correspond pas à la propriété autorisée.",
  IDEMPOTENCY_CONFLICT: "Cette clé a déjà été utilisée avec une demande différente.",
  DUPLICATE_OPEN_SOLICITATION: "Une demande identique est déjà en attente auprès de cet artisan.",
  ALREADY_RESPONDED: "Cette demande a déjà reçu une réponse.", VERSION_CONFLICT: "La demande a changé. Rechargez-la.",
  DECLARATION_CHANGED: "Les informations ont changé. Réessayez avec la même clé.", UNAVAILABLE: "Le service est temporairement indisponible.",
};
function json(value: unknown, status = 200) { return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } }); }
function errorResponse(error: unknown) {
  const failure = error instanceof Failure ? error : new Failure("UNAVAILABLE", 503);
  return json({ error: { code: failure.code, message: messages[failure.code] } }, failure.status);
}
async function bounded<T>(operation: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([Promise.resolve(operation), new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Failure("UNAVAILABLE", 503)), 8000);
  })]); } finally { clearTimeout(timer); }
}
async function access(req: NextRequest): Promise<Actor> {
  // No env file is changed in this lot. Explicit activation is a separate decision.
  if (process.env.PROVIDER_SOLICITATIONS_API_ENABLED !== "true" || !isSupabaseServerConfigured) throw new Failure("UNAVAILABLE", 503);
  const actor = await bounded(resolveCommercialPrincipalAccess(req));
  if (actor instanceof NextResponse) throw new Failure(actor.status === 401 ? "UNAUTHENTICATED" : actor.status === 403 ? "FORBIDDEN" : "UNAVAILABLE", actor.status === 401 ? 401 : actor.status === 403 ? 403 : 503);
  if (actor.principalProfileId !== actor.userId || (!owners.has(actor.role) && !providers.has(actor.role))) throw new Failure("FORBIDDEN", 403);
  return actor;
}
function strictOrigin(req: NextRequest) {
  // These cookie-authenticated routes do not accept the global S2S-header exemption.
  const origin = req.headers.get("origin");
  if (!origin) throw new Failure("FORBIDDEN", 403);
  let parsed: URL;
  try { parsed = new URL(origin); } catch { throw new Failure("FORBIDDEN", 403); }
  if (parsed.origin !== req.nextUrl.origin || origin !== parsed.origin || req.headers.get("sec-fetch-site") === "cross-site") throw new Failure("FORBIDDEN", 403);
}
function rpcFailure(error: { code?: string; message?: string }) {
  const mapping: Partial<Record<SolicitationErrorCode, number>> = { INVALID_INPUT: 400, FORBIDDEN: 403, NOT_FOUND: 404,
    INELIGIBLE_PROVIDER: 422, INVALID_LOCATION: 422, INVALID_RESERVATION: 422, IDEMPOTENCY_CONFLICT: 409,
    DUPLICATE_OPEN_SOLICITATION: 409, ALREADY_RESPONDED: 409, VERSION_CONFLICT: 409, DECLARATION_CHANGED: 409 };
  const code = error.message as SolicitationErrorCode;
  if (Object.hasOwn(mapping, code)) throw new Failure(code, mapping[code]!);
  // Do not forward SQL messages/details, including private constraint values.
  if (["22P02", "22023", "23502", "23514"].includes(error.code ?? "")) throw new Failure("INVALID_INPUT", 400);
  if (error.code === "42501") throw new Failure("FORBIDDEN", 403);
  if (["40001", "40P01"].includes(error.code ?? "")) throw new Failure("DECLARATION_CHANGED", 409);
  throw new Failure("UNAVAILABLE", 503);
}
async function rpc(name: string, args: Record<string, unknown>) {
  const result = await bounded(database.rpc(name, args));
  if (result.error) rpcFailure(result.error);
  return result.data as unknown;
}
async function row(table: string, columns: string, id: string) {
  const result = await bounded(database.from(table).select(columns).eq("id", id).maybeSingle<unknown>());
  if (result.error) throw new Failure("UNAVAILABLE", 503);
  return result.data;
}
async function requestBody(req: NextRequest): Promise<unknown> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" || !req.body) throw new Failure("INVALID_INPUT", 400);
  const reader = req.body.getReader(); const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0; let text = "";
  try {
    while (true) {
      const chunk = await bounded(reader.read());
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 32768) { void reader.cancel().catch(() => undefined); throw new Failure("INVALID_INPUT", 400); }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof Failure) throw error;
    throw new Failure("INVALID_INPUT", 400);
  } finally { reader.releaseLock(); }
}
async function resolvePlace(input: CreateSolicitationInput, actor: Actor) {
  let source: { city: string | null; address: string | null };
  let query: PlaceInput;
  if (input.reservation_id !== null) {
    if (input.location.kind !== "property") throw new Failure("INVALID_RESERVATION", 422);
    const stay = z.object({ owner_profile_id: uuid, property_id: uuid.nullable() }).safeParse(
      await row("reservations", "id,owner_profile_id,property_id", input.reservation_id));
    if (!stay.success || stay.data.owner_profile_id !== actor.userId || stay.data.property_id !== input.location.property_id) throw new Failure("INVALID_RESERVATION", 422);
  }
  if (input.location.kind === "property") {
    const property = z.object({ owner_id: uuid, city: z.string().nullable() }).safeParse(
      await row("properties", "id,owner_id,city", input.location.property_id));
    if (!property.success || property.data.owner_id !== actor.userId) throw new Failure("FORBIDDEN", 403);
    // The persisted properties contract exposes only a city. Never invent an address
    // or borrow a housing record without a verified relation.
    throw new Failure("INVALID_LOCATION", 422);
  } else if (input.location.kind === "housing") {
    const housing = z.object({ ville: z.string().nullable(), adresse: z.string().nullable(), proprietaire: record }).safeParse(
      await row("housing", "id,ville,adresse,proprietaire", input.location.housing_id));
    if (!housing.success) throw new Failure("FORBIDDEN", 403);
    const ids = HOUSING_OWNER_KEYS.map((key) => housing.data.proprietaire[key]).filter((value) => value != null && value !== "");
    if (!ids.length || ids.some((id) => id !== actor.userId)) throw new Failure("FORBIDDEN", 403);
    source = { city: housing.data.ville, address: housing.data.adresse };
    query = { address: source.address ?? "", city: source.city ?? "" };
  } else {
    source = { city: input.location.city, address: input.location.address };
    query = input.location;
  }
  if (!hasPreciseAddress(query)) throw new Failure("INVALID_LOCATION", 422);
  const point = await geocodeSolicitationPlace(query);
  if (!point) throw new Failure("INVALID_LOCATION", 422);
  return { source, point };
}

export async function create(req: NextRequest) {
  try {
    strictOrigin(req);
    const actor = await access(req);
    if (!owners.has(actor.role)) throw new Failure("FORBIDDEN", 403);
    const key = idempotencyKeySchema.safeParse(req.headers.get("idempotency-key"));
    if (!key.success) throw new Failure("INVALID_INPUT", 400);
    const parsed = createSolicitationSchema.safeParse(await requestBody(req));
    if (!parsed.success) throw new Failure("INVALID_INPUT", 400);
    const input = parsed.data;
    const identity = { p_principal_id: actor.principalProfileId, p_actor_id: actor.userId, p_idempotency_key: key.data };
    const lookup = record.safeParse(await rpc("lookup_provider_solicitation_creation", { ...identity, p_parameters: input }));
    if (!lookup.success || typeof lookup.data.found !== "boolean") throw new Failure("UNAVAILABLE", 503);
    if (lookup.data.found) {
      const replay = commandResultSchema.safeParse(lookup.data);
      if (!replay.success || !replay.data.replayed) throw new Failure("UNAVAILABLE", 503);
      return json(replay.data);
    }
    if (input.desired_at !== null && Date.parse(input.desired_at) <= Date.now()) throw new Failure("INVALID_INPUT", 400);
    const profile = providerSchema.safeParse(await row("profiles", "id,role,status,option,availability_hours,service_radius_km,latitude,longitude", input.provider_profile_id));
    if (!profile.success) throw new Failure("INELIGIBLE_PROVIDER", 422);
    const provider = profile.data;
    if (provider.id !== input.provider_profile_id || provider.id === actor.userId || provider.status !== "active"
      || !providers.has(provider.role.trim().toLowerCase()) || !professionalMatchesServices(readProviderSkills(provider.option), [input.service_slug])) throw new Failure("INELIGIBLE_PROVIDER", 422);
    const { source, point } = await resolvePlace(input, actor);
    const coverage = evaluateProfessionalCoverage(provider, { center: point, radiusKm: 0 });
    if (coverage.state !== "covered") throw new Failure("INELIGIBLE_PROVIDER", 422);
    const entry = PLANETLS_SERVICE_TARGET.find((service) => service.slug === input.service_slug)!;
    const { option, availability_hours, service_radius_km, latitude, longitude } = provider;
    const command = createSolicitationCommandSchema.safeParse({ ...input, ...point, service_label_snapshot: entry.label,
      provider_declaration: { option, availability_hours, service_radius_km, latitude, longitude }, location_declaration: source });
    if (!command.success) throw new Failure("UNAVAILABLE", 503);
    const result = commandResultSchema.safeParse(await rpc("create_provider_solicitation", { ...identity, p_parameters: command.data }));
    if (!result.success) throw new Failure("UNAVAILABLE", 503);
    return json(result.data, result.data.replayed ? 200 : 201);
  } catch (error) { return errorResponse(error); }
}

export async function respond(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    strictOrigin(req);
    const actor = await access(req);
    if (!providers.has(actor.role)) throw new Failure("FORBIDDEN", 403);
    const id = uuid.safeParse((await context.params).id);
    const key = idempotencyKeySchema.safeParse(req.headers.get("idempotency-key"));
    if (!id.success || !key.success) throw new Failure("INVALID_INPUT", 400);
    const parsed = respondSolicitationSchema.safeParse(await requestBody(req));
    if (!parsed.success) throw new Failure("INVALID_INPUT", 400);
    const input = parsed.data;
    // Only SQL decides the transition/replay under lock. No read-then-write
    // decision here, no local status mutation, no secondary persistence call.
    const result = parseSolicitationResponseResult(await rpc("respond_provider_solicitation", {
      p_principal_id: actor.principalProfileId, p_actor_id: actor.userId, p_idempotency_key: key.data,
      p_solicitation_id: id.data, p_status: input.status, p_message: input.message, p_expected_version: input.expected_version,
    }), id.data, input.status);
    if (!result) throw new Failure("UNAVAILABLE", 503);
    // Minimal private command result, including on replay. Detail/history are
    // obtained separately through the participant-scoped GET, never post-write.
    return json(result);
  } catch (error) { return errorResponse(error); }
}

function view(raw: unknown, actor: Actor): SolicitationView {
  const parsed = (owners.has(actor.role) ? ownerViewSchema : providerViewSchema).safeParse(raw);
  if (!parsed.success) throw new Failure("UNAVAILABLE", 503);
  const item = parsed.data;
  if ((owners.has(actor.role) ? item.owner_profile_id : item.provider_profile_id) !== actor.userId) throw new Failure("NOT_FOUND", 404);
  if (item.prospective_client_profile_id !== item.owner_profile_id || item.owner_profile_id === item.provider_profile_id
    || (item.status === "sent" ? item.version !== 1 || item.responded_at !== null || item.response_message !== null : item.version !== 2 || item.responded_at === null)) throw new Failure("UNAVAILABLE", 503);
  return item;
}
export async function list(req: NextRequest) {
  try {
    const actor = await access(req);
    const params = req.nextUrl.searchParams;
    if (new Set(params.keys()).size !== [...params.keys()].length) throw new Failure("INVALID_INPUT", 400);
    const parsed = solicitationListSchema.safeParse(Object.fromEntries(params));
    if (!parsed.success) throw new Failure("INVALID_INPUT", 400);
    const input = parsed.data;
    let before: { at: string; id: string } | null = null;
    if (input.cursor) {
      let raw: unknown;
      try {
        if (!/^[A-Za-z0-9_-]+$/.test(input.cursor)) throw new Error();
        raw = JSON.parse(Buffer.from(input.cursor, "base64url").toString("utf8"));
      } catch { throw new Failure("INVALID_INPUT", 400); }
      const cursor = cursorSchema.safeParse(raw);
      if (!cursor.success || cursor.data.actor !== actor.userId || cursor.data.role !== actor.role || cursor.data.status !== (input.status ?? null)) throw new Failure("INVALID_INPUT", 400);
      before = cursor.data;
    }
    const result = record.safeParse(await rpc("read_provider_solicitations", { p_principal_id: actor.principalProfileId,
      p_actor_id: actor.userId, p_status: input.status ?? null, p_limit: input.limit, p_before_at: before?.at ?? null, p_before_id: before?.id ?? null }));
    if (!result.success || !Array.isArray(result.data.items) || result.data.items.length > input.limit) throw new Failure("UNAVAILABLE", 503);
    const items = result.data.items.map((item) => view(item, actor));
    if (input.status && items.some((item) => item.status !== input.status)) throw new Failure("UNAVAILABLE", 503);
    const last = items.at(-1);
    const cursor = items.length === input.limit && last ? Buffer.from(JSON.stringify({ actor: actor.userId, role: actor.role,
      status: input.status ?? null, at: last.created_at, id: last.id })).toString("base64url") : null;
    return json({ items, next_cursor: cursor });
  } catch (error) { return errorResponse(error); }
}
export async function detail(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await access(req);
    const id = uuid.safeParse((await context.params).id);
    if (!id.success) throw new Failure("INVALID_INPUT", 400);
    const result = record.safeParse(await rpc("read_provider_solicitations", { p_principal_id: actor.principalProfileId, p_actor_id: actor.userId, p_solicitation_id: id.data }));
    if (!result.success) throw new Failure("UNAVAILABLE", 503);
    const item = view(result.data.solicitation, actor);
    if (item.id !== id.data) throw new Failure("NOT_FOUND", 404);
    const events = z.array(eventViewSchema).safeParse(result.data.events);
    if (!events.success || events.data.some((event) => event.solicitation_id !== item.id
      || ![item.owner_profile_id, item.provider_profile_id].includes(event.actor_profile_id))) throw new Failure("UNAVAILABLE", 503);
    if (events.data.length !== item.version || events.data.some((event, index) => event.version !== index + 1
      || (index === 0 ? event.event_type !== "solicitation_sent" || event.actor_profile_id !== item.owner_profile_id
        || event.old_status !== null || event.new_status !== "sent" || event.message !== null
        : event.actor_profile_id !== item.provider_profile_id || event.old_status !== "sent" || event.new_status !== item.status
          || event.event_type !== (item.status === "interested" ? "provider_interested" : "provider_declined")
          || event.message !== item.response_message))) throw new Failure("UNAVAILABLE", 503);
    let canRespondNow = false;
    if (providers.has(actor.role) && canRespond(item.status, item.version)) {
      const owner = z.object({ id: uuid, role: z.string(), status: z.string().nullable() }).safeParse(
        await row("profiles", "id,role,status", item.owner_profile_id));
      canRespondNow = owner.success && owner.data.id === item.owner_profile_id && owner.data.status === "active" && owners.has(owner.data.role.trim().toLowerCase());
    }
    // Advisory action only: SQL rechecks both parties under lock on POST.
    return json({ solicitation: item, events: events.data, allowed_actions: { can_view: true, can_respond: canRespondNow } });
  } catch (error) { return errorResponse(error); }
}
