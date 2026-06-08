import test from "node:test";
import assert from "node:assert/strict";

import {
  buildServiceRequestBrief,
  getPricingExpectation,
  getServiceRequestBriefDefaults,
  getServiceRequestBriefFormGuidance,
  inferRequestTypeFromCollaboration,
  OWNER_COLLABORATION_TYPE_OPTIONS,
  OWNER_REQUEST_GOAL_OPTIONS,
} from "../app/lib/serviceRequestBrief.ts";

test("scenario A guides a one-off checkout cleaning request", () => {
  const defaults = getServiceRequestBriefDefaults("one_off_quote");
  const brief = buildServiceRequestBrief({
    ownerGoal: "one_off_quote",
    collaborationType: defaults.collaborationType,
    frequency: defaults.frequency,
    responsibilityLevel: defaults.responsibilityLevel,
    propertyName: "Studio Republique",
    propertyAddress: "Paris 11",
    propertyType: "Studio",
    sleepingCapacity: "2",
    propertyConstraints: "Depart voyageur a 11h",
    city: "Paris",
    requestedServices: ["Menage"],
    desiredDate: "2026-07-10",
    description: "Menage apres depart voyageur.",
  });

  assert.equal(defaults.collaborationType, "one_off");
  assert.equal(inferRequestTypeFromCollaboration(defaults.collaborationType), "ponctuel");
  assert.equal(brief.pricing_expectation, "devis ponctuel");
  assert.equal(brief.missing_information.length, 0);
  assert.match(brief.summary, /Menage/);
  assert.match(brief.summary, /Studio/);
});

test("scenario B frames a year-round collaboration", () => {
  const defaults = getServiceRequestBriefDefaults("regular_support");
  const brief = buildServiceRequestBrief({
    ownerGoal: "regular_support",
    collaborationType: defaults.collaborationType,
    frequency: defaults.frequency,
    responsibilityLevel: defaults.responsibilityLevel,
    propertyName: "Appartement Lyon 6",
    propertyAddress: "Lyon 6",
    propertyType: "Appartement",
    sleepingCapacity: 4,
    propertyConstraints: "Arrivees autonomes possibles",
    city: "Lyon",
    requestedServices: ["Check-in", "Menage", "Gestion du linge"],
    desiredDate: "2026-08-01",
    description: "Gestion reguliere toute l'annee.",
  });

  assert.equal(defaults.collaborationType, "regular");
  assert.equal(defaults.frequency, "year_round");
  assert.equal(inferRequestTypeFromCollaboration(defaults.collaborationType), "durable");
  assert.equal(brief.pricing_expectation, "forfait ou accompagnement mensuel");
  assert.match(brief.summary, /toute/i);
});

test("scenario C makes comparison explicit for concierges", () => {
  const defaults = getServiceRequestBriefDefaults("compare_concierges");
  const guidance = getServiceRequestBriefFormGuidance("compare_concierges");
  const brief = buildServiceRequestBrief({
    ownerGoal: "compare_concierges",
    collaborationType: defaults.collaborationType,
    frequency: defaults.frequency,
    responsibilityLevel: defaults.responsibilityLevel,
    propertyName: "Villa Nice",
    propertyAddress: "Nice centre",
    propertyType: "Villa",
    sleepingCapacity: "6",
    propertyConstraints: "Comparer forfait et disponibilite",
    city: "Nice",
    requestedServices: ["Gestion complete"],
    description: "Je veux comparer plusieurs concierges.",
  });

  assert.equal(defaults.collaborationType, "trial");
  assert.equal(brief.owner_goal_label, "Comparer plusieurs concierges");
  assert.equal(brief.pricing_expectation, "devis ponctuel avec option d'accompagnement");
  assert.match(guidance.detailsPlaceholder, /comparer/i);
});

test("scenario D keeps missing date visible instead of blocking the request", () => {
  const brief = buildServiceRequestBrief({
    ownerGoal: "delegate_tasks",
    collaborationType: "partial_management",
    frequency: "monthly",
    responsibilityLevel: "shared",
    propertyName: "Maison Arcachon",
    propertyAddress: "Arcachon",
    propertyType: "Maison",
    sleepingCapacity: "5",
    propertyConstraints: "Acces par boite a cles",
    city: "Arcachon",
    requestedServices: ["Menage", "Linge"],
    description: "La premiere date dependra de la prochaine reservation.",
  });

  assert.ok(brief.missing_information.includes("date_premiere_mission"));
  assert.match(brief.summary, /a definir/);
});

test("scenario E exposes incomplete information for concierge follow-up", () => {
  const brief = buildServiceRequestBrief({
    ownerGoal: "find_concierge",
    collaborationType: "partial_management",
    frequency: "unknown",
    responsibilityLevel: "unknown",
    requestedServices: [],
  });

  assert.ok(brief.missing_information.includes("logement_concerne"));
  assert.ok(brief.missing_information.includes("services_prioritaires"));
  assert.ok(brief.missing_information.includes("frequence"));
  assert.ok(brief.missing_information.includes("niveau_responsabilite"));
});

test("brief repositories cover all requested owner goals and collaboration types", () => {
  assert.equal(OWNER_REQUEST_GOAL_OPTIONS.length, 7);
  assert.equal(OWNER_COLLABORATION_TYPE_OPTIONS.length, 7);
  assert.equal(getPricingExpectation("full_management"), "forfait ou accompagnement mensuel");
  assert.equal(getPricingExpectation("temporary_replacement"), "devis de remplacement temporaire");
});
