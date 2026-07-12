import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStayPreparation,
  buildTravelerStay,
  buildTravelerStayDashboard,
  normalizeTravelerStayStatus,
} from "../app/lib/travelerStayCenter.ts";

const NOW = new Date("2026-07-12T10:00:00.000Z");

test("normalizes traveler stay statuses from external values", () => {
  assert.equal(normalizeTravelerStayStatus("ready"), "ready_for_arrival");
  assert.equal(normalizeTravelerStayStatus("completed"), "closed");
  assert.equal(normalizeTravelerStayStatus("incident-open"), "incident_open");
  assert.equal(normalizeTravelerStayStatus("unknown"), "to_prepare");
});

test("blocks ready arrival when critical preparation data is missing", () => {
  const preparation = buildStayPreparation({
    id: "stay-1",
    propertyLabel: "Villa Corail",
    primaryTraveler: { displayName: "Nadia M." },
    checkIn: "2026-07-12T15:00:00.000Z",
    checkOut: "2026-07-15T10:00:00.000Z",
    babyBedRequested: true,
    babyBedConfirmed: false,
  });

  assert.equal(preparation.canMarkReady, false);
  assert.equal(preparation.overrideRequired, true);
  assert.ok(preparation.criticalBlockers.includes("Horaire d'arrivee"));
  assert.ok(preparation.criticalBlockers.includes("Acces pret"));
  assert.ok(preparation.criticalBlockers.includes("Menage termine"));
  assert.ok(preparation.criticalBlockers.includes("Demandes speciales"));
});

test("allows traced override while keeping blockers visible", () => {
  const preparation = buildStayPreparation({
    id: "stay-2",
    propertyLabel: "Studio Port",
    primaryTraveler: { displayName: "Marc B." },
    checkIn: "2026-07-12T15:00:00.000Z",
    checkOut: "2026-07-14T10:00:00.000Z",
    preparationOverride: true,
    preparationOverrideReason: "Voyageur deja informe, code envoye par telephone.",
  });

  assert.equal(preparation.canMarkReady, true);
  assert.equal(preparation.overrideRequired, false);
  assert.ok(preparation.criticalBlockers.length > 0);
});

test("builds dashboard counters for arrivals, departures and incidents", () => {
  const dashboard = buildTravelerStayDashboard(
    [
      {
        id: "arrival",
        checkIn: "2026-07-12T15:00:00.000Z",
        checkOut: "2026-07-16T10:00:00.000Z",
        primaryTraveler: { displayName: "Ariane" },
      },
      {
        id: "departure",
        checkIn: "2026-07-09T15:00:00.000Z",
        checkOut: "2026-07-12T10:00:00.000Z",
        primaryTraveler: { displayName: "Sami" },
      },
      {
        id: "incident",
        checkIn: "2026-07-11T15:00:00.000Z",
        checkOut: "2026-07-14T10:00:00.000Z",
        primaryTraveler: { displayName: "Lea" },
        incidents: [{ id: "inc-1", title: "Serrure bloquee", status: "open" }],
      },
    ],
    NOW,
  );

  assert.equal(dashboard.total, 3);
  assert.equal(dashboard.arrivalsToday, 1);
  assert.equal(dashboard.departuresToday, 1);
  assert.equal(dashboard.inProgress, 2);
  assert.equal(dashboard.incidentsOpen, 1);
});

test("keeps traveler profile operational and avoids scoring fields", () => {
  const stay = buildTravelerStay(
    {
      id: "stay-privacy",
      primaryTraveler: { displayName: "Voyageur RGPD", previousStays: 2, notes: "Prefere une arrivee autonome." },
      checkIn: "2026-07-20T15:00:00.000Z",
      checkOut: "2026-07-23T10:00:00.000Z",
    },
    NOW,
  );

  assert.equal(stay.primaryTraveler.displayName, "Voyageur RGPD");
  assert.equal("score" in stay.primaryTraveler, false);
  assert.equal("sensitiveCategory" in stay.primaryTraveler, false);
});

