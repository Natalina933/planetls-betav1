import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const browser = await chromium.launch({ channel: 'msedge' });
const reports = [];
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 960 } });
    await context.addCookies([{ name: 'hasVisited', value: 'true', url: 'http://127.0.0.1:3110' }]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/auth/session') ? null : { items: [] } }));
    await page.addInitScript(() => {
      window.homeMeasurements = { lcp: 0, cls: 0, shifts: [] };
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.homeMeasurements.lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) {
          window.homeMeasurements.cls += entry.value;
          window.homeMeasurements.shifts.push({ value: entry.value, nodes: entry.sources?.map(s => ({ html: s.node?.outerHTML?.slice(0, 250), previous: s.previousRect, current: s.currentRect })) });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('http://127.0.0.1:3110/home', { waitUntil: 'networkidle' });
    await page.locator('#home-title').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const initial = await page.evaluate(() => ({ ...window.homeMeasurements, overflow: document.documentElement.scrollWidth > innerWidth + 1, resources: performance.getEntriesByType('resource').map(r => ({ name: r.name, bytes: r.transferSize, duration: r.duration })) }));
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const audit = async () => page.evaluate(async () => {
      const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
      return { violations: result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), incomplete: result.incomplete.map(v => ({ id: v.id, count: v.nodes.length })) };
    });
    const collapsed = await audit();
    await page.locator('details').evaluateAll(items => items.forEach(item => { item.open = true; }));
    const expanded = await audit();
    await page.screenshot({ path: `test-results/home-production-${width}.png`, fullPage: true });
    reports.push({ width, initial, collapsed, expanded, errors });
    await context.close();
  }
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/home-production.json', JSON.stringify({ date: new Date().toISOString(), conditions: 'Local production build, Edge, no throttling, public APIs mocked empty; laboratory measurements, not field Core Web Vitals.', reports }, null, 2));
  console.log(JSON.stringify(reports.map(({width,initial,collapsed,expanded,errors}) => ({width,lcp:initial.lcp,cls:initial.cls,overflow:initial.overflow,collapsed,expanded,errors})), null, 2));
} finally { await browser.close(); }
