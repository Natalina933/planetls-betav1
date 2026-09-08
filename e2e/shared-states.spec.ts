import { test, expect } from "@playwright/test";

test("états explicites et compatibilité historique", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/design-system/visuels");
  await page.getByText("Cartes, indicateurs et états des parcours", { exact: true }).click();
  const section = page.getByRole("region", { name: "Alertes et états partagés" });
  const controls = section.getByRole("group", { name: "État de démonstration" });
  const result = page.getByTestId("shared-state-result");
  await expect(result).toContainText("0 demande en attente");
  for (const [label, text, visible] of [
    ["Chargement", "Chargement des données", false],
    ["Erreur", "Le chargement a échoué", false],
    ["Vide", "Aucun élément", false],
    ["Calme", "aucune urgence", true],
    ["Urgent", "nécessite votre attention", true],
    ["Indisponible", "Aucun chiffre ne peut être confirmé", false],
  ] as const) {
    await controls.getByRole("button", { name: label, exact: true }).click();
    await expect(result).toContainText(text);
    await expect(result.getByText(/0 demande en attente/)).toHaveCount(visible ? 1 : 0);
    await expect(result.getByRole(label === "Erreur" ? "alert" : "status")).toBeVisible();
  }
  await result.getByRole("button", { name: "Réessayer la démonstration" }).focus();
  await page.keyboard.press("Enter");
  await expect(result).toContainText("0 demande en attente");
  await section.getByText("Compatibilité avec les états historiques", { exact: true }).click();
  await expect(page.getByTestId("legacy-loading").getByRole("status")).toBeVisible();
  await expect(page.getByTestId("legacy-loading")).not.toContainText("Erreur historique");
  await expect(page.getByTestId("legacy-error").getByRole("alert")).toContainText("Erreur historique");
  await expect(page.getByTestId("legacy-empty")).toContainText("Aucune donnée disponible");
  await expect(page.getByTestId("legacy-ready")).toContainText("Contenu historique");
  await expect(page.getByTestId("explicit-priority")).toHaveText("État explicite prioritaire");
  for (const width of [1600, 1366, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await section.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});
