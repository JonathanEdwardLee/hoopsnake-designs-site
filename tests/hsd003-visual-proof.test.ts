import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { featuredPortfolio, moreWork } from '@/data/site';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('HSD-003 visual proof and approved logo', () => {
  const indexSource = read('src/pages/index.astro');
  const layoutSource = read('src/layouts/BaseLayout.astro');
  const globalCss = read('src/styles/global.css');
  const siteSource = read('src/data/site.ts');
  const markSource = read('src/components/HoopsnakeMark.astro');
  const featuredChunk = indexSource.slice(
    indexSource.indexOf('id="featured"'),
    indexSource.indexOf('id="portfolio"'),
  );

  it('sends Portfolio navigation to Featured while keeping More Work anchored', () => {
    expect(layoutSource).toContain('href="#featured">Portfolio');
    expect(indexSource).toContain('id="featured"');
    expect(indexSource).toContain('id="portfolio"');
    expect(indexSource).toContain('<h2 id="portfolio-title" class="section-title">More Work</h2>');
  });

  it('follows the Featured label with Orpheus visual proof, not a title block', () => {
    expect(featuredChunk).toContain('>Featured<');
    expect(featuredChunk).toContain('orpheus-proof');
    expect(featuredChunk).not.toContain('Recent work, shown at a scale you can actually judge.');
    expect(featuredChunk).not.toContain('shown large enough to judge');
    expect(featuredPortfolio[0]?.id).toBe('orpheus-deck');
  });

  it('uses current Play Store/app screenshots and the Junkfeathers art-project label', () => {
    expect(existsSync(resolve(root, 'public/images/portfolio/orpheus-deck.webp'))).toBe(true);
    expect(existsSync(resolve(root, 'public/images/portfolio/orpheus-deck-recording.webp'))).toBe(true);
    expect(existsSync(resolve(root, 'public/images/portfolio/orpheus-deck-chronos.webp'))).toBe(true);
    expect(existsSync(resolve(root, 'public/images/portfolio/auto-detailing-guide.webp'))).toBe(true);
    expect(existsSync(resolve(root, 'public/images/portfolio/snorkleprawn.webp'))).toBe(true);
    expect(siteSource).toContain("Jonathan's Art Project");
    expect(moreWork.map((item) => item.id)).toEqual([
      'auto-detailing-guide',
      'can-i-borrow-this',
      'snorkleprawn',
    ]);
  });

  it('implements the founder logo pack without redrawing the silhouette', () => {
    expect(markSource).toContain('/images/brand/hoopsnake-emblem.png');
    expect(markSource).toContain('/images/brand/hoopsnake-lockup.png');
    expect(layoutSource).toContain('variant="lockup"');
    expect(indexSource).toContain('class="hero-mark"');
    expect(globalCss).toContain('animation: loop-spin 56s linear infinite');
    expect(globalCss).toMatch(/prefers-reduced-motion[\s\S]*\.hero-mark \{ animation: none/);
    expect(existsSync(resolve(root, 'public/images/brand/hoopsnake-emblem.png'))).toBe(true);
    expect(existsSync(resolve(root, 'public/images/brand/hoopsnake-lockup.png'))).toBe(true);
  });
});
