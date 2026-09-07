import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', headless: true });
const page = await browser.newPage();
const logs = [];
page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 160)));
page.on('pageerror', e => logs.push('PAGEERROR: ' + String(e).slice(0, 200)));

await page.goto('https://crm.optifin.nl/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);

const probe = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    inlineStyleAttr: (document.documentElement.getAttribute('style') || '').slice(0, 300),
    colorBlue: cs.getPropertyValue('--t-color-blue').trim(),
    accent3570: cs.getPropertyValue('--t-accent-accent3570').trim(),
    htmlClass: document.documentElement.className,
    title: document.title,
  };
});
console.log(JSON.stringify(probe, null, 2));
console.log('--- page console (first 12) ---');
for (const l of logs.slice(0, 12)) console.log(l);
await page.screenshot({ path: '/tmp/optifin-live.png', fullPage: false });
await browser.close();
