import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";

test("la préparation globale des logements reprend la hiérarchie PlanetLS", async ({ page, context }) => {
  const user = { id: "4dae1e64-5d5e-4ab7-ad7f-7eed4b3e46c9", role: "owner", firstName: "Nathalie", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/session") return route.fulfill({ json: { user, expires: "2099-01-01T00:00:00Z" } });
    if (path === "/api/profiles/current" || path === "/api/profiles/me") return route.fulfill({ json: user });
    if (path === "/api/housing") return route.fulfill({ json: [
      { id: 30, nom_logement: "Villa des Pins", ville: "Sainte-Maxime", statut: "active", infos: { equipements: ["Piscine", "Climatisation"], stock_management: { beds: [{ id: "bed-1", room: "Chambre principale", type: "Lit double", quantity: 1, mattressSize: "160x200", linenKit: "Parure complète", notes: "" }], consumables: [{ id: "soap", name: "Savon d’accueil", category: "Accueil", currentQty: 1, minQty: 3, unit: "unité", storageLocation: "Buanderie", notes: "" }], laundry: { sheetSets: 4, duvetCovers: 4, pillowcases: 8, towelSets: 6, bathMats: 2, blankets: 2, storageLocation: "Placard", notes: "" }, equipmentNotes: "", storageNotes: "", conciergeInstructions: "", purchaseNeeds: [], lastUpdatedAt: "2026-09-12T10:00:00Z" } } },
      { id: 28, nom_logement: "Maison du Littoral", ville: "Le Barcarès", statut: "active", infos: { equipements: ["Wi-Fi"], stock_management: null } },
    ] });
    return route.fulfill({ json: {} });
  });

  await page.goto("/dashboard/owner/stocks");
  await expect(page.getByRole("heading", { name: "Préparation des logements" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vos logements sont-ils prêts à accueillir ?" })).toBeVisible();
  await expect(page.getByText("Villa des Pins", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Priorité du moment", { exact: true })).toBeVisible();
  await expect(page.getByText("Paramètres opérationnels", { exact: true })).toBeVisible();
  for (const width of [1600, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/owner-stocks-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
