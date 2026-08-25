import { expect, test, type Page } from "@playwright/test";

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/auth/dev-workspace-login", { data: { workspace: "admin" } });
  expect(response.ok(), await response.text()).toBeTruthy();
  const credentials = (await response.json()) as { email: string; password: string };
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard/admin", { timeout: 60_000, waitUntil: "commit" });
}

test("admin : le Master Plan compact reste lisible et pilotable", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/dashboard/admin/developpement");

  await expect(page.getByRole("heading", { name: "Où j'en suis et quoi faire ensuite", exact: true })).toBeVisible();
  await expect(page.getByText("Source canonique", { exact: true })).toBeVisible();
  await expect(page.getByText("Vérifications rapides", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "Pilotage des priorités" })).toBeVisible();

  const prioritySearch = page.getByLabel("Rechercher dans le pilotage des priorités");
  await prioritySearch.fill("PLS-DEV-008");
  await expect(page.getByRole("table", { name: "Pilotage des priorités" }).getByText("PLS-DEV-008", { exact: true })).toBeVisible();
  await prioritySearch.fill("");

  await page.getByLabel("Filtrer les priorités par niveau").selectOption("P0");
  await expect(page.getByRole("cell", { name: "P0 Critique" }).first()).toBeVisible();
  await page.getByLabel("Filtrer les priorités par niveau").selectOption("");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Où j'en suis et quoi faire ensuite", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
