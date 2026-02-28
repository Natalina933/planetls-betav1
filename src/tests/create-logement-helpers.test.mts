import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCreateLogementSummary,
  buildCreateLogementPayload,
  validateCreateLogementForm,
} from "../app/dashboard/concierge/logements/create/createLogementHelpers.ts";

const baseForm = {
  name: "Appartement test",
  propertyType: "Appartement",
  description: "",
  capacity: "",
  bedrooms: "",
  equipments: "",
  address: "1 rue de Paris",
  city: "Paris",
  platform: "Airbnb",
  photo: "",
  status: "pret" as const,
};

test("validateCreateLogementForm enforces required session and fields", () => {
  assert.equal(
    validateCreateLogementForm(
      { ...baseForm, name: "" },
      undefined,
    ),
    "Session introuvable. Reconnecte-toi pour créer un logement.",
  );

  assert.equal(
    validateCreateLogementForm(
      { ...baseForm, name: "   " },
      "user-1",
    ),
    "Le nom du logement est obligatoire.",
  );

  assert.equal(
    validateCreateLogementForm(
      { ...baseForm, city: "   " },
      "user-1",
    ),
    "La ville est obligatoire.",
  );

  assert.equal(
    validateCreateLogementForm(
      { ...baseForm, name: "Ap" },
      "user-1",
    ),
    "Le nom du logement doit contenir au moins 3 caractères.",
  );

  assert.equal(
    validateCreateLogementForm(
      { ...baseForm, address: " " },
      "user-1",
    ),
    "L'adresse est obligatoire.",
  );

  assert.equal(
    validateCreateLogementForm(
      { ...baseForm, photo: "ftp://img.png" },
      "user-1",
    ),
    "La photo doit être une URL valide ou un chemin commençant par '/'.",
  );
});

test("buildCreateLogementPayload trims values and builds expected body", () => {
  assert.deepEqual(
    buildCreateLogementPayload(
      {
        name: " Appartement ",
        propertyType: " Appartement premium ",
        description: " Bien lumineux ",
        capacity: " 4 ",
        bedrooms: " 2 ",
        equipments: " Wifi, Parking , Piscine ",
        address: " 12 rue Victor Hugo ",
        city: " Paris ",
        platform: " Airbnb ",
        photo: " /img.png ",
        status: "pret",
      },
      "user-1",
    ),
    {
      infos: {
        nomLogement: "Appartement",
        adresse: "12 rue Victor Hugo",
        photos: ["/img.png"],
        categorie: "Appartement premium",
        description: "Bien lumineux",
        capacite: 4,
        nb_chambres: 2,
        equipements: ["Wifi", "Parking", "Piscine"],
      },
      statut: "pret",
      photo_principale: "/img.png",
      proprietaire: { id: "user-1" },
      location: { city: "Paris", plateformePrincipale: "Airbnb" },
    },
  );
});

test("buildCreateLogementSummary exposes a readable preview", () => {
  assert.deepEqual(
    buildCreateLogementSummary({
      name: "Appartement",
      propertyType: "Villa",
      description: "",
      capacity: "8",
      bedrooms: "4",
      equipments: "Piscine, Parking",
      address: "12 rue Victor Hugo",
      city: "Paris",
      platform: "Airbnb",
      photo: "",
      status: "pret",
    }),
    [
      { label: "Nom", value: "Appartement" },
      { label: "Type", value: "Villa" },
      { label: "Adresse", value: "12 rue Victor Hugo" },
      { label: "Ville", value: "Paris" },
      { label: "Plateforme", value: "Airbnb" },
      { label: "Capacité", value: "8" },
      { label: "Chambres", value: "4" },
      { label: "Équipements", value: "Piscine, Parking" },
      { label: "Statut", value: "pret" },
      { label: "Photo", value: "Aucune" },
    ],
  );
});
