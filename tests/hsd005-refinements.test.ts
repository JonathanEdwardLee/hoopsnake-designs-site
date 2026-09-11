import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('HSD-005 visual refinements', () => {
  const indexSource = read('src/pages/index.astro');
  const layoutSource = read('src/layouts/BaseLayout.astro');
  const globalCss = read('src/styles/global.css');
  const formSource = read('src/scripts/form.ts');
  const motionSource = read('src/scripts/motion-loop.ts');

  it('uses Rakkas for display typography', () => {
    expect(globalCss).toContain("family=Rakkas");
    expect(globalCss).toContain("--font-display: 'Rakkas'");
    expect(globalCss).not.toContain('Instrument Serif');
  });

  it('renames the public offer to Project Launch System', () => {
    expect(indexSource).toContain('Project Launch System');
    expect(indexSource).not.toContain('Hoopsnake Launch System');
    expect(layoutSource).toContain('Project Launch System');
    expect(layoutSource).not.toContain('Hoopsnake Launch System');
  });

  it('removes insider hero-offer language', () => {
    expect(indexSource).toContain('The Project Launch System is the starting point.');
    expect(indexSource).not.toMatch(/hero offer/i);
    expect(indexSource).not.toMatch(/The hero /i);
  });

  it('updates motion-art center copy', () => {
    expect(indexSource).toContain('Launch your dream project');
    expect(indexSource).not.toContain('Qualified lead path');
  });

  it('implements restrained pointer interaction with reduced-motion guard', () => {
    expect(indexSource).toContain('data-motion-loop');
    expect(motionSource).toContain("addEventListener('pointermove'");
    expect(motionSource).toContain("addEventListener('pointerleave'");
    expect(motionSource).toContain('prefers-reduced-motion: reduce');
    expect(motionSource).not.toContain('preventDefault');
    expect(globalCss).toContain('touch-action: pan-y');
  });

  it('names Jonathan as the human reviewer in customer-facing copy', () => {
    expect(indexSource).toContain('Jonathan reviews fit before any scheduling.');
    expect(indexSource).toContain('Jonathan evaluates fit before scheduling a call');
    expect(indexSource).toContain('Jonathan reviews fit before scheduling a call');
    expect(formSource).toContain('Jonathan reviews fit before scheduling a call.');
    expect(indexSource).not.toMatch(/Hoopsnake reviews/i);
    expect(indexSource).not.toMatch(/Hoopsnake evaluates/i);
    expect(layoutSource).toContain('Hoopsnake Designs');
  });
});
