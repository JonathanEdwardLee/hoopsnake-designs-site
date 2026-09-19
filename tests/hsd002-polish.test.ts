import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { featuredPortfolio, moreWork, portfolioItems } from '@/data/site';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('HSD-002 polish', () => {
  const indexSource = read('src/pages/index.astro');
  const layoutSource = read('src/layouts/BaseLayout.astro');
  const siteSource = read('src/data/site.ts');
  const publicCopy = `${indexSource}\n${layoutSource}\n${siteSource}`;

  it('uses visitor-facing relationship labels', () => {
    expect(publicCopy).not.toContain('Owned PIM project');
    expect(publicCopy).not.toContain('Jonathan / Junkfeathers property');
    expect(publicCopy).not.toMatch(/Owned PIM/);
  });

  it('keeps featured work large and lists only remaining projects under More Work', () => {
    expect(featuredPortfolio.map((item) => item.title)).toEqual([
      'Orpheus Deck',
      'OzarksKey',
      'Junkfeathers',
    ]);
    expect(moreWork.map((item) => item.title)).toEqual([
      'Auto Detailing Guide',
      'Can I Borrow This?',
      'SnorklePrawn',
    ]);
    expect(moreWork.every((item) => !featuredPortfolio.some((featured) => featured.id === item.id))).toBe(true);
    expect(portfolioItems).toHaveLength(6);
    expect(indexSource).toContain('<h2 id="more-work-title" class="section-title">More Work</h2>');
    expect(indexSource).toContain('moreWork.map');
    expect(layoutSource).toContain('href="#portfolio">Portfolio');
  });

  it('warms conversion copy without repeating acceptance denials or AI-chat governance', () => {
    expect(indexSource).toContain("I'll put scope, timeline, deliverables, and payment schedule in writing before work begins.");
    expect(indexSource).toContain("If the project looks like a good fit, I'll follow up to schedule a conversation.");
    expect(publicCopy).not.toMatch(/acceptance is not (promised|assumed)/i);
    expect(indexSource).not.toContain('No public AI chat');
  });

  it('uses the same three header links on every viewport', () => {
    expect(layoutSource).toContain('href="#portfolio">Portfolio');
    expect(layoutSource).toContain('href="#about">About');
    expect(layoutSource).toContain('href="#project-review">Start a Project');
    expect(layoutSource).not.toContain('What I Build');
    expect(layoutSource).not.toContain('Working Together');
    expect(layoutSource).not.toContain('nav-compact-hide');
  });
});
