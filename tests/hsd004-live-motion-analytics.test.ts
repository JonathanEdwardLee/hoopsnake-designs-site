import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('HSD-004 live motion and analytics', () => {
  const indexSource = read('src/pages/index.astro');
  const layoutSource = read('src/layouts/BaseLayout.astro');
  const globalCss = read('src/styles/global.css');
  const motionSource = read('src/scripts/motion-loop.ts');
  const revealSource = read('src/scripts/scroll-reveal.ts');
  const analyticsSource = read('src/scripts/analytics.ts');
  const heroChunk = indexSource.slice(0, indexSource.indexOf('id="featured"'));
  const navChunk = layoutSource.slice(
    layoutSource.indexOf('aria-label="Primary"'),
    layoutSource.indexOf('</nav>'),
  );

  it('keeps a three-link header and a single hero CTA', () => {
    expect(navChunk).toContain('href="#portfolio">Portfolio');
    expect(navChunk).toContain('href="#about">About');
    expect(navChunk).toContain('href="#project-review">Start a Project');
    expect(navChunk).not.toContain('What I Build');
    expect(navChunk).not.toContain('Working Together');
    expect(heroChunk).toContain('Start a Project');
    expect(heroChunk).not.toContain('View Portfolio');
    expect(heroChunk.match(/Start a Project/g)?.length).toBe(1);
  });

  it('makes the emblem independently draggable without replacing the 56s spin', () => {
    expect(indexSource).toContain('class="hero-mark-user"');
    expect(globalCss).toContain('animation: loop-spin 56s linear infinite');
    expect(globalCss).toContain('transform: rotate(var(--user-rot, 0deg))');
    expect(motionSource).toContain('setPointerCapture');
    expect(motionSource).toContain("pointerType === 'touch'");
    expect(motionSource).toContain('MAX_FLING_DEG_PER_MS');
    expect(motionSource).toContain('prefers-reduced-motion: reduce');
    expect(motionSource).not.toContain('preventDefault');
  });

  it('adds reduced-motion-safe scroll reveal without a motion library', () => {
    expect(indexSource).toContain('data-reveal');
    expect(revealSource).toContain('IntersectionObserver');
    expect(revealSource).toContain('js-reveal');
    expect(globalCss).toContain('.js-reveal [data-reveal]');
    expect(indexSource).not.toContain('framer-motion');
    expect(indexSource).not.toContain('gsap');
  });

  it('installs one GA4 tag and no inquiry PII events', () => {
    expect(layoutSource).toContain("gtag/js?id=${gaMeasurementId}");
    expect(layoutSource).toContain("gtag('config', 'G-X45GW26X65')");
    expect(layoutSource.match(/G-X45GW26X65/g)?.length).toBe(2);
    expect(layoutSource).not.toContain('GTM-');
    expect(analyticsSource).toContain("track('cta_start_project')");
    expect(analyticsSource).toContain("track('portfolio_project_click')");
    expect(analyticsSource).not.toContain('FormData');
    expect(analyticsSource).not.toContain('email');
    expect(read('src/scripts/form.ts')).not.toContain('gtag');
  });

  it('references cache-safe approved favicon PNGs', () => {
    expect(layoutSource).toContain('/images/brand/hoopsnake-icon-32-v004.png');
    expect(layoutSource).toContain('/images/brand/hoopsnake-icon-192-v004.png');
    expect(layoutSource).toContain('/images/brand/hoopsnake-apple-touch-180-v004.png');
    expect(layoutSource).not.toContain('href="/favicon.svg"');
    expect(layoutSource).not.toContain('hoopsnake-favicon.png');
    expect(existsSync(resolve(root, 'public/images/brand/hoopsnake-icon-32-v004.png'))).toBe(true);
    expect(existsSync(resolve(root, 'public/images/brand/hoopsnake-icon-192-v004.png'))).toBe(true);
    expect(existsSync(resolve(root, 'public/images/brand/hoopsnake-apple-touch-180-v004.png'))).toBe(true);
  });
});
