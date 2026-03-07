import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMissionProfileFromSelection,
  buildProfileWeeklyAvailabilityUpdate,
  buildProfileZoneUpdate,
} from "../app/dashboard/concierge/profile/missionEditing.ts";

test("buildMissionProfileFromSelection activates existing and missing mission services", () => {
  const parsed = {
    missionCatalog: [
      { id: "checkin", label: "Check-in" },
      { id: "cleaning", label: "Ménage" },
    ],
    missionProfile: {
      missions: [
        {
          id: "checkin",
          label: "Check-in",
          isActive: false,
          minNoticeHours: 24,
          allowUrgent: false,
          urgentMultiplier: 1.3,
        },
      ],
    },
  };

  const nextProfile = buildMissionProfileFromSelection(
    parsed,
    ["Check-in", "Ménage", "Inventaire"],
    (value) => value.toLowerCase(),
  );

  assert.equal(nextProfile.missions.find((item) => item.id === "checkin")?.isActive, true);
  assert.equal(nextProfile.missions.find((item) => item.id === "cleaning")?.isActive, true);
  assert.equal(nextProfile.missions.find((item) => item.id === "inventaire")?.label, "Inventaire");
});

test("buildProfileZoneUpdate syncs location, service area and rules", () => {
  const previousProfile = {
    location: "Paris",
    service_area: "Paris",
    city: "PARIS",
    availability_hours: JSON.stringify({ rules: { old: true } }),
  };

  const nextProfile = buildProfileZoneUpdate(
    previousProfile,
    {
      zones: [{ label: "Lyon" }],
      radiusKm: 25,
      rules: { refuseOutOfZone: true },
    },
    (value) => (value ? JSON.parse(value) : {}),
  );

  assert.equal(nextProfile.location, "Lyon");
  assert.equal(nextProfile.service_area, "Lyon");
  assert.equal(nextProfile.city, "PARIS");
  assert.equal(nextProfile.service_radius_km, 25);
  assert.deepEqual(JSON.parse(nextProfile.availability_hours), {
    rules: { refuseOutOfZone: true },
  });
});

test("buildProfileWeeklyAvailabilityUpdate syncs schedule and emergency flag", () => {
  const previousProfile = {
    availability_hours: JSON.stringify({ rules: { keep: true } }),
  };

  const nextProfile = buildProfileWeeklyAvailabilityUpdate(
    previousProfile,
    [{ day: "mon", ranges: [] }],
    true,
    (value) => (value ? JSON.parse(value) : {}),
    (schedule) => schedule,
  );

  assert.equal(nextProfile.emergency_service, true);
  assert.deepEqual(JSON.parse(nextProfile.availability_hours), {
    rules: { keep: true },
    schedule: [{ day: "mon", ranges: [] }],
    emergency24h: true,
  });
});
