import { expect, test } from "@playwright/test";
import { loginWorkspace } from "./helpers/workspace";

const planningPath = "/dashboard/provider/planning";

test.describe("Planning artisan", () => {
  test.beforeEach(async ({ page, request }) => {
    await loginWorkspace(page, request, "provider");
    await page.route("**/api/provider/interventions", (route) =>
      route.fulfill({
        json: {
          items: [{
            id: "intervention-e2e",
            title: "Intervention de recette",
            status: "pending",
            priority: "normal",
            scheduled_start: null,
            scheduled_end: null,
            location_label: null,
          }],
          summary: { total: 1, in_progress: 0, pending: 1, completed: 0 },
        },
      }),
    );
    await page.goto(planningPath);
  });

  test("affiche la page de planification", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Planning des interventions" })).toBeVisible();
  });

  test("affiche le calendrier mensuel", async ({ page }) => {
    const month = page.getByRole("button", { name: "Mois", exact: true });
    await month.click();
    await expect(month).toHaveAttribute("data-active", "true");
    await expect(page.getByText("Lun", { exact: true })).toBeVisible();
    await expect(page.getByText("Dim", { exact: true })).toBeVisible();
  });

  test("permet de parcourir et d’activer les vues au clavier", async ({ page }) => {
    const priority = page.getByRole("button", { name: "Prioritaire", exact: true });
    const week = page.getByRole("button", { name: "Semaine", exact: true });

    await priority.focus();
    await page.keyboard.press("Tab");
    await expect(week).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(week).toHaveAttribute("data-active", "true");
    await page.keyboard.press("Shift+Tab");
    await expect(priority).toBeFocused();
  });

  test("permet de fermer la barre latérale sur mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    const menu = page.getByRole("button", { name: "Ouvrir ou fermer le menu" });

    await menu.click();
    const close = sidebar.getByRole("button", { name: "Fermer la sidebar" });
    await expect(close).toBeInViewport();
    await close.click();
    await expect(close).not.toBeInViewport();
  });
});
