import { expect, test } from "@playwright/test";

test("atelier : navigation commune, rubriques et menu mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/design-system");
  await expect(page.locator("main h1")).toHaveText("Design & maquettes");
  await expect(page.locator("main a")).toHaveCount(4);
  await page.locator("main").getByRole("link", { name: /Modèles de pages/ }).click();
  await expect(page).toHaveURL(/\/design-system\/pages$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Une identité, quatre usages");
  await page.getByRole("navigation", { name: "Atelier Design" }).getByRole("link", { name: "Accueil", exact: true }).click();
  await page.locator("main").getByRole("link", { name: /Composants & visuels/ }).click();
  const gallery = page.locator("main > details");
  await expect(gallery).toHaveCount(7);
  await gallery.filter({ has: page.locator("summary", { hasText: "Boutons, badges" }) }).locator("summary").click();
  await expect(page.getByRole("heading", { name: "Composants de base", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const menu = page.getByRole("button", { name: "Explorer l’atelier" });
  const navigation = page.getByRole("navigation", { name: "Atelier Design" });
  await menu.click();
  await navigation.getByRole("link", { name: "Artisan / prestataire", exact: true }).click();
  await expect(page).toHaveURL(/\/design-system\/provider-dashboard$/);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(navigation.getByRole("link", { name: "Artisan / prestataire", exact: true })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Accueil", exact: true }).click();
  await expect(page.locator("main h1")).toHaveText("Design & maquettes");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("adresses courtes : renvoi vers les parcours protégés existants", async ({ request }) => {
  for (const role of ["admin", "owner", "concierge", "provider"]) {
    for (const suffix of ["", "/dashboard"]) {
      const response = await request.get(`/${role}${suffix}`, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(response.headers().location).toBe(`/dashboard/${role}`);
    }
    const protectedResponse = await request.get(`/dashboard/${role}`, { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(protectedResponse.status());
    expect(protectedResponse.headers().location).toContain("/login");
  }
});
