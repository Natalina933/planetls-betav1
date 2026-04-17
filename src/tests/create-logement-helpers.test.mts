import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCreateLogementPayload,
  buildCreateLogementSummary,
  createInitialManualForm,
  validateCreateLogementForm,
} from "../app/dashboard/concierge/logements/create/createLogementHelpers.ts";

test("validateCreateLogementForm enforces the guided manual flow", () => {
  const form = createInitialManualForm("manager-1");
  assert.equal(validateCreateLogementForm(form), "Le nom du logement est obligatoire.");

  const partiallyFilled = {
    ...form,
    housingName: "Appart Montmartre",
    addressLine1: "12 rue des Abbesses",
    city: "Paris",
    surfaceSqm: "45",
    bedroomCount: "1",
    services: [],
    owner: {
      ...form.owner,
      fullName: "Jean Dupont",
      email: "jean@email.com",
    },
  };
  assert.equal(
    validateCreateLogementForm(partiallyFilled),
    "Ajoutez au moins un service associé pour finaliser la création manuelle.",
  );
});

test("buildCreateLogementPayload maps the new manual form to legacy-compatible housing JSON columns", () => {
  const form = {
    ...createInitialManualForm("manager-1"),
    housingName: "Appart Montmartre",
    addressLine1: "12 rue des Abbesses",
    postalCode: "75018",
    city: "Paris",
    surfaceSqm: "45",
    bedroomCount: "2",
    amenities: "Wifi, Balcon",
    owner: {
      ...createInitialManualForm("manager-1").owner,
      profileId: "owner-1",
      managerProfileId: "manager-1",
      fullName: "Jean Dupont",
      email: "jean@email.com",
      phone: "0600000000",
      companyName: "",
      city: "Paris",
      notes: "",
      source: "directory" as const,
    },
    services: [
      {
        id: "service-1",
        label: "Menage hebdo",
        category: "Menage",
        frequency: "Hebdomadaire",
        unitPrice: "80",
        totalPrice: "320",
        notes: "4 passages",
      },
    ],
  };

  const payload = buildCreateLogementPayload(form);
  assert.equal(payload.nom_logement, "Appart Montmartre");
  assert.equal(payload.ville, "Paris");
  assert.equal((payload.proprietaire as Record<string, unknown>).owner_profile_id, "owner-1");
  assert.equal((payload.proprietaire as Record<string, unknown>).manager_profile_id, "manager-1");
  assert.equal((payload.location as Record<string, unknown>).postal_code, "75018");
  assert.equal(((payload.menage as Record<string, unknown>).services as Array<Record<string, unknown>>)[0]?.label, "Menage hebdo");
});

test("buildCreateLogementSummary exposes the premium guided preview", () => {
  const form = {
    ...createInitialManualForm("manager-1"),
    housingName: "Appart Montmartre",
    propertyType: "Appartement",
    addressLine1: "12 rue des Abbesses",
    city: "Paris",
    surfaceSqm: "45",
    owner: {
      ...createInitialManualForm("manager-1").owner,
      profileId: "owner-1",
      managerProfileId: "manager-1",
      fullName: "Jean Dupont",
      email: "jean@email.com",
      phone: "",
      companyName: "",
      city: "Paris",
      notes: "",
      source: "manual" as const,
    },
  };

  assert.deepEqual(buildCreateLogementSummary(form), [
    { label: "Logement", value: "Appart Montmartre" },
    { label: "Proprietaire", value: "Jean Dupont" },
    { label: "Adresse", value: "12 rue des Abbesses" },
    { label: "Ville", value: "Paris" },
    { label: "Type", value: "Appartement" },
    { label: "Surface", value: "45 m2" },
    { label: "Services", value: "1" },
    { label: "Flux", value: "Manuel" },
  ]);
});
