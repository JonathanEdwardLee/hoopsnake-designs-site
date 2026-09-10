import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const baseUrl = 'http://127.0.0.1:4321';
const outDir = 'docs/evidence';
mkdirSync(outDir, { recursive: true });

async function shot(page, name, width, height, action) {
  await page.setViewportSize({ width, height });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  if (action) await action();
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: name.includes('full') });
}

const browser = await chromium.launch();
const page = await browser.newPage();

await shot(page, 'desktop_1440_full_page.png', 1440, 900);
await shot(page, 'mobile_390_hero.png', 390, 844);
await shot(page, 'mobile_390_portfolio.png', 390, 844, async () => {
  await page.locator('#selected-work').scrollIntoViewIfNeeded();
});
await shot(page, 'mobile_390_project_fit.png', 390, 844, async () => {
  await page.locator('#project-fit').scrollIntoViewIfNeeded();
});
await shot(page, 'mobile_390_form.png', 390, 844, async () => {
  await page.locator('#project-review').scrollIntoViewIfNeeded();
});

await browser.close();
