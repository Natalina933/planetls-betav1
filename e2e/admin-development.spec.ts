import { expect, test, type Page } from "@playwright/test";

type AdminCredentials = { email: string; password: string; href: string };

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/auth/dev-workspace-login", { data: { workspace: "admin" } });
  expect(response.ok(), `Préparation du compte admin impossible : ${await response.text()}`).toBeTruthy();
  const credentials = (await response.json()) as AdminCredentials;
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard/admin", { timeout: 60_000, waitUntil: "commit" });
}

test("admin : le Master Plan reste lisible et filtrable sur desktop et mobile", async ({ page }) => {
  const duplicateKeyErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("same key")) duplicateKeyErrors.push(message.text());
  });

  await loginAdmin(page);
  await page.goto("/dashboard/admin/developpement");
  await expect(page.getByRole("heading", { name: "Master Plan PlanetLS", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Sommaire du Master Plan" })).toBeVisible();
  await expect(page.getByText("sections indexées")).toBeVisible();

  const search = page.getByPlaceholder("Rechercher une fonctionnalité, une décision, une limite…");
  await search.fill("Stripe");
  await expect(page.getByText(/résultats?/).first()).toBeVisible();
  await expect(page.getByText("Aucun résultat")).toHaveCount(0);
  await page.getByRole("button", { name: "Effacer" }).click();
  await expect(search).toHaveValue("");
  await page.getByLabel("Filtrer par priorité").selectOption("P0 Critique");
  await expect(page.getByText("Aucun résultat")).toHaveCount(0);

  await page.getByRole("button", { name: /P1 Prioritaire/ }).click();
  await expect(page.getByLabel(/Filtrer par priorit/)).toHaveValue("P1 Prioritaire");
  await page.getByRole("button", { name: /En cours/ }).click();
  await expect(page.getByLabel("Filtrer par statut")).not.toHaveValue("");
  await expect(page.getByText(/Aucun r.sultat/)).toHaveCount(0);

  await page.getByRole("button", { name: "Tout replier" }).click();
  const firstSectionToggle = page.locator("article").filter({ has: page.locator("button[aria-expanded]") }).first().getByRole("button");
  await expect(firstSectionToggle).toHaveAttribute("aria-expanded", "false");
  await firstSectionToggle.click();
  await expect(firstSectionToggle).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Tout replier" }).click();
  await page.getByRole("button", { name: "Tout déplier" }).click();
  await expect(firstSectionToggle).toHaveAttribute("aria-expanded", "true");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Master Plan PlanetLS", exact: true })).toBeVisible();
  await expect(page.getByLabel("Filtres du Master Plan")).toBeVisible();
  await page.screenshot({ path: "test-results/master-plan-mobile.png", fullPage: true });
  expect(duplicateKeyErrors).toEqual([]);
});
