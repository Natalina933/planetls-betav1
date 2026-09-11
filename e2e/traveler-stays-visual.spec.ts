import { expect, test, type Page, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

const url = "/dashboard/owner/missions/voyageurs";
const ownerId = "11111111-1111-4111-8111-111111111111";
const conciergeId = "22222222-2222-4222-8222-222222222222";
const propertyId = "33333333-3333-4333-8333-333333333333";
const requestId = "44444444-4444-4444-8444-444444444444";
const quoteId = "55555555-5555-4555-8555-555555555555";

async function fixtures(page: Page, context: BrowserContext) {
  const user = { id: ownerId, role: "owner", firstName: "Camille", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: ownerId }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  await page.clock.install({ time: new Date("2026-09-11T10:00:00+02:00") });
  const state = { mode: "ready", posts: [] as Record<string, unknown>[], patches: [] as Record<string, unknown>[], errors: [] as string[] };
  let reservations: Record<string, unknown>[] = ["shared", "acknowledged", "scheduled", "in_stay", "completed", "canceled"].map((status, index) => ({
    id: `stay-${index}`, property_id: propertyId, property_label: "Villa Horizon", concierge_profile_id: conciergeId,
    concierge_name: "Conciergerie Les Séjours", traveler_first_name: `Voyageur${index}`, traveler_last_name: "Bernard", adults_count: 2, children_count: 1,
    check_in_at: `2026-09-${index < 3 ? 13 + index : "08"}T16:00:00+02:00`, check_out_at: "2026-09-20T10:00:00+02:00", status,
    owner_notes: "Préparer le lit bébé", metadata: { issue_flag: index === 0 ? "urgent" : "none" },
  }));
  page.on("pageerror", error => state.errors.push(error.message));
  await context.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let json: unknown = { items: [] };
    if (path === "/api/auth/session") json = { user, expires: "2099-01-01T00:00:00Z" };
    else if (path === "/api/profiles/current") json = user;
    else if (path === "/api/owner/reservations") {
      if (method === "POST") {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        state.posts.push(body);
        const created = { ...body, id: `created-${state.posts.length}` };
        reservations = [...reservations, created];
        json = { reservation: created };
      } else {
        if (state.mode === "error") return route.fulfill({ status: 500, json: { error: "Indisponibilité de test" } });
        if (state.mode === "loading") await new Promise(resolve => setTimeout(resolve, 1500));
        json = { reservations: ["empty", "no-partner"].includes(state.mode) ? [] : reservations };
      }
    } else if (path.startsWith("/api/reservations/")) {
      const id = path.split("/").at(-1);
      let reservation = reservations.find(row => row.id === id);
      if (method === "PATCH") {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        state.patches.push(body);
        reservation = { ...reservation, ...(body.patch as Record<string, unknown> ?? {}), ...(body.action === "cancel" ? { status: "canceled" } : {}) };
        reservations = reservations.map(row => row.id === id ? reservation! : row);
      }
      json = { reservation, timeline: [{ id: "event-1", title: "Séjour transmis", created_at: "2026-09-10T12:00:00Z" }] };
    } else if (path === "/api/housing") json = [{ id: propertyId, nom_logement: "Villa Horizon", ville: "Le Barcarès" }];
    else if (path === "/api/service-requests") json = { items: state.mode === "no-partner" ? [] : [{ id: requestId, title: "[E2E] Demande propriétaire-conciergerie 1787674437612", status: "accepted", property_id: propertyId, selected_concierge_profile_id: conciergeId, selected_concierge_name: "Conciergerie Les Séjours", mission_id: "commercial-mission", metadata: { selected_quote_id: quoteId } }] };
    else if (path === "/api/quotes") json = [{ id: quoteId, quote_number: "DEV-2026-000015", status: "accepted", concierge_profile_id: conciergeId, service_request_id: requestId, quote_items: [{ id: "item-1", label: "Accueil voyageurs" }] }];
    else if (["/api/missions", "/api/invoices", "/api/reviews"].includes(path)) json = [];
    await route.fulfill({ json });
  });
  return state;
}

