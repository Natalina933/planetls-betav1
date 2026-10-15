import test from "node:test";
import assert from "node:assert/strict";
import { presentConciergeServices, countConciergeServiceMatches } from "../features/owner-concierges/lib/servicePresentation.ts";
import { groupProfilesAtCoordinates, resolveSearchMapCenter, searchRadiusMeters } from "../features/owner-concierges/lib/geography.ts";
import { parseProfileServices, isProfileAvailableNow } from "../app/api/profiles/concierges/shared.ts";
import { parsePublicConciergeServices } from "../app/api/profiles/public-concierges/shared.ts";
import { PLANETLS_SERVICE_FAMILIES, PLANETLS_SERVICE_TARGET } from "../app/lib/planetlsServiceCatalogTarget.ts";

test("canonical services deduplicate, group by family and preserve ambiguous raw values", () => {
  const p = presentConciergeServices(["Menage", "cleaning_standard", "Linge", "Maintenance", "cleaning_linen", "access_management"]);
  assert.deepEqual(p.services.map(x => x.slug), ["cleaning_standard"]);
  assert.deepEqual(p.sections.map(x => x.slug), ["cleaning_linen"]);
  assert.deepEqual(p.families.map(x => x.slug), ["cleaning_linen"]);
  assert.deepEqual(p.groups.map(x => x.slug), ["access_management"]);
  assert.deepEqual(p.unresolved, ["Linge", "Maintenance"]);
  const all = presentConciergeServices(PLANETLS_SERVICE_TARGET.filter(x => x.kind === "service").map(x => x.slug));
  assert.deepEqual(all.sections.map(x => x.slug), PLANETLS_SERVICE_FAMILIES.map(x => x.slug));
});
test("commercial check-in display preserves arrival-only without inventing departure", () => {
  const p = presentConciergeServices(["guest_checkin"]);
  assert.equal(p.services[0].slug, "guest_checkin_checkout");
  assert.match(p.services[0].label, /uniquement/);
  assert.deepEqual(p.precise.map(x => x.slug), ["guest_checkin"]);
  assert.equal(countConciergeServiceMatches(["guest_checkin", "guest_checkout"], ["guest_checkin_checkout"]), 1);
  assert.equal(countConciergeServiceMatches(["guest_checkout"], ["guest_checkin"]), 0);
  assert.equal(countConciergeServiceMatches(["guest_checkin"], ["guest_checkin_checkout"]), 1);
  assert.equal(countConciergeServiceMatches(["cleaning_standard", "Menage"], ["Menage"]), 1);
  assert.equal(countConciergeServiceMatches(["cleaning_standard"], ["cleaning_linen"]), 0);
});
test("33 overlapping profiles remain accessible without changing coordinates", () => {
  const profiles = Array.from({length:33}, (_,i) => ({id:String(i),latitude:48.85,longitude:2.32}));
  const groups = groupProfilesAtCoordinates([...profiles, {id:"nan",latitude:NaN,longitude:2}, {id:"infinite",latitude:1,longitude:Infinity}, {id:"bounds",latitude:91,longitude:0}]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].profiles, profiles);
  assert.equal(groups[0].latitude, 48.85);
});
test("inactive mission catalog never falls back to historical options; missing catalog still does", () => {
  for (const parse of [parseProfileServices, parsePublicConciergeServices]) {
    for (const missions of [[], [{label:"Menage",isActive:false}]]) assert.deepEqual(parse("Menage", JSON.stringify({missionProfile:{missions}})), []);
    assert.deepEqual(parse("Menage", null), ["Ménage"]);
    assert.deepEqual(parse("Linge", JSON.stringify({missionProfile:{missions:[{label:"Menage",isActive:true}]}})), ["Ménage"]);
  }
});
test("unknown availability, generic schedules and active skills do not prove immediate availability", () => {
  for (const availabilityHours of [null, "invalid", "null", "{}", JSON.stringify({schedule:[{ranges:[{start:"09:00",end:"18:00"}]}]}), JSON.stringify({missionProfile:{missions:[{isActive:true}]}})]) assert.equal(isProfileAvailableNow({availabilityHours}), false);
  assert.equal(isProfileAvailableNow({availabilityHours:JSON.stringify({emergency24h:true})}), true);
  assert.equal(isProfileAvailableNow({availabilityHours:null,emergencyService:true}), true);
});

test("API search center takes precedence over profiles and radius remains a single search area", () => {
  const api = {latitude:48.86,longitude:2.34};
  const profile = {latitude:48.85,longitude:2.32};
  assert.equal(resolveSearchMapCenter(api, [profile]), api);
  assert.equal(resolveSearchMapCenter(null, [profile]), profile);
  assert.equal(resolveSearchMapCenter({latitude:Infinity,longitude:0}, []), null);
  assert.equal(searchRadiusMeters(20), 20000);
  assert.equal(searchRadiusMeters(NaN), 20000);
});
