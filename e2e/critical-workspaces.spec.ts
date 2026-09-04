import { expect, test } from "@playwright/test";
import { expectApiAvailable, loginWorkspace } from "./helpers/workspace";

test.describe("parcours critiques par espace", () => {
  test("propriétaire : dashboard, recherche et demandes restent accessibles", async ({ page, request }) => {
    await loginWorkspace(page, request, "owner");
    await expect(page.getByRole("main")).toBeVisible();

    await page.goto("/dashboard/owner/concierges");
    await expect(page).toHaveURL(/\/dashboard\/owner\/concierges/);
    await expectApiAvailable(page, "/api/profiles/public-concierges?limit=5");
    await expectApiAvailable(page, "/api/service-requests?view=owner&limit=5");
  });

  test("concierge : cockpit, demandes et assistant décoration restent accessibles", async ({ page, request }) => {
    await loginWorkspace(page, request, "concierge");
    await expect(page.getByRole("main")).toBeVisible();

    await page.goto("/dashboard/concierge/demandes");
    await expect(page).toHaveURL(/\/dashboard\/concierge\/demandes/);
    await expectApiAvailable(page, "/api/service-requests?view=concierge&limit=5");

    await page.goto("/dashboard/concierge/equipe");
    await expect(page).toHaveURL(/\/dashboard\/concierge\/equipe/);
    await expect(page.getByRole("heading", { name: /Employes, collaborateurs/i })).toBeVisible();
    await expectApiAvailable(page, "/api/concierge/team");

    await page.goto("/dashboard/concierge/decoration-ai");
    await expect(page).toHaveURL(/\/dashboard\/concierge\/decoration-ai/);
    await expectApiAvailable(page, "/api/concierge/decoration-assistant?limit=2");
  });

  test("provider : cockpit, clients, messages et interventions restent accessibles", async ({ page, request }) => {
    await loginWorkspace(page, request, "provider");
    await expect(page.getByRole("main")).toBeVisible();

    await page.goto("/dashboard/provider/clients");
    await expect(page).toHaveURL(/\/dashboard\/provider\/clients/);
    await expectApiAvailable(page, "/api/provider/clients?limit=5");
    await expectApiAvailable(page, "/api/provider/messages?limit=5");
    await expectApiAvailable(page, "/api/provider/interventions?limit=5");
  });

  test("admin : cockpit et vue d'ensemble restent accessibles", async ({ page, request }) => {
    await loginWorkspace(page, request, "admin");
    await expect(page.getByRole("main")).toBeVisible();

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL(/\/dashboard\/admin/);
    await expect(page.getByRole("heading", { name: "Aujourd'hui sur PlanetLS", exact: true })).toBeVisible();
    await expectApiAvailable(page, "/api/admin/overview");
  });
});
