import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";

async function installFixtures(
  page: Page,
  context: BrowserContext,
  options: { housingId?: number; amenities?: string[] } = {},
) {
  const housingId = options.housingId ?? 30;
  const user = {
    id: "4dae1e64-5d5e-4ab7-ad7f-7eed4b3e46c9",
    role: "owner",
    firstName: "Camille",
    email: "owner@example.test",
  };
  const token = await encode({
    secret: "traveler-stays-fixture-secret",
    salt: "authjs.session-token",
    token: { ...user, sub: user.id },
    maxAge: 3600,
  });
  await context.addCookies([
    { name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true },
  ]);

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/auth/session") {
      return route.fulfill({ json: { user, expires: "2099-01-01T00:00:00Z" } });
    }
    if (path === "/api/profiles/current" || path === "/api/profiles/me") {
      return route.fulfill({ json: user });
    }
    if (path === `/api/housing/${housingId}`) {
      return route.fulfill({
        json: {
          id: housingId,
          nom_logement: housingId === 28 ? "Maison du Littoral" : "Villa des Dunes",
          adresse: "12 avenue de la Plage",
          ville: "Le Barcarès",
          statut: "active",
          photo_principale: null,
          proprietaire: { id: user.id, nom: "Camille Martin", email: user.email, telephone: "06 12 34 56 78" },
          infos: {
            property_type: "Villa",
            floor: "RDC",
            postal_code: "66420",
            guest_capacity: 6,
            bedroom_count: 3,
            bathroom_count: 2,
            surface_sqm: 110,
            wifi_info: "Fibre - réseau Villa des Dunes",
            access_code: "Boîte à clés à droite du portail",
            entry_instructions: "Stationner devant le portail puis utiliser la boîte à clés.",
            platforms: ["Airbnb", "Booking"],
            amenities: options.amenities ?? [],
            bathrooms: [{ id: "bath-1", name: "Salle de bain principale", type: "shower", notes: "Douche italienne" }],
            stock_management: { beds: [{ id: "bed-1", room: "Chambre principale", type: "Lit double", quantity: 1, mattressSize: "160x200", linenKit: "Drap housse + housse de couette" }] },
            services: { temps: "3 h", checklist: "Vérifier les vitres", instructions: "Préparer les clés avant 15 h", housekeepingNotes: "Contrôler la terrasse", internalNotes: "Contacter la propriétaire en cas de doute" },
          },
        },
      });
    }
    if (path === "/api/missions" || path === "/api/service-requests" || path === "/api/inspections") {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ json: {} });
  });
  return errors;
}

test("l'onglet Informations est structuré, responsive et éditable", async ({ page, context }) => {
  const errors = await installFixtures(page, context);
  await page.goto("/dashboard/owner/logements/30?tab=infos#informations");
  await expect(page.getByRole("heading", { name: /La fiche opérationnelle/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Sections des informations du logement" })).toBeVisible();
  await expect(page.getByText("Villa des Dunes", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("À quoi sert ce bloc ?", { exact: true })).toBeVisible();
  await expect(page.getByText("Ce n’est pas le suivi en direct d’un ménage en cours.", { exact: true })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Informations générales", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Description et caractéristiques", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Localisation", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Équipements", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Photos", exact: true })).toBeVisible();

  for (const width of [1600, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (width === 390) {
      const tabs = page.getByRole("button", { name: "Informations", exact: true }).locator("..");
      expect(await tabs.evaluate((element) => getComputedStyle(element).flexWrap)).toBe("nowrap");
    }
    await page.screenshot({ path: `test-results/owner-housing-infos-${width}.png`, fullPage: true });
  }

  await page.getByRole("link", { name: "Description", exact: true }).click();
  await expect(page.locator("#infos-description")).toBeInViewport();
  await page.getByRole("button", { name: "Modifier cet onglet" }).click();
  await expect(page.getByLabel("Nom du logement")).toBeEnabled();
  expect(errors).toEqual([]);
});

test("l'onglet Équipements reprend la hiérarchie de la fiche de référence", async ({ page, context }) => {
  const errors = await installFixtures(page, context, {
    housingId: 28,
    amenities: ["Wi-Fi", "Climatisation", "Télévision", "Lave-linge", "Lave-vaisselle", "Piscine", "Parking privé"],
  });
  await page.goto("/dashboard/owner/logements/28?tab=stocks#stocks");

  await expect(page.getByRole("heading", { name: "Équipements", exact: true }).last()).toBeVisible();
  await expect(page.getByText("Les essentiels renseignés", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Rechercher un équipement")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tout le catalogue" })).toBeVisible();
  await expect(page.getByText("Achats à suivre", { exact: true })).toBeVisible();
  await expect(page.getByText("Maison du Littoral", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("7 au total", { exact: true })).toBeVisible();

  for (const width of [1600, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/owner-housing-28-stocks-${width}.png`, fullPage: true });
  }

  await page.getByLabel("Rechercher un équipement").fill("wifi");
  await expect(page.getByText("Wi-Fi", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Modifier cet onglet" }).click();
  await expect(page.getByLabel("Wi-Fi", { exact: true }).last()).toBeEnabled();
  expect(errors).toEqual([]);
});
