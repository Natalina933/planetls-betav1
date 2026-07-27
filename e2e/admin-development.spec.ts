import { expect, test, type Page } from "@playwright/test";

type AdminCredentials = { email: string; password: string; href: string };

async function expectFoldablePanel(page: Page, title: string, panelId: string, initiallyOpen: boolean) {
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

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/auth/dev-workspace-login", { data: { workspace: "admin" } });
  expect(response.ok(), `Préparation du compte admin impossible : ${await response.text()}`).toBeTruthy();
  const credentials = (await response.json()) as AdminCredentials;
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard/admin", { timeout: 60_000, waitUntil: "commit" });
}

test("admin : le Master Plan reste lisible, pilotable et la roadmap se recalcule", async ({ page }) => {
  const duplicateKeyErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("same key")) duplicateKeyErrors.push(message.text());
  });

  await loginAdmin(page);
  await page.addInitScript(() => {
    window.localStorage.removeItem("planetls:developer-roadmap:completions");
  });
  await page.goto("/dashboard/admin/developpement");

  await expect(page.getByRole("heading", { name: "Master Plan PlanetLS", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mission Control", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mémoire technique", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Roadmap intelligente", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Planning opérationnel" })).toHaveCount(0);

  await expectFoldablePanel(page, "Mission Control", "mission-control-panel", true);
  await expectFoldablePanel(page, "Mémoire technique", "technical-memory-panel", false);
  await expectFoldablePanel(page, "Roadmap intelligente", "smart-roadmap-panel", true);
  await expectFoldablePanel(page, "Journal de bord", "developer-log-panel", false);
  await expectFoldablePanel(page, "Sommaire et détail du Master Plan", "master-plan-detail-panel", false);

  await page.getByRole("button", { name: /Sommaire et détail du Master Plan/ }).click();
  await expect(page.getByRole("navigation", { name: "Sommaire du Master Plan" })).toBeVisible();
  await expect(page.getByText("sections indexées")).toBeVisible();

  const visionSubsections = page.getByRole("navigation", { name: "Sous-sections de 1. Vision du projet" });
  await expect(visionSubsections).toBeVisible();
  await expect(visionSubsections.getByRole("link", { name: "Mission", exact: true })).toBeVisible();

  const search = page.getByPlaceholder("Rechercher une fonctionnalité, une décision, une limite…");
  const masterPlanFilters = page.getByLabel("Filtres du Master Plan");
  await search.fill("Stripe");
  await expect(page.getByText(/résultats?/).first()).toBeVisible();
  await expect(page.getByText("Aucun résultat")).toHaveCount(0);
  await page.getByRole("button", { name: "Effacer" }).click();
  await expect(search).toHaveValue("");
  await masterPlanFilters.getByLabel("Filtrer par priorité").selectOption("P0 Critique");
  await expect(page.getByText("Aucun résultat")).toHaveCount(0);

  await page.getByRole("button", { name: /P1 Prioritaire/ }).click();
  await expect(masterPlanFilters.getByLabel(/Filtrer par priorit/)).toHaveValue("P1 Prioritaire");
  await masterPlanFilters.getByLabel(/Filtrer par priorit/).selectOption("");
  await page.getByRole("button", { name: /En cours/ }).click();
  await expect(masterPlanFilters.getByLabel("Filtrer par statut")).not.toHaveValue("");
  await expect(page.getByText(/Aucun r.sultat/)).toHaveCount(0);

  await page.getByRole("button", { name: "Tout replier" }).click();
  const firstSectionToggle = page.locator("article").filter({ has: page.locator("button[aria-expanded]") }).first().getByRole("button");
  await expect(firstSectionToggle).toHaveAttribute("aria-expanded", "false");
  await firstSectionToggle.click();
  await expect(firstSectionToggle).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Tout replier" }).click();
  await page.getByRole("button", { name: "Tout déplier" }).click();
  await expect(firstSectionToggle).toHaveAttribute("aria-expanded", "true");

  await page.getByRole("button", { name: /Mémoire technique/ }).click();
  const memorySearch = page.getByPlaceholder("Pourquoi Supabase, Next.js, Vercel, cette architecture, ce workflow...");
  await memorySearch.fill("Supabase");
  await expect(page.getByRole("heading", { name: "Supabase comme socle data" })).toBeVisible();
  await memorySearch.fill("");

  const nextRoadmapTitle = page.getByTestId("roadmap-next-title");
  const initialRoadmapTitle = (await nextRoadmapTitle.textContent()) ?? "";
  await page.locator('[data-testid^="roadmap-toggle-"]').first().click();
  await expect(page.getByRole("button", { name: "Réouvrir" })).toBeVisible();
  await expect(nextRoadmapTitle).not.toHaveText(initialRoadmapTitle);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Master Plan PlanetLS", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Roadmap intelligente", exact: true })).toBeVisible();
  await expect(page.getByLabel("Filtres du Master Plan")).toBeVisible();
  await page.screenshot({ path: "test-results/master-plan-mobile.png", fullPage: true });

  expect(duplicateKeyErrors).toEqual([]);
});
