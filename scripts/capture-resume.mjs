import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const out = '/tmp/ayeh-ui-audit';
const base = 'http://localhost:5173';
const routes = [
  '/', '/search', '/community', '/upload', '/studio',
  '/achievements', '/khatm', '/scholars', '/collections', '/competitions',
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
const summary = [];

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: 'fa-IR',
  });
  const page = await context.newPage();
  // Force light mode if toggled via class
  await page.addInitScript(() => {
    document.documentElement.classList.remove('dark');
    try { localStorage.setItem('theme', 'light'); } catch {}
  });
  for (const route of routes) {
    const slug = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
    const file = path.join(out, `postfix2__${vp.name}__${slug}.png`);
    try {
      const resp = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1200);
      // RTL smoke
      const dir = await page.evaluate(() => document.documentElement.dir || document.body.dir || '');
      await page.screenshot({ path: file, fullPage: false });
      summary.push({ vp: vp.name, route, status: resp?.status(), file, ok: true, dir });
      console.log(`OK ${vp.name} ${route} status=${resp?.status()} dir=${dir}`);
    } catch (e) {
      summary.push({ vp: vp.name, route, ok: false, error: String(e).slice(0, 200) });
      console.log(`FAIL ${vp.name} ${route}: ${e.message}`);
    }
  }
  await context.close();
}

fs.writeFileSync(path.join(out, 'summary-resume.json'), JSON.stringify(summary, null, 2));
await browser.close();
console.log('DONE', summary.filter(s=>s.ok).length, '/', summary.length);
