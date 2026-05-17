import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPublicConciergeRecommendations,
  parsePublicConciergeServices,
} from "../app/api/profiles/public-concierges/shared.ts";

test("parsePublicConciergeServices prefers active mission labels over legacy option", () => {
  const result = parsePublicConciergeServices(
    "Menage, Check-in",
    JSON.stringify({
      missionProfile: {
        missions: [
          { label: "Maintenance", isActive: true },
          { label: "Check-in", isActive: false },
        ],
      },
    }),
  );

  assert.deepEqual(result, ["Maintenance"]);
});

test("parsePublicConciergeServices removes legacy JSON-like noise", () => {
  const result = parsePublicConciergeServices(
    '["Conciergerie complete (menage","accueil","gestion)","cleaning"]',
    null,
  );

  assert.deepEqual(result, []);
});

test("parsePublicConciergeServices removes newline legacy noise", () => {
  const result = parsePublicConciergeServices(
    `["Conciergerie complete (menage"
"accueil"
"gestion)"`,
    null,
  );

  assert.deepEqual(result, []);
});

test("buildPublicConciergeRecommendations ranks by rating, PRO badge and reviews", () => {
  const result = buildPublicConciergeRecommendations(
    [
      {
        id: "a",
        first_name: "Alice",
        last_name: "Martin",
        username: null,
        company_name: null,
        city: "Paris",
        service_area: "Paris centre",
        hourly_rate: 70,
        monthly_rate: 900,
        option: "Menage",
        availability_hours: null,
        role: "concierge_pro",
        years_experience: 5,
      },
      {
        id: "b",
        first_name: "Bruno",
        last_name: "Roux",
        username: null,
        company_name: null,
        city: "Nice",
        service_area: "Nice centre",
        hourly_rate: 60,
        monthly_rate: 800,
        option: "Check-in",
        availability_hours: null,
        role: "concierge",
        years_experience: 3,
      },
    ],
    [
      {
        reviewed_profile_id: "a",
        rating: 5,
        comment: "Excellent suivi",
        created_at: "2026-02-20T10:00:00.000Z",
      },
      {
        reviewed_profile_id: "a",
        rating: 4,
        comment: "Tres pro",
        created_at: "2026-02-21T10:00:00.000Z",
      },
      {
        reviewed_profile_id: "b",
        rating: 4,
        comment: "Reactive",
        created_at: "2026-02-22T10:00:00.000Z",
      },
    ],
  );

  assert.equal(result[0]?.id, "a");
  assert.equal(result[0]?.average_rating, 4.5);
  assert.equal(result[0]?.latest_review_comment, "Tres pro");
  assert.equal(result[1]?.id, "b");
});
