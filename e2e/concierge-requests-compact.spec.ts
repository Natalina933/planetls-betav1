import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

test("demandes compactes : cinq formats, clavier, détails et navigation", async ({ page, context }) => {
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "concierge", firstName: "Camille", email: "concierge@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await context.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = { items: [] };
    if (path === "/api/auth/session") json = { user, expires: "2099-01-01T00:00:00Z" };
    else if (path === "/api/profiles/current") json = user;
    else if (path === "/api/service-requests") json = { items: Array.from({length:8}, (_, i) => ({ id: `request-${i}`, recipient_id: `recipient-${i}`, title: i === 7 ? "Une demande avec un titre particulièrement long pour contrôler la lisibilité et les retours à la ligne" : `Ménage après séjour ${i + 1}`, description: "Préparer le logement après le départ des voyageurs. Vérifier toutes les pièces et signaler les éventuels problèmes.", request_type: "ponctuel", city: "Le Barcarès", postal_code: "66420", property_name: "Villa des Pins", desired_date: "2026-09-18T09:00:00+02:00", urgency: false, budget_max: null, currency: "EUR", requested_services: ["Ménage", "Linge"], status: "sent", recipient_status: "viewed", owner_name: "Nathalie C.", response_message: null, conversation_id: "conversation-test" })) };
    await route.fulfill({ json });
  });
  await page.goto("/dashboard/concierge/demandes");
  await page.getByRole("button", {name: /Compatibles/}).click();
  const cards = page.locator('article[id^="request-"]');
  await expect(cards).toHaveCount(8);
  for (const width of [1600,1366,1024,768,390]) {
    await page.setViewportSize({width,height:1000});
    const first = cards.first();
    await expect(first.getByRole("img")).toBeVisible();
    await expect.poll(() => first.getByRole("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const bounds = await first.boundingBox();
    console.log(width, await first.evaluate(el => { const rows = []; for(let p: Element | null = el; p; p=p.parentElement) {const r=p.getBoundingClientRect(); rows.push([p.className,r.x,r.width,getComputedStyle(p).minWidth]);} return rows; }));
    if (width >= 1366) expect(bounds!.height).toBeLessThanOrEqual(175);
    const image = await first.getByRole("img").boundingBox();
    expect(image!.width / image!.height).toBeCloseTo(4/3,1);
    await first.getByRole("button", {name:"Voir la demande",exact:true}).focus();
    await page.keyboard.press("Enter");
    await expect(first.getByRole("button", {name:"Je suis intéressée",exact:true})).toBeVisible();
    await first.getByRole("button", {name:"Masquer la demande",exact:true}).click();
    await expect(first.getByRole("button", {name:"Je suis intéressée",exact:true})).toBeHidden();
    await page.screenshot({path:`test-results/concierge-requests-${width}.png`,fullPage:true});
  }
  await cards.first().getByRole("button", {name:"Voir la demande",exact:true}).click();
  await cards.first().getByRole("link", {name:"Ouvrir la conversation"}).click();
  await expect(page).toHaveURL(/messages\?conversation=conversation-test/);
  expect(errors).toEqual([]);
});
