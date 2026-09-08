import { test, expect } from "@playwright/test";

test("fiche Propriétaire : rubriques, états, clavier, isolation et responsive", async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", request => { if (/\/api\/(?!auth\/)/.test(request.url())) requests.push(request.url()); });
  await page.goto("/design-system/pages");
  await page.getByLabel("Espace", { exact: true }).selectOption("owner");
  await page.getByLabel("Modèle", { exact: true }).selectOption("Fiche");
  const detail = page.getByRole("region", { name: "Fiche logement Propriétaire", exact: true });
  await expect(detail.getByRole("heading", { name: "Logement Démo A", exact: true })).toBeVisible();
  await expect(detail.getByText("Démonstration — données fictives", { exact: true })).toBeVisible();
  await expect(detail).toContainText("Non renseignée");
  await expect(detail).not.toContainText("0 m²");
  await expect(detail.getByRole("tab")).toHaveCount(5);
  await detail.getByRole("tab", { name: "Aperçu", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(detail.getByRole("tab", { name: "Réservations", exact: true })).toBeFocused();
  await expect(detail.getByRole("tabpanel")).toContainText("Du 12 au 15 septembre 2026");
  for (const [tab, text] of [["Équipements", "Un lit double"], ["Interventions", "Vérification de la serrure"], ["Documents", "aucun fichier joint"], ["Aperçu", "Préparer un accueil serein"]]) {
    await detail.getByRole("tab", { name: tab, exact: true }).click();
    await expect(detail.getByRole("tabpanel")).toContainText(text);
  }
  await detail.getByRole("button", { name: "Vérifier les consignes", exact: true }).click();
  await expect(detail.getByRole("status")).toContainText("Aucune donnée n’est enregistrée");
  for (const [state, text] of [["loading", "Chargement de la fiche"], ["empty", "Aucun logement à présenter"], ["error", "Erreur technique simulée"], ["success", "Confirmation de démonstration"], ["incomplete", "Informations à compléter"], ["no-reservation", "Aucune réservation à venir"]]) {
    await detail.getByLabel("État de la fiche").selectOption(state);
    await expect(detail).toContainText(text);
    await expect(detail.getByRole("tablist")).toHaveCount(["loading", "empty", "error"].includes(state) ? 0 : 1);
    if (state === "error") await expect(detail.getByRole("alert")).toContainText("Son état ne peut pas être confirmé");
    if (state === "incomplete") {
      await expect(detail).toContainText("pas d’une erreur technique");
      await expect(detail.getByRole("button", { name: "Compléter les consignes", exact: true })).toBeVisible();
      await expect(detail).not.toContainText("Consignes d’arrivée relues");
    }
    if (state === "no-reservation") {
      await detail.getByRole("tab", { name: "Réservations", exact: true }).click();
      await expect(detail.getByRole("tabpanel")).toContainText("Aucune réservation à venir");
      await expect(detail).not.toContainText("Du 12 au 15 septembre 2026");
    }
  }
  await detail.getByLabel("État de la fiche").selectOption("error");
  await detail.getByRole("button", { name: "Réessayer la fiche" }).focus();
  await page.keyboard.press("Enter");
  await expect(detail.getByLabel("État de la fiche")).toHaveValue("normal");
  for (const width of [1600, 1366, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const action = detail.getByRole("button", { name: "Vérifier les consignes", exact: true });
    await action.focus();
    expect(await action.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
    for (const button of await detail.getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
    for (const tab of await detail.getByRole("tab").all()) {
      const box = await tab.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: `test-results/page-workshop/owner-detail-${width}.png`, fullPage: true });
  }
  await detail.getByRole("button", { name: "Retour à la liste des logements" }).click();
  await expect(page.getByLabel("Modèle", { exact: true })).toHaveValue("Liste");
  await expect(page.getByLabel("Modèle", { exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Mes logements", exact: true })).toBeVisible();
  await page.getByLabel("Modèle", { exact: true }).selectOption("Fiche");
  await page.getByLabel("Espace", { exact: true }).selectOption("concierge");
  await expect(page.getByLabel("Modèle", { exact: true })).toHaveValue("Liste");
  await expect(page.getByLabel("Modèle", { exact: true }).locator('option[value="Fiche"]')).toHaveAttribute("disabled", "");
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});
