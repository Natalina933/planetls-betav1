import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
test('concierge reference layout and real component interactions', async ({ page, context }) => {
 const user = { id: '11111111-1111-4111-8111-111111111111', firstName: 'Sophie', username: 'Sophie', role: 'concierge', email: 'concierge@example.test' };
 const token = await encode({ secret: 'concierge-visual-fixture-secret', salt: 'authjs.session-token', token: { ...user, sub: user.id }, maxAge: 3600 });
 await context.addCookies([{ name: 'authjs.session-token', value: token, domain: '127.0.0.1', path: '/', httpOnly: true }]);
 await page.clock.install({ time: new Date('2026-09-10T09:00:00+02:00') });
 const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
 let empty = false;
 await context.route('**/api/**', route => {
  const path = new URL(route.request().url()).pathname;
  let json: unknown = { items: [] };
  if (path === '/api/auth/session') json = { user, expires: '2099-01-01T00:00:00Z' };
  else if (path === '/api/profiles/current') json = user;
  else if (path === '/api/housing' || path === '/api/quotes' || path === '/api/profiles/owners') json = [];
  else if (path === '/api/missions') json = (empty ? [] : [9, 10, 11]).map((h, i) => ({ id: `mission-${i}`, title: `Logement ${i+1}`, scheduled_start: `2026-09-10T${String(h).padStart(2,'0')}:00:00+02:00`, scheduled_end: `2026-09-10T${h+1}:00:00+02:00`, status: 'scheduled' }));
  else if (path === '/api/messages/conversations') json = { items: [{ id: 'conversation-test', counterpart_name: 'Claire Dubois', last_message_at: '2026-09-10T08:00:00Z', unread_count: 2 }] };
  return route.fulfill({ json });
 });
 await page.goto('/dashboard/concierge');
 const mission = page.getByRole('heading', { name: 'Prochaine mission', exact: true });
 const tour = page.getByRole('heading', { name: 'Ma tournée du jour', exact: true });
 await expect(mission).toBeVisible();
 for (const width of [1600,1366,1024,768,390]) {
  await page.setViewportSize({ width, height: 1080 });
  await page.clock.runFor(500);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (width >= 1024) {
   const navbar = await page.getByRole('banner').boundingBox();
   const greeting = await page.locator('.headerCopy h1').boundingBox();
   const quote = await page.locator('.headerCopy blockquote').boundingBox();
   const hero = await page.locator('.headerBandeau').boundingBox();
   expect(greeting!.y).toBeGreaterThanOrEqual(navbar!.y + navbar!.height + 24);
   expect(quote!.y + quote!.height).toBeLessThanOrEqual(hero!.y + hero!.height);
   const a = await mission.boundingBox(), b = await tour.boundingBox();
   expect(b!.x).toBeGreaterThan(a!.x); expect(Math.abs(a!.y - b!.y)).toBeLessThan(65);
  }
  if (width >= 1366) {
   const right = await page.getByRole('heading', { name: 'Optimisation de la tournée' }).boundingBox();
   const center = await tour.boundingBox(); expect(right!.x).toBeGreaterThan(center!.x);
  }
  await page.screenshot({ path: `test-results/concierge-reference-${width}.png`, fullPage: true });
 }
 await expect(page.getByText('Estimation non disponible', { exact: true })).toBeVisible();
 await expect(page.locator('a[href*="conversation=conversation-test"]').first()).toBeVisible();
 expect(errors).toEqual([]);
 empty = true;
 await page.reload();
 await expect(page.getByText(/Aucune mission planifiée aujourd/)).toBeVisible();
 await expect(page.getByText(/Votre tournée se construira ici/)).toBeVisible();
 expect(errors).toEqual([]);
});