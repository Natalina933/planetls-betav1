import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getProfessionalType,
  getProfessionalServices,
  professionalMatchesServices,
  professionalMatchesType,
  professionalIsSearchable,
} from "../app/lib/professionalSearchMatching.ts";

test("reconnaît les rôles professionnels", () => {
  assert.equal(getProfessionalType("concierge"), "concierge");
  assert.equal(getProfessionalType("concierge_pro"), "concierge");
  assert.equal(getProfessionalType("artisan"), "provider");
  assert.equal(getProfessionalType("artisan_pro"), "provider");
  assert.equal(getProfessionalType("provider"), "provider");
  assert.equal(getProfessionalType("provider_pro"), "provider");
  assert.equal(getProfessionalType("owner"), null);
});

test("lit les prestations d'un artisan", () => {
  const services = getProfessionalServices(
    "artisan",
    JSON.stringify(["cleaning_standard", "cleaning_turnover"]),
  );

  assert.deepEqual(services, ["cleaning_standard", "cleaning_turnover"]);
});

test("conserve les prestations d'un concierge", () => {
  const services = getProfessionalServices("concierge", null, [
    "guest_checkin_checkout",
    "cleaning_turnover",
  ]);

  assert.deepEqual(services, ["guest_checkin_checkout", "cleaning_turnover"]);
});

test("exige toutes les prestations demandées", () => {
  assert.equal(
    professionalMatchesServices(
      ["cleaning_standard", "linen_change"],
      ["cleaning_standard", "linen_change"],
    ),
    true,
  );

  assert.equal(
    professionalMatchesServices(
      ["cleaning_standard"],
      ["cleaning_standard", "linen_change"],
    ),
    false,
  );
});

test("respecte le Check-in & Check-out groupé", () => {
  assert.equal(
    professionalMatchesServices(["guest_checkin_checkout"], ["guest_checkin"]),
    true,
  );

  assert.equal(
    professionalMatchesServices(["guest_checkin_checkout"], ["guest_checkout"]),
    true,
  );
});

test("refuse les prestations inconnues ou incertaines", () => {
  assert.equal(
    professionalMatchesServices(["prestation_inconnue"], ["cleaning_standard"]),
    false,
  );

  assert.equal(
    professionalMatchesServices(["cleaning_standard"], ["prestation_inconnue"]),
    false,
  );
});

test("Tous inclut concierges et artisans", () => {
  assert.equal(professionalMatchesType("concierge", "all"), true);
  assert.equal(professionalMatchesType("artisan", "all"), true);
  assert.equal(professionalMatchesType("provider_pro", "all"), true);
});

test("Concierges exclut les artisans", () => {
  assert.equal(professionalMatchesType("concierge_pro", "concierge"), true);
  assert.equal(professionalMatchesType("artisan", "concierge"), false);
});

test("Artisans et prestataires exclut les concierges", () => {
  assert.equal(professionalMatchesType("provider", "provider"), true);
  assert.equal(professionalMatchesType("artisan_pro", "provider"), true);
  assert.equal(professionalMatchesType("concierge", "provider"), false);
});

test("Les rôles inconnus sont exclus", () => {
  assert.equal(professionalMatchesType("owner", "all"), false);
  assert.equal(professionalMatchesType(null, "all"), false);
});

test("exclut les professionnels suspendus ou supprimés", () => {
  assert.equal(professionalIsSearchable("active"), true);
  assert.equal(professionalIsSearchable(null), true);
  assert.equal(professionalIsSearchable("suspended"), false);
  assert.equal(professionalIsSearchable("deleted"), false);
});