test("hiérarchie métier, statuts, filtres et quatre formats", async ({ page, context }) => {
  const state = await fixtures(page, context);
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Votre conciergerie" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Préparez sereinement chaque arrivée");
  await expect(page.locator(".headerBandeau")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /\[E2E\]/ })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Synthèse des séjours" }).locator("article")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Voir la collaboration" })).toHaveAttribute("href", "/dashboard/owner/missions/commercial-mission");
  const table = page.getByRole("table");
  await expect(table.locator("tbody tr")).toHaveCount(6);
  await expect(table.getByText("Terminée", { exact: true })).toBeVisible();
  await expect(table.getByText("Planifiée", { exact: true })).toBeVisible();
  await expect(table.getByText("En cours", { exact: true })).toBeVisible();
  for (const width of [1600, 1366, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.runFor(400);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const hero = await page.locator("main header").first().boundingBox();
    if (width >= 1366) expect(hero!.height).toBeLessThanOrEqual(280);
    const nav = await page.getByRole("navigation", { name: "Navigation propriétaire", exact: true }).boundingBox();
    expect(nav!.height).toBeLessThan(90);
    await page.screenshot({ path: `test-results/traveler-stays-${width}.png`, fullPage: true });
  }
  expect(await table.locator("tbody tr").first().evaluate(el => getComputedStyle(el).display)).toBe("block");
  await page.getByRole("group", { name: "Vue des séjours" }).getByRole("button", { name: "À venir", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Recherche", { exact: true }).fill("Voyageur2");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Réinitialiser", exact: true }).click();
  await page.getByLabel("Statut", { exact: true }).selectOption("completed");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).toContainText("Voyageur4");
  await page.getByRole("button", { name: "Réinitialiser", exact: true }).click();
  await page.getByLabel("Recherche", { exact: true }).fill("introuvable");
  await expect(table).toContainText("Aucun séjour ne correspond");
  expect(state.errors).toEqual([]);
});

test("création, duplication, import et suivi gardent leurs contrats API", async ({ page, context }) => {
  const state = await fixtures(page, context);
  await page.goto(`${url}?request=${requestId}&quote=${quoteId}`);
  await expect(page.getByRole("heading", { name: "Votre conciergerie" })).toBeVisible();
  await page.getByRole("button", { name: "Prévenir la conciergerie", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Prénom", { exact: true }).fill("Alice");
  await dialog.getByLabel("Nom", { exact: true }).fill("Martin");
  await dialog.getByLabel("Date arrivée", { exact: true }).fill("2026-09-21");
  await dialog.getByLabel("Date départ", { exact: true }).fill("2026-09-25");
  await dialog.getByRole("button", { name: "Envoyer à la concierge", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(state.posts[0]).toMatchObject({ traveler_first_name: "Alice", property_id: propertyId, concierge_profile_id: conciergeId, status: "shared", metadata: { source_quote_id: quoteId } });
  const row = page.getByRole("table").locator("tbody tr").filter({ hasText: "Voyageur1 Bernard" });
  await row.getByRole("button", { name: "Suivi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Suivi du séjour de Voyageur1 Bernard" })).toBeVisible();
  await page.getByLabel("Note propriétaire", { exact: true }).fill("Arrivée autonome confirmée");
  await page.getByRole("button", { name: /Mettre . jour le brief/ }).click();
  await expect.poll(() => state.patches.length).toBe(1);
  expect(state.patches[0]).toMatchObject({ patch: { owner_notes: "Arrivée autonome confirmée" } });
  await page.getByRole("button", { name: "Fermer le suivi" }).click();
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Dupliquer", exact: true }).click();
  await expect(dialog.getByLabel("Prénom", { exact: true })).toHaveValue("Voyageur1");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await row.getByRole("button", { name: "Suivi", exact: true }).click();
  page.once("dialog", confirmation => confirmation.accept());
  await page.getByRole("button", { name: "Annuler le séjour", exact: true }).click();
  await expect.poll(() => state.patches.length).toBe(2);
  expect(state.patches[1]).toMatchObject({ action: "cancel" });
  await expect(page.getByRole("button", { name: "Annuler le séjour", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Fermer le suivi" }).click();
  await page.getByRole("button", { name: "Importer un planning", exact: true }).click();
  await dialog.getByLabel("Message reçu", { exact: true }).fill("Julie Robert\n20 septembre -> 24 septembre\n2 adultes");
  await expect(dialog.getByText("Séjour 1", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Valider et envoyer", exact: true }).first().click();
  await expect.poll(() => state.posts.length).toBe(2);
  expect(state.posts[1]).toMatchObject({ traveler_first_name: "Julie", concierge_profile_id: conciergeId, status: "shared" });
  expect(state.errors).toEqual([]);
});

test("chargement, erreur, reprise, absence de séjour et de partenaire", async ({ page, context }) => {
  const state = await fixtures(page, context);
  state.mode = "loading";
  await page.goto(url);
  await expect(page.getByText("Chargement des séjours et de votre collaboration…", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Votre conciergerie" })).toBeVisible();
  state.mode = "error";
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "Impossible de charger les séjours" })).toContainText("Indisponibilité de test");
  await expect(page.getByText("Aucun séjour prévu pour le moment", { exact: true })).toHaveCount(0);
  state.mode = "empty";
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(page.getByText("Aucun séjour prévu pour le moment", { exact: true })).toBeVisible();
  state.mode = "no-partner";
  await page.reload();
  await expect(page.getByText(/Aucune collaboration active pour le moment/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir mes demandes" })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter un séjour", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(state.posts).toHaveLength(0);
  expect(state.errors).toEqual([]);
});
