import { expect, test, type Page } from "@playwright/test";
import { loginWorkspace } from "./helpers/workspace";

async function loginAdmin(page: Page) {
  await loginWorkspace(page, page.request, "admin");
}

test("admin : les KPI activation restent lisibles en mode connecte ou degrade", async ({ page }) => {
  await loginAdmin(page);
  const response = await page.request.get("/api/kpis/overview?window_days=30");
  expect(response.ok(), await response.text()).toBeTruthy();
  const payload = (await response.json()) as {
    health?: { available?: boolean; reasons?: string[] };
    activation_alert_policy?: { minimum_eligible?: number };
    activation_alerts?: unknown[];
  };
  expect(payload.activation_alert_policy?.minimum_eligible).toBe(5);
  expect(Array.isArray(payload.activation_alerts)).toBe(true);

  await page.goto("/dashboard/admin");

  if (payload.health?.available === false) {
    await expect(page.getByText(/Mode dégradé/i)).toBeVisible();
  } else {
    await expect(page.getByText("Indicateurs d activation indisponibles.")).toHaveCount(0);
    await expect(page.getByText("Activation J+7", { exact: true })).toBeVisible();
  }
});
