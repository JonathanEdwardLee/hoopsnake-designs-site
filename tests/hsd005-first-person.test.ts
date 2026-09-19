import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { featuredPortfolio, moreWork } from '@/data/site';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('HSD-005 first-person voice and credibility', () => {
  const indexSource = read('src/pages/index.astro');
  const layoutSource = read('src/layouts/BaseLayout.astro');
  const globalCss = read('src/styles/global.css');
  const formSource = read('src/scripts/form.ts');
  const siteSource = read('src/data/site.ts');

  it('keeps first-person public copy outside identity/byline/title contexts', () => {
    expect(indexSource).toContain('You work with me directly.');
    expect(indexSource).toContain("I'm Jonathan Edward Lee.");
    expect(indexSource).not.toContain('You work with Jonathan');
    expect(indexSource).not.toContain('Jonathan will follow up');
    expect(indexSource).not.toContain('He designs and builds');
    expect(indexSource).not.toContain('Inquiries are read by Jonathan');
    expect(formSource).toContain("I'll follow up");
    expect(formSource).not.toContain('Jonathan will follow up');
    expect(layoutSource).toContain('I design and build websites, apps, and digital products through Hoopsnake Designs');
    expect(layoutSource).toContain('I design and build distinctive websites, apps, and digital tools through Hoopsnake Designs');
  });

  it('adds GitHub and LinkedIn as visible About text links', () => {
    expect(indexSource).toContain('href="https://github.com/JonathanEdwardLee"');
    expect(indexSource).toContain('href="https://www.linkedin.com/in/thewordjonlee"');
    expect(indexSource).toContain('>GitHub<');
    expect(indexSource).toContain('>LinkedIn<');
    expect(indexSource).toContain('rel="noopener noreferrer"');
    expect(indexSource).toContain('You can also find my code and project history on GitHub, or connect with me on LinkedIn.');
  });

  it('renames overlapping section labels without moving the sections', () => {
    expect(indexSource).toContain('>How I Work<');
    expect(indexSource).toContain('Pricing &amp; Scope');
    expect(indexSource).toContain('id="how-we-work"');
    expect(indexSource).toContain('id="working-together"');
    expect(indexSource).not.toContain("How We'll Work Together");
    expect(indexSource).not.toContain('>Working Together<');
  });

  it('uses first-person process, pricing, and relationship labels', () => {
    expect(siteSource).toContain("Send the project form when you're ready. I read it and reply about next steps.");
    expect(siteSource).toContain("I'll put scope, timeline, deliverables, and investment in writing before I start building.");
    expect(indexSource).toContain('$3,500');
    expect(featuredPortfolio[0]?.relationship).toBe('My Android app');
    expect(featuredPortfolio[2]?.relationship).toBe('My art project');
    expect(moreWork.every((item) => item.relationship === 'Independent project')).toBe(true);
    expect(siteSource).not.toContain('Independent project by Jonathan');
  });

  it('enlarges the desktop lockup without changing the mobile min size', () => {
    expect(globalCss).toContain('height: clamp(2.45rem, 5.2vw, 3.2rem)');
    expect(globalCss).toMatch(/@media \(min-width: 960px\) \{\s*\.brand-lockup-img \{ height: 3\.55rem; \}/);
  });
});
