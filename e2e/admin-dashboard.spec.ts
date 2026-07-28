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

test("admin : le Mission Control reste lisible sur desktop et mobile", async ({ page }) => {
  const relevantConsoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/same key|hydration|Minified React error/i.test(text)) {
      relevantConsoleErrors.push(text);
    }
  });

  await loginAdmin(page);
  await page.goto("/dashboard/admin", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Mission Control", exact: true })).toBeVisible();
  await expect(page.getByText("Cockpit administrateur", { exact: true })).toBeVisible();
  await expect(page.getByText(/Voir la tension du jour, les conversions qui accélèrent/i)).toBeVisible();

  await expect(page.getByRole("button", { name: "7 jours" })).toBeVisible();
  await expect(page.getByRole("button", { name: "30 jours" })).toHaveAttribute("data-active", "true");
  await expect(page.getByRole("button", { name: "90 jours" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Propriétaires" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Conciergeries" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Artisans" })).toBeVisible();

  await expect(page.getByText(/Nouveaux comptes \(30 j\)/i)).toBeVisible();
  await expect(page.getByText("Complétude onboarding", { exact: true })).toBeVisible();
  await expect(page.getByText("Confirmation e-mail", { exact: true })).toBeVisible();
  await expect(page.getByText(/Demandes entrantes \(30 j\)/i)).toBeVisible();
  await expect(page.getByText("Missions à surveiller", { exact: true })).toBeVisible();
  await expect(page.getByText("Facturation", { exact: true })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Ce qui mérite une action admin maintenant" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ouvrir le contrôle détaillé/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Les derniers mouvements utiles à relire" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Les portes d'entrée utiles pour agir vite" })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Nouveaux profils à relire" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Demandes nécessitant un suivi" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Missions opérationnelles à contrôler" })).toBeVisible();

  await page.getByRole("button", { name: "7 jours" }).click();
  await expect(page.getByRole("button", { name: "7 jours" })).toHaveAttribute("data-active", "true");
  await expect(page.getByText(/Nouveaux comptes \(7 j\)/i)).toBeVisible();

  await page.getByRole("button", { name: "Artisans" }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("button", { name: "Artisans" })).toHaveAttribute("data-active", "true");
  await expect(page.getByText("Tendance d'activation", { exact: true })).toBeVisible();
  await expect(page.getByText("Zones les plus mûres", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Mission Control", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "7 jours" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ce qui mérite une action admin maintenant" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nouveaux profils à relire" })).toBeVisible();

  expect(relevantConsoleErrors).toEqual([]);
});
