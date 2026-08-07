import test from "node:test";
import assert from "node:assert/strict";

import {
  getPublicProfileLinks,
  normalizePublicProfileUrl,
} from "../features/public-concierges/publicProfileLinks.ts";

test("normalizePublicProfileUrl adds https when the protocol is missing", () => {
  assert.equal(normalizePublicProfileUrl("planetls.fr"), "https://planetls.fr");
  assert.equal(normalizePublicProfileUrl(" https://planetls.fr "), "https://planetls.fr");
});

test("getPublicProfileLinks keeps only configured links in a stable order", () => {
  const result = getPublicProfileLinks({
    website: "planetls.fr",
    linkedin: "",
    instagram: "instagram.com/planetls",
    facebook: null,
  });

  assert.deepEqual(result, [
    {
      key: "website",
      label: "Site web",
      href: "https://planetls.fr",
    },
    {
      key: "instagram",
      label: "Instagram",
      href: "https://instagram.com/planetls",
    },
  ]);
});
