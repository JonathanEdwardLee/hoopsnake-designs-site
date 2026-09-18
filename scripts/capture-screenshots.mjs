import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:4321';
const outDir = '/opt/cursor/artifacts/screenshots';

async function shot(page, name, width, height, action) {
  await page.setViewportSize({ width, height });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  if (action) await action();
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: name.includes('full') });
}

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await shot(page, 'desktop_1440_full_page.png', 1440, 900);
  await shot(page, 'desktop_1440_hero.png', 1440, 900);
  await shot(page, 'mobile_390_hero.png', 390, 844);
  await shot(page, 'mobile_390_portfolio.png', 390, 844, async () => {
    await page.locator('#portfolio').scrollIntoViewIfNeeded();
  });
  await shot(page, 'mobile_390_project_fit.png', 390, 844, async () => {
    await page.locator('#project-fit').scrollIntoViewIfNeeded();
    await page.selectOption('#fit_project_type', 'Website / small site');
    await page.selectOption('#fit_primary_goal', 'Generate qualified leads');
    await page.selectOption('#fit_budget_band', '$3,500 – $7,500');
    await page.selectOption('#fit_timing', 'Within 4 weeks');
  });
  await shot(page, 'mobile_390_form.png', 390, 844, async () => {
    await page.locator('#project-review').scrollIntoViewIfNeeded();
  });

  await browser.close();
};

run();
