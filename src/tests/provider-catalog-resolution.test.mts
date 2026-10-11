import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveProviderCatalogValue,
  resolveProviderInterventionCatalog,
  resolveProviderInterventionsCatalog,
  resolveProviderProfileCatalog,
} from "../app/dashboard/provider/_components/providerCatalogResolution.ts";

test("provider category stays a profession and is not converted to a billable service", () => {
  const plumber = resolveProviderCatalogValue("Plombier", "category");
  const electrician = resolveProviderCatalogValue("Électricien", "category");

  assert.equal(plumber.kind, "profession");
  assert.equal(electrician.kind, "profession");
  assert.equal(plumber.verifiedQualification, false);
  assert.equal(electrician.verifiedQualification, false);
});

test("un artisan qui choisit Plomberie est identifié sans toutes les interventions", () => {
  const plumbing = resolveProviderCatalogValue("plumbing_installation", "service_label");

  assert.equal(plumbing.kind, "group");
  if (plumbing.kind === "group") {
    assert.equal(plumbing.slug, "plumbing_installation");
    assert.equal(plumbing.verifiedQualification, false);
  }
});

test("provider declared skills stay declared skills without verified qualification", () => {
  const skill = resolveProviderCatalogValue("plumbing_repair", "skill");

  assert.equal(skill.kind, "skill");
  if (skill.kind === "skill") {
    assert.equal(skill.value, "plumbing_repair");
    assert.equal(skill.service?.slug, "plumbing_repair");
    assert.equal(skill.verifiedQualification, false);
  }
});

test("provider service labels resolve exact services", () => {
  const plumbing = resolveProviderCatalogValue("plumbing_repair", "service_label");

  assert.equal(plumbing.kind, "service");
  if (plumbing.kind === "service") {
    assert.equal(plumbing.slug, "plumbing_repair");
    assert.equal(plumbing.verifiedQualification, false);
  }
});

test("un métier artisan ne prouve aucune prestation précise", () => {
  const maintenance = resolveProviderCatalogValue("Maintenance", "service_label");

  assert.notEqual(maintenance.kind, "service");
  assert.equal(maintenance.kind, "unknown");
});

test("provider unknown and empty values remain unknown", () => {
  assert.deepEqual(resolveProviderCatalogValue("Valeur inventée", "service_label"), {
    kind: "unknown",
    source: "service_label",
    value: "Valeur inventée",
    verifiedQualification: false,
  });
  assert.deepEqual(resolveProviderCatalogValue(null, "service_label"), {
    kind: "unknown",
    source: "service_label",
    value: "",
    verifiedQualification: false,
  });
});

test("provider profile resolution preserves source values and skill order", () => {
  const profile = {
    category: "Artisan polyvalent",
    skills: ["Électricité", "Maintenance", "Valeur libre"],
  };
  const before = structuredClone(profile);

  const resolution = resolveProviderProfileCatalog(profile);

  assert.deepEqual(profile, before);
  assert.equal(resolution.category.kind, "profession");
  assert.deepEqual(
    resolution.skills.map((item) => ({ kind: item.kind, value: item.value })),
    [
      { kind: "skill", value: "Électricité" },
      { kind: "skill", value: "Maintenance" },
      { kind: "skill", value: "Valeur libre" },
    ],
  );
  assert.equal(resolution.skills.length, profile.skills.length);
  assert.equal(
    resolution.skills.some((item) => item.verifiedQualification !== false),
    false,
  );
});

test("provider intervention resolution preserves original intervention data", () => {
  const intervention = {
    id: "intervention-1",
    service_label: "electrical_repair",
    budget_amount: 120,
    currency: "EUR",
    status: "pending",
  };
  const before = structuredClone(intervention);

  const resolution = resolveProviderInterventionCatalog(intervention);

  assert.equal(resolution.intervention, intervention);
  assert.deepEqual(intervention, before);
  assert.equal(resolution.catalogResolution.kind, "service");
  if (resolution.catalogResolution.kind === "service") {
    assert.equal(resolution.catalogResolution.slug, "electrical_repair");
    assert.equal(resolution.catalogResolution.verifiedQualification, false);
  }
  assert.equal(resolution.intervention.budget_amount, 120);
  assert.equal(resolution.intervention.currency, "EUR");
});

test("provider intervention list resolution keeps count and order", () => {
  const interventions = [
    { id: "1", service_label: "plumbing_installation", budget_amount: 10 },
    { id: "2", service_label: "Valeur inventée", budget_amount: 20 },
    { id: "3", service_label: null, budget_amount: null },
  ];

  const resolutions = resolveProviderInterventionsCatalog(interventions);

  assert.equal(resolutions.length, interventions.length);
  assert.deepEqual(
    resolutions.map((item) => item.intervention.id),
    ["1", "2", "3"],
  );
  assert.deepEqual(
    resolutions.map((item) => item.catalogResolution.kind),
    ["group", "unknown", "unknown"],
  );
  assert.deepEqual(
    resolutions.map((item) => item.intervention.budget_amount),
    [10, 20, null],
  );
});
