import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

test("API géographique : refus anonyme et cross-rôle, passage propriétaire", async ({ request }) => {
  const endpoint = "/api/profiles/concierges?geographic=1";
  expect((await request.get(endpoint)).status()).toBe(401);
  for (const role of ["provider", "concierge", "owner"]) {
    const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { sub: "11111111-1111-4111-8111-111111111111", role }, maxAge: 3600 });
    const response = await request.get(endpoint, { headers: { Cookie: `authjs.session-token=${token}` } });
    expect(response.status()).toBe(role === "owner" ? 422 : 403);
  }
});

test("recherche propriétaire : accents, carte/liste, filtres, retour privé et responsive", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "owner", firstName: "Camille", city: "Vendôme", onboarding_complete: true };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  const errors: string[] = []; const queries: URL[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let mode = "results";
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/weather") return route.fulfill({ status: 503, json: { error: "Météo hors périmètre du test" } });
    let json: unknown = { items: [] };
    if (url.pathname === "/api/auth/session") json = { user, expires: "2099-01-01" };
    if (url.pathname === "/api/profiles/current") json = user;
    if (url.pathname === "/api/profiles/concierges") {
      queries.push(url);
      if (mode === "error") return route.fulfill({ status: 503, json: { error: "Localisation indisponible" } });
      json = { warning: mode === "partial" ? "Certains profils n’ont pas pu être vérifiés ; les résultats peuvent être incomplets." : undefined,
        center: { latitude: 47.792, longitude: 1.065 }, available_filters: { services: ["Ménage", "Accueil voyageurs"] }, items: mode === "empty" ? [] : [
        { id: "local", display_name: "Conciergerie du Loir", city: "Vendôme", latitude: 47.792, longitude: 1.065, services: ["Ménage", "Accueil voyageurs"] },
        { id: "near", display_name: "Maison des voyageurs", city: "Naveil", latitude: 47.8, longitude: 1.03, services: ["Ménage"] },
      ] };
    }
    if (url.pathname === "/api/profiles/public/local") json = { profile: { id: "local", display_name: "Conciergerie du Loir", city: "Vendôme", services: ["Ménage"] }, reviews: [], stats: { average_rating: null, reviews_count: 0 }, links: {}, ctas: [] };
    await route.fulfill({ json });
  });
  await page.goto("/dashboard/owner/concierges");
  await expect(page.getByRole("heading", { name: "Trouver une concierge", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Ville ou code postal", exact: true })).toHaveValue("Vendôme");
  const cards = page.getByRole("article", { name: /^Profil professionnel/ });
  await expect(cards).toHaveCount(2);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.getByRole("button", { name: "+ Choisir des prestations précises", exact: true }).click();
  await page.getByRole("button", { name: /^Ménage du logement Ménage et linge$/ }).click();
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page).toHaveURL(/services=cleaning_standard/);
  await expect(cards).toHaveCount(2);
  await page.screenshot({ path: "test-results/owner-concierges-geography/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator(".leaflet-container")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/owner-concierges-geography/tablet.png", fullPage: true });
  await page.getByRole("link", { name: "Voir le profil", exact: true }).first().click();
  await expect(page).toHaveURL(/\/concierges\/local\?/);
  await page.getByRole("link", { name: "Retour aux profils" }).click();
  await expect(page).toHaveURL(/services=cleaning_standard/);
  await expect(page.getByRole("textbox", { name: "Ville ou code postal", exact: true })).toHaveValue("Vendôme");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(cards).toHaveCount(2);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.screenshot({ path: "test-results/owner-concierges-geography/mobile.png", fullPage: true });
  await page.locator(".leaflet-container").evaluate((map) => map.scrollIntoView({ block: "center" }));
  await page.locator(".leaflet-control-zoom-in").click();
  await page.locator(".leaflet-control-zoom-in").click();
  await page.locator(".leaflet-marker-icon").first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  mode = "partial";
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.getByText("Certains profils n’ont pas pu être vérifiés ; les résultats peuvent être incomplets.")).toBeVisible();
  await expect(cards).toHaveCount(2);
  mode = "empty";
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Aucune concierge trouvée pour/ })).toBeVisible();
  await expect(cards).toHaveCount(0);
  mode = "error";
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.getByRole("region", { name: "Carte des concierges", exact: true }).getByRole("alert")).toContainText("Localisation indisponible");
  mode = "results";
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(cards).toHaveCount(2);
  expect(queries.length).toBeGreaterThan(0);
  expect(queries.every((url) => url.searchParams.get("geographic") === "1" && !url.searchParams.has("availableOnly"))).toBe(true);
  expect(errors).toEqual([]);
});


