import { expect, test, type Page } from "@playwright/test";

type AdminCredentials = { email: string; password: string; href: string };

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/auth/dev-workspace-login", {
    data: { workspace: "admin" },
  });
  expect(
    response.ok(),
    `Preparation du compte admin impossible : ${await response.text()}`,
  ).toBeTruthy();
  const credentials = (await response.json()) as AdminCredentials;
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard/admin", { timeout: 60_000, waitUntil: "commit" });
}

async function expectFoldablePanel(
  page: Page,
  title: string,
  panelId: string,
  initiallyOpen: boolean,
) {
  const toggle = page.getByRole("button", { name: new RegExp(title) });
  const panel = page.locator(`#${panelId}`);

  await expect(toggle).toHaveAttribute("aria-expanded", initiallyOpen ? "true" : "false");
  await expect(panel).toHaveCount(initiallyOpen ? 1 : 0);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", initiallyOpen ? "false" : "true");
  await expect(panel).toHaveCount(initiallyOpen ? 0 : 1);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", initiallyOpen ? "true" : "false");
  await expect(panel).toHaveCount(initiallyOpen ? 1 : 0);
}

test("admin : le cockpit reste lisible avec ses panneaux repliables", async ({ page }) => {
  const duplicateKeyErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("same key")) {
      duplicateKeyErrors.push(message.text());
    }
  });

  await loginAdmin(page);
  await page.goto("/dashboard/admin");

  await expect(page.getByRole("heading", { name: "Cockpit de controle", exact: true })).toBeVisible();

  await expectFoldablePanel(page, "Sante operationnelle", "admin-health-panel", true);
  await expectFoldablePanel(page, "Activation J\\+7", "admin-activation-panel", false);
  await expectFoldablePanel(page, "Priorites a traiter", "admin-priorities-panel", true);
  await expectFoldablePanel(page, "Lecture visuelle", "admin-visuals-panel", false);
  await expectFoldablePanel(page, "Parcours et feux de controle", "admin-journey-panel", true);
  await expectFoldablePanel(page, "Acces metier", "admin-access-panel", false);

  await expect(page.getByText("Demandes en cours")).toBeVisible();
  await expect(page.getByText("Blocages")).toBeVisible();

  await expect(page.getByText(/alerte/i).first()).toBeVisible();

  const journeyPanel = page.locator("#admin-journey-panel");
  await expect(journeyPanel.getByText("Demande", { exact: true })).toBeVisible();
  await expect(journeyPanel.getByRole("link", { name: /^Inscriptions/ })).toBeVisible();

  await page.getByRole("button", { name: /Acces metier/ }).click();
  const accessPanel = page.locator("#admin-access-panel");
  await expect(accessPanel.getByRole("link", { name: /Controle detaille/ })).toBeVisible();
  await expect(accessPanel.getByRole("link", { name: /Decisions architecture/ })).toBeVisible();
  await expect(accessPanel.getByRole("link", { name: /Proprietaires/ })).toHaveCount(0);
  await expect(accessPanel.getByRole("link", { name: /Conciergeries/ })).toHaveCount(0);
  await expect(accessPanel.getByRole("link", { name: /^Artisans$/ })).toHaveCount(0);

  await page.getByRole("button", { name: /Lecture visuelle/ }).click();
  await expect(page.getByText("Bulles de signalement")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Cockpit de controle", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sante operationnelle/ })).toBeVisible();

  expect(duplicateKeyErrors).toEqual([]);
});
