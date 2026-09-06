import { expect, test, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

async function fixtureSession(context: BrowserContext, role: string) {
  const token = await encode({ secret: "personas-local-test-secret-not-for-production", salt: "authjs.session-token",
    token: { id: "personas-fictional-user", sub: "personas-fictional-user", role, name: "Revue Personas", email: "personas@example.invalid", status: "active" }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, url: "http://127.0.0.1:3117", httpOnly: true, sameSite: "Lax" }]);
}

test("admin : référentiel, détails accessibles, lots réels et responsive", async ({ page, context }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await fixtureSession(context, "admin");
  // Seul le profil de la navigation globale est simulé. Personas lit ses vrais fichiers.
  await page.route("**/api/profiles/current", (route) => route.fulfill({ json: { id: "personas-fictional-user", role: "admin", firstName: "Revue", username: "Revue Personas" } }));
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = await page.goto("/dashboard/admin/personas");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Qui servir, quelle valeur apporter, où agir" })).toBeVisible();
  await expect(page.locator("#pilot article")).toHaveCount(4);
  await expect(page.locator("#secondary article")).toHaveCount(3);
  await expect(page.locator("#future article")).toHaveCount(2);
  await expect(page.locator("#secondary > details")).not.toHaveAttribute("open", "");
  await expect(page.locator("#future > details")).not.toHaveAttribute("open", "");
  const sophie = page.locator("#persona-owner-individual");
  await expect(sophie.getByRole("img", { name: "Portrait illustratif de Sophie Martin" })).toBeVisible();
  const summary = sophie.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(sophie.getByText("Modes de collaboration envisagés")).toBeVisible();
  await expect(sophie.getByText(/Remplacement temporaire/)).toBeVisible();
  await page.locator("#coverage > details > summary").click();
  await expect(page.locator("#need-owner-individual-delegate")).toContainText("PLS-DEV-008 : ✅ Terminé");
  await expect(page.locator("#need-owner-individual-delegate")).toContainText("🟡 Partiel");
  await page.screenshot({ path: testInfo.outputPath("personas-desktop.png"), fullPage: true });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(sophie).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("personas-mobile.png"), fullPage: true });
  await page.getByRole("link", { name: "Couverture produit", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Couverture produit", exact: true })).toBeInViewport();
  for (const alias of ["/dashboard/admin/pilotage/personas", "/dashboard/admin/developpement/personas"]) {
    await page.goto(alias);
    await expect(page).toHaveURL(/\/dashboard\/admin\/personas$/);
  }
  expect(errors).toEqual([]);
});

test("la page refuse un visiteur anonyme et un rôle propriétaire", async ({ page, context }) => {
  await page.goto("/dashboard/admin/personas");
  await expect(page).toHaveURL(/\/login/);
  await fixtureSession(context, "owner");
  // Lecture sans suivre une éventuelle redirection vers le dashboard propriétaire.
  const response = await page.request.get("/dashboard/admin/personas", { maxRedirects: 0 });
  expect([302, 303, 307, 308, 403]).toContain(response.status());
});