test("fiabilite carte : consultation independante et profils superposes", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "owner", city: "Paris", onboarding_complete: true };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  const profiles = Array.from({ length: 33 }, (_, index) => ({ id: "pro-" + index, display_name: "Professionnel " + index, city: "Paris", latitude: 48.8589, longitude: 2.3200, services: ["cleaning_standard", "Linge"] }));
  await context.route("**/api/**", async route => {
    expect(route.request().method()).toBe("GET");
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/weather") return route.fulfill({ status: 503, json: { error: "Météo hors périmètre du test" } });
    const json = path === "/api/auth/session" ? { user, expires: "2099-01-01" }
      : path === "/api/profiles/current" ? user
      : path.startsWith("/api/profiles/public/") ? { profile:{ ...profiles.find(profile => profile.id === path.split("/").pop()), company_name:null, country:"France", role:"concierge" }, reviews:[],stats:{} }
      : path === "/api/profiles/concierges" ? { center: {latitude:48.86,longitude:2.34}, items: profiles }
      : { items: [] };
    await route.fulfill({ json });
  });
  const searchFilters = new URLSearchParams({ city: "Paris", radiusKm: "20", region: "Île-de-France", serviceFamilies: "cleaning_linen", services: "cleaning_standard,linen_change", propertyType: "Appartement", budgetMax: "90", proOnly: "1" });
  await page.goto("/dashboard/owner/concierges?" + searchFilters);
  const cards = page.getByRole("article", { name: /^Profil professionnel/ });
  await expect(cards).toHaveCount(33);
  await page.getByRole("button", { name: "Sélectionner Professionnel 0", exact:true }).click();
  await page.getByRole("button", { name: "Sélectionner Professionnel 1", exact:true }).click();
  const markers = page.locator(".leaflet-marker-icon");
  await expect(markers).toHaveCount(1);
  await expect(markers).toHaveAttribute("title", "33 professionnels");
  await markers.click();
  const popup = page.locator(".leaflet-popup-content");
  await expect(popup.getByRole("button", { name:/^Consulter Professionnel/ })).toHaveCount(33);
  for (const index of [2, 32, 1]) {
    await popup.getByRole("button", { name:"Consulter Professionnel " + index, exact:true }).click();
    const href = await popup.getByRole("link", {name:"Voir le profil"}).getAttribute("href");
    expect(new URL(href!, "http://127.0.0.1").pathname).toBe("/concierges/pro-" + index);
    expect(new URL(new URL(href!, "http://127.0.0.1").searchParams.get("returnTo")!, "http://127.0.0.1").searchParams.get("selectedConciergeIds")).toBe("pro-0,pro-1");
    await expect(page.getByRole("button", {name:"Retirer Professionnel 0",exact:true})).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", {name:"Retirer Professionnel 1",exact:true})).toHaveAttribute("aria-pressed", "true");
  }
  await popup.getByRole("link", {name:"Voir le profil"}).click();
  await expect(page.getByRole("heading", { name: "Professionnel 1", exact: true })).toBeVisible();
  await expect(page.getByRole("link", {name:"Retour aux profils",exact:true})).toBeVisible();
  await page.getByRole("link", {name:"Retour aux profils",exact:true}).click();
  for (const index of [0,1]) await expect(page.getByRole("button", {name:"Retirer Professionnel " + index,exact:true})).toHaveAttribute("aria-pressed","true");
  const card = page.getByRole("article", {name:"Profil professionnel Professionnel 0",exact:true});
  await card.getByRole("link", {name:"Voir le profil"}).click();
  await expect(page.getByRole("heading", { name: "Professionnel 0", exact: true })).toBeVisible();
  await page.getByRole("link", {name:"Retour aux profils",exact:true}).click();
  await expect(page).toHaveURL(/city=Paris/);
  for (const [key, value] of searchFilters) expect(new URL(page.url()).searchParams.get(key)).toBe(value);
  await expect(page.getByRole("textbox", { name: "Ville ou code postal", exact: true })).toHaveValue("Paris");
  await expect(page.getByRole("combobox", { name: "Rayon de recherche" })).toHaveValue("20");
  await expect(page.getByRole("button", { name: "Ménage et linge", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Filtres avancés", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Type de bien", exact: true })).toHaveValue("Appartement");
  await expect(page.getByRole("checkbox", { name: "Afficher uniquement les professionnels PRO" })).toBeChecked();
  await expect(page.getByRole("slider", { name: "Budget max", exact: true })).toHaveValue("90");
  for (const index of [0,1]) await expect(page.getByRole("button", {name:"Retirer Professionnel " + index,exact:true})).toHaveAttribute("aria-pressed","true");
  await page.screenshot({path:"test-results/owner-concierges-geography/reliability-desktop.png",fullPage:true});
  const verifyComposer = async () => {
    await page.getByRole("button", { name: "Préparer ma demande", exact: true }).filter({ visible: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "Préparer ma demande", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Fermer", exact: true })).toBeInViewport();
    expect(await dialog.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.left + 10, rect.top + 10));
    })).toBe(true);
    await expect(dialog.getByText("2 sélectionné(s)", { exact: true })).toBeVisible();
    for (const index of [0, 1]) await expect(dialog.getByText("Professionnel " + index, { exact: true })).toBeVisible();
    const services = dialog.locator('[aria-label="Prestations sélectionnées"]');
    await expect(services.getByRole("button")).toHaveCount(2);
    await expect(services).toContainText("Ménage du logement");
    await expect(services).toContainText("Changement de linge");
    await page.screenshot({ path: `test-results/owner-concierges-geography/composer-${page.viewportSize()!.width}.png` });
    await dialog.getByRole("button", { name: "Fermer", exact: true }).click();
  };
  await verifyComposer();
  await page.setViewportSize({width:390,height:844});
  await expect(markers).toHaveCount(1);
  await page.screenshot({path:"test-results/owner-concierges-geography/reliability-mobile.png",fullPage:true});
  await verifyComposer();
  expect(errors).toEqual([]);
});
