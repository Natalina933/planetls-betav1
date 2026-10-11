import assert from "node:assert/strict";
import test from "node:test";
import {
  diagnoseQuoteDraftServiceMatches,
  clarifyQuoteDraftRequestedServices,
  type ServiceCatalogRow,
  type PricingRow,
} from "../features/concierge-commercial/server/quoteDraftMatching.ts";

// Le catalogue historique (services_catalog) est préchargé par le
// professionnel sous forme de libellés textuels. Il sert UNIQUEMENT à
// retrouver un tarif déjà renseigné : l'identité de la prestation reste
// portée par le slug du catalogue cible.
const CATALOG: ServiceCatalogRow[] = [
  { id: 1, category: "Ménage", service: "Ménage du logement", description: null },
  { id: 7, category: "Conciergerie", service: "Check-in", description: null },
];

const PRICING_FOR_CLEANING: PricingRow[] = [
  { id: "p1", service_id: 1, label: "Ménage du logement", type: "fixed", amount: 90, unit: "prestation" },
];

test("prestation précise avec tarif renseigné : exact, tarif disponible, aucune clarification", () => {
  const diagnostics = diagnoseQuoteDraftServiceMatches(["cleaning_standard"], CATALOG);
  assert.equal(diagnostics[0].diagnostic, "exact");
  assert.equal(diagnostics[0].confidence, "certain");

  const clarifications = clarifyQuoteDraftRequestedServices(
    ["cleaning_standard"],
    CATALOG,
    PRICING_FOR_CLEANING,
  );
  assert.equal(clarifications[0].isPrecise, true);
  assert.equal(clarifications[0].exactTariffAvailable, true);
  assert.equal(clarifications[0].explicitPriceRequired, false);
  assert.equal(clarifications[0].needsClarification, false);
  // L'identité est le slug cible, jamais le libellé historique.
  assert.equal(clarifications[0].canonicalSlug, "cleaning_standard");
});

test("prestation précise sans tarif renseigné : devis personnalisé requis", () => {
  const clarifications = clarifyQuoteDraftRequestedServices(
    ["cleaning_standard"],
    CATALOG,
    [],
  );
  assert.equal(clarifications[0].isPrecise, true);
  assert.equal(clarifications[0].exactTariffAvailable, false);
  assert.equal(clarifications[0].explicitPriceRequired, true);
  assert.equal(clarifications[0].needsClarification, true);
  assert.equal(clarifications[0].canonicalSlug, "cleaning_standard");
});

test("groupe reconnu : à qualifier, jamais de prestation précise auto-attribuée", () => {
  const clarifications = clarifyQuoteDraftRequestedServices(
    ["access_management"],
    CATALOG,
    PRICING_FOR_CLEANING,
  );
  assert.equal(clarifications[0].diagnostic, "family_only");
  assert.equal(clarifications[0].isPrecise, false);
  assert.equal(clarifications[0].needsClarification, true);
  // Le groupe garde son identité mais ne devient pas une prestation tarifée.
  assert.equal(clarifications[0].canonicalSlug, "access_management");
});

test("prestation inconnue : jamais transformée, identité nulle, clarification requise", () => {
  const clarifications = clarifyQuoteDraftRequestedServices(
    ["prestation-fantaisiste"],
    CATALOG,
    PRICING_FOR_CLEANING,
  );
  assert.equal(clarifications[0].diagnostic, "unknown");
  assert.equal(clarifications[0].isPrecise, false);
  assert.equal(clarifications[0].needsClarification, true);
  assert.equal(clarifications[0].canonicalSlug, null);
  assert.deepEqual(clarifications[0].historicalServiceIds, []);
});

test("le tarif dépend des lignes réellement renseignées par le professionnel", () => {
  // Un tarif sur une autre prestation ne doit pas être associé au check-in.
  const clarifications = clarifyQuoteDraftRequestedServices(
    ["cleaning_standard"],
    CATALOG,
    [{ id: "p7", service_id: 7, label: "Check-in", type: "fixed", amount: 40, unit: "prestation" }],
  );
  assert.equal(clarifications[0].exactTariffAvailable, false);
  assert.equal(clarifications[0].explicitPriceRequired, true);
  assert.deepEqual(clarifications[0].historicalServiceIds, [1]);
});
