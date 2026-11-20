import assert from "node:assert/strict";
import test from "node:test";
import { homeContent } from "../app/home/home.content.ts";

test("les libellés de l'accueil conservent leurs accents et les identifiants associés", () => {
  assert.equal(homeContent.hero.ctaPrimary.label, "Découvrir PlanetLS");
  assert.equal(homeContent.hero.ctaPrimary.href, "/parcours");
  assert.equal(homeContent.threeExperiences.profiles[0].cta.label, "Découvrir l'espace propriétaire");
  assert.equal(homeContent.threeExperiences.profiles[0].image, "proprietaires");
  assert.equal(homeContent.trustEcosystem.engagements[1].description, "Des informations utiles avant de décider.");
  assert.deepEqual(homeContent.yourStory.services.slice(0, 2), ["Arrivée / Départ", "Ménage"]);
});
