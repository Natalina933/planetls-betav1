import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

test("fiche privée concierge : informations réelles, responsive, contexte et états", async ({ page, context }) => {
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "owner", firstName: "Camille", onboarding_complete: true };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  let mode = "complete";
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/weather") return route.fulfill({ status: 503, json: { error: "Hors périmètre" } });
    let json: unknown = { items: [] };
    if (path === "/api/auth/session") json = { user, expires: "2099-01-01" };
    if (path === "/api/profiles/current") json = user;
    if (path.startsWith("/api/profiles/public/")) {
      if (mode === "error") return route.fulfill({ status: 503, json: { error: "Profil momentanément inaccessible." } });
      const complete = mode === "complete";
      json = { profile: { id: "local", display_name: "Conciergerie Riviera", company_name: "Conciergerie Riviera", city: "Nice", country: null,
        service_area: "Nice et ses environs", service_radius_km: complete ? 30 : null, services: complete ? ["Ménage", "Accueil voyageurs", "Blanchisserie", "Maintenance"] : [],
        role: complete ? "concierge_pro" : "concierge", years_experience: complete ? 8 : null,
        hourly_rate: complete ? 35 : null, monthly_rate: null, avatar_url: null, image: null,
        website: complete ? "https://example.test" : null },
        stats: { average_rating: complete ? 4.8 : null, reviews_count: complete ? 1 : 0 },
        reviews: complete ? [{ id: "review", rating: 4.8, comment: "Un accompagnement attentif et un logement impeccable.", created_at: "2026-09-20" }] : [] };
    }
    await route.fulfill({ json });
  });
  const returnTo = "/dashboard/owner/concierges?city=Nice&radiusKm=250";
  const url = `/dashboard/owner/concierges/local?returnTo=${encodeURIComponent(returnTo)}`;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Conciergerie Riviera", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Les prestations proposées" })).toBeVisible();
  await expect(page.getByText("Concierge PRO", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contacter", exact: true })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Retour aux résultats" })).toHaveAttribute("href", returnTo);
  await expect(page.getByRole("link", { name: "Site web" })).toHaveAttribute("href", "https://example.test");
  await page.screenshot({ path: "test-results/owner-concierge-profile/desktop.png", fullPage: true });
  for (const width of [1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "Tarifs indicatifs" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/owner-concierge-profile/${width}.png`, fullPage: true });
  }
  mode = "empty";
  await page.reload();
  await expect(page.getByText("Les prestations ne sont pas encore renseignées.")).toBeVisible();
  await expect(page.getByText("Les tarifs ne sont pas encore renseignés.")).toBeVisible();
  await expect(page.getByText("Aucun avis publié pour le moment.")).toBeVisible();
  await expect(page.getByText("Concierge PRO", { exact: true })).toHaveCount(0);
  mode = "error";
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ce profil est indisponible" })).toBeVisible();
  mode = "complete";
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.getByRole("heading", { name: "Conciergerie Riviera", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
