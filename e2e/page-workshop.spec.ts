import { test, expect } from "@playwright/test";

test("quatre listes : filtres, pagination, états, clavier et responsive", async ({ page }) => {
  const errors: string[] = [];
  const businessRequests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", request => { if (/\/api\/(?!auth\/)/.test(request.url())) businessRequests.push(request.url()); });
  await page.goto("/design-system/pages");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Une identité, quatre usages");
  await expect(page.getByText("Démonstration — données fictives", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Modèle", { exact: true }).locator("option:disabled")).toHaveCount(5);
  for (const [space, label, title] of [["admin", "Admin", "Liste des utilisateurs"], ["concierge", "Concierge", "Missions du jour"], ["owner", "Propriétaire", "Mes logements"], ["provider", "Artisan", "Mes interventions"]]) {
    await page.getByLabel("Espace", { exact: true }).selectOption(space);
    const preview = page.getByRole("region", { name: `Prévisualisation ${label}`, exact: true });
    await expect(preview.getByRole("heading", { level: 2, name: title })).toBeVisible();
    await preview.getByRole("textbox").focus();
    await page.keyboard.press("Tab");
    await expect(preview.getByRole("combobox").last()).toBeFocused();
    await preview.getByRole("button", { name: "Suivant", exact: true }).click();
    await expect(preview).toContainText("Page 2 sur 2");
    await preview.getByRole("textbox").fill("introuvable");
    await expect(preview).toContainText("Aucun résultat pour ces filtres.");
    await preview.getByRole("button", { name: "Afficher tous les exemples" }).click();
    await expect(preview).toContainText("Page 1 sur 2");
    await preview.getByRole("button", { name: /^(Examiner les comptes|Voir les (missions|logements|interventions))/ }).click();
    await expect(preview).toContainText("2 résultat(s)");
    await preview.getByRole("button", { name: "Réinitialiser", exact: true }).click();
    for (const [state, text] of [["loading", "Chargement de la démonstration"], ["empty", "Aucun"], ["error", "Erreur simulée"], ["success", "Action simulée réussie"]]) {
      await preview.getByLabel("État présenté").selectOption(state);
      await expect(preview).toContainText(text);
      if (state !== "success") await expect(preview.getByRole("navigation", { name: "Pagination des exemples" })).toHaveCount(0);
    }
    await preview.getByLabel("État présenté").selectOption("error");
    await preview.getByRole("button", { name: "Réessayer", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(preview).toContainText("Page 1 sur 2");
    const action = preview.getByRole("button", { name: /^(Examiner les comptes|Voir les (missions|logements|interventions))/ });
    await action.focus();
    expect(await action.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
    for (const width of [1600, 1366, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await preview.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const box = await action.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
      await page.screenshot({ path: `test-results/page-workshop/${space}-${width}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 1366, height: 1000 });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByLabel("État présenté").selectOption("loading");
  expect(await page.locator("main *").evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === "none"))).toBe(true);
  expect(businessRequests).toEqual([]);
  expect(errors).toEqual([]);
});
