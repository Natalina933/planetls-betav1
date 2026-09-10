import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";

// Presentation fixtures only: no account creation or database mutation.
for (const role of ["owner", "concierge", "provider", "admin"]) {
  test(`${role}: shared shell, tokens, keyboard and narrow viewports`, async ({ page, context }) => {
    const user = { id: "11111111-1111-4111-8111-111111111111", firstName: "Camille", username: "Camille", role, email: `${role}@example.test` };
    const token = await encode({ secret: "concierge-visual-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
    await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
    await page.addInitScript(id => localStorage.setItem(`owner-onboarding-first-login-seen:${id}`, "1"), user.id);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.route("**/api/**", route => {
      const pathname = new URL(route.request().url()).pathname;
      let json: unknown = { items: [], summary: {} };
      if (pathname === "/api/auth/session") json = { user, expires: "2099-01-01T00:00:00Z" };
      else if (pathname === "/api/profiles/current") json = user;
      else if (["/api/housing", "/api/missions", "/api/quotes", "/api/invoices", "/api/reviews", "/api/profiles/owners"].includes(pathname)) json = [];
      else if (pathname === "/api/provider/workspace") json = { profile: { id: user.id, first_name: "Camille" }, summary: { display_name: "Camille", location: null, is_pro: false } };
      else if (pathname === "/api/admin/operations") json = { requests: [], missions: [], invoiceCount: 0 };
      else if (pathname.startsWith("/api/admin/") || pathname.startsWith("/api/kpis/")) json = null;
      return route.fulfill({ json });
    });
    await page.goto(`/dashboard/${role}`);
    await expect(page.locator(".dashboard-content h1, .dashboard-content h2").first()).toBeVisible();
    await expect(page.locator(".headerCopy h1")).toContainText("Camille");
    for (const width of [1600, 1024, 768, 540, 390, 320]) {
      await page.setViewportSize({ width, height: 1080 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const frame = await page.locator(".dashboard-root").evaluate(root => {
        const style = getComputedStyle(root);
        const main = root.querySelector(".dashboard-main")!;
        return { primary: style.getPropertyValue("--ds-color-primary").trim(), radius: style.getPropertyValue("--ds-radius-card").trim(), surface: style.getPropertyValue("--ds-color-surface").trim(), margin: getComputedStyle(main).marginLeft };
      });
      expect(frame.primary).toBe("#276a58");
      expect(frame.surface).toBe("#fffdf8");
      expect(frame.radius).toBe("12px");
      await expect.poll(async () => page.locator(".dashboard-main").evaluate(el => getComputedStyle(el).marginLeft)).toBe(width > 900 ? "224px" : "0px");
      const hero = await page.locator(".headerBandeau").boundingBox();
      const quote = await page.locator(".headerCopy blockquote").boundingBox();
      expect(quote!.y + quote!.height).toBeLessThanOrEqual(hero!.y + hero!.height);
      if (width === 1600 || width === 390) await page.screenshot({ path: `test-results/dashboard-shared-${role}-${width}.png`, fullPage: true });
    }
    const action = page.locator(".headerActionLinks a").first();
    await action.focus();
    expect(await action.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
    await expect(action).toHaveAttribute("href", new RegExp(`^/dashboard/${role}`));
    expect(errors).toEqual([]);
  });
}
