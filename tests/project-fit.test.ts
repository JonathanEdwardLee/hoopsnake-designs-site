import { describe, expect, it } from 'vitest';
import { budgetBands, primaryGoals, projectTypes, timingOptions } from '@/data/site';
import { buildProjectFitResult, isCompleteProjectFit } from '@/lib/project-fit';

describe('Project Fit', () => {
  it('requires all answers before completion', () => {
    expect(isCompleteProjectFit({ projectType: projectTypes[0] })).toBe(false);
    expect(
      isCompleteProjectFit({
        projectType: projectTypes[0],
        primaryGoal: primaryGoals[0],
        budgetBand: budgetBands[1],
        timing: timingOptions[0],
      }),
    ).toBe(true);
  });

  it('builds a non-binding fit summary and prefill', () => {
    const result = buildProjectFitResult({
      projectType: 'Website / small site',
      primaryGoal: 'Generate qualified leads',
      budgetBand: 'Below $3,500',
      timing: 'Within 4 weeks',
    });

    expect(result.summary).toContain('Website / small site');
    expect(result.fitNote).toContain('$3,500');
    expect(result.prefill.project_type).toBe('Website / small site');
    expect(result.prefill.budget_band).toBe('Below $3,500');
  });

  it('does not present a binding quote', () => {
    const result = buildProjectFitResult({
      projectType: 'Web app',
      primaryGoal: 'Replace or launch a site/product',
      budgetBand: '$15,000+',
      timing: 'Flexible / exploring',
    });

    expect(result.fitNote.toLowerCase()).not.toContain('binding quote');
    expect(result.fitNote.toLowerCase()).not.toContain('your quote');
    expect(JSON.stringify(result)).not.toMatch(/total (cost|price)/i);
  });
});
