import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import sharp from "sharp";

test("concierge nocturne: open, compact, keyboard tooltip and mobile drawer", async ({ page, context }) => {
  const user = { id: "11111111-1111-4111-8111-111111111111", firstName: "Sophie", role: "concierge", email: "concierge@example.test", onboarding_complete: true };
  const token = await encode({ secret: "concierge-visual-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  await context.addInitScript(() => localStorage.setItem("theme", "mucha-dark"));
  await context.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = { items: [] };
    if (path === "/api/auth/session") json = { user, expires: "2099-01-01T00:00:00Z" };
    else if (path === "/api/profiles/current") json = user;
    else if (["/api/housing", "/api/quotes", "/api/profiles/owners", "/api/missions"].includes(path)) json = [];
    else if (path === "/api/service-requests") json = { items: new URL(route.request().url()).searchParams.get("limit") === "30" ? [{ id: "request-test", title: "Demande de test", recipient_status: "sent" }] : [] };
    else if (path === "/api/weather") return route.fulfill({ status: 503, json: { error: "Météo indisponible dans la fixture" } });
    return route.fulfill({ json });
  });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/dashboard/concierge");
  // Passer par le vrai sélecteur : le thème initial peut être réinitialisé par l'hydratation.
  await page.getByRole("button", { name: "Changer de thème", exact: true }).click();
  await page.getByRole("button", { name: "Sélectionner thème Mucha Nocturne", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mucha-dark");
  const sidebar = page.getByRole("complementary", { name: "Sidebar", exact: true, includeHidden: true });
  await expect(sidebar.locator("nav a")).toHaveCount(13);
  await expect(sidebar).toHaveCSS("width", "252px");
  await expect(page.locator(".dashboard-main")).toHaveCSS("margin-left", "252px");
  await expect(sidebar.locator("nav a[aria-current='page']")).toHaveCount(1);
  await expect(sidebar.getByRole("link", { name: "Mes demandes", exact: false })).toHaveAccessibleName(/1 notification/);
  await expect(sidebar).toHaveCSS("background-image", /linear-gradient/);
  expect(await sidebar.evaluate(el => getComputedStyle(el).backgroundImage)).not.toContain("url(");
  console.log("Sidebar geometry", await sidebar.evaluate(el => ({
    top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom,
    height: el.getBoundingClientRect().height, viewport: innerHeight,
    document: document.documentElement.scrollHeight,
    position: getComputedStyle(el).position,
  })));
  const fullPage = await page.screenshot({ style: "nextjs-portal { visibility: hidden !important; }", path: "test-results/concierge-sidebar/open-full.png", fullPage: true });
  const belowViewport = await sharp(fullPage).extract({ left: 100, top: 950, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  expect([...belowViewport]).toEqual([24, 38, 63]);
  const calendar = sidebar.getByRole("link", { name: "Calendrier", exact: true });
  await expect(calendar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const frieze = sidebar.locator('svg[viewBox="0 0 24 800"]');
  const decorBox = (await frieze.boundingBox())!;
  expect(decorBox.x + decorBox.width).toBeLessThanOrEqual((await calendar.boundingBox())!.x);
  await expect(sidebar.locator('[class*="conciergeSidebarBottom"] p')).toHaveCount(0);
  await expect(sidebar.locator('[class*="conciergeFoot"]')).toHaveCount(0);
  const scrollBody = sidebar.locator('[class*="sidebarBody"]');
  const muse = sidebar.locator('img[src*="lunaire"]');
  await muse.scrollIntoViewIfNeeded();
  await expect(muse).toBeInViewport();
  await expect(muse).toHaveAttribute("alt", "");
  await expect.poll(() => muse.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const museBox = (await muse.boundingBox())!;
  expect(museBox.width).toBe(196);
  await expect(sidebar.locator('[class*="conciergeMoon"]')).toHaveCount(0);
  await expect(sidebar.locator('[class*="conciergeBotanical"]')).toHaveCount(1);
  expect(museBox.width / museBox.height).toBeCloseTo(1086 / 1448, 2);
  expect((await sidebar.locator("nav").boundingBox())!.y + (await sidebar.locator("nav").boundingBox())!.height).toBeLessThanOrEqual(museBox.y);
  await scrollBody.evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(sidebar.getByRole("link", { name: "Paramètres", exact: true })).toBeInViewport();
  await scrollBody.evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ style: "nextjs-portal { visibility: hidden !important; }", path: "test-results/concierge-sidebar/open.png" });

  await sidebar.getByRole("button", { name: "Fermer la sidebar", exact: true }).click();
  await expect(sidebar).toHaveCSS("width", "72px");
  await expect(muse).toBeHidden();
  await expect(page.locator(".dashboard-main")).toHaveCSS("margin-left", "72px");
  const messages = sidebar.getByRole("link", { name: "Messages", exact: true });
  await messages.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Messages");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.screenshot({ style: "nextjs-portal { visibility: hidden !important; }", path: "test-results/concierge-sidebar/compact.png" });
  await sidebar.getByRole("button", { name: "Déployer la sidebar" }).click();
  await page.setViewportSize({ width: 1366, height: 760 });
  await muse.scrollIntoViewIfNeeded();
  await expect(muse).toBeInViewport();
  await page.setViewportSize({ width: 1366, height: 550 });
  const logoY = (await sidebar.getByAltText("PlanetLS").boundingBox())!.y;
  await scrollBody.evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect((await sidebar.getByAltText("PlanetLS").boundingBox())!.y).toBe(logoY);
  await expect(sidebar.getByRole("link", { name: "Paramètres", exact: true })).toBeInViewport();
  await muse.scrollIntoViewIfNeeded();
  await expect(muse).toBeInViewport();
  await page.screenshot({ style: "nextjs-portal { visibility: hidden !important; }", path: "test-results/concierge-sidebar/low-height.png" });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(page.locator(".dashboard-main")).toHaveCSS("margin-left", "0px");
  await page.getByRole("button", { name: "Ouvrir ou fermer le menu" }).click();
  await expect(sidebar).not.toHaveAttribute("inert");
  await expect(sidebar).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await expect(muse).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const closeButton = sidebar.getByRole("button", { name: "Fermer la sidebar", exact: true });
  await closeButton.click({ trial: true });
  await scrollBody.evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ style: "nextjs-portal { visibility: hidden !important; }", path: "test-results/concierge-sidebar/mobile.png" });
  await page.keyboard.press("Escape");
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  for (const [width, height] of [[1440, 900], [1055, 900], [1055, 700], [390, 844], [357, 600]]) {
    await page.setViewportSize({ width, height });
    if (width <= 900 && await sidebar.getAttribute("inert") !== null) {
      await page.getByRole("button", { name: "Ouvrir ou fermer le menu" }).click();
    }
    await expect(sidebar).not.toHaveAttribute("inert");
    await expect(sidebar.locator("nav a")).toHaveCount(13);
    await scrollBody.evaluate(el => { el.scrollTop = 0; });
    const logoTop = (await sidebar.getByAltText("PlanetLS").boundingBox())!.y;
    await sidebar.locator("nav a").last().evaluate(el => (el as HTMLElement).blur());
    await sidebar.locator("nav a").last().focus();
    await expect(sidebar.locator("nav a").last()).toBeInViewport();
    await scrollBody.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await expect(muse).toBeInViewport({ ratio: 1 });
    const imageBox = (await muse.boundingBox())!;
    const navBox = (await sidebar.locator("nav").boundingBox())!;
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(imageBox.y);
    expect(imageBox.width).toBe(196);
    const botanicalBox = (await sidebar.locator('[class*="conciergeBotanical"]').boundingBox())!;
    expect(botanicalBox.x + botanicalBox.width).toBeLessThanOrEqual((await scrollBody.boundingBox())!.x + (await scrollBody.boundingBox())!.width);
    expect(imageBox.width / imageBox.height).toBeCloseTo(1086 / 1448, 2);
    expect((await sidebar.getByAltText("PlanetLS").boundingBox())!.y).toBe(logoTop);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ style: "nextjs-portal { visibility: hidden !important; }", path: "test-results/concierge-sidebar/scroll-" + width + "x" + height + ".png" });
    console.log("Muse accessible", { width, height, imageBox });
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  for (const label of ["Mode clair", "Sepia 1900", "Art Deco"]) {
    await page.getByRole("button", { name: "Changer de thème", exact: true }).click();
    await page.getByRole("button", { name: `Sélectionner thème ${label}`, exact: true }).click();
    await expect(sidebar.locator("nav a")).toHaveCount(13);
    await expect(sidebar.locator('img[src*="lunaire"]')).toHaveCount(0);
    await page.screenshot({ style: "nextjs-portal { visibility: hidden !important; }", path: `test-results/concierge-sidebar/theme-${label.replaceAll(" ", "-")}.png` });
    await sidebar.getByRole("button", { name: "Fermer la sidebar", exact: true }).click();
    await expect(page.locator(".dashboard-main")).toHaveCSS("margin-left", "0px");
    await page.getByRole("button", { name: "Ouvrir ou fermer le menu" }).click();
  }
});
