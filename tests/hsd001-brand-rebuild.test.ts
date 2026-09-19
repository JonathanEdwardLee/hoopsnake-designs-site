import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

const forbiddenPublicPhrases = [
  'Project Launch System',
  'Launch System first',
  'Capability breadth',
  'Selected Work',
  'Qualified Project Review',
  'hero offer',
  'qualified-lead system',
  'premium launch systems',
  'Launch your dream project',
];

describe('HSD-001 brand and portfolio rebuild', () => {
  const indexSource = read('src/pages/index.astro');
  const layoutSource = read('src/layouts/BaseLayout.astro');
  const globalCss = read('src/styles/global.css');
  const formSource = read('src/scripts/form.ts');
  const motionSource = read('src/scripts/motion-loop.ts');
  const fitSource = read('src/lib/project-fit.ts');
  const siteSource = read('src/data/site.ts');
  const heroChunk = indexSource.slice(0, indexSource.indexOf('id="featured"'));

  it('uses editorial serif, grotesk, and mono roles without Rakkas', () => {
    expect(layoutSource).toContain('family=Source+Serif+4');
    expect(globalCss).toContain("--font-display: 'Source Serif 4'");
    expect(globalCss).toContain("--font-body: 'Manrope'");
    expect(globalCss).toContain("--font-mono: 'IBM Plex Mono'");
    expect(globalCss).not.toContain('Rakkas');
    expect(layoutSource).not.toContain('Rakkas');
  });

  it('uses a warm paper surface instead of a dark agency treatment', () => {
    expect(globalCss).toContain('color-scheme: light');
    expect(globalCss).toContain('--hsd-bg: #f4efe6');
    expect(globalCss).toContain('--hsd-accent: #b5522a');
    expect(globalCss).not.toContain('color-scheme: dark');
  });

  it('answers who, what, and next action in the hero without a price', () => {
    expect(heroChunk).toContain('I design and build distinctive websites, apps, and digital tools.');
    expect(heroChunk).toContain('View Portfolio');
    expect(heroChunk).toContain('Start a Project');
    expect(heroChunk).not.toMatch(/\$3,500/);
    expect(heroChunk).not.toMatch(/price/i);
  });

  it('places portfolio proof before working-together pricing', () => {
    expect(indexSource.indexOf('id="featured"')).toBeLessThan(indexSource.indexOf('id="portfolio"'));
    expect(indexSource.indexOf('id="portfolio"')).toBeLessThan(indexSource.indexOf('id="working-together"'));
    expect(indexSource).toContain('id="portfolio-title"');
    expect(indexSource).toMatch(/<h2 id="portfolio-title"[^>]*>More Work<\/h2>/);
    expect(layoutSource).toContain('href="#featured">Portfolio');
    expect(indexSource).toContain('$3,500');
    expect(indexSource.indexOf('$3,500')).toBeGreaterThan(indexSource.indexOf('id="working-together"'));
  });

  it('keeps the approved public project set and truthful relationship labels', () => {
    for (const title of [
      'Auto Detailing Guide',
      'Can I Borrow This?',
      'OzarksKey',
      'SnorklePrawn',
      'Junkfeathers',
      'Orpheus Deck',
    ]) {
      expect(siteSource).toContain(title);
    }
    expect(indexSource).toContain('featuredPortfolio.map');
    expect(indexSource).toContain('moreWork.map');
    expect(siteSource).toContain('Independent project by Jonathan');
    expect(siteSource).toContain("Jonathan's Art Project");
    expect(siteSource).toContain('Android app by Jonathan Edward Lee');
    expect(siteSource).not.toContain('Owned PIM project');
    expect(siteSource).not.toContain('Jonathan / Junkfeathers property');
  });

  it('removes internal launch-system framing from public copy', () => {
    const publicCopy = `${indexSource}\n${layoutSource}\n${fitSource}`;
    for (const phrase of forbiddenPublicPhrases) {
      expect(publicCopy).not.toContain(phrase);
    }
    expect(layoutSource).not.toMatch(/Project Launch System/);
    expect(layoutSource).toContain('Websites, apps, and digital products by Jonathan Edward Lee');
  });

  it('keeps the hoopsnake loop motion with reduced-motion support', () => {
    expect(indexSource).toContain('data-motion-loop');
    expect(motionSource).toContain("addEventListener('pointermove'");
    expect(motionSource).toContain("addEventListener('pointerleave'");
    expect(motionSource).toContain('prefers-reduced-motion: reduce');
    expect(motionSource).not.toContain('preventDefault');
    expect(globalCss).toContain('touch-action: pan-y');
  });

  it('names Jonathan as the human reviewer and keeps form success copy', () => {
    expect(siteSource).toContain('Jonathan reads it and replies about next steps.');
    expect(indexSource).toContain('If the project looks like a good fit, Jonathan will follow up to schedule a conversation.');
    expect(formSource).toContain('If the project looks like a good fit, Jonathan will follow up to schedule a conversation.');
    expect(indexSource).not.toMatch(/Hoopsnake reviews/i);
    expect(indexSource).not.toMatch(/Hoopsnake evaluates/i);
    expect(layoutSource).toContain('Hoopsnake Designs');
  });

  it('preserves project-fit and review-form contracts', () => {
    expect(indexSource).toContain('data-project-fit');
    expect(indexSource).toContain('name="fit_project_type"');
    expect(indexSource).toContain('data-review-form');
    expect(indexSource).toContain('name="decision_path"');
    expect(indexSource).toContain('name="website"');
    expect(formSource).toContain('/api/project-review.php');
  });
});
