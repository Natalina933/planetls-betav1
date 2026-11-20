import { expect, test, type Page } from "@playwright/test";
import { loginWorkspace } from "./helpers/workspace";

async function loginAdmin(page: Page) {
  await loginWorkspace(page, page.request, "admin");
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
