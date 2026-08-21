import { expect, test, type Page } from "@playwright/test";

type AdminCredentials = { email: string; password: string };

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/auth/dev-workspace-login", {
    data: { workspace: "admin" },
  });
  expect(response.ok(), `Preparation du compte admin impossible : ${await response.text()}`).toBeTruthy();

  const credentials = (await response.json()) as AdminCredentials;
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard\/admin\/?$/, { timeout: 60_000 });
}

test("admin dashboard remains readable across reference viewports", async ({ page }) => {
  const relevantConsoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (/same key|hydration|Minified React error/i.test(message.text())) {
      relevantConsoleErrors.push(message.text());
    }
  });

  await loginAdmin(page);
  await page.goto("/dashboard/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Mission Control", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "7 jours" })).toBeVisible();
  await expect(page.getByRole("button", { name: "30 jours" })).toHaveAttribute("data-active", "true");
  await expect(page.getByRole("button", { name: "90 jours" })).toBeVisible();
  await expect(page.locator("table")).toHaveCount(3);

  await page.getByRole("button", { name: "7 jours" }).click();
  await expect(page.getByRole("button", { name: "7 jours" })).toHaveAttribute("data-active", "true");
  await page.getByRole("button", { name: "Artisans" }).click();
  await expect(page.getByRole("button", { name: "Artisans" })).toHaveAttribute("data-active", "true");

  for (const viewport of [
    { name: "desktop", width: 1600, height: 1000 },
    { name: "laptop", width: 1366, height: 768 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Mission Control", exact: true })).toBeVisible();
    await expect(page.locator("table").first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBeTruthy();
    await page.screenshot({ path: `test-results/admin-dashboard-${viewport.name}.png`, fullPage: true });
  }

  expect(relevantConsoleErrors).toEqual([]);
});
