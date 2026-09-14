import { expect, test } from "@playwright/test";
import { compile } from "sass";

const globalCss = compile("src/app/styles/main.scss").css;
const buttonCss = compile("src/components/ui/Button/Button.module.scss").css
  .replace(/:global\(([^)]+)\)/g, "$1")
  .replace(/\.(button|primary|secondary|outline|ghost|danger|success|paper|dark|sm|md|lg|fullWidth)\b/g, ".button-$1");
const containerCss = compile("src/components/ui/Container/Container.module.scss").css
  .replace(/\.(container|sm|md|lg|xl|compact|standard|large|full)\b/g, ".container-$1");
const variants = ["primary", "secondary", "ghost", "outline", "danger", "success", "paper", "dark"];

function luminance(rgb: string) {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(value => {
    const channel = Number(value) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

for (const width of [390, 768, 1366, 1600]) {
  test(`foundations at ${width}px: themes, actions, focus and container compatibility`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setContent(`<html lang="fr"><head><style>${globalCss}\n${buttonCss}\n${containerCss}</style></head><body>
      <main id="scope"><h1>Fondations PlanetLS</h1>
      ${variants.map(variant => `<button class="button-button button-md button-${variant}" data-variant="${variant}">${variant}</button>`).join(" ")}
      <button class="button-button button-md button-primary" disabled>Indisponible</button>
      ${["sm", "md", "lg", "xl", "compact", "standard", "large", "full"].map(size => `<div class="container-container container-${size}" data-size="${size}">${size}</div>`).join("")}
      </main></body></html>`);
    for (const theme of ["light", "sepia", "art-deco", "mucha-dark", "dark"]) {
      for (const dashboard of [false, true]) {
        await page.evaluate(({ theme, dashboard }) => {
          document.documentElement.dataset.theme = theme;
          const scope = document.querySelector("main")!;
          if (dashboard) scope.dataset.dashboardTheme = "owner";
          else delete scope.dataset.dashboardTheme;
        }, { theme, dashboard });
        const primary = page.locator('[data-variant="primary"]');
        await page.mouse.move(0, 0);
        await expect(primary).toHaveCSS("background-color", "rgb(39, 106, 88)");
        for (const variant of ["primary", "danger", "success"]) {
          const button = page.locator(`[data-variant="${variant}"]`);
          for (const hover of [false, true]) {
            if (hover) await button.hover(); else await page.mouse.move(0, 0);
            const colors = await button.evaluate(el => ({ text: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor }));
            const a = luminance(colors.text), b = luminance(colors.bg);
            expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), `${theme}/${dashboard}/${variant}/${hover}`).toBeGreaterThanOrEqual(4.5);
          }
        }
        await primary.focus();
        await expect(primary).toHaveCSS("outline-style", "solid");
        await expect(primary).toHaveCSS("min-height", "44px");
        const disabled = page.locator("button:disabled");
        await disabled.hover({ force: true });
        await expect(disabled).toHaveCSS("transform", "none");
        await expect(disabled).toHaveCSS("background-color", "rgb(39, 106, 88)");
      }
    }
    await page.evaluate(() => { delete document.querySelector("main")!.dataset.dashboardTheme; document.documentElement.dataset.theme = "light"; });
    for (const [size, max] of Object.entries({ sm: 640, md: 840, lg: 1120, xl: 1280, compact: 1220, standard: 1280, large: 1400, full: width })) {
      const box = await page.locator(`[data-size="${size}"]`).boundingBox();
      expect(box!.width).toBe(Math.min(width, max));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/css-foundations-${width}.png`, fullPage: true });
  });
}
