import { chromium } from 'playwright';

const BREAKPOINTS = [
  { name: '1440p', width: 1440, height: 900 },
  { name: '1280p', width: 1280, height: 800 },
  { name: '1024p', width: 1024, height: 768 },
  { name: '768p', width: 768, height: 1024 },
  { name: '390px', width: 390, height: 844 },
  { name: '360px', width: 360, height: 640 },
];

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/profile/568f6c2a-086a-4c4f-b1c9-6153c251fae9', name: 'scholar-profile' },
  { path: '/profile/9950b709-fb8c-459d-9d7d-8edcb15a4c1b', name: 'creator-profile' },
  { path: '/profile/test-missing-id', name: 'missing-profile-404' },
];

const BASE_URL = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const page of PAGES) {
    for (const bp of BREAKPOINTS) {
      const context = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
      });
      const pg = await context.newPage();
      
      try {
        const response = await pg.goto(`${BASE_URL}${page.path}`, { waitUntil: 'networkidle', timeout: 30000 });
        const status = response.status();
        
        await pg.waitForTimeout(2000);
        
        const title = await pg.title();
        const bodyText = await pg.innerText('body').catch(() => 'N/A');
        const hasNotFound = bodyText.includes('یافت نشد') || bodyText.includes('not found') || bodyText.includes('Not Found');
        const hasConsoleErrors = await pg.evaluate(() => {
          const errors = [];
          window.__consoleErrors = errors;
          const origError = console.error;
          console.error = (...args) => { errors.push(args.join(' ')); origError.apply(console, args); };
          return errors;
        });
        
        const screenshotName = `verify2-${page.name}-${bp.name}`;
        await pg.screenshot({ path: `/tmp/${screenshotName}.png`, fullPage: true });
        
        results.push({
          page: page.path,
          breakpoint: bp.name,
          width: bp.width,
          status,
          title,
          is404: hasNotFound || status === 404,
          screenshot: `/tmp/${screenshotName}.png`,
        });
      } catch (err) {
        results.push({
          page: page.path,
          breakpoint: bp.name,
          width: bp.width,
          status: 'ERROR',
          error: err.message,
        });
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  console.log('\n=== BROWSER VERIFICATION RESULTS (Post-Fix) ===\n');
  for (const r of results) {
    if (r.status === 'ERROR') {
      console.log(`❌ ${r.page} @ ${r.breakpoint}: ERROR - ${r.error}`);
    } else {
      console.log(`✅ ${r.page} @ ${r.breakpoint}: HTTP ${r.status} | "${r.title}" | ${r.is404 ? '404 page' : 'OK'}`);
    }
  }
  
  const errors = results.filter(r => r.status === 'ERROR' || r.status >= 400);
  console.log(`\nTotal: ${results.length} checks, ${errors.length} errors`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
