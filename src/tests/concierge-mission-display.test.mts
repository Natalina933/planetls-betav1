import test from "node:test";
import assert from "node:assert/strict";

import {
  getConciergeMissionHousingLabel,
  getConciergeMissionView,
  isSameMissionLocalDay,
  missionMatchesHousing,
} from "../app/dashboard/concierge/missionDisplay.ts";

const TODAY = new Date("2026-10-06T12:00:00+02:00").getTime();
const todayMission = "2026-10-06T14:30:00+02:00";
const tomorrowMission = "2026-10-07T10:30:00+02:00";

test("manual concierge mission with metadata housing is recognized and labeled", () => {
  const mission = {
    id: "manual-1",
    title: "Ménage — Appartement Test PlanetLS",
    status: "scheduled",
    priority: "normal",
    property_id: null,
    scheduled_start: todayMission,
    metadata: {
      property_housing_id: "1",
      intervention_type: "menage",
    },
  };
  const housingNameById = new Map([["1", "Appartement Test PlanetLS"]]);

  assert.equal(missionMatchesHousing(mission, 1), true);
  assert.equal(getConciergeMissionHousingLabel(mission, housingNameById), "Appartement Test PlanetLS");
  assert.equal(getConciergeMissionView(mission, TODAY), "today");
});

test("stay or quote mission with property id remains recognized", () => {
  const mission = {
    id: "workflow-1",
    title: "Check-in",
    status: "date_requested",
    priority: "normal",
    property_id: "11111111-1111-4111-8111-111111111111",
    scheduled_start: null,
    metadata: {
      reservation_id: "reservation-1",
      service_request_id: "request-1",
      property_label: "Appartement République",
    },
  };

  assert.equal(getConciergeMissionHousingLabel(mission, new Map()), "Appartement République");
  assert.equal(getConciergeMissionView(mission, TODAY), "to_plan");
});

test("today and tomorrow missions are not merged in dashboard day logic", () => {
  const today = {
    id: "today",
    title: "Ménage",
    status: "scheduled",
    priority: "normal",
    property_id: null,
    scheduled_start: todayMission,
    metadata: { property_housing_id: "1" },
  };
  const tomorrow = {
    id: "tomorrow",
    title: "Ménage",
    status: "scheduled",
    priority: "normal",
    property_id: null,
    scheduled_start: tomorrowMission,
    metadata: { property_housing_id: "1" },
  };

  assert.equal(getConciergeMissionView(today, TODAY), "today");
  assert.equal(getConciergeMissionView(tomorrow, TODAY), "all");
  assert.equal(isSameMissionLocalDay(new Date(todayMission), new Date(TODAY)), true);
  assert.equal(isSameMissionLocalDay(new Date(tomorrowMission), new Date(TODAY)), false);
});
