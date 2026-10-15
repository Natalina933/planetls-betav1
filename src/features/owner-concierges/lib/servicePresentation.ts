import { GUEST_CHECKIN_CHECKOUT_BUNDLE, getGuestCheckinCheckoutDisplaySelections, inferGuestCheckinCheckoutMode, getGuestCheckinCheckoutModeLabel } from "../../../app/lib/guestCheckinCheckout.ts";
import { PLANETLS_SERVICE_FAMILIES, PLANETLS_SERVICE_TARGET } from "../../../app/lib/planetlsServiceCatalogTarget.ts";
import { resolvePlanetLSServiceSlug, matchPlanetLSService } from "../../../app/lib/planetlsServiceMatching.ts";
import { normalizeCatalogText } from "../../../app/lib/serviceCatalog.ts";

export function presentConciergeServices(values: readonly string[]) {
  const entries = new Map<string, (typeof PLANETLS_SERVICE_TARGET)[number]>();
  const families = new Set<string>();
  const unresolved = new Set<string>();
  for (const value of values) {
    const raw = value.trim();
    if (!raw) continue;
    const family = PLANETLS_SERVICE_FAMILIES.find((item) => item.slug === raw || normalizeCatalogText(item.label) === normalizeCatalogText(raw));
    if (family) { families.add(family.slug); continue; }
    const slug = resolvePlanetLSServiceSlug(raw);
    const entry = PLANETLS_SERVICE_TARGET.find((item) => item.slug === slug);
    if (entry) entries.set(entry.slug, entry);
    else unresolved.add(raw);
  }
  const precise = [...entries.values()].filter((entry) => entry.kind === "service");
  const mode = inferGuestCheckinCheckoutMode(precise.map((entry) => entry.slug));
  const services = getGuestCheckinCheckoutDisplaySelections(precise.map((entry) => entry.slug)).map((slug) => {
    const entry = PLANETLS_SERVICE_TARGET.find((item) => item.slug === slug)!;
    return slug === GUEST_CHECKIN_CHECKOUT_BUNDLE && mode && !entries.has(GUEST_CHECKIN_CHECKOUT_BUNDLE)
      ? { ...entry, label: entry.label + " — " + getGuestCheckinCheckoutModeLabel(mode) } : entry;
  });
  const groups = [...entries.values()].filter((entry) => entry.kind === "group");
  return {
    services, precise, groups, unresolved: [...unresolved],
    families: PLANETLS_SERVICE_FAMILIES.filter((family) => families.has(family.slug)),
    sections: PLANETLS_SERVICE_FAMILIES.flatMap((family) => {
      const items = services.filter((entry) => entry.family === family.slug);
      return items.length ? [{ ...family, services: items }] : [];
    }),
  };
}

export function countConciergeServiceMatches(requested: readonly string[], offered: readonly string[]) {
  const services = presentConciergeServices(offered).precise;
  const wanted = presentConciergeServices(requested).precise;
  const matches = wanted.filter((request) => services.some((offer) => matchPlanetLSService(request.slug, offer.slug) === "match"));
  return new Set(getGuestCheckinCheckoutDisplaySelections(matches.map((entry) => entry.slug))).size;
}
