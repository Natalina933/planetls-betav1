import { expect, test } from "@playwright/test";

for (const role of ["owner", "concierge", "provider", "admin"]) {
  test(`Art déco ${role} : recherche et devis adaptés`, async ({ page }) => {
    const errors: string[] = [];
    const mutations: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => {
      if (!["GET", "HEAD", "OPTIONS"].includes(route.request().method())) { mutations.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    await page.goto(`/design-system/${role}-dashboard`, { waitUntil: "load" });
    const search = page.locator("[data-smart-search]");
    await expect(search).toBeVisible();
    const field = search.getByRole("textbox", { name: "Rechercher dans cet espace" });
    await field.fill("aucun-document-zzzz");
    await field.press("Enter");
    await expect(search.getByText(/Aucun résultat/)).toBeVisible();
    await search.getByRole("button", { name: "Effacer la recherche" }).click();
    await search.getByLabel("Type de résultat").selectOption({ index: 1 });
    await expect(search.getByText("1 résultat(s) de démonstration", { exact: true })).toBeVisible();
    await search.getByLabel("Localisation").fill("lieu-inconnu");
    await expect(search.getByText(/Aucun résultat/)).toBeVisible();
    await search.getByRole("button", { name: "Effacer la recherche" }).click();
    await expect(search.getByText("3 résultat(s) de démonstration", { exact: true })).toBeVisible();
    await search.getByRole("button", { name: /Afficher le repère/ }).first().click();
    await expect(search.getByText("Aperçu fictif ; aucune action enregistrée.", { exact: true })).toBeVisible();
    const quotes = page.locator("[data-dynamic-quotes]");
    const choices = quotes.getByRole("group").getByRole("button");
    await expect(choices).toHaveCount(3);
    await choices.nth(2).click();
    await expect(choices.nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(choices.first()).toHaveAttribute("aria-pressed", "false");
    await quotes.locator("[data-quote-details]").getByRole("button").click();
    await expect(page.locator("[data-role-followup]").getByRole("status")).toContainText("aucun message envoyé");
    if (role === "concierge") {
      const live = page.locator("[data-live-dashboard]");
      await expect(live).toBeVisible();
      await expect(live.getByText("12", { exact: true })).toBeVisible();
      await expect(live.getByText("Interventions du jour", { exact: true })).toBeVisible();
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
    expect(mutations).toEqual([]);
  });
}

test("fondations : les trois blocs partagés restent accessibles", async ({ page }) => {
  await page.goto("/design-system/fondations");
  await page.getByText("Exemple de composition Art déco", { exact: true }).click();
  for (const selector of ["[data-live-dashboard]", "[data-smart-search]", "[data-dynamic-quotes]", "[data-artdeco-timeline]"]) await expect(page.locator(selector)).toBeVisible();
});
