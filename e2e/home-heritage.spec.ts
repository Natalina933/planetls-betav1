import { test, expect } from '@playwright/test';
test('home responsive et interactions existantes', async ({ page, context }) => {
 await context.addCookies([{ name: 'hasVisited', value: 'true', url: 'http://127.0.0.1:3106' }]);
 const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
 await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/auth/session') ? null : { items: [] } }));
 await page.goto('/home');
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('main')).toHaveCount(1);
 for (const width of [1600, 1366, 1024, 768, 390]) {
  await page.setViewportSize({ width, height: 960 });
  await expect(page.locator('#home-title')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('#profils').scrollIntoViewIfNeeded();
  await page.locator('#profils img').evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `test-results/home-heritage-${width}.png`, fullPage: true });
  await page.screenshot({ path: `test-results/home-viewport-${width}.png` });
 }
 const menu = page.getByRole('button', { name: /Explorer PlanetLS/ });
 await menu.click();
 await expect(menu).toHaveAttribute('aria-expanded', 'true');
 await page.getByRole('navigation', { name: 'Découvrir PlanetLS', exact: true }).getByRole('link', { name: 'Propriétaires', exact: true }).click();
 await expect(menu).toHaveAttribute('aria-expanded', 'false');
 await page.locator('summary').filter({ hasText: 'fonctionnement par profil' }).click();
 await expect(page.getByRole('tab').first()).toBeVisible();
 await page.locator('summary').filter({ hasText: 'Explorer tous les services' }).click();
 await expect(page.getByRole('link', { name: 'Choisir un parcours pour essayer la plateforme gratuitement' })).toBeVisible();
 const play = page.locator('button[aria-label^="Lire la"]'); await play.focus(); await page.keyboard.press('Space');
 await expect(page.locator('video')).toBeVisible();
 await expect(page.locator('video')).toHaveAttribute('src', '/videos/PlanetLs.mp4');
 await expect(page.locator('a[href="/shop"]')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('public profile data and first visit contact', async ({ page }) => {
 await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/auth/session') ? null : { items: [{ id: 'home-fixture', display_name: 'Conciergerie de test', avatar_url: null, city: 'La Ciotat', service_area: null, services: [], hourly_rate: null, monthly_rate: null, years_experience: null, is_pro: false, average_rating: null, reviews_count: 0, latest_review_comment: null }] } }));
 await page.goto('/home');
 await expect(page.getByRole('heading', { name: 'Bienvenue sur PlanetLS' })).toBeVisible();
 await page.getByRole('button', { name: 'Nous contacter', exact: true }).click();
 await expect(page.getByRole('heading', { name: 'Bienvenue sur PlanetLS' })).toHaveCount(0);
 await expect(page.getByRole('heading', { name: 'Conciergerie de test' })).toBeVisible();
 await expect(page.locator('a[href="/concierges/home-fixture"]')).toBeVisible();
});
test('editorial cards retain public data without detailed pricing', async ({ page, context }) => {
 await context.addCookies([{ name: 'hasVisited', value: 'true', url: 'http://127.0.0.1:3106' }]);
 await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/auth/session') ? null : { items: [{ id: 'editorial-fixture', display_name: 'Conciergerie de test', avatar_url: null, city: 'La Ciotat', services: ['Accueil', 'Ménage', 'Linge'], hourly_rate: 28, monthly_rate: 340, years_experience: 4, is_pro: true, average_rating: 4.8, reviews_count: 12 }] } }));
 await page.goto('/home');
 await expect(page.getByText('4.8 / 5', { exact: true })).toBeVisible();
 await expect(page.getByText('12 avis', { exact: true })).toBeVisible();
 await expect(page.getByText('340 EUR / mois', { exact: true })).toHaveCount(0);
 await expect(page.getByRole('button', { name: 'Voir tous les conseils' })).toBeDisabled();
 for (const width of [1600, 1366, 1024, 768, 390]) {
  await page.setViewportSize({ width, height: 960 });
  await page.locator('#concierges-recommandes a').first().scrollIntoViewIfNeeded();
  await expect(page.locator('#concierges-recommandes a').first()).toBeVisible();
  await expect(page.locator('#concierges-recommandes a').first()).toHaveCSS('background-color', 'rgb(65, 107, 89)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('#concierges-recommandes').screenshot({ path: `test-results/home-concierges-${width}.png` });
 }
});