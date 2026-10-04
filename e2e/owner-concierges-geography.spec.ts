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
  await expect(page).toHaveURL(/city=Vend%C3%B4me&radiusKm=20/);
  await expect(page.getByRole("heading", { name: "Trouver ma concierge" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Ville de recherche", exact: true })).toHaveValue("Vendôme");
  await expect(page.getByText(/^2 résultats/)).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect.poll(() => page.locator('img[src="/icons/key-icon.svg"]').first().evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Sélectionner Conciergerie du Loir sur la carte" }).click();
  await expect(page.getByRole("button", { name: "Sélectionner Conciergerie du Loir sur la carte" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("checkbox", { name: "Ménage", exact: true }).check();
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page).toHaveURL(/services=M%C3%A9nage/);
  await expect(page.getByText(/^2 résultats/)).toBeVisible();
  await page.screenshot({ path: "test-results/owner-concierges-geography/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator(".leaflet-container")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/owner-concierges-geography/tablet.png", fullPage: true });
  await page.getByRole("link", { name: "Voir le profil", exact: true }).first().click();
  await expect(page).toHaveURL(/dashboard\/owner\/concierges\/local/);
  await page.getByRole("link", { name: "Retour aux résultats" }).click();
  await expect(page).toHaveURL(/city=Vend%C3%B4me&radiusKm=20&services=M%C3%A9nage/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText(/^2 résultats/)).toBeVisible();
  await page.getByRole("button", { name: "Carte", exact: true }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.screenshot({ path: "test-results/owner-concierges-geography/mobile.png", fullPage: true });
  await page.locator(".leaflet-container").evaluate((map) => map.scrollIntoView({ block: "center" }));
  await page.locator(".leaflet-control-zoom-in").click();
  await page.locator(".leaflet-control-zoom-in").click();
  await page.locator(".leaflet-marker-icon").first().click();
  await expect(page.getByRole("button", { name: "Liste", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  mode = "partial";
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.getByText("Certains profils n’ont pas pu être vérifiés ; les résultats peuvent être incomplets.")).toBeVisible();
  await expect(page.getByText(/^2 résultats/)).toBeVisible();
  mode = "empty";
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Aucune concierge dans cette recherche" })).toBeVisible();
  await page.getByRole("button", { name: "Élargir à 40 km" }).click();
  await expect(page).toHaveURL(/radiusKm=40/);
  await expect(page.getByText(/^0 résultat/)).toBeVisible();
  mode = "error";
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Localisation indisponible" })).toBeVisible();
  mode = "results";
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(page.getByText(/^2 résultats/)).toBeVisible();
  expect(queries.every((url) => url.searchParams.get("geographic") === "1" && url.searchParams.get("availableOnly") === "0")).toBe(true);
  expect(errors).toEqual([]);
});
