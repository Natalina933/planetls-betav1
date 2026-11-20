import { expect, test, type Page } from "@playwright/test";

const housingPath = "/dashboard/owner/logements/overview";
const planningPath = "/dashboard/provider/planning";
const interventionApi = "/api/provider/interventions";

async function signIn(page: Page, role: "owner" | "concierge" | "provider") {
  const prefix = `PLS_LOCAL_${role.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) throw new Error(`Renseignez ${prefix}_EMAIL et ${prefix}_PASSWORD pour un compte local existant.`);

  await page.goto("/login");
  try {
    await page.getByLabel("Email").fill(email);
    await page.locator("#password").fill(password);
  } catch {
    throw new Error("Impossible de renseigner le formulaire de connexion local.");
  }
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page.waitForURL((url) => url.pathname === `/dashboard/${role}`, { waitUntil: "commit" });
}

test("propriétaire : lecture réelle du parc et refus du planning artisan", async ({ page }) => {
  await signIn(page, "owner");
  const housingResponse = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/housing");
  await page.goto(housingPath);
  const response = await housingResponse;
  expect(response.status()).toBe(200);
  const listings = await response.json();
  const heading = listings.length === 0
    ? "Votre premier logement vous attend"
    : `${listings.length} logement${listings.length > 1 ? "s" : ""} à piloter`;
  await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();

  await page.goto(planningPath);
  await expect(page).toHaveURL(/\/dashboard\/owner\/?$/);
  expect((await page.request.get(interventionApi)).status()).toBe(403);
});

test("artisan : lecture réelle du planning et refus de la page propriétaire", async ({ page }) => {
  await signIn(page, "provider");
  const planningResponse = page.waitForResponse((response) => new URL(response.url()).pathname === interventionApi);
  await page.goto(planningPath);
  const response = await planningResponse;
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.interventions_schema_ready).not.toBe(false);
  if (payload.items.length === 0) {
    await expect(page.getByText("Planning vide", { exact: true })).toBeVisible();
  } else {
    for (const view of ["Prioritaire", "Semaine", "Mois"]) {
      const tab = page.getByRole("button", { name: view, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("data-active", "true");
    }
  }
  await page.goto(housingPath);
  await expect(page).toHaveURL(/\/dashboard\/provider\/?$/);
});

test("conciergerie : refus des pages privées et de l’API artisan", async ({ page }) => {
  await signIn(page, "concierge");
  for (const path of [housingPath, planningPath]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard\/concierge\/?$/);
  }
  expect((await page.request.get(interventionApi)).status()).toBe(403);
});
