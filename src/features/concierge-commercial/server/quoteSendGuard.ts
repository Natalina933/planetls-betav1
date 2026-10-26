// LOT 6B — Garde-fou d'envoi de devis (côté serveur, logique pure).
//
// Un devis ne peut être envoyé que si :
//  - chaque ligne est tarifée (unit_price > 0) ou explicitement confirmée
//    gratuite (métadonnée serveur quote_service_price_confirmed === true) ;
//  - aucune ligne ne porte une clarification encore ouverte
//    (needs_clarification / needs_explicit_price) ;
//  - le budget du propriétaire n'est JAMAIS converti en prix (indicatif).
//
// La vérification est par ligne et par défaut bloquante : l'absence de
// métadonnée n'est jamais une preuve de résolution pour une ligne non tarifée,
// et une ligne tarifée ne peut pas masquer une ligne non résolue.

// Clé serveur marquant qu'une prestation à 0 € a été explicitement confirmée
// par le professionnel. Distincte de unit_price > 0 : seule cette clé permet
// l'envoi d'une ligne gratuite. Écrite côté serveur uniquement.
import { PLANETLS_SERVICE_TARGET } from "../../../app/lib/planetlsServiceCatalogTarget.ts";
import { getGuestCheckinCheckoutModeFromMetadata, getGuestCheckinCheckoutOperationalSlugs } from "../../../app/lib/guestCheckinCheckout.ts";

export const QUOTE_PRICE_CONFIRMED_KEY = "quote_service_price_confirmed";

/** A priced edit resolves a known service; client metadata alone cannot resolve it. */
export function confirmQuoteItemPrice(input: { label?: string; unit_price?: unknown }, metadata: Record<string, unknown>) {
  const known = PLANETLS_SERVICE_TARGET.some((entry) => entry.slug === metadata.requested_service_slug || entry.label === input.label);
  if (known && typeof input.unit_price === "number" && Number.isFinite(input.unit_price) && input.unit_price > 0) {
    return { ...metadata, quote_service_clarification_status: "resolved_manual", quote_service_clarification_reason: null };
  }
  return metadata;
}

const UNRESOLVED_STATUSES = new Set(["needs_clarification", "needs_explicit_price"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function readClarificationStatus(metadata: unknown): string | null {
  const record = isRecord(metadata) ? metadata : {};
  return typeof record.quote_service_clarification_status === "string"
    ? record.quote_service_clarification_status
    : null;
}

// Confirme qu'une ligne a un tarif retenu : positif, ou 0 € explicitement
// confirmé par le professionnel (via la clé serveur).
export function hasConfirmedPrice(unitPrice: unknown, metadata: unknown): boolean {
  const record = isRecord(metadata) ? metadata : {};
  const price = Number(unitPrice);
  const priceIsPositive = Number.isFinite(price) && price > 0;
  // Une ligne à 0 € n'est acceptable que si le professionnel l'a explicitement
  // confirmée (métadonnée serveur). Un simple unit_price > 0 d'une ligne déjà
  // tarifée n'est pas une preuve pour une ligne initialement non tarifée.
  const freeButExplicitlyConfirmed = Number.isFinite(price) && price === 0 && record[QUOTE_PRICE_CONFIRMED_KEY] === true;
  return priceIsPositive || freeButExplicitlyConfirmed;
}

export type QuoteSendItem = {
  service_id?: number | null;
  pricing_id?: string | null;
  label?: string | null;
  unit_price?: number | null;
  metadata?: unknown;
};

// Une ligne est non résolue si elle n'a pas de tarif confirmé, OU si elle porte
// une clarification encore ouverte. Vérification par ligne, par défaut bloquante.
export function isUnresolvedQuoteItem(item: QuoteSendItem): boolean {
  const status = readClarificationStatus(item.metadata);
  const confirmed = hasConfirmedPrice(item.unit_price, item.metadata);

  // Tarif confirmé (positif ou 0 € explicitement confirmé) et aucune
  // clarification ouverte : ligne résolue.
  if (confirmed && !UNRESOLVED_STATUSES.has(status ?? "")) {
    return false;
  }

  // Non tarifée (0 €/vide) sans confirmation serveur : toujours bloquée,
  // même sans métadonnée — impossible à contourner par suppression.
  if (!confirmed) {
    return true;
  }

  // Tarif confirmé mais statut encore ouvert (needs_*) : bloqué tant que le
  // professionnel n'a pas résolu la clarification.
  if (UNRESOLVED_STATUSES.has(status ?? "")) {
    return true;
  }

  // Dernier filet : resolved_manual/resolved_catalog sans tarif confirmé.
  return !confirmed;
}

export type QuoteSendItemWithTotals = QuoteSendItem & {
  quantity?: number | null;
  line_total?: number | null;
};

// Quantité × prix reste la source de vérité, même si line_total est incohérent.
export function computeItemsTotal(items: readonly QuoteSendItemWithTotals[] | null | undefined): number {
  const list = Array.isArray(items) ? items : [];
  const total = list.reduce<number>((sum, raw) => {
    const item = isRecord(raw) ? raw : {};
    const quantity =
      Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    const unitPrice = Number(item.unit_price);
    const effective = quantity * (Number.isFinite(unitPrice) ? unitPrice : 0);
    return sum + (Number.isFinite(effective) ? effective : 0);
  }, 0);
  return Math.round(total * 100) / 100;
}

export function computeQuoteTotals(items: readonly QuoteSendItemWithTotals[], discount = 0, taxRate = 0) {
  const round = (value: number) => Math.round(value * 100) / 100;
  const subtotal = computeItemsTotal(items);
  const safeDiscount = Math.max(0, round(Number(discount) || 0));
  const safeTaxRate = Math.min(100, Math.max(0, round(Number(taxRate) || 0)));
  const base = Math.max(0, subtotal - safeDiscount);
  const taxAmount = round(base * safeTaxRate / 100);
  return { subtotal, discount: safeDiscount, taxRate: safeTaxRate, taxAmount, total: round(base + taxAmount) };
}

export function quoteCoversRequestedServices(items: readonly QuoteSendItem[], requested: readonly string[], metadata?: Record<string, unknown> | null) {
  const mode = getGuestCheckinCheckoutModeFromMetadata(metadata);
  const expected = requested.flatMap((slug) => slug === "guest_checkin_checkout" && mode
    ? getGuestCheckinCheckoutOperationalSlugs(mode) : [slug]);
  return expected.every((slug) => items.some((item) => {
    const saved = isRecord(item.metadata) ? item.metadata : {};
    return saved.requested_service_slug === slug || PLANETLS_SERVICE_TARGET.some((entry) => entry.slug === slug && entry.label === item.label);
  }));
}
