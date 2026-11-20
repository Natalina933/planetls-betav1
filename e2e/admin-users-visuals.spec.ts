import { expect, test, type Page } from "@playwright/test";
import { loginWorkspace } from "./helpers/workspace";

async function loginAdmin(page: Page) {
  await loginWorkspace(page, page.request, "admin");
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
