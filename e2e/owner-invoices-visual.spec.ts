import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { readFile } from "node:fs/promises";

async function fixtures(page: Page, context: BrowserContext) {
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "owner", firstName: "Camille", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  await page.clock.install({ time: new Date("2026-09-11T10:00:00+02:00") });
  const state = { mode: "ready", calls: [] as { path: string; body: unknown }[], errors: [] as string[] };
  page.on("pageerror", error => state.errors.push(error.message));
  await context.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = { items: [] };
    if (path === "/api/auth/session") json = { user, expires: "2099-01-01T00:00:00Z" };
    else if (path === "/api/profiles/current") json = user;
    else if (path === "/api/invoices") {
      if (state.mode === "error") return route.fulfill({ status: 500, json: { error: "Indisponibilité de test" } });
      if (state.mode === "loading") await new Promise(resolve => setTimeout(resolve, 1800));
      json = state.mode === "empty" ? [] : Array.from({ length: 12 }, (_,index) => ({
        id: `invoice-${index}`, invoice_number: `FAC-2026-${index}`, status: ["issued","paid","partially_paid","overdue","canceled","draft"][index % 6],
        total_amount: 100, paid_amount: index % 6 === 1 ? 100 : index % 6 === 2 ? 40 : 0,
        balance_amount: index % 6 === 1 ? 0 : index % 6 === 2 ? 60 : 100,
        currency: index === 11 ? "USD" : "EUR", created_at: index === 10 ? "2025-08-20" : "2026-08-20", due_date: "2026-09-20",
        metadata: { property_label: "Villa Horizon", traveler_name: `Voyageur ${index}` },
        invoice_items: [{ id: `line-${index}`, label: "Accueil voyageurs", quantity: 1, line_total: 100 }],
      }));
    } else if (path.includes("/billing/invoices/")) {
      state.calls.push({ path, body: route.request().postData() ? route.request().postDataJSON() : null });
      if (path.endsWith("/sync")) { await new Promise(resolve => setTimeout(resolve, 400)); json = { status: "paid" }; }
      else if (state.mode === "checkout-error") return route.fulfill({ status: 500, json: { error: "Paiement indisponible" } });
      else json = { url: "http://127.0.0.1:3109/fixture-checkout" };
    } else if (path.endsWith("/document")) return route.fulfill({ contentType: "text/html; charset=utf-8", body: "<h1>Document de facture simulé</h1>" });
    else if (["/api/housing","/api/quotes","/api/missions","/api/reviews"].includes(path)) json = [];
    await route.fulfill({ json });
  });
  await context.route("**/fixture-checkout", route => route.fulfill({ contentType: "text/html; charset=utf-8", body: "<h1>Paiement simulé</h1>" }));
  return state;
}

test("factures : tableau, filtres, pagination, CSV et cinq formats", async ({ page, context }) => {
  const state = await fixtures(page,context);
  await page.goto("/dashboard/owner/factures");
  await expect(page.getByRole("heading",{name:"Vos factures",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{level:1})).toHaveText("Suivi des factures");
  const table = page.getByRole("table");
  await expect(table.locator("tbody tr")).toHaveCount(10);
  await page.getByRole("button",{name:"Suivant",exact:true}).click();
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button",{name:"Précédent",exact:true}).click();
  for (const width of [1600,1366,1024,768,390]) {
    await page.setViewportSize({width,height:1000});
    await page.evaluate(() => window.scrollTo(0,0));
    await page.clock.runFor(350);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({path:`test-results/owner-invoices-${width}.png`,fullPage:true});
    const search = page.getByRole("searchbox", { name: "Recherche", exact: true });
    await search.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("combobox", { name: "Année des factures" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("combobox", { name: "Statut des factures" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("combobox", { name: "Année des factures" })).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Shift+Tab");
    await expect(search).toBeFocused();
    await expect(search).toHaveCSS("outline-style", "solid");
    await search.blur();

  }
  await page.getByRole("group",{name:"Vue des factures"}).getByRole("button",{name:"Factures réglées",exact:true}).click();
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button",{name:"Réinitialiser",exact:true}).click();
  await page.getByLabel("Année des factures").selectOption("2025");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button",{name:"Réinitialiser",exact:true}).click();
  await page.getByLabel("Recherche",{exact:true}).fill("Voyageur 2");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button",{name:"Exporter CSV",exact:true}).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("owner-factures.csv");
  expect((await readFile((await download.path())!,"utf8")).split("\n")).toHaveLength(2);
  expect(state.calls).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("factures : focus, document, paiement et synchronisation", async ({page,context}) => {
  const state = await fixtures(page,context);
  await page.goto("/dashboard/owner/factures?invoice=invoice-0");
  const table = page.getByRole("table");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  const popupPromise = page.waitForEvent("popup");
  await table.getByRole("link",{name:"Voir la facture",exact:true}).click();
  const popup = await popupPromise;
  await expect(popup.getByRole("heading")).toHaveText("Document de facture simulé");
  await popup.close();
  await table.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(table.locator("details")).toHaveAttribute("open", "");
  await expect(table.getByRole("link",{name:"Imprimer / PDF"})).toHaveAttribute("href","/api/invoices/invoice-0/document?print=1");
  await expect(table).toContainText("Accueil voyageurs");
  await table.getByRole("button",{name:"Régler",exact:true}).click();
  await expect(page).toHaveURL(/fixture-checkout$/);
  expect(state.calls[0].path).toBe("/api/billing/invoices/invoice-0/checkout");
  await page.goto("/dashboard/owner/factures?invoice=invoice-0&payment=success&session_id=session-test");
  await expect(page.getByText("Paiement confirmé et facture synchronisée comme réglée.",{exact:true})).toBeVisible();
  await expect(table.getByRole("button",{name:"Régler",exact:true})).toHaveCount(0);
  expect(state.calls.some(call => call.path.endsWith("/sync") && JSON.stringify(call.body) === JSON.stringify({session_id:"session-test"}))).toBe(true);
  await page.goto("/dashboard/owner/factures?invoice=invoice-0&payment=cancel");
  await expect(page.getByText("Paiement annulé. Vous pouvez reprendre plus tard.",{exact:true})).toBeVisible();
  state.mode = "checkout-error";
  await table.getByRole("button",{name:"Régler",exact:true}).click();
  await expect(page.getByRole("alert").filter({hasText:"Impossible de terminer"})).toBeVisible();
  expect(state.errors).toEqual([]);
});

test("factures : chargement, erreur et vide", async ({page,context}) => {
  const state = await fixtures(page,context);
  for (const width of [390,768,1024,1366,1600]) {
    await page.setViewportSize({width,height:1000});
  state.mode="loading";
  await page.goto("/dashboard/owner/factures");
  await expect(page.getByText("Chargement des factures…",{exact:true})).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  state.mode="error";
  await page.reload();
  await expect(page.getByRole("alert").filter({hasText:"Impossible de terminer"})).toBeVisible();
  state.mode="empty";
  await page.getByRole("button",{name:"Réessayer",exact:true}).click();
  await expect(page.getByRole("table")).toContainText("Aucune facture ne correspond");
  await expect(page.getByRole("button",{name:"Exporter CSV",exact:true})).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(state.errors).toEqual([]);
});
