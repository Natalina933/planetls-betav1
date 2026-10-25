import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// Aucun lancement direct ne doit contourner le contrôle d'isolation de l'orchestrateur.
test.beforeAll(() => {
  throw new Error("BLOCKED : protection réseau système non démontrée ; recette non activée.");
});
test("sidebar isolée : desktop, rail, défilement et tiroir mobile", async ({ browser }) => {
  const output = path.resolve("test-results/design-05c-sidebar");
  const names = ["sidebar-desktop.png", "sidebar-muse-frise.png", "sidebar-pied-botanique.png", "sidebar-mobile.png", "sidebar-scroll.png"];
  for (const name of names) expect(existsSync(path.join(output, name))).toBe(false);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const denied: string[] = [];
  const origin = "http://127.0.0.1:3117";
  const assets = new Map([
    ["/", path.join(output, "index.html")],
    ["/sidebar.js", path.join(output, "sidebar.js")],
    ["/icons/gauge-svgrepo-com.svg", path.resolve("public/icons/gauge-svgrepo-com.svg")],
    ["/ornements/Élégie lunaire Art Nouveau.png", path.resolve("public/ornements/Élégie lunaire Art Nouveau.png")],
    ["/logo/Logo PlanetLS _ globe doré et élégance verte.png", path.resolve("public/logo/Logo PlanetLS _ globe doré et élégance verte.png")],
  ]);
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    const file = url.origin === origin && !url.search ? assets.get(decodeURIComponent(url.pathname)) : undefined;
    if (!file) {
      denied.push(`${url.protocol}//${url.hostname}`);
      return route.abort("blockedbyclient");
    }
    const contentType = file.endsWith(".svg") ? "image/svg+xml" : file.endsWith(".png") ? "image/png" : file.endsWith(".js") ? "application/javascript" : "text/html; charset=utf-8";
    await route.fulfill({ body: readFileSync(file), contentType, headers: { "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'" } });
  });
  await context.routeWebSocket("**/*", socket => { denied.push("websocket"); socket.close(); });
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.name));
    await page.goto(origin);
    const sidebar = page.getByRole("complementary", { name: "Sidebar", exact: true });
    const body = sidebar.locator('[class*="sidebarBody"]');
    const muse = sidebar.locator('img[src*="lunaire"]');
    await expect(sidebar.locator("nav a")).toHaveCount(13);
    await expect(sidebar).toHaveCSS("width", "252px");
    await page.screenshot({ path: path.join(output, names[0]) });
    await muse.scrollIntoViewIfNeeded();
    await expect(muse).toBeInViewport({ ratio: 1 });
    await sidebar.screenshot({ path: path.join(output, names[1]) });
    await sidebar.locator('[class*="conciergeSidebarBottom"]').screenshot({ path: path.join(output, names[2]) });
    await sidebar.getByRole("button", { name: "Fermer la sidebar", exact: true }).click();
    await expect(sidebar).toHaveCSS("width", "72px");
    await sidebar.getByRole("link", { name: "Messages", exact: true }).focus();
    await expect(page.getByRole("tooltip")).toHaveText("Messages");
    await sidebar.getByRole("button", { name: "Déployer la sidebar" }).click();
    await body.evaluate(element => { element.scrollTop = 0; });
    await sidebar.getByRole("link", { name: "Calendrier", exact: true }).click();
    await expect(sidebar.getByRole("link", { name: "Calendrier", exact: true })).toHaveAttribute("aria-current", "page");
    await sidebar.getByRole("link", { name: "Paramètres", exact: true }).focus();
    await expect(sidebar.getByRole("link", { name: "Paramètres", exact: true })).toBeInViewport();
    await page.screenshot({ path: path.join(output, names[4]) });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(sidebar).toHaveAttribute("inert", "");
    await page.getByRole("button", { name: "Ouvrir ou fermer le menu" }).click();
    await expect(sidebar).not.toHaveAttribute("inert");
    await body.evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: path.join(output, names[3]) });
    await muse.scrollIntoViewIfNeeded();
    await expect(muse).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(sidebar).toHaveAttribute("inert", "");
    expect(errors).toEqual([]);
    expect(denied).toEqual([]);
  } finally {
    await context.close();
  }
});
