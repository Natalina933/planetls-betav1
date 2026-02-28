import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedPricingRole,
  toOptionalNumber,
} from "../app/api/pricing/pure.ts";

test("isAllowedPricingRole accepts expected billing roles", () => {
  assert.equal(isAllowedPricingRole("concierge"), true);
  assert.equal(isAllowedPricingRole("concierge_pro"), true);
  assert.equal(isAllowedPricingRole("admin"), true);
  assert.equal(isAllowedPricingRole("owner"), false);
});

test("toOptionalNumber normalizes supported values", () => {
  assert.equal(toOptionalNumber(undefined), undefined);
  assert.equal(toOptionalNumber(null), null);
  assert.equal(toOptionalNumber(""), null);
  assert.equal(toOptionalNumber("42"), 42);
  assert.equal(toOptionalNumber(12.5), 12.5);
  assert.equal(toOptionalNumber("abc"), undefined);
});
