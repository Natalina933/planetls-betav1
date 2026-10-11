import assert from "node:assert/strict";
import test from "node:test";
import {
  clarifyQuoteDraftRequestedServices,
  diagnoseQuoteDraftServiceMatches,
  type PricingRow,
  type ServiceCatalogRow,
} from "../features/concierge-commercial/server/quoteDraftMatching.ts";

const clarify = (
  requestedServices: string[],
  catalog: ServiceCatalogRow[],
  pricing: PricingRow[],
) => clarifyQuoteDraftRequestedServices(requestedServices, catalog, pricing);

test("prestation précise avec tarif du professionnel : certaine, sans clarification", () => {
  const [clarification] = clarify(
    ["cleaning_standard"],
    [
      {
        id: 10,
        category: "cleaning_standard",
        service: "Ménage du logement",
        description: null,
      },
    ],
    [{ id: "p1", service_id: 10, label: "Ménage", type: null, amount: 60, unit: null }],
  );

  assert.equal(clarification.diagnostic, "exact");
  assert.equal(clarification.isPrecise, true);
  assert.equal(clarification.canonicalSlug, "cleaning_standard");
  assert.equal(clarification.exactTariffAvailable, true);
  assert.equal(clarification.explicitPriceRequired, false);
  assert.equal(clarification.needsClarification, false);
});

test("prestation précise sans tarif renseigné : prix explicite requis", () => {
  const [clarification] = clarify(
    ["cleaning_standard"],
    [{ id: 10, category: "other", service: "Autre chose", description: null }],
    [],
  );

  assert.equal(clarification.diagnostic, "exact");
  assert.equal(clarification.isPrecise, true);
  assert.equal(clarification.exactTariffAvailable, false);
  assert.equal(clarification.explicitPriceRequired, true);
  assert.equal(clarification.needsClarification, true);
});

test("groupe reconnu : devis personnalisé, jamais converti en prestation précise", () => {
  const [clarification] = clarify(
    ["shopping_supplies"],
    [{ id: 10, category: "management_complementary", service: "Courses", description: null }],
    [{ id: "p1", service_id: 10, label: "Courses", type: null, amount: 25, unit: null }],
  );

  assert.equal(clarification.diagnostic, "family_only");
  assert.equal(clarification.isPrecise, false);
  assert.equal(clarification.canonicalSlug, "shopping_supplies");
  assert.equal(clarification.explicitPriceRequired, false);
  assert.equal(clarification.needsClarification, true);
});

test("valeur inconnue : jamais approximée, aucune confiance", () => {
  const [clarification] = clarify(
    ["prestation-fantaisiste"],
    [{ id: 10, category: "cleaning_linen", service: "Ménage du logement", description: null }],
    [],
  );

  assert.equal(clarification.diagnostic, "unknown");
  assert.equal(clarification.confidence, "none");
  assert.equal(clarification.isPrecise, false);
  assert.equal(clarification.canonicalSlug, null);
  assert.equal(clarification.needsClarification, true);
});

test("identité des prestations distinctes conservée : photo ≠ réseaux sociaux", () => {
  const [photo, social] = clarify(
    ["admin_professional_photography", "social_media_management"],
    [],
    [],
  );

  assert.equal(photo.canonicalSlug, "admin_professional_photography");
  assert.equal(social.canonicalSlug, "social_media_management");
  assert.notEqual(photo.canonicalSlug, social.canonicalSlug);
});

test("diagnostic de correspondance : certain quand l'historique correspond au libellé", () => {
  const [certain] = diagnoseQuoteDraftServiceMatches(
    ["cleaning_standard"],
    [
      {
        id: 10,
        category: "cleaning_standard",
        service: "Ménage du logement",
        description: null,
      },
    ],
  );
  assert.equal(certain.diagnostic, "exact");
  assert.equal(certain.confidence, "certain");

  const [needsValidation] = diagnoseQuoteDraftServiceMatches(
    ["cleaning_standard"],
    [{ id: 11, category: "x", service: "Tout autre service", description: null }],
  );
  assert.equal(needsValidation.diagnostic, "exact");
  assert.equal(needsValidation.confidence, "needs_validation");
});
