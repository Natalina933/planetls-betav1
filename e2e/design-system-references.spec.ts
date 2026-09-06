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
  await expect(page.getByRole("heading", { name: "Design & maquettes", exact: true })).toBeVisible();
  await page.locator("main").getByRole("link", { name: /Fondations/ }).click();
  await expect(page.getByRole("heading", { name: "Fondations du Design System PlanetLS" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Atelier Design" }).getByRole("link", { name: "Concierge", exact: true })).toBeVisible();

  await page.goto("/design-system/visuels", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "Référentiel visuel" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Règles officielles du Design System" })).toBeVisible();

  await page.goto("/design-system/concierge-dashboard", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "La journée doit se lire en un regard." })).toBeVisible();
  await expect(page.getByText("Prototype isolé")).toBeVisible();
  await page.getByRole("button", { name: "Chargement" }).click();
  await expect(page.getByText("Préparation de la journée de démonstration...")).toBeVisible();
  await page.getByRole("button", { name: "Vide" }).click();
  await expect(page.getByText("Rien à afficher pour le moment")).toBeVisible();
  await page.getByRole("button", { name: "Erreur" }).click();
  await expect(page.getByText("Les données de démonstration ne sont pas disponibles. Réessayez ou revenez à la vue active.")).toBeVisible();
  await page.getByRole("button", { name: "Vue active" }).click();
  await page.getByLabel("Rechercher une mission").fill("serrure");
  await expect(page.getByText("1 résultat(s)")).toBeVisible();
  await page.getByLabel("Filtrer les missions par statut").selectOption("danger");
  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await expect(page.getByText("3 résultat(s)", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Consulter" }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("action de démonstration");
  await page.getByRole("button", { name: "Ouvrir la mission" }).click();
  await expect(page.getByRole("status")).toContainText("action de démonstration");

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload({ waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "La journée doit se lire en un regard." })).toBeVisible();
    await expect(page.locator("table").first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }

  expect(relevantConsoleErrors).toEqual([]);
});
