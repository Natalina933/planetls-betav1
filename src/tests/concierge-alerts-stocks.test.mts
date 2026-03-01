import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHousingStockChecks,
  buildInactiveHousingItems,
  buildStockForecast,
  buildUrgentMissionItems,
  normalizeStockStatus,
} from "../app/dashboard/concierge/stocks/stocksHelpers.ts";
import {
  buildDraftHousingAlerts,
  buildProfileSetupAlerts,
  buildStalledConversationAlerts,
  buildUrgentMissionAlerts,
} from "../app/dashboard/concierge/alertes/alertesHelpers.ts";

test("stocks helpers build readable stock projections and cards", () => {
  const forecast = buildStockForecast(3, 4, 1);
  assert.equal(forecast.welcomeKits, 6);
  assert.equal(forecast.linenSets, 9);
  assert.equal(normalizeStockStatus("in_progress"), "in progress");

  const housingChecks = buildHousingStockChecks([{ id: 1, nom: "Villa", statut: "active" }]);
  assert.equal(housingChecks[0]?.tone, "success");

  const urgentItems = buildUrgentMissionItems([{ id: "mission1234", priority: "urgent", status: "assigned" }]);
  assert.match(urgentItems[0]?.title || "", /^Mission /);

  const inactiveItems = buildInactiveHousingItems([{ id: 2, nom: null, statut: "draft" }]);
  assert.equal(inactiveItems[0]?.tone, "warning");
});

test("alertes helpers build operational alert sections", () => {
  const urgent = buildUrgentMissionAlerts([{ id: "m1", title: null, priority: "urgent", status: "pending" }]);
  assert.equal(urgent[0]?.tone, "warning");

  const stalled = buildStalledConversationAlerts([{ id: "c1", counterpart_name: null, last_message_at: null }]);
  assert.equal(stalled[0]?.actionLabel, "Relancer");

  const draft = buildDraftHousingAlerts([{ id: 4, statut: "draft", nom: "Studio" }]);
  assert.equal(draft[0]?.title, "Studio");

  const profileAlerts = buildProfileSetupAlerts({
    city: null,
    service_area: null,
    hourly_rate: null,
    monthly_rate: null,
    role: "concierge",
  });
  assert.equal(profileAlerts.length, 3);
});
