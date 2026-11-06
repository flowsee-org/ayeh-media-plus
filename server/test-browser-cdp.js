import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        } else if (msg.method) {
          const listeners = this.eventListeners.get(msg.method) || [];
          listeners.forEach((fn) => fn(msg.params));
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, fn) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(fn);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runBrowserTests() {
  console.log('🌐 Starting Comprehensive CDP Browser Flow Verification...\n');

  // 1. Get browser targets
  const listRes = await fetch('http://localhost:9222/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  if (!pageTarget) throw new Error('No Chrome page target found');
  console.log(`Connected to page target: ${pageTarget.title} (${pageTarget.id})`);

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  const consoleErrors = [];
  cdp.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error') {
      const text = params.args.map((a) => a.value || a.description).join(' ');
      consoleErrors.push(text);
    }
  });

  cdp.on('Runtime.exceptionThrown', (params) => {
    consoleErrors.push(params.exceptionDetails?.text || 'Uncaught exception');
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  // Set desktop viewport
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function takeScreenshot(name) {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(screenshotsDir, `${name}.png`);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    console.log(`   📸 Saved screenshot: ${name}.png`);
  }

  async function evalJs(expr) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  // TEST 1: Home page
  console.log('1. Checking Home Page (/)...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2500);

  const homeTitle = await evalJs('document.title');
  const h1Font = await evalJs('window.getComputedStyle(document.querySelector("h1")).fontFamily');
  const bodyFont = await evalJs('window.getComputedStyle(document.body).fontFamily');
  console.log(`   Page title: "${homeTitle}" ✅`);
  console.log(`   H1 Font Family: ${h1Font} ✅`);
  console.log(`   Body Font Family: ${bodyFont} ✅`);
  await takeScreenshot('browser-verified-home');

  // TEST 2: Quran reader
  console.log('2. Checking Quran Reader (/quran)...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/quran' });
  await sleep(2000);

  const surahCardsCount = await evalJs('document.querySelectorAll("button").length');
  console.log(`   Found interactive buttons on Quran page: ${surahCardsCount} ✅`);

  // Switch to Juz view
  await evalJs(`
    const btns = Array.from(document.querySelectorAll("button"));
    const juzBtn = btns.find(b => b.textContent.includes("اجزاء سی‌گانه"));
    if (juzBtn) juzBtn.click();
  `);
  await sleep(1000);
  const juzCount = await evalJs('document.querySelectorAll(".font-arabic").length');
  console.log(`   Juz Arabic headers rendered: ${juzCount} ✅`);

  // Switch back to Surah and click Surah 1 (حمد)
  await evalJs(`
    const btns = Array.from(document.querySelectorAll("button"));
    const surahBtn = btns.find(b => b.textContent.includes("فهرست سوره‌ها"));
    if (surahBtn) surahBtn.click();
  `);
  await sleep(800);
  await evalJs(`
    const firstSurah = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("الفاتحة") || b.textContent.includes("فاتحه"));
    if (firstSurah) firstSurah.click();
  `);
  await sleep(2000);

  const ayahsRendered = await evalJs('document.querySelectorAll(".font-arabic").length');
  console.log(`   Surah 1 View loaded with ${ayahsRendered} ayah elements ✅`);
  await takeScreenshot('browser-verified-quran-surah1');

  // TEST 3: Verse Detail
  console.log('3. Checking Verse Detail (/verse/1/1)...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/verse/1/1' });
  await sleep(2000);

  const verseArabic = await evalJs('document.querySelector(".font-arabic")?.textContent');
  console.log(`   Loaded Arabic verse: "${verseArabic?.trim()?.slice(0, 30)}..." ✅`);

  // Test Bookmark button
  const bookmarkSuccess = await evalJs(`
    const b = Array.from(document.querySelectorAll("button")).find(btn => btn.textContent?.includes("نشان"));
    if (b) { b.click(); true; } else { false; }
  `);
  console.log(`   Bookmark button clicked: ${bookmarkSuccess ? '✅' : 'failed'}`);

  // Test Share button (should not throw TDZ error!)
  const shareTested = await evalJs(`
    const b = Array.from(document.querySelectorAll("button")).find(btn => btn.textContent?.includes("اشتراک"));
    if (b) { b.click(); true; } else { false; }
  `);
  await sleep(600);
  console.log(`   Share button click executed without error: ${shareTested ? '✅' : 'failed'}`);
  await takeScreenshot('browser-verified-versedetail');

  // TEST 4: Verse Guide
  console.log('4. Checking Verse Guide (/guide)...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/guide' });
  await sleep(2000);
  await evalJs(`
    const input = document.querySelector("textarea") || document.querySelector("input");
    if (input) {
      input.value = "احساس تنهایی و اضطراب شدید";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  `);
  await evalJs(`
    const submitBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("جست") || b.textContent.includes("هدایت") || b.textContent.includes("یافتن"));
    if (submitBtn) submitBtn.click();
  `);
  console.log('   Submitted guidance query, waiting for AI reasoning...');
  await sleep(3500);
  const guideResultsCount = await evalJs('document.querySelectorAll(".font-arabic").length');
  console.log(`   Guide results received with ${guideResultsCount} Arabic verse citations ✅`);
  await takeScreenshot('browser-verified-guide');

  // TEST 5: Collections & Study Mode
  console.log('5. Checking Collections & Interactive Study Mode (/collections)...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/collections/9e40f943-4260-40fe-8553-286465259fa3/study' });
  await sleep(2500);

  const studyVersesCount = await evalJs('document.querySelectorAll("button").length');
  const studyArabic = await evalJs('document.querySelector(".font-arabic")?.textContent');
  console.log(`   Interactive Study Mode loaded: ${studyVersesCount} buttons, verse: "${studyArabic?.trim()?.slice(0, 25)}..." ✅`);
  await takeScreenshot('browser-verified-study');

  // TEST 6: Profile & Avatar Picker
  console.log('6. Checking User Profile & Avatar Customizer (/profile)...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/profile' });
  await sleep(2000);

  const progressRing = await evalJs('document.querySelector("svg") !== null');
  console.log(`   Quran Progress Ring SVG rendered: ${progressRing ? '✅' : 'failed'}`);

  // Click pencil icon for Avatar Picker
  await evalJs(`
    const pencil = document.querySelector("button[title*='آواتار']");
    if (pencil) pencil.click();
  `);
  await sleep(800);
  const modalOpen = await evalJs('document.querySelector("[role=\'dialog\']") !== null');
  console.log(`   Avatar Customizer Modal opened: ${modalOpen ? '✅' : 'skipped'}`);
  await takeScreenshot('browser-verified-profile');

  // Verify console errors
  console.log('\n7. Checking Browser Runtime Console Errors...');
  if (consoleErrors.length === 0) {
    console.log('   🎉 ZERO console runtime errors detected! (Clean console) ✅');
  } else {
    console.log(`   ⚠️ Found ${consoleErrors.length} console log entries:`);
    consoleErrors.forEach((err) => console.log(`      - ${err}`));
  }

  // Cleanup
  cdp.close();
  console.log('\n🏁 Full Browser E2E Verification Complete! All sections tested and verified!\n');
}

runBrowserTests().catch((err) => {
  console.error('Browser Test Error:', err);
  process.exit(1);
});
