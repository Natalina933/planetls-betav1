import assert from "node:assert/strict";
import test from "node:test";
import {
  isUnresolvedQuoteItem,
  hasConfirmedPrice,
  computeItemsTotal,
  QUOTE_PRICE_CONFIRMED_KEY,
  type QuoteSendItem,
} from "../features/concierge-commercial/server/quoteSendGuard.ts";

const freeDraftItem = (metadata?: Record<string, unknown>): QuoteSendItem => ({
  label: "Prestation à chiffrer",
  unit_price: 0,
  metadata,
});

test("1. Brouillon sans tarif (0 €, métadonnée needs_*) : envoi refusé", () => {
  const item = freeDraftItem({ quote_service_clarification_status: "needs_explicit_price" });
  assert.equal(isUnresolvedQuoteItem(item), true);
});

test("2. Ligne non tarifée SANS métadonnée parent (contournement par suppression) : envoi refusé", () => {
  // Aucune métadonnée : le garde-fou doit rester bloquant par défaut.
  assert.equal(isUnresolvedQuoteItem(freeDraftItem(undefined)), true);
  assert.equal(isUnresolvedQuoteItem(freeDraftItem({})), true);
});

test("3. Une ligne tarifée ne masque PAS une ligne non résolue (vérification par ligne)", () => {
  const priced: QuoteSendItem = { label: "Ménage", unit_price: 60, metadata: { quote_service_clarification_status: "resolved_catalog" } };
  const unresolved = freeDraftItem({ quote_service_clarification_status: "needs_clarification" });
  assert.equal(isUnresolvedQuoteItem(priced), false);
  assert.equal(isUnresolvedQuoteItem(unresolved), true);
  // Le filtre sur l'ensemble refuse si au moins une ligne est non résolue.
  const items = [priced, unresolved];
  assert.equal(items.some(isUnresolvedQuoteItem), true);
});

test("4. Tarif professionnel valide (unit_price > 0, resolved_catalog) : envoi autorisé", () => {
  const item: QuoteSendItem = {
    label: "Ménage",
    unit_price: 60,
    metadata: { quote_service_clarification_status: "resolved_catalog" },
  };
  assert.equal(isUnresolvedQuoteItem(item), false);
});

test("5. Prestation gratuite explicitement confirmée (0 € + clé serveur) : envoi autorisé", () => {
  const item = freeDraftItem({
    quote_service_clarification_status: "resolved_manual",
    [QUOTE_PRICE_CONFIRMED_KEY]: true,
  });
  assert.equal(isUnresolvedQuoteItem(item), false);
  assert.equal(hasConfirmedPrice(0, item.metadata), true);
});

test("6. Prestation gratuite NON confirmée (0 € sans clé serveur) : envoi refusé", () => {
  const item = freeDraftItem({ quote_service_clarification_status: "resolved_manual" });
  assert.equal(isUnresolvedQuoteItem(item), true);
  // Même resolved_manual sans preuve serveur = refusé.
  assert.equal(hasConfirmedPrice(0, item.metadata), false);
});

test("7. Budget propriétaire n'est jamais converti en tarif (indicatif, 0 € non confirmé)", () => {
  const item = freeDraftItem({
    quote_service_budget_max: 500,
    quote_service_budget_is_indicative: true,
    quote_service_clarification_status: "needs_explicit_price",
  });
  // Le budget n'apparaît pas dans unit_price et la ligne reste bloquée.
  assert.equal(item.unit_price, 0);
  assert.equal(isUnresolvedQuoteItem(item), true);
});

test("8. Contournement par suppression de métadonnée : impossible de rendre une ligne 0 € envoyable", () => {
  // Un client tente d'effacer la métadonnée d'une ligne 0 € pour la faire passer.
  const stripped = { label: "Prestation", unit_price: 0, metadata: undefined };
  assert.equal(isUnresolvedQuoteItem(stripped), true);
  // Et en forgeant une fausse clé de confirmation avec un prix non nul : le
  // statut needs_* ouvert empêche toujours l'envoi.
  const forged = {
    label: "Prestation",
    unit_price: 0.01,
    metadata: { quote_service_clarification_status: "needs_explicit_price", [QUOTE_PRICE_CONFIRMED_KEY]: true },
  };
  assert.equal(isUnresolvedQuoteItem(forged), true);
});

test("9. Total incohérent : le total est recalculé de manière fiable depuis les lignes", () => {
  const items = [
    { label: "A", quantity: 2, unit_price: 30, line_total: 60 },
    { label: "B", quantity: 1, unit_price: 45.5, line_total: 45.5 },
  ];
  assert.equal(computeItemsTotal(items), 105.5);
  // line_total absent : fallback quantity * unit_price.
  assert.equal(
    computeItemsTotal([
      { label: "A", quantity: 3, unit_price: 10 },
      { label: "B", quantity: 1, unit_price: 2.5 },
    ]),
    32.5,
  );
  // Devis totalement à 0 € (toutes lignes confirmées gratuites) : total 0,
  // mais l'envoi n'est autorisé que via la clé serveur (test 5).
  assert.equal(computeItemsTotal([{ label: "Gratuit", quantity: 1, unit_price: 0, line_total: 0 }]), 0);
});

test("clarification ouverte empêche l'envoi même avec un tarif saisi (statut needs_* prioritaire)", () => {
  const item: QuoteSendItem = {
    label: "Prestation",
    unit_price: 120,
    metadata: { quote_service_clarification_status: "needs_clarification" },
  };
  assert.equal(isUnresolvedQuoteItem(item), true);
});
