import { expect, test, type Page } from "@playwright/test";

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/auth/dev-workspace-login", { data: { workspace: "admin" } });
  expect(response.ok(), `Préparation du compte admin impossible : ${await response.text()}`).toBeTruthy();
  const credentials = (await response.json()) as { email: string; password: string };
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard/admin", { timeout: 60_000, waitUntil: "commit" });
}

test("admin utilisateurs : les légendes des camemberts restent dans les cartes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loginAdmin(page);
  await page.goto("/dashboard/admin/utilisateurs");
  await expect(page.getByRole("heading", { name: "État des comptes" })).toBeVisible();

  for (const title of ["État des comptes", "Activité", "Inscription"]) {
    const card = page.locator("article[class*='donutCard']").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    const cardBox = await card.boundingBox();
    const legendLabels = card.locator("[class*='legendLabel']");
    expect(cardBox).not.toBeNull();
    expect(await legendLabels.count()).toBeGreaterThan(0);
    for (let index = 0; index < await legendLabels.count(); index += 1) {
      const legendBox = await legendLabels.nth(index).boundingBox();
      expect(legendBox).not.toBeNull();
      expect((legendBox?.x ?? 0) + (legendBox?.width ?? 0)).toBeLessThanOrEqual((cardBox?.x ?? 0) + (cardBox?.width ?? 0) + 1);
    }
  }
});
