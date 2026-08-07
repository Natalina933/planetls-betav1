import test from "node:test";
import assert from "node:assert/strict";

import { getPublicProfileCtas } from "../features/public-concierges/publicProfileCtas.ts";

test("getPublicProfileCtas prioritises the platform contact CTA and keeps external links ordered", () => {
  const result = getPublicProfileCtas({
    contactHref: "/login",
    website: "planetls.fr",
    linkedin: "linkedin.com/company/planetls",
    instagram: null,
    facebook: "",
  });

  assert.deepEqual(result, [
    {
      key: "contact_platform",
      label: "Contacter via PlanetLS",
      description: "Déclenche un échange qualifié depuis la plateforme.",
      href: "/login",
      variant: "primary",
      external: false,
    },
    {
      key: "visit_website",
      label: "Visiter le site",
      description: "Consulter la vitrine, les offres et les informations publiques.",
      href: "https://planetls.fr",
      variant: "secondary",
      external: true,
    },
    {
      key: "view_linkedin",
      label: "Voir LinkedIn",
      description: "Consulter la présence professionnelle et le positionnement.",
      href: "https://linkedin.com/company/planetls",
      variant: "secondary",
      external: true,
    },
  ]);
});
