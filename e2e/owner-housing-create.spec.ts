import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";

test("la création d’un logement est structurée et responsive", async ({ page, context }) => {
  const user = { id: "4dae1e64-5d5e-4ab7-ad7f-7eed4b3e46c9", role: "owner", firstName: "Nathalie", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/session") return route.fulfill({ json: { user, expires: "2099-01-01T00:00:00Z" } });
    if (path === "/api/profiles/current" || path === "/api/profiles/me") return route.fulfill({ json: user });
    return route.fulfill({ json: {} });
  });

  await page.goto("/dashboard/owner/logements/create");
  await expect(page.getByRole("heading", { name: "Ajouter un logement" })).toBeVisible();
  for (const title of ["Identité du logement", "Adresse du logement", "Capacité et diffusion", "Description et équipements", "Votre logement"]) await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("0 champ obligatoire sur 3")).toBeVisible();

  await page.getByLabel("Nom du logement *").fill("Villa des Pins");
  await page.getByLabel("Adresse *").fill("123 route des Pins");
  await page.getByLabel("Ville *").fill("Sainte-Maxime");
  await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Villa des Pins" })).toBeVisible();

  for (const width of [1600, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/owner-housing-create-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
