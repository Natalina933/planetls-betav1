import test from "node:test";
import assert from "node:assert/strict";

import {
  getMatchesErrorMessage,
  normalizeConciergeMatches,
} from "../app/dashboard/concierge/dashboardClient.ts";

test("normalizeConciergeMatches returns matches array or empty fallback", () => {
  assert.deepEqual(
    normalizeConciergeMatches({
      matches: [
        {
          id: "1",
          listing_id: "housing-1",
          listing_source: "housing",
          owner_profile_id: "owner-1",
          title: "Appartement",
          city: "Paris",
          services_wanted: ["Menage"],
          matched_services: ["Menage"],
          compatibility_ratio: "1/1",
          compatibility_score: 100,
          distance_km: 2,
        },
      ],
    }),
    [
      {
        id: "1",
        listing_id: "housing-1",
        listing_source: "housing",
        owner_profile_id: "owner-1",
        title: "Appartement",
        city: "Paris",
        services_wanted: ["Menage"],
        matched_services: ["Menage"],
        compatibility_ratio: "1/1",
        compatibility_score: 100,
        distance_km: 2,
      },
    ],
  );

  assert.deepEqual(normalizeConciergeMatches({}), []);
});

test("getMatchesErrorMessage prefers API message and falls back otherwise", () => {
  assert.equal(
    getMatchesErrorMessage({ error: "Acces refuse" }),
    "Acces refuse",
  );
  assert.equal(
    getMatchesErrorMessage({ error: "" }),
    "Impossible de charger les proprietaires compatibles",
  );
  assert.equal(
    getMatchesErrorMessage(null),
    "Impossible de charger les proprietaires compatibles",
  );
});
