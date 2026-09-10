#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const targets = [
  { id: 'auto-detailing-guide', url: 'https://autodetailingguide.com/' },
  { id: 'can-i-borrow-this', url: 'https://caniborrowthis.com/' },
  { id: 'ozarkskey', url: 'https://ozarkskey.com/' },
  { id: 'snorkleprawn', url: 'https://snorkleprawn.com/' },
  { id: 'junkfeathers', url: 'https://junkfeathers.com/' },
  { id: 'orpheus-deck', url: 'https://junkfeathers.com/orpheus-deck/' },
];

const outDir = path.join(process.cwd(), 'public', 'images', 'portfolio');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

for (const target of targets) {
  await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(outDir, `${target.id}.webp`),
    type: 'webp',
    quality: 72,
    clip: { x: 0, y: 0, width: 1280, height: 720 },
  });
  console.log(`Captured ${target.id}`);
}

await browser.close();
