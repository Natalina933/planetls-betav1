import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";

test("le suivi des demandes reprend la hiérarchie visuelle PlanetLS", async ({ page, context }) => {
  const user = { id: "4dae1e64-5d5e-4ab7-ad7f-7eed4b3e46c9", role: "owner", firstName: "Nathalie", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/session") return route.fulfill({ json: { user, expires: "2099-01-01T00:00:00Z" } });
    if (path === "/api/profiles/current" || path === "/api/profiles/me") return route.fulfill({ json: user });
    if (path === "/api/housing") return route.fulfill({ json: [{ id: 30, nom_logement: "Villa des Pins", ville: "Sainte-Maxime" }] });
    if (path === "/api/quotes") return route.fulfill({ json: [] });
    if (path === "/api/services/services-catalog") return route.fulfill({ json: [] });
    if (path === "/api/service-requests") return route.fulfill({ json: { items: [
      { id: "request-1", title: "Ménage et accueil voyageurs", description: "Préparation complète avant arrivée", request_type: "ponctuel", property_housing_id: "30", property_name: "Villa des Pins", city: "Sainte-Maxime", postal_code: "83120", requested_services: ["Ménage", "Accueil voyageurs"], status: "sent", workflow_status: "sent", urgency: false, created_at: "2026-09-12T10:00:00Z", recipients: [{ id: "recipient-1", status: "sent", concierge_name: "Conciergerie du Golfe" }] },
      { id: "request-2", title: "Gestion saisonnière", request_type: "durable", property_housing_id: "30", property_name: "Villa des Pins", city: "Sainte-Maxime", requested_services: ["Gestion complète"], status: "accepted", workflow_status: "accepted", selected_concierge_name: "Maison Sérénité", created_at: "2026-09-10T10:00:00Z", recipients: [{ id: "recipient-2", status: "selected", concierge_name: "Maison Sérénité" }] },
    ] } });
    return route.fulfill({ json: {} });
  });

  await page.goto("/dashboard/owner/demandes");
  await expect(page.getByRole("heading", { name: "Suivi des recherches concierge" })).toBeVisible();
  await expect(page.getByText("Votre parcours", { exact: true })).toBeVisible();
  await expect(page.getByText("Prochaine action", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "À suivre" })).toBeVisible();
  await expect(page.getByText("Ménage et accueil voyageurs", { exact: true }).first()).toBeVisible();
  for (const width of [1600, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/owner-requests-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Nouvelle demande" }).click();
  await expect(page.getByRole("dialog", { name: "Préparer la recherche concierge" })).toBeVisible();
  expect(errors).toEqual([]);
});
