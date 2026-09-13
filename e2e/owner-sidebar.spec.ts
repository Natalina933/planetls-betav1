import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

test("sidebar propriétaire : groupes, liens, état actif, clavier et mobile", async ({ page, context }) => {
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "owner", firstName: "Camille", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await context.route("**/api/**", route => {
    if (route.request().method() !== "GET") writes.push(route.request().url());
    const path = new URL(route.request().url()).pathname;
    const json = path === "/api/auth/session" ? { user, expires: "2099-01-01T00:00:00Z" } : path === "/api/profiles/current" ? user : path === "/api/housing" ? [] : { items: [] };
    return route.fulfill({ json });
  });
  await page.setViewportSize({ width: 1366, height: 1000 });
  await page.goto("/dashboard/owner/logements");
  const sidebar = page.getByRole("complementary", { name: "Sidebar" });
  const nav = sidebar.locator("nav");
  await expect(nav.getByRole("link", { name: "Tous mes logements", exact: true })).toHaveAttribute("aria-current", "page");
  for (const [name, href] of [["Mes logements", "/dashboard/owner/logements/overview"], ["Interventions", "/dashboard/owner/missions/overview"], ["Conciergeries", "/dashboard/owner/conciergerie/overview"], ["Finances", "/dashboard/owner/finances/overview"]]) {
    await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
  await expect(nav.getByRole("link", { name: "Vue d'ensemble", exact: true })).toHaveCount(0);
  const interventions = nav.getByRole("button", { name: "Déplier Interventions", exact: true });
  await interventions.focus(); await page.keyboard.press("Enter");
  await expect(nav.locator('button[aria-expanded="true"]')).toHaveCount(1);
  await expect(nav.getByRole("link", { name: "Tous mes logements", exact: true })).not.toBeVisible();
  await nav.getByRole("link", { name: "Maintenance", exact: true }).click();
  await expect(page).toHaveURL(/planning\?type=maintenance/);
  await expect(page.getByLabel("Filtrer par type de mission")).toHaveValue("maintenance");
  await expect(nav.getByRole("link", { name: "Maintenance", exact: true })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Arrivées & départs", exact: true }).click();
  await expect(page.getByLabel("Filtrer par type de mission")).toHaveValue("movements");
  await nav.getByRole("button", { name: "Déplier Réservations", exact: true }).click();
  await nav.getByRole("link", { name: "Calendrier", exact: true }).click();
  await expect(page.getByLabel("Filtrer par type de mission")).toHaveValue("all");
  await expect(nav.getByRole("link", { name: "Calendrier", exact: true })).toHaveAttribute("aria-current", "page");
  await page.screenshot({ path: "test-results/owner-sidebar-desktop.png" });
  await sidebar.getByRole("button", { name: "Fermer la sidebar", exact: true }).click();
  await page.getByRole("button", { name: "Ouvrir ou fermer le menu" }).click();
  await expect(nav.getByRole("link", { name: "Tableau de bord", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Ouvrir ou fermer le menu" }).click();
  await expect(nav.getByRole("link", { name: "Tableau de bord", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/owner-sidebar-mobile.png" });
  await nav.getByRole("link", { name: "Calendrier", exact: true }).click();
  await expect.poll(async () => { const box = await sidebar.boundingBox(); return (box?.x ?? 0) + (box?.width ?? 0); }).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Ouvrir ou fermer le menu" }).click();
  await expect(sidebar.getByRole("button", { name: "Fermer la sidebar", exact: true })).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect.poll(async () => { const box = await sidebar.boundingBox(); return (box?.x ?? 0) + (box?.width ?? 0); }).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]); expect(writes).toEqual([]);
});
