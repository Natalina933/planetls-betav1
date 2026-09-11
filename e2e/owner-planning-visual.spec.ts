import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { readFile } from "node:fs/promises";

const routePath = "/dashboard/owner/planning";
async function fixtures(page: Page, context: BrowserContext) {
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "owner", firstName: "Camille", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  await page.clock.install({ time: new Date("2026-09-11T10:00:00+02:00") });
  const state = { mode: "ready", errors: [] as string[], mutations: [] as string[] };
  const reservations = ["shared", "scheduled", "draft", "completed", "acknowledged", "shared", "scheduled"].map((status,index) => ({
    id: `planning-${index}`, property_label: index === 2 ? "Villa des Oliviers" : "Villa Horizon",
    concierge_name: "Conciergerie Les Séjours", traveler_first_name: `Voyageur${index}`, traveler_last_name: "Bernard",
    check_in_at: index === 6 ? "2026-10-05T16:00:00+02:00" : `2026-09-${index < 4 ? "11" : "13"}T${12 + index}:00:00+02:00`,
    check_out_at: "2026-10-09T10:00:00+02:00", status, owner_notes: `Consigne ${index}`,
    metadata: { service_type: index === 2 ? "maintenance" : "check_in", issue_flag: index === 0 ? "urgent" : "none" },
  }));
  page.on("pageerror", error => state.errors.push(error.message));
  await context.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET") state.mutations.push(path);
    let json: unknown = { items: [] };
    if (path === "/api/auth/session") json = { user, expires: "2099-01-01T00:00:00Z" };
    else if (path === "/api/profiles/current") json = user;
    else if (path === "/api/owner/reservations") {
      if (state.mode === "error") return route.fulfill({ status: 500, json: { error: "Indisponibilité de test" } });
      if (state.mode === "loading") await new Promise(resolve => setTimeout(resolve, 1800));
      json = { reservations: state.mode === "empty" ? [] : reservations };
    } else if (["/api/missions", "/api/invoices", "/api/housing", "/api/reviews"].includes(path)) json = [];
    await route.fulfill({ json });
  });
  return state;
}

test("planning : hiérarchie, trois vues et quatre formats", async ({ page, context }) => {
  const state = await fixtures(page, context);
  await page.goto(routePath);
  await expect(page.getByRole("heading", { name: "Votre agenda", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chaque intervention, au bon moment");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator(".headerBandeau")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Indicateurs du planning" }).locator("article")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Créer une mission", exact: true })).toHaveAttribute("href", "/dashboard/owner/missions/new");
  await expect(page.getByRole("link", { name: "Signaler une urgence" })).toHaveAttribute("href", "/dashboard/owner/mission-urgente");
  const view = page.getByRole("group", { name: "Choisir la vue du planning" });
  for (const width of [1600,1366,768,390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const label of ["Jour", "Semaine", "Mois"]) {
      await view.getByRole("button", { name: label, exact: true }).click();
      await expect(view.getByRole("button", { name: label, exact: true })).toHaveAttribute("aria-pressed", "true");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: `test-results/owner-planning-${width}-${label}.png`, fullPage: true });
    }
    if (width >= 1366) expect((await page.locator("main header").first().boundingBox())!.height).toBeLessThanOrEqual(280);
    if (width < 900) {
      await expect(page.locator('[aria-label="Missions du mois"]')).toBeVisible();
      await expect(page.locator('[aria-label="Missions du mois"] > article')).toHaveCount(6);
    }
  }
  await page.getByLabel("Mois affiché").selectOption("2026-10");
  await expect(page.getByRole("heading", { name: "Mois de Octobre 2026" })).toBeVisible();
  await expect(page.locator('[aria-label="Missions du mois"] > article')).toHaveCount(1);
  await expect(page.locator('[aria-label="Missions du mois"]').getByRole("link", { name: "Voir", exact: true })).toHaveAttribute("href", "/dashboard/owner/missions/planning-6");
  expect(state.errors).toEqual([]);
  expect(state.mutations).toEqual([]);
});

test("planning : filtres, réinitialisation et export intégral", async ({ page, context }) => {
  const state = await fixtures(page, context);
  await page.goto(routePath);
  await expect(page.getByRole("heading", { name: "Votre agenda", exact: true })).toBeVisible();
  const agenda = page.getByRole("region", { name: "Votre agenda", exact: true });
  await page.getByLabel("Filtrer par logement").selectOption("Villa des Oliviers");
  await expect(agenda).toContainText("1 mission(s) correspondant aux filtres");
  await page.getByLabel("Filtrer par type de mission").selectOption("maintenance");
  await page.getByLabel("Filtrer par statut").selectOption("a_faire");
  await page.getByLabel("Recherche", { exact: true }).fill("Consigne 2");
  await expect(agenda).toContainText("1 mission(s) correspondant aux filtres");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter tout" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("planning-proprietaire.csv");
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv.split("\n")).toHaveLength(8);
  expect(csv).toContain("Villa des Oliviers");
  expect(csv).toContain("Villa Horizon");
  await page.getByLabel("Recherche", { exact: true }).fill("introuvable");
  await expect(agenda.getByText("Aucune mission à afficher", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exporter tout" })).toBeDisabled();
  await page.getByRole("button", { name: "Réinitialiser", exact: true }).click();
  await expect(agenda).toContainText("7 mission(s) correspondant aux filtres");
  expect(state.errors).toEqual([]);
  expect(state.mutations).toEqual([]);
});

test("planning : chargement, erreur, reprise et état vide", async ({ page, context }) => {
  const state = await fixtures(page, context);
  state.mode = "loading";
  await page.goto(routePath);
  await expect(page.getByText("Chargement du planning…", { exact: true })).toBeVisible();
  await expect(page.getByText("Aucune priorité signalée dans les missions chargées.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Votre agenda", exact: true })).toBeVisible();
  state.mode = "error";
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "Planning indisponible" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Votre agenda", exact: true })).toHaveCount(0);
  state.mode = "empty";
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.getByText("Aucune priorité signalée dans les missions chargées.")).toBeVisible();
  await expect(page.getByText("Aucune mission à afficher", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exporter tout" })).toBeDisabled();
  expect(state.errors).toEqual([]);
});
