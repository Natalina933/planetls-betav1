import test from "node:test";
import assert from "node:assert/strict";

import {
  diagnoseQuoteDraftServiceMatches,
  clarifyQuoteDraftRequestedServices,
  getDefaultQuantity,
  getBestMatchingPackage,
  type ServiceCatalogRow,
  type PricingRow,
  type PackageRow,
} from "../features/concierge-commercial/server/quoteDraftMatching.ts";

// Catalogue historique du professionnel. Le champ `service` stocke ici le
// libellé exact du catalogue cible, ce qui permet une correspondance certaine.
const HISTORICAL_CATALOG: ServiceCatalogRow[] = [
  { id: 1, category: "Menage et linge", service: "Menage du logement", description: null },
  { id: 2, category: "Menage et linge", service: "Grand menage", description: null },
  { id: 3, category: "Conciergerie et voyageurs", service: "Check-in", description: null },
  { id: 4, category: "Conciergerie et voyageurs", service: "Check-out", description: null },
];

// Tarifs reellement renseignes par le professionnel : seule une prestation est
// tarifee, le reste necessite un devis personnalise.
const PRICING: PricingRow[] = [
  { id: "price-1", service_id: 1, label: "Menage standard", type: "flat", amount: 80, unit: "logement" },
];

test("prestation tarifee : identite cible + prix professionnel disponibles", () => {
  const [clarification] = clarifyQuoteDraftRequestedServices(
    ["cleaning_standard"],
    HISTORICAL_CATALOG,
    PRICING,
  );

  assert.equal(clarification.diagnostic, "exact");
  assert.equal(clarification.canonicalSlug, "cleaning_standard");
  assert.equal(clarification.isPrecise, true);
  assert.equal(clarification.exactTariffAvailable, true);
  assert.equal(clarification.explicitPriceRequired, false);
  assert.equal(clarification.needsClarification, false);
  // Le tarif provient du professionnel (service_id 1), pas du catalogue cible.
  assert.deepEqual(clarification.historicalServiceIds, [1]);
});

test("prestation precise sans tarif renseigne : prix explicite requis", () => {
  const [clarification] = clarifyQuoteDraftRequestedServices(
    ["cleaning_deep"],
    HISTORICAL_CATALOG,
    PRICING,
  );

  assert.equal(clarification.diagnostic, "exact");
  assert.equal(clarification.canonicalSlug, "cleaning_deep");
  assert.equal(clarification.isPrecise, true);
  assert.equal(clarification.exactTariffAvailable, false);
  assert.equal(clarification.explicitPriceRequired, true);
  assert.equal(clarification.needsClarification, true);
});

test("groupe reconnu : devis personnalise, jamais de prestation auto-selectionnee", () => {
  const [clarification] = clarifyQuoteDraftRequestedServices(
    ["shopping_supplies"],
    HISTORICAL_CATALOG,
    PRICING,
  );

  assert.equal(clarification.diagnostic, "family_only");
  assert.equal(clarification.isPrecise, false);
  assert.equal(clarification.exactTariffAvailable, false);
  assert.equal(clarification.explicitPriceRequired, false);
  assert.equal(clarification.needsClarification, true);
  // L'identite du groupe est conservee sans etre convertie en prestation.
  assert.equal(clarification.canonicalSlug, "shopping_supplies");
});

test("prestation inconnue : aucun diagnostic de prestation certaine", () => {
  const [clarification] = clarifyQuoteDraftRequestedServices(
    ["photo_drone_mystere"],
    HISTORICAL_CATALOG,
    PRICING,
  );

  assert.equal(clarification.diagnostic, "unknown");
  assert.equal(clarification.isPrecise, false);
  assert.equal(clarification.needsClarification, true);
  assert.equal(clarification.canonicalSlug, null);
  assert.deepEqual(clarification.historicalServiceIds, []);
});

test("check-in et check-out restent distincts dans le diagnostic", () => {
  const checkin = diagnoseQuoteDraftServiceMatches(["guest_checkin"], HISTORICAL_CATALOG)[0];
  const checkout = diagnoseQuoteDraftServiceMatches(["guest_checkout"], HISTORICAL_CATALOG)[0];

  assert.equal(checkin.catalogResolution.kind, "service");
  assert.equal(checkout.catalogResolution.kind, "service");
  assert.equal(checkin.historicalServiceSlugs[0], "guest_checkin");
  assert.equal(checkout.historicalServiceSlugs[0], "guest_checkout");
  // Chacun pointe son propre identifiant historique, jamais celui de l'autre.
  assert.deepEqual(checkin.historicalServiceIds, [3]);
  assert.deepEqual(checkout.historicalServiceIds, [4]);
});

test("quantite par defaut : unite horaire compte 2, forfait compte 1", () => {
  const hourly = getDefaultQuantity({
    id: "p",
    service_id: 1,
    label: "Menage horaire",
    type: "hourly",
    amount: 30,
    unit: "heure",
  });
  const flat = getDefaultQuantity({
    id: "p",
    service_id: 1,
    label: "Menage forfait",
    type: "flat",
    amount: 80,
    unit: "logement",
  });

  assert.equal(hourly, 2);
  assert.equal(flat, 1);
});

test("aucun pack automatique si aucune prestation tarifee ne correspond", () => {
  const packages: PackageRow[] = [
    {
      id: "pack-1",
      name: "Pack menage",
      description: null,
      category: "Menage et linge",
      services_package_items: [{ service_id: 1 }],
    },
  ];

  // Prestation inconnue : aucun service_id matche, donc aucun pack suggere.
  const match = getBestMatchingPackage([], packages);
  assert.equal(match, null);

  // Prestation tarifee et demandee : le pack correspondant est retrouve.
  const matching = getBestMatchingPackage([1], packages);
  assert.equal(matching?.pkg.id, "pack-1");
});
