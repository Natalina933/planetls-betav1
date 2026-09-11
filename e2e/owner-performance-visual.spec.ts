import { expect, test, type Page, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

async function fixtures(page: Page, context: BrowserContext) {
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "owner", firstName: "Camille", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  await page.clock.install({ time: new Date("2026-09-11T10:00:00+02:00") });
  const state = { mode: "ready", errors: [] as string[], writes: [] as string[] };
  page.on("pageerror", error => state.errors.push(error.message));
  await context.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET") state.writes.push(path);
    let json: unknown = { items: [] };
    if (path === "/api/auth/session") json = { user, expires: "2099-01-01T00:00:00Z" };
    else if (path === "/api/profiles/current") json = user;
    else if (path === "/api/housing") json = state.mode === "empty" ? [] : [
      { id: 1, nom_logement: "Villa Horizon", ville: "Le Barcarès", statut: "published" },
      { id: 2, nom_logement: "Mas des Oliviers", ville: "Argelès-sur-Mer", statut: "inactive" },
      { id: 3, nom_logement: "Clos Salin", ville: "Gruissan", statut: "maintenance" },
    ];
    else if (path === "/api/owner/reservations") {
      if (state.mode === "error") return route.fulfill({ status: 500, json: { error: "Indisponibilité de test" } });
      if (state.mode === "loading") await new Promise(resolve => setTimeout(resolve, 2000));
      json = { reservations: state.mode === "empty" ? [] : [
        { id: "a", property_id: "1", status: "shared", check_in_at: "2026-09-13", check_out_at: "2026-09-16" },
        { id: "b", property_id: "2", status: "scheduled", check_in_at: "2026-10-01", check_out_at: "2026-10-03" },
        { id: "c", property_id: "1", status: "canceled", check_in_at: "2026-09-13", check_out_at: "2026-09-20" },
      ] };
    } else if (["/api/quotes", "/api/invoices", "/api/missions", "/api/reviews"].includes(path)) json = [];
    await route.fulfill({ json });
  });
  return state;
}

test("performance propriétaire : données réelles, filtres et responsive", async ({ page, context }) => {
  const state = await fixtures(page, context);
  await page.goto("/dashboard/owner/finances/overview");
  await expect(page.getByRole("heading", { name: "Performance par logement" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vue d’ensemble de vos performances");
  await expect(page.getByText("5 nuits renseignées", { exact: true })).toBeVisible();
  await expect(page.getByText("Vos revenus locatifs ne sont pas encore renseignés", { exact: true })).toBeVisible();
  await expect(page.getByText(/Hypothèses|MVP|Tests à mener|Prototype owner/)).toHaveCount(0);
  const table = page.getByRole("table");
  await expect(table.locator("tbody tr")).toHaveCount(3);
  await expect(table.getByRole("row").filter({ hasText: "Villa Horizon" }).getByRole("link", { name: "Voir", exact: true })).toHaveAttribute("href", "/dashboard/owner/logements/1");
  for (const width of [1600,1366,768,390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0,0));
    await page.clock.runFor(350);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/owner-performance-${width}.png`, fullPage: true });
  }
  await page.getByLabel("Statut du logement").selectOption("Maintenance");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).toContainText("Clos Salin");
  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await page.getByLabel("Recherche", { exact: true }).fill("Horizon");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Période des nuits").selectOption("2026");
  await expect(table).toContainText("Villa Horizon");
  expect(state.errors).toEqual([]);
  expect(state.writes).toEqual([]);
});

test("performance : chargement, erreur et propriétaire sans données", async ({ page, context }) => {
  const state = await fixtures(page, context);
  state.mode = "loading";
  await page.goto("/dashboard/owner/finances/overview");
  await expect(page.getByText("Chargement de vos performances…", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Performance par logement" })).toBeVisible();
  state.mode = "error";
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "Performances indisponibles" })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  state.mode = "empty";
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.getByRole("table")).toContainText("Ajoutez votre premier logement");
  await expect(page.getByText("0 nuits renseignées", { exact: true })).toBeVisible();
  expect(state.errors).toEqual([]);
});
