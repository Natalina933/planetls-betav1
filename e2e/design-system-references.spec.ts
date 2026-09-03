import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1600, height: 1000 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

test("design system references and concierge prototype stay readable", async ({ page }) => {
  const relevantConsoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (/same key|hydration|Minified React error/i.test(message.text())) relevantConsoleErrors.push(message.text());
  });

  await page.goto("/design-system", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "Fondations du Design System PlanetLS" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Prototype concierge", exact: true })).toBeVisible();

  await page.goto("/design-system/visuels", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "Référentiel visuel" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Regles officielles du Design System" })).toBeVisible();

  await page.goto("/design-system/concierge-dashboard", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "La journee doit se lire en un regard." })).toBeVisible();
  await expect(page.getByText("Prototype isolé")).toBeVisible();
  await page.getByRole("button", { name: "Chargement" }).click();
  await expect(page.getByText("Preparation de la journee de demonstration...")).toBeVisible();
  await page.getByRole("button", { name: "Vide" }).click();
  await expect(page.getByText("Rien a afficher pour le moment")).toBeVisible();
  await page.getByRole("button", { name: "Erreur" }).click();
  await expect(page.getByText("Les donnees de demonstration ne sont pas disponibles. Reessayez ou revenez a la vue active.")).toBeVisible();
  await page.getByRole("button", { name: "Vue active" }).click();
  await page.getByLabel("Rechercher une mission").fill("serrure");
  await expect(page.getByText("1 resultat(s)")).toBeVisible();
  await page.getByLabel("Filtrer les missions par statut").selectOption("danger");
  await page.getByRole("button", { name: "Reinitialiser" }).click();
  await expect(page.getByText("3 resultat(s)")).toBeVisible();
  await page.getByRole("button", { name: "Consulter" }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("action de demonstration");
  await page.getByRole("button", { name: "Ouvrir la mission" }).click();
  await expect(page.getByRole("status")).toContainText("action de demonstration");

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload({ waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "La journee doit se lire en un regard." })).toBeVisible();
    await expect(page.locator("table").first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }

  expect(relevantConsoleErrors).toEqual([]);
});
