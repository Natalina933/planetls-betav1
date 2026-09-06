import { expect, test } from "@playwright/test";

const spaces = ["admin", "owner", "concierge", "provider"];
const widths = [1600, 1366, 768, 390];
for (const space of spaces) {
  test(`${space} : React, états, clavier et quatre résolutions`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    const mutations: string[] = [];
    const scripts: number[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", (response) => { if (response.request().resourceType() === "script") scripts.push(response.status()); });
    // Empêche matériellement toute mutation réseau, même en cas de régression.
    await page.route("**/*", (route) => {
      const request = route.request();
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) { mutations.push(`${request.method()} ${request.url()}`); return route.abort(); }
      return route.continue();
    });
    const response = await page.goto(`/design-system/${space}-dashboard`, { waitUntil: "load" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.getByText("Prototype • Données fictives • Aucune sauvegarde")).toBeVisible();
    const metrics = page.locator(`[data-role-metrics='${space}']`);
    await expect(metrics.getByText("Messages non lus", { exact: true })).toBeVisible();
    await expect(metrics.getByRole("img")).toHaveCount(1);
    // Le nom doit être visible, pas uniquement présent dans le nom accessible de la carte.
    const cadenceLabel = { admin: "Missions en cours", owner: "Missions à venir", concierge: "Cadence du jour", provider: "Interventions du jour" }[space]!;
    const cadence = metrics.getByText(cadenceLabel, { exact: true });
    await expect(cadence).toBeVisible();
    expect(await cadence.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(30);
    await expect(page.locator(`[data-role-context='${space}'] li`)).toHaveCount(2);
    await page.getByRole("button", { name: "Chargement", exact: true }).click();
    await expect(page.locator("main").getByRole("status").first()).toContainText(/Chargement|Préparation/);
    await page.getByRole("button", { name: "Vide", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Rien à afficher pour le moment" })).toBeVisible();
    await expect(page.locator("[data-role-followup]")).toHaveCount(0);
    await expect(page.locator("[data-role-metrics], [data-role-context]")).toHaveCount(0);
    await page.getByRole("button", { name: "Erreur", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Impossible d’afficher cette vue" })).toBeVisible();
    await page.getByRole("button", { name: "Vue active", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("main table").first()).toBeVisible();
    if (space !== "admin") {
      const search = page.locator("main input").first();
      await search.fill("aucun-résultat-inventé");
      await expect(page.locator("main")).toContainText(/Aucun résultat|Aucune mission ne correspond/);
      await page.getByRole("button", { name: "Réinitialiser" }).click();
      await expect(search).toHaveValue("");
      await page.locator("main select").first().selectOption(space === "concierge" ? "danger" : "À confirmer");
      await expect(page.locator("main tbody").first().locator("tr")).toHaveCount(1);
      await page.getByRole("button", { name: "Réinitialiser" }).click();
      await page.locator("main table button").first().click();
      await expect(page.locator("main").getByRole("status").first()).toContainText(/démonstration/);
    } else {
      await page.getByRole("link", { name: /Traiter les priorités/ }).click();
      await expect(page).toHaveURL(/#priorities$/);
    }
    const followUp = page.locator(`[data-role-followup='${space}']`);
    await expect(followUp).toBeVisible();
    const choices = followUp.getByRole("group").getByRole("button");
    await choices.nth(1).click();
    await expect(choices.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "false");
    await followUp.locator("[class*='offer']").getByRole("button").click();
    await expect(followUp.getByRole("status")).toContainText("aucun message envoyé");
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width <= 768) {
        const menu = page.getByRole("button", { name: "Explorer l’atelier", exact: true });
        await expect(menu).toBeVisible();
        await menu.click();
        await expect(page.getByRole("navigation", { name: "Atelier Design" })).toBeVisible();
        await menu.click();
      }
      const shortControls = await page.locator("main button:visible").evaluateAll((elements) => elements.filter((element) => element.getBoundingClientRect().height < 43).map((element) => element.textContent));
      expect(shortControls).toEqual([]);
      if (width === 390 && (space === "concierge" || space === "provider")) {
        const primary = page.getByRole("button", { name: space === "concierge" ? "Ouvrir la mission" : "Lire la demande", exact: true });
        const bounds = await primary.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
      }
      await page.screenshot({ path: testInfo.outputPath(`${space}-${width}.png`), fullPage: true });
    }
    // Équivalent d'une fenêtre desktop zoomée à 200 % : surface de lecture divisée par deux.
    await page.setViewportSize({ width: 683, height: 384 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Vue active", exact: true }).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    expect(await page.locator(":focus").evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.every((status) => status === 200 || status === 304)).toBe(true);
    const contrast = await page.locator("main button[class*='primary'], main a[class*='primary']").evaluateAll((elements) => elements.map((element) => {
      const css = getComputedStyle(element);
      const luminance = (color: string) => {
        const rgb = color.match(/[\d.]+/g)!.slice(0,3).map(Number).map((value) => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      };
      const a = luminance(css.color), b = luminance(css.backgroundColor);
      return { text: element.textContent, foreground: css.color, background: css.backgroundColor, ratio: (Math.max(a,b) + .05) / (Math.min(a,b) + .05) };
    }));
    expect(contrast.length).toBeGreaterThan(0);
    for (const sample of contrast) expect(sample.ratio).toBeGreaterThanOrEqual(4.5);
    await testInfo.attach("contrastes-actions", { body: JSON.stringify(contrast, null, 2), contentType: "application/json" });
    expect(errors).toEqual([]);
    expect(mutations).toEqual([]);
  });
}

test("comparaison : quatre liens de prototype", async ({ page }) => {
  await page.goto("/design-system/dashboards", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "Quatre espaces, une même maison." })).toBeVisible();
  for (const space of spaces) await expect(page.locator(`main a[href='/design-system/${space}-dashboard']`)).toBeVisible();
});
