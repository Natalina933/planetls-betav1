import { expect, test, type Page } from "@playwright/test";

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/auth/dev-workspace-login", { data: { workspace: "admin" } });
  expect(response.ok(), `Preparation du compte admin impossible : ${await response.text()}`).toBeTruthy();
  const credentials = (await response.json()) as { email: string; password: string };
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard/admin", { timeout: 60_000, waitUntil: "commit" });
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
    await expect(page.getByText(/cible \d+% · alerte critique sous \d+%/).first()).toBeVisible();
  }
});
