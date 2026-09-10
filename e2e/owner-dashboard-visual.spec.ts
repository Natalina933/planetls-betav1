import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  firstName: "Nathalie",
  username: "Nathalie",
  role: "owner",
  email: "owner@example.test",
};
const properties = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  nom_logement: ["Le Barcarès", "La Ciotat", "Biarritz", "Bordeaux", "Nantes"][
    i
  ],
  ville: "France",
  statut: i ? "draft" : "active",
  photo_principale: "/images/default-logement.png",
  infos: {
    property_type: "Appartement",
    guest_capacity: 4,
    bedroom_count: 2,
    bathroom_count: 1,
    surface_sqm: 45,
    equipements: ["Wi-Fi", "Terrasse"],
  },
}));
const missions = [
  {
    id: "stay-1",
    title: "Sophie Martin",
    property_id: 1,
    scheduled_start: "2026-09-12T14:00:00",
    scheduled_end: "2026-09-16T10:00:00",
    status: "scheduled",
    metadata: { mission_kind: "traveler_stay" },
  },
  {
    id: "stay-canceled",
    title: "Séjour annulé",
    property_id: 1,
    scheduled_start: "2026-09-20T14:00:00",
    scheduled_end: "2026-09-23T10:00:00",
    status: "canceled",
    metadata: { mission_kind: "traveler_stay" },
  },
  {
    id: "work-1",
    title: "Vérification climatisation",
    property_id: 1,
    scheduled_start: "2026-09-15T10:00:00",
    status: "in_progress",
    metadata: {},
  },
];

test("accueil propriétaire : composants réels, cinq résolutions et interactions", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: new Date("2026-09-09T10:00:00+02:00") });
  const token = await encode({
    secret: "planetls-owner-visual-fixture-secret",
    salt: "authjs.session-token",
    token: { ...user, sub: user.id },
    maxAge: 3600,
  });
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: token,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
    },
  ]);
  await page.addInitScript((id) => {
    localStorage.setItem(`owner-onboarding-first-login-seen:${id}`, "1");
  }, user.id);
  let state: "ready" | "empty" | "error" = "ready";
  await context.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (pathname === "/api/auth/session")
      body = { user, expires: "2099-01-01T00:00:00Z" };
    else if (pathname === "/api/profiles/current") body = user;
    else if (pathname === "/api/housing") {
      if (state === "error") {
        await route.fulfill({
          status: 500,
          json: { error: "Chargement indisponible pour ce test" },
        });
        return;
      }
      body = state === "empty" ? [] : properties;
    } else if (pathname === "/api/missions")
      body = state === "empty" ? [] : missions;
    else if (pathname === "/api/quotes")
      body =
        state === "empty"
          ? []
          : [{ id: "quote-1", quote_number: "DEV-2026-1", status: "sent" }];
    else if (pathname === "/api/invoices") body = [];
    else if (pathname === "/api/reviews")
      body = state === "empty" ? [] : [{ id: "review-1", rating: 4.8 }];
    else if (pathname === "/api/messages/conversations")
      body = {
        items:
          state === "empty"
            ? []
            : [
                {
                  id: "msg-1",
                  counterpart_name: "Christa",
                  last_message_preview: "Le ménage est bien terminé",
                  last_message_at: "2026-09-08T10:00:00",
                  unread_count: 1,
                },
              ],
      };
    else if (pathname === "/api/service-requests") body = { items: [] };
    await route.fulfill({ json: body });
  });
  await page.goto("/dashboard/owner", { timeout: 180_000 });
  await expect(
    page.getByRole("heading", { name: "Bonjour Nathalie 👋" }),
  ).toBeVisible();
  for (const width of [1600, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(400);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const metrics = page
      .locator("main article")
      .filter({ hasText: "Réservations à venir" })
      .first();
    await expect(metrics).toBeVisible();
    const columnCount = await metrics.evaluate(
      (el) =>
        getComputedStyle(el.parentElement!).gridTemplateColumns.split(" ")
          .length,
    );
    expect(columnCount).toBe(width <= 680 ? 1 : width <= 1200 ? 2 : 4);
    expect(
      await metrics.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(255, 253, 248)");
    const h1 = page.getByRole("heading", { name: "Bonjour Nathalie 👋" });
    expect(
      await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeLessThanOrEqual(26);
    const headerBox = await page.getByRole("banner").boundingBox();
    const titleBox = await h1.boundingBox();
    expect(headerBox?.height).toBeLessThanOrEqual(72);
    expect(titleBox?.y).toBeGreaterThan(
      (headerBox?.y ?? 0) + (headerBox?.height ?? 0),
    );
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    const sidebarBox = await sidebar.boundingBox();
    if (width > 680) expect(sidebarBox?.x).toBeGreaterThanOrEqual(0);
    else
      expect(
        (sidebarBox?.x ?? 0) + (sidebarBox?.width ?? 0),
      ).toBeLessThanOrEqual(1);
    for (const photo of await page.locator("main img").all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toHaveJSProperty("complete", true);
      await expect(photo).not.toHaveJSProperty("naturalWidth", 0);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/owner-modern-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Ouvrir ou fermer le menu" }).click();
  await expect(
    page.getByRole("link", { name: "Tableau de bord", exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fermer la sidebar" }).last().click();
  await page.setViewportSize({ width: 1366, height: 1000 });
  expect(
    await page
      .locator("[data-owner-dashboard]")
      .first()
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--pls-primary").trim(),
      ),
  ).toBe("#276a58");
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ds-color-primary")
        .trim(),
    ),
  ).toBe("#b88746");
  await expect(
    page.getByRole("link", { name: "Voir les détails", exact: true }),
  ).toHaveCount(3);
  await expect(
    page.getByRole("link", { name: "Voir tous les logements" }),
  ).toHaveAttribute("href", "/dashboard/owner/logements");
  await page.getByRole("searchbox").fill("barcares");
  await expect(
    page.getByRole("link", { name: "Le Barcarès France", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("introuvable-xyz");
  await expect(
    page.getByText("Aucun résultat pour cette recherche."),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("");
  await page
    .getByRole("combobox", { name: "Logement", exact: true })
    .selectOption("2");
  await expect(page.locator('[title*="Réservé"]')).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Logement", exact: true })
    .selectOption("1");
  await expect(page.locator('[title*="Réservé"]').first()).toBeVisible();
  await page.getByRole("button", { name: "Mois suivant" }).click();
  await expect(page.getByText("octobre 2026", { exact: true })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Votre mémo", exact: true })
    .fill("Préparer les clés");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Votre mémo", exact: true }),
  ).toHaveValue("Préparer les clés");
  state = "empty";
  await page.reload();
  await expect(page.getByText("Aucun message pour le moment.")).toBeVisible();
  await expect(page.getByText("Aucune intervention à afficher.")).toBeVisible();
  state = "error";
  await page.reload();
  await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
  expect(errors).toEqual([]);
});
