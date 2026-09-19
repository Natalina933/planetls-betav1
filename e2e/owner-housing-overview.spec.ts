import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";

test("la vue d’ensemble des logements reprend la hiérarchie de la fiche logement", async ({ page, context }) => {
  const user = { id: "4dae1e64-5d5e-4ab7-ad7f-7eed4b3e46c9", role: "owner", firstName: "Nathalie", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/session") return route.fulfill({ json: { user, expires: "2099-01-01T00:00:00Z" } });
    if (path === "/api/profiles/current" || path === "/api/profiles/me") return route.fulfill({ json: user });
    if (path === "/api/housing") return route.fulfill({ json: [
      { id: 30, nom_logement: "Villa des Pins", ville: "Sainte-Maxime", statut: "active", photo_principale: null, documents: { items: [{ id: 1 }] }, infos: { categorie: "Maison / Villa", capacite: 6, bedroom_count: 3, equipements: ["Piscine", "Climatisation"], plateformes: ["Airbnb"], photos: ["photo-1.jpg"], description: "Villa avec vue mer" } },
      { id: 28, nom_logement: "Maison du Littoral", ville: "Le Barcarès", statut: "draft", photo_principale: null, documents: [], infos: { categorie: "Maison", capacite: 4, bedroom_count: 2, equipements: [], plateformes: [] } },
    ] });
    if (["/api/missions", "/api/quotes", "/api/invoices", "/api/reviews"].includes(path)) return route.fulfill({ json: [] });
    if (path === "/api/messages/conversations" || path === "/api/service-requests") return route.fulfill({ json: { items: [] } });
    return route.fulfill({ json: {} });
  });

  await page.goto("/dashboard/owner/logements/overview");
  await expect(page.getByRole("heading", { name: "Vue d’ensemble des logements" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2 logements à piloter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Le parc en un coup d’œil" })).toBeVisible();
  await expect(page.getByText("Villa des Pins", { exact: true })).toBeVisible();
  await expect(page.getByText("Maison du Littoral", { exact: true })).toBeVisible();
  await expect(page.getByText("À finaliser", { exact: true })).toBeVisible();

  for (const width of [1600, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/owner-housing-overview-${width}.png`, fullPage: true });
  }
  expect(pageErrors).toEqual([]);
});
