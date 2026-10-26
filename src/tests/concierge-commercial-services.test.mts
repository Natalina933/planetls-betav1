import test from "node:test";
import assert from "node:assert/strict";
import { buildRequestQuoteItems } from "../features/concierge-commercial/server/quoteDraftItems.ts";
import { computeQuoteTotals, confirmQuoteItemPrice, isUnresolvedQuoteItem, quoteCoversRequestedServices } from "../features/concierge-commercial/server/quoteSendGuard.ts";
import { assertRequestOpen, RequestCommercialError, readRequestQuoteLink, requestQuoteDraftId } from "../features/concierge-commercial/server/requestCommercialGuard.ts";

test("modalités arrivée, départ ou les deux : toutes les autres prestations sont conservées", () => {
  for (const [mode, expected] of [["arrival_only", ["guest_checkin"]], ["departure_only", ["guest_checkout"]],
    ["arrival_departure", ["guest_checkin", "guest_checkout"]]] as const) {
    const request = { id: "isolated-request", requested_services: ["guest_checkin_checkout", "cleaning_standard", "linen_change"],
      metadata: { service_modalities: { guest_checkin_checkout: mode } }, budget_max: 1000 };
    const items = buildRequestQuoteItems(request, [], []);
    assert.deepEqual(items.map(item => item.metadata.requested_service_slug), [...expected, "cleaning_standard", "linen_change"]);
    assert.ok(items.every(item => item.unit_price === 0 && isUnresolvedQuoteItem(item)));
    assert.equal(quoteCoversRequestedServices(items, request.requested_services, request.metadata), true);
    assert.equal(quoteCoversRequestedServices(items.slice(0, -1), request.requested_services, request.metadata), false);
  }
});

test("tarif manuel d'une prestation connue : résolution serveur sans convertir le budget en prix", () => {
  const item = buildRequestQuoteItems({ id: "fixture", requested_services: ["linen_change"], budget_max: 1000 }, [], [])[0];
  const metadata = confirmQuoteItemPrice({ label: item.label, unit_price: 25 }, item.metadata);
  assert.equal(isUnresolvedQuoteItem({ ...item, unit_price: 25, metadata }), false);
  assert.equal(isUnresolvedQuoteItem({ ...item, metadata: confirmQuoteItemPrice({ unit_price: 0 }, item.metadata) }), true);
  assert.equal(confirmQuoteItemPrice({ label: "Valeur inconnue", unit_price: 25 }, { quote_service_clarification_status: "needs_clarification" })
    .quote_service_clarification_status, "needs_clarification");
});

test("total serveur : line_total falsifié ignoré, quantité, remise et TVA appliquées", () => {
  const totals = computeQuoteTotals([{ quantity: 2, unit_price: 50, line_total: 9999 }], 10, 20);
  assert.deepEqual(totals, { subtotal: 100, discount: 10, taxRate: 20, taxAmount: 18, total: 108 });
});

test("invitations et demandes terminales : aucune réouverture commerciale", () => {
  for (const status of ["declined", "selected", "not_selected"]) assert.throws(() => assertRequestOpen({ status: "sent" }, { status }), RequestCommercialError);
  for (const status of ["closed", "cancelled", "expired", "quote_accepted", "accepted", "draft"]) assert.throws(() => assertRequestOpen({ status }), RequestCommercialError);
  assert.throws(() => assertRequestOpen({ status: "sent", metadata: { selected_quote_id: "winner" } }), RequestCommercialError);
});

test("rattachement incohérent interdit et identifiant de brouillon stable par invitation", () => {
  assert.throws(() => readRequestQuoteLink({ service_request_id: "a", metadata: { service_request_id: "b" } }), RequestCommercialError);
  assert.equal(requestQuoteDraftId("invitation-a"), requestQuoteDraftId("invitation-a"));
  assert.notEqual(requestQuoteDraftId("invitation-a"), requestQuoteDraftId("invitation-b"));
  assert.match(requestQuoteDraftId("invitation-a"), /^[\da-f]{8}-[\da-f]{4}-5[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
});
