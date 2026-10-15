import test from "node:test";
import assert from "node:assert/strict";
import { buildOwnerSearchReturnTo, conciergeProfileHref, readSelectedConcierges, restoreSelectedConcierges } from "../features/owner-concierges/lib/searchNavigation.ts";
import { ownerSearchReturnPath, publicConciergeReturnPath } from "../features/owner-concierges/lib/geography.ts";
import { buildOwnerConciergeSearchParams } from "../app/dashboard/owner/concierges/searchHelpers.ts";
const filters = { region:"Ile-de-France", city:"Paris", radiusKm:"20", selectedCategories:[], selectedServiceFamilies:["cleaning_linen" as const], selectedServices:["cleaning_standard"], propertyType:"Appartement", budgetMax:"90", proOnly:true };

test("card and marker profile links round-trip complete search and both recipients", () => {
  const returnTo = buildOwnerSearchReturnTo(filters, ["pro-1", "pro-2"], "housingId=h1");
  for (const id of ["pro-1", "pro-3"]) {
    const profile = new URL(conciergeProfileHref(id, returnTo), "https://planetls.local");
    assert.equal(profile.pathname, "/concierges/" + id);
    const restored = new URL(ownerSearchReturnPath(profile.searchParams.get("returnTo")), profile.origin);
    for (const [key,value] of buildOwnerConciergeSearchParams(filters)) assert.equal(restored.searchParams.get(key), value);
    assert.equal(restored.searchParams.get("housingId"), "h1");
    assert.deepEqual(readSelectedConcierges(restored.searchParams), ["pro-1", "pro-2"]);
  }
});
test("cleared filters override saved preferences through explicit empty query values", () => {
  const cleared = {...filters, region:"",selectedServiceFamilies:[],selectedServices:[],propertyType:"",budgetMax:"",proOnly:false};
  const path = buildOwnerSearchReturnTo(cleared, [], "services=old&service=old&postalCode=06000&propertyType=Villa");
  const params = new URL(path, "https://planetls.local").searchParams;
  for (const key of ["region","categories","serviceFamilies","services","propertyType","budgetMax"]) assert.equal(params.get(key), "");
  assert.equal(params.get("proOnly"), "0");
  assert.equal(params.has("service"), false);
  assert.equal(params.has("postalCode"), false);
  assert.deepEqual(readSelectedConcierges(params), []);
});
test("return navigation rejects foreign destinations and malformed recipient IDs", () => {
  assert.equal(ownerSearchReturnPath("https://evil.example/dashboard/owner/concierges"), "/dashboard/owner/concierges");
  assert.equal(ownerSearchReturnPath("//evil.example"), "/dashboard/owner/concierges");
  assert.equal(conciergeProfileHref("pro-1"), "/concierges/pro-1");
  assert.deepEqual(readSelectedConcierges(new URLSearchParams({selectedConciergeIds:"pro-1,pro-1,../bad,pro-2"})), ["pro-1","pro-2"]);
});

test("direct public profiles return to general concierge discovery, never Home", () => {
  assert.equal(publicConciergeReturnPath(), "/map-list?filter=concierge");
  assert.equal(publicConciergeReturnPath(null, "owner"), "/dashboard/owner/concierges");
  assert.equal(publicConciergeReturnPath(null, "owner_pro"), "/dashboard/owner/concierges");
  assert.equal(publicConciergeReturnPath("/dashboard/owner/concierges?city=Nice&radiusKm=20"), "/dashboard/owner/concierges?city=Nice&radiusKm=20");
});

test("recipients restore only after authorized results load and disappeared profiles are excluded", () => {
  const params = new URLSearchParams({selectedConciergeIds:"pro-1,pro-2,missing"});
  assert.deepEqual(restoreSelectedConcierges(params, []), []);
  assert.deepEqual(restoreSelectedConcierges(params, [{id:"pro-2"},{id:"pro-1"}]), ["pro-1","pro-2"]);
});
